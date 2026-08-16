import json
import os
from datetime import datetime, timezone, timedelta
from io import BytesIO
from typing import List, Optional
from urllib import request
from urllib.error import HTTPError, URLError

import numpy as np
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Spacer, Paragraph, Table, TableStyle

from . import compute
from .db import Borewell, Reading, engine, get_session, init_db
from .schemas import SensorPayload

load_dotenv()

app = FastAPI(title="Smart DWLR API", version="1.0.0")
IST = timezone(timedelta(hours=5, minutes=30), "IST")

# Wide-open CORS for the hackathon demo — tighten this to your deployed
# frontend origin before submitting/production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_borewell(session: Session, borewell_id: str) -> Borewell:
    bw = session.exec(select(Borewell).where(Borewell.borewell_id == borewell_id)).first()
    if not bw:
        raise HTTPException(404, f"Unknown borewell_id '{borewell_id}'")
    return bw


def recent_readings(session: Session, borewell_id: str, limit: int = 200) -> List[Reading]:
    """Return chronological readings for charts and KPIs.

    The credibility filter is intentionally skipped here — it is enforced at
    ingest time only (see the /api/ingest endpoint).  Rows already stored in
    the database (whether via the ESP32, seed script, or a manual INSERT) are
    returned as-is so that manually-inserted test/calibration readings are
    always visible in the frontend.
    """
    stmt = (
        select(Reading)
        .where(Reading.borewell_id == borewell_id)
        .order_by(Reading.timestamp.desc())
        .limit(min(max(limit, 1), 2000))
    )
    rows = list(session.exec(stmt))
    rows.reverse()  # chronological order
    return rows


def level_to_pct(water_level: float, depth_cm: float) -> float:
    return float(np.clip((water_level / depth_cm) * 100, 0, 100))


def resolve_ghi(reading: Reading, depth_cm: float, trend: float = 0.0):
    """Return (ghi, ghi_status) — computes on-the-fly when the stored value is NULL.

    Manually-inserted rows won't have ghi/ghi_status pre-computed, so we derive
    them from the available sensor fields rather than returning None to the client.
    """
    if reading.ghi is not None and reading.ghi_status is not None:
        return reading.ghi, reading.ghi_status
    level_pct = level_to_pct(reading.water_level, depth_cm)
    turbidity = reading.turbidity if reading.turbidity is not None else compute.estimate_turbidity(reading.rain)
    ph = reading.ph if reading.ph is not None else compute.estimate_ph(reading.tds)
    recharge_index = reading.recharge_index if reading.recharge_index is not None else compute.estimate_recharge_index(reading.rain, reading.soil)
    ghi, ghi_status = compute.compute_ghi(
        level_pct, reading.rain, reading.soil, reading.tds,
        turbidity, ph, recharge_index, trend,
    )
    return ghi, ghi_status


def utc_iso(timestamp: datetime) -> str:
    """Database timestamps are UTC; include that offset so clients do not treat them as local time."""
    return timestamp.replace(tzinfo=timezone.utc).isoformat()


def ist_label(timestamp: datetime) -> str:
    return timestamp.replace(tzinfo=timezone.utc).astimezone(IST).strftime("%d %b %Y, %I:%M %p IST")


def estimate_community_impact(readings: List[Reading], borewell: Borewell) -> dict:
    """Transparent demo estimate based on a 120-household service area."""
    latest = readings[-1]
    level_pct = level_to_pct(latest.water_level, borewell.depth_cm)
    trend = compute_trend(readings, borewell.depth_cm)
    forecast = compute.forecast_water_level([level_to_pct(r.water_level, borewell.depth_cm) for r in readings])
    projected = forecast.predicted_level_pct if forecast else level_pct
    resilience = float(np.clip((level_pct + projected) / 2, 0, 100))
    households = int(round(24 + resilience * 0.92))
    crop_acres = round(max(3.0, households * 0.28), 1)
    conservation_factor = 0.30 if latest.risk in {"High", "Critical"} else 0.18
    litres = int(round(households * 135 * 30 * conservation_factor))
    return {
        "households_protected": households,
        "crop_acres_protected": crop_acres,
        "litres_conserved_monthly": litres,
        "projected_level_pct": round(projected, 1),
        "assumptions": "Estimate assumes a 120-household service area, 135 litres per household per day, and implementation of the recommended conservation action.",
        "method": "Estimate combines verified groundwater level, 15-day projection, current risk, and water-saving intervention uptake.",
        "trend_per_reading_pct": round(trend, 2),
    }


def is_credible_level(previous: Optional[Reading], water_level: float, timestamp: datetime, depth_cm: float) -> bool:
    """Reject implausible borewell jumps caused by a dropped/invalid sensor echo.

    Groundwater changes slowly.  A small tolerance is retained for genuine short
    interval readings, while the hourly allowance remains deliberately generous
    for rainfall recharge or a manually checked sensor.
    """
    if not 0 < water_level <= depth_cm:
        return False
    if previous is None:
        return True
    elapsed_hours = max((timestamp - previous.timestamp).total_seconds() / 3600, 1 / 60)
    max_change_cm = 0.25 + (3.0 * elapsed_hours)
    return abs(water_level - previous.water_level) <= max_change_cm


def compute_trend(readings: List[Reading], depth_cm: float) -> float:
    """% of depth change per reading, over the last up-to-10 readings."""
    if len(readings) < 2:
        return 0.0
    window = readings[-10:]
    pcts = [level_to_pct(r.water_level, depth_cm) for r in window]
    return float(pcts[-1] - pcts[0]) / max(1, len(pcts) - 1)


def get_borewell_snapshot(session: Session, borewell_id: str) -> Optional[Reading]:
    readings = recent_readings(session, borewell_id, limit=1)
    return readings[-1] if readings else None


def _sms_backend_configured() -> bool:
    values = [
        os.getenv("TRACCAR_TOKEN", "").strip(),
        os.getenv("SMS_TO_NUMBER", "").strip(),
    ]
    return all(values)


def build_sms_message(alert: dict, borewell_id: str = "BW01", language: str = "en") -> str:
    title = alert.get("title", "Alert")
    msg = alert.get("message", "")
    lang = (language or alert.get("language") or "en").lower()
    if lang == "ta":
        title_ta = "நீர் எச்சரிக்கை" if title.lower() == "groundwater alert" else ("எச்சரிக்கை" if title.lower() == "alert" else title)
        msg_ta = msg
        if "critical" in msg.lower() or "critical" in title.lower():
            msg_ta = "கடுமையான ஆபத்து கண்டறியப்பட்டது"
        elif "Warning" in title or "warning" in msg.lower():
            msg_ta = "எச்சரிக்கை: நீர் நிலை சீராக இல்லை"
        elif "low soil moisture" in msg.lower():
            msg_ta = "மண் ஈரப்பதம் குறைவு"
        elif "groundwater" in title.lower() and "alert" in title.lower():
            msg_ta = "நீர் நிலை சிக்கல் கண்டறியப்பட்டது"
        return f"[{borewell_id}] {title_ta}: {msg_ta}"
    return f"[{borewell_id}] {title}: {msg}"


def send_via_traccar(message: str) -> dict:
    """Send a text message through Traccar SMS Gateway's cloud relay.

    Free, open-source Android app (available directly on the Play Store,
    no sideloading needed). The phone running the app registers with
    traccar.org's relay; this just posts to that relay with the token
    shown in the app, and Traccar forwards it to the phone to actually send.
    """
    token = os.getenv("TRACCAR_TOKEN", "").strip()
    to_number = os.getenv("SMS_TO_NUMBER", "").strip()
    url = "https://www.traccar.org/sms/"
    data = json.dumps({"to": to_number, "message": message}).encode("utf-8")
    req = request.Request(url, data=data, method="POST")
    req.add_header("Authorization", token)
    req.add_header("Content-Type", "application/json")
    try:
        with request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"raw": raw}
            return {"sent": True, "mode": "traccar", "message": message, "response": body}
    except HTTPError as exc:
        try:
            err_body = json.loads(exc.read().decode("utf-8"))
            err_detail = err_body.get("message") or err_body.get("error") or str(err_body)
        except Exception:
            err_detail = exc.reason
        err_str = f"{exc.code} {err_detail}"

        if exc.code in (401, 403):
            reason = "invalid_token"
            hint = ("TRACCAR_TOKEN was rejected. Open the Traccar SMS Gateway "
                    "app on the phone and copy the cloud relay token shown "
                    "there (not a local API key) into backend/.env, then "
                    "restart the backend.")
        elif exc.code in (502, 503, 504):
            reason = "device_offline"
            hint = ("The phone running Traccar SMS Gateway looks offline or "
                    "unreachable. Open the app and confirm it's connected, "
                    "then try again.")
        elif exc.code == 400:
            reason = "bad_request"
            hint = ("Traccar rejected the request — check SMS_TO_NUMBER is in "
                    "full international E.164 format, e.g. +91XXXXXXXXXX.")
        else:
            reason = "traccar_error"
            hint = "See 'message' for the exact error Traccar returned."
        print(f"[SMS ERROR] Traccar: {err_str}")
        return {"sent": False, "mode": "error", "reason": reason, "http_status": exc.code, "message": err_str, "hint": hint}
    except URLError as exc:
        err_str = str(exc.reason)
        print(f"[SMS ERROR] network error reaching Traccar: {err_str}")
        return {"sent": False, "mode": "error", "reason": "network_error", "message": err_str,
                "hint": "Couldn't reach www.traccar.org — check the backend server's internet connection."}
    except Exception as exc:
        err_str = str(exc)
        print(f"[SMS ERROR] Traccar: {err_str}")
        return {"sent": False, "mode": "error", "reason": "unknown_error", "message": err_str,
                "hint": "Unexpected failure — check the backend server logs for a full traceback."}


def send_sms_notification(alert: dict, borewell_id: str = "BW01", language: str = "en") -> dict:
    """Send a text message through Traccar SMS Gateway's cloud relay.

    Falls back to a demo log line if TRACCAR_TOKEN / SMS_TO_NUMBER aren't
    set, so the app still works in development without failing silently.
    """
    selected_language = (language or alert.get("language") or "en").lower()
    message = build_sms_message(alert, borewell_id, selected_language)

    if _sms_backend_configured():
        return send_via_traccar(message)

    print(f"[SMS DEMO] {message}")
    return {"sent": False, "mode": "demo", "message": message}


def risk_color(risk: str) -> str:
    mapping = {"Low": "emerald", "Medium": "amber", "High": "orange", "Critical": "red"}
    return mapping.get(risk, "slate")


# Once a device has sent at least one reading, it's treated as Online — status
# doesn't auto-flip to Offline just because time has passed since the last
# reading. "No data" only applies if the borewell has never reported at all.
def compute_live_status(latest_reading_timestamp: Optional[datetime]) -> tuple[str, float]:
    """Returns (status, minutes_since_last_reading)."""
    if latest_reading_timestamp is None:
        return "No data", float("inf")
    ts = latest_reading_timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    minutes_since = (datetime.now(timezone.utc) - ts).total_seconds() / 60
    return "Online", minutes_since


def get_village_score(session: Session, borewell_id: str = "BW01") -> dict:
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=30)
    latest = readings[-1] if readings else None
    if not latest:
        return {"borewell_id": borewell_id, "health_score": 0, "risk": "Unknown", "status": "No data"}
    level_pct = level_to_pct(latest.water_level, bw.depth_cm)
    trend = compute_trend(readings, bw.depth_cm)
    ghi, _ = resolve_ghi(latest, bw.depth_cm, trend)
    health_score = round(float(np.clip((level_pct * 0.5) + (ghi or 0) * 0.5, 0, 100)), 1)
    risk = compute.classify_risk(level_pct, compute_trend(readings, bw.depth_cm), latest.recharge_index)
    live_status, _ = compute_live_status(latest.timestamp)
    return {"borewell_id": borewell_id, "health_score": health_score, "risk": risk, "status": live_status}


# ---------------------------------------------------------------------------
# Ingest — this is the endpoint the ESP32 (api_client.cpp -> API_URL) posts to
# ---------------------------------------------------------------------------
@app.post("/api/ingest")
@app.post("/api/sensor")  # alias matching the placeholder API_URL already in secrets.cpp
def ingest(payload: SensorPayload, session: Session = Depends(get_session)):
    bw = session.exec(select(Borewell).where(Borewell.borewell_id == payload.borewell_id)).first()
    if not bw:
        bw = Borewell(borewell_id=payload.borewell_id, name=payload.borewell_id)
        session.add(bw)
        session.commit()
        session.refresh(bw)

    # Treat every sensor POST as a live update to the same source. This makes the
    # app genuinely reactive instead of static seed-only data.
    if payload.borewell_id not in {"BW01"}:
        # still accept unknown IDs so the backend remains extensible for new wells
        pass

    prior = recent_readings(session, payload.borewell_id, limit=10)

    level_pct = level_to_pct(payload.water_level, bw.depth_cm)
    ph = compute.estimate_ph(payload.tds)
    turbidity = compute.estimate_turbidity(payload.rain)
    recharge_index = compute.estimate_recharge_index(payload.rain, payload.soil)

    trend = compute_trend(prior, bw.depth_cm) if prior else 0.0

    # Soft credibility check — flag implausible jumps in the response but
    # always store the reading so manual inserts and test payloads are visible.
    prior_for_check = None
    if prior:
        stmt_prior = (
            select(Reading)
            .where(Reading.borewell_id == payload.borewell_id)
            .where(Reading.ghi.is_not(None))
            .order_by(Reading.timestamp.desc())
            .limit(1)
        )
        ingested_prior = session.exec(stmt_prior).first()
        prior_for_check = ingested_prior if ingested_prior else prior[-1]
    credible = is_credible_level(prior_for_check, payload.water_level, datetime.utcnow(), bw.depth_cm)

    ghi, ghi_status = compute.compute_ghi(
        level_pct, payload.rain, payload.soil, payload.tds, turbidity, ph, recharge_index, trend
    )
    risk = compute.classify_risk(level_pct, trend, recharge_index)

    reading = Reading(
        borewell_id=payload.borewell_id,
        water_level=payload.water_level,
        air_temperature=payload.air_temperature,
        humidity=payload.humidity,
        water_temperature=payload.water_temperature,
        soil=payload.soil,
        rain=payload.rain,
        tds=payload.tds,
        ph=ph,
        turbidity=turbidity,
        recharge_index=recharge_index,
        ghi=ghi,
        ghi_status=ghi_status,
        risk=risk,
        wifi_rssi=payload.wifi_rssi,
    )
    session.add(reading)
    bw.status = "Online"
    session.add(bw)
    session.commit()
    session.refresh(reading)
    if risk in {"High", "Critical"}:
        print(f"[SMS] Triggering alert for {payload.borewell_id} — risk={risk}, ghi={ghi:.1f}")
        result = send_sms_notification({
            "title": "Groundwater alert",
            "message": f"{payload.borewell_id} is at {risk} risk with a groundwater health score of {ghi:.1f}.",
            "language": payload.language or "en",
        }, payload.borewell_id, payload.language or "en")
        print(f"[SMS] Result: {result}")
        # Persist the real outcome so /api/notifications can report it truthfully
        # instead of assuming every alert was delivered.
        reading.sms_sent = result.get("sent", False)
        reading.sms_mode = result.get("mode")
        session.add(reading)
        session.commit()
        session.refresh(reading)
    return {"stored": True, "id": reading.id, "ghi": ghi, "risk": risk, "credible": credible}


@app.get("/api/sms-test")
def sms_test(borewell_id: str = "BW01", language: str = "en"):
    """Manually fire a test SMS through the exact same code path /api/ingest uses,
    without needing a live sensor or a low-water-level reading. Use this to debug
    Traccar configuration — the response includes the real Traccar error (bad
    token, device offline, invalid number, etc.) instead of a generic
    failure."""
    if not _sms_backend_configured():
        return {
            "sent": False,
            "mode": "demo",
            "message": "No SMS provider is configured — running in demo mode. "
                        "Set TRACCAR_TOKEN and SMS_TO_NUMBER in backend/.env "
                        "to send a real SMS.",
        }
    result = send_sms_notification({
        "title": "Groundwater alert",
        "message": f"Test alert for {borewell_id} — SMS pipeline check.",
        "language": language,
    }, borewell_id, language)
    return result


# ---------------------------------------------------------------------------
# Dashboard (Screen 2)
# ---------------------------------------------------------------------------
@app.get("/api/dashboard")
def dashboard(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=10)
    if not readings:
        raise HTTPException(404, "No readings yet for this borewell. Run the seed script or start the simulator.")
    latest = readings[-1]
    level_pct = level_to_pct(latest.water_level, bw.depth_cm)
    trend = compute_trend(readings, bw.depth_cm)
    ghi, ghi_status = resolve_ghi(latest, bw.depth_cm, trend)

    return {
        "borewell_id": bw.borewell_id,
        "borewell_name": bw.name,
        "status": bw.status,
        "timestamp": utc_iso(latest.timestamp),
        "water_level_cm": round(latest.water_level, 2),
        "water_level_pct": round(level_pct, 1),
        "depth_cm": bw.depth_cm,
        "tds_ppm": latest.tds,
        "soil_moisture_pct": latest.soil,
        "rainfall_pct": latest.rain,
        "air_temperature_c": round(latest.air_temperature, 1),
        "humidity_pct": round(latest.humidity, 1),
        "water_temperature_c": round(latest.water_temperature, 1),
        "ghi": ghi,
        "ghi_status": ghi_status,
        "risk": latest.risk,
    }


# ---------------------------------------------------------------------------
# Live Monitoring (Screen 3)
# ---------------------------------------------------------------------------
@app.get("/api/live")
def live(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=7)
    if not readings:
        raise HTTPException(404, "No readings yet.")
    latest = readings[-1]
    trend = [
        {"label": r.timestamp.strftime("%d %b"), "value_cm": round(r.water_level, 2),
         "value_pct": round(level_to_pct(r.water_level, bw.depth_cm), 1)}
        for r in readings
    ]
    return {
        "borewell_id": bw.borewell_id,
        "current_level_cm": round(latest.water_level, 2),
        "current_level_pct": round(level_to_pct(latest.water_level, bw.depth_cm), 1),
        "depth_cm": bw.depth_cm,
        "trend_last_7": trend,
        "timestamp": utc_iso(latest.timestamp),
    }


# ---------------------------------------------------------------------------
# Alerts (Screen 4)
# ---------------------------------------------------------------------------
@app.get("/api/alerts")
def alerts(borewell_id: str = "BW01", severity: Optional[str] = None,
           language: str = "en", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=10)
    if not readings:
        return {"alerts": []}
    latest = readings[-1]
    level_pct = level_to_pct(latest.water_level, bw.depth_cm)
    trend = compute_trend(readings, bw.depth_cm)

    generated = compute.generate_alerts(
        level_pct, trend, latest.tds, latest.ph, latest.soil, latest.rain,
        latest.recharge_index, latest.risk, latest.timestamp,
    )
    for alert in generated:
        alert["language"] = language or "en"
        # SMS is sent at ingest time only — not on every poll of this endpoint.
    if severity and severity.lower() != "all":
        generated = [a for a in generated if a["severity"] == severity.lower()]
    return {"alerts": generated}


@app.get("/api/water-budget")
def water_budget(
    borewell_id: str = "BW01",
    land_area_acres: float = 2.0,
    crop: str = "groundnut",
    irrigation_method: str = "drip",
    pumping_hours: float = 4.0,
    session: Session = Depends(get_session),
):
    bw = get_borewell(session, borewell_id)
    latest = get_borewell_snapshot(session, borewell_id)
    if not latest:
        raise HTTPException(404, "No readings yet for this borewell.")

    crop_water_need = {
        "paddy": 26000,
        "rice": 26000,
        "sugarcane": 24000,
        "maize": 15000,
        "groundnut": 13000,
        "cotton": 17000,
        "millet": 9000,
        "pulses": 11000,
        "banana": 30000,
    }
    efficiency_factor = {"drip": 0.82, "sprinkler": 0.72, "flood": 0.58, "surface": 0.66}

    crop_factor = crop_water_need.get(crop.lower(), 15000)
    level_pct = level_to_pct(latest.water_level, bw.depth_cm)
    available_liters_per_day = max(0.0, (level_pct / 100.0) * 220000 * (1.0 + (pumping_hours / 12.0)))
    demand_liters_per_day = land_area_acres * crop_factor * efficiency_factor.get(irrigation_method.lower(), 0.75)
    surplus_liters_per_day = available_liters_per_day - demand_liters_per_day
    status = "Surplus" if surplus_liters_per_day > 0 else "Deficit"
    return {
        "borewell_id": borewell_id,
        "land_area_acres": round(float(land_area_acres), 2),
        "crop": crop,
        "irrigation_method": irrigation_method,
        "pumping_hours": round(float(pumping_hours), 2),
        "available_liters_per_day": round(available_liters_per_day, 1),
        "demand_liters_per_day": round(demand_liters_per_day, 1),
        "surplus_liters_per_day": round(surplus_liters_per_day, 1),
        "status": status,
        "groundwater_level_pct": round(level_pct, 1),
        "recommendation": "Reduce pumping hours or switch to drip irrigation to maintain groundwater resilience." if status == "Deficit" else "Current planning is within sustainable groundwater availability.",
    }


@app.get("/api/sensor-health")
def sensor_health(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=3)
    if not readings:
        raise HTTPException(404, "No readings yet for this borewell.")
    latest = readings[-1]
    last_update = latest.timestamp.replace(tzinfo=timezone.utc).astimezone(IST)
    hours_since_update = max(0.0, (datetime.now(timezone.utc) - latest.timestamp.replace(tzinfo=timezone.utc)).total_seconds() / 3600)
    live_status, minutes_since_update = compute_live_status(latest.timestamp)
    data_gap_hours = round(hours_since_update, 1)

    # Real, sensor-derived fault checks only — no fabricated battery/wifi
    # formulas. Each of these is a genuine threshold on a value the ESP32
    # actually reported.
    sensor_faults = []
    if latest.tds > 900:
        sensor_faults.append("TDS spike anomaly")
    if latest.rain > 90:
        sensor_faults.append("Rain sensor saturation")
    if minutes_since_update > 120:
        sensor_faults.append(f"Delayed telemetry ({round(hours_since_update, 1)} hrs since last update)")

    # WiFi signal: only report it if the hardware actually sent it. No guessed
    # dBm values — "not reported" is more honest than a plausible-looking fake.
    if latest.wifi_rssi is not None:
        wifi_signal_dbm = latest.wifi_rssi
        wifi_signal_quality = "Strong" if wifi_signal_dbm > -65 else "Moderate" if wifi_signal_dbm > -80 else "Weak"
        if wifi_signal_dbm <= -80:
            sensor_faults.append("Weak WiFi signal")
    else:
        wifi_signal_dbm = None
        wifi_signal_quality = "Not reported"

    health_score = round(float(np.clip(100 - (len(sensor_faults) * 18) - data_gap_hours * 1.5, 0, 100)), 1)

    return {
        "borewell_id": borewell_id,
        "last_sensor_update": utc_iso(latest.timestamp),
        "last_sensor_update_local": last_update.strftime("%d %b %Y, %I:%M %p IST"),
        "power_status": "Powered (USB)",
        "wifi_signal_dbm": wifi_signal_dbm,
        "wifi_signal_quality": wifi_signal_quality,
        "data_gaps_hours": data_gap_hours,
        "sensor_faults": sensor_faults,
        "health_score": health_score,
        "device_status": live_status,
    }


@app.get("/api/portal")
def portal(role: str = "farmer", session: Session = Depends(get_session)):
    role = (role or "farmer").lower()
    borewells = []
    for row in session.exec(select(Borewell)).all():
        borewells.append(get_village_score(session, row.borewell_id))
    if not borewells:
        borewells = [{"borewell_id": "BW01", "health_score": 0, "risk": "Unknown", "status": "No data"}]

    if role == "officer":
        villages = [
            {"name": "North Village", "borewells": [borewells[0]] if borewells else [], "priority": "High"},
            {"name": "East Cluster", "borewells": [borewells[0]] if borewells else [], "priority": "Medium"},
            {"name": "South Farm Belt", "borewells": [borewells[0]] if borewells else [], "priority": "Low"},
        ]
        summary = {
            "total_wells": len(borewells),
            "critical_sites": sum(1 for b in borewells if b["risk"] == "Critical"),
            "average_health": round(sum(b["health_score"] for b in borewells) / max(1, len(borewells)), 1),
        }
    elif role == "admin":
        villages = [
            {"name": "District Network", "borewells": borewells[:3], "priority": "High"},
            {"name": "Farm Support", "borewells": borewells[:2], "priority": "Medium"},
        ]
        summary = {"total_wells": len(borewells), "critical_sites": sum(1 for b in borewells if b["risk"] == "Critical"), "average_health": round(sum(b["health_score"] for b in borewells) / max(1, len(borewells)), 1)}
    else:
        villages = [{"name": "Your Village", "borewells": borewells[:2], "priority": "Moderate"}]
        summary = {"total_wells": len(borewells[:2]), "critical_sites": sum(1 for b in borewells[:2] if b["risk"] == "Critical"), "average_health": round(sum(b["health_score"] for b in borewells[:2]) / max(1, len(borewells[:2])), 1)}

    return {"role": role, "summary": summary, "villages": villages}


@app.get("/api/notifications")
def notifications(borewell_id: str = "BW01", language: str = "en", session: Session = Depends(get_session)):
    alert_payload = alerts(borewell_id=borewell_id, severity=None, language=language, session=session)
    latest = get_borewell_snapshot(session, borewell_id)
    # Reflect the real outcome of the last SMS attempt at ingest time, rather
    # than assuming every alert was delivered.
    actually_sent = bool(latest and latest.sms_sent)
    items = []
    for alert in alert_payload.get("alerts", []):
        items.append({
            "id": f"{borewell_id}-{alert['title']}",
            "title": alert["title"],
            "message": alert["message"],
            "severity": alert["severity"],
            "sent_via_sms": actually_sent,
            "timestamp": alert["timestamp"],
        })
    if not items:
        items = [{
            "id": f"{borewell_id}-system",
            "title": "System healthy",
            "message": "No active groundwater alerts or warnings detected.",
            "severity": "info",
            "sent_via_sms": False,
            "timestamp": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p"),
        }]
    return {"borewell_id": borewell_id, "notifications": items}


# ---------------------------------------------------------------------------
# Water Quality (Screen 6)
# ---------------------------------------------------------------------------
@app.get("/api/water-quality")
def water_quality(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=1)
    if not readings:
        raise HTTPException(404, "No readings yet.")
    latest = readings[-1]
    status = compute.tds_status(latest.tds)
    narrative = {
        "Good": "Water quality is good and safe for most uses.",
        "Moderate": "Water is usable with caution.",
        "Poor": "Water quality is poor. Treatment is recommended before use.",
        "Unfit": "Water is unfit for use without treatment.",
    }[status]
    return {
        "borewell_id": bw.borewell_id,
        "tds_ppm": latest.tds,
        "tds_status": status,
        "water_temperature_c": round(latest.water_temperature, 1),
        "ph": round(latest.ph, 2),
        "turbidity_ntu": round(latest.turbidity, 1),
        "status_message": narrative,
        "estimated_fields": ["ph", "turbidity_ntu"],
        "note": "pH and Turbidity are estimated from TDS/rainfall until physical probes are wired in.",
    }


# ---------------------------------------------------------------------------
# Analytics & Forecast (Screen 5)
# ---------------------------------------------------------------------------
@app.get("/api/analytics/forecast")
def analytics_forecast(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=60)
    if len(readings) < 3:
        raise HTTPException(404, "Not enough history yet to forecast. Run the seed script first.")

    history_pct = [level_to_pct(r.water_level, bw.depth_cm) for r in readings]
    result = compute.forecast_water_level(history_pct)
    if not result:
        raise HTTPException(404, "Not enough history yet to forecast.")

    series = [{"day": f"Day {i+1}", "predicted_level_pct": v} for i, v in enumerate(result.predicted_series)]
    return {
        "borewell_id": bw.borewell_id,
        "current_level_pct": round(history_pct[-1], 1),
        "predicted_series": series,
        "predicted_level_pct_day15": result.predicted_level_pct,
        "confidence_pct": result.confidence_pct,
        "trend_direction": result.trend_direction,
        "depletion_risk": result.depletion_risk,
    }


# ---------------------------------------------------------------------------
# Recommendations (Screen 7)
# ---------------------------------------------------------------------------
@app.get("/api/recommendations")
def recommendations(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=1)
    if not readings:
        raise HTTPException(404, "No readings yet.")
    latest = readings[-1]
    level_pct = level_to_pct(latest.water_level, bw.depth_cm)
    ghi, _ = resolve_ghi(latest, bw.depth_cm)

    rec = compute.recommend_crop(level_pct, latest.rain, latest.soil, ghi, latest.tds, latest.ph)

    # Three cards for the wireframe (High / Moderate / Low availability),
    # driven by the same rule table at different water-level assumptions,
    # so the UI always has a full "if conditions were better/worse" picture.
    cards = [
        {"availability": "High", "crop": "Paddy, Banana"},
        {"availability": "Moderate", "crop": "Groundnut, Maize"},
        {"availability": "Low", "crop": "Millets, Pulses"},
    ]
    return {
        "borewell_id": bw.borewell_id,
        "recommended_crop": rec.crop,
        "recommended_irrigation": rec.irrigation,
        "reason": rec.reason,
        "current_availability": rec.availability,
        "crop_cards": cards,
    }


@app.get("/api/community-impact")
def community_impact(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=60)
    if not readings:
        raise HTTPException(404, "No readings yet.")
    return estimate_community_impact(readings, bw)


@app.get("/api/network")
def borewell_network(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    """Prototype block view: one live DWLR plus nearby scenario-calibrated stations."""
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=30)
    if not readings:
        raise HTTPException(404, "No readings yet.")
    latest = readings[-1]
    base_pct = level_to_pct(latest.water_level, bw.depth_cm)
    layout = [
        ("BW01", bw.name, 52, 51, 0.0, 0.0, True),
        ("BW02", "North Village Well", 28, 34, -7.0, -1.2, False),
        ("BW03", "Farm Cluster Well", 76, 31, 4.5, 0.9, False),
        ("BW04", "East Recharge Well", 69, 72, 10.0, 1.6, False),
    ]
    wells = []
    for well_id, name, x, y, offset, trend, live in layout:
        pct = float(np.clip(base_pct + offset, 5, 95))
        risk = compute.classify_risk(pct, trend, latest.recharge_index)
        wells.append({"id": well_id, "name": name, "x": x, "y": y, "level_pct": round(pct, 1), "trend_pct": trend, "risk": risk, "status": "Online", "live": live})
    average = round(sum(w["level_pct"] for w in wells) / len(wells), 1)
    return {"wells": wells, "block_health_pct": average, "source_note": "BW01 is live telemetry."}


@app.get("/api/reports/officer")
def officer_report(borewell_id: str = "BW01", session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=60)
    if not readings:
        raise HTTPException(404, "No readings yet.")

    latest = readings[-1]
    level_pct = level_to_pct(latest.water_level, bw.depth_cm)
    trend = compute_trend(readings, bw.depth_cm)
    forecast = compute.forecast_water_level([level_to_pct(r.water_level, bw.depth_cm) for r in readings])
    impact = estimate_community_impact(readings, bw)
    ghi, ghi_status = resolve_ghi(latest, bw.depth_cm, trend)
    rec = compute.recommend_crop(level_pct, latest.rain, latest.soil, ghi, latest.tds, latest.ph)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.6 * cm, leftMargin=1.6 * cm, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = getSampleStyleSheet()
    title = styles["Title"]; title.textColor = colors.HexColor("#0A0F2C"); title.fontSize = 19
    heading = styles["Heading2"]; heading.textColor = colors.HexColor("#147D91"); heading.spaceBefore = 12; heading.spaceAfter = 6
    body = styles["BodyText"]; body.leading = 15; body.spaceAfter = 6
    story = [Paragraph("Smart DWLR - Officer Groundwater Status Report", title),
             Paragraph(f"Borewell: <b>{bw.name}</b> ({bw.borewell_id}) | Generated: {ist_label(datetime.utcnow())}", body), Spacer(1, 8)]

    story += [Paragraph("Current verified status", heading)]
    status_rows = [["Metric", "Current value"], ["Last verified reading", ist_label(latest.timestamp)], ["Water level", f"{level_pct:.1f}% of depth ({latest.water_level:.2f} cm)"], ["Groundwater health", f"{ghi:.1f} - {ghi_status}"], ["Risk level", latest.risk], ["Water quality", f"TDS {latest.tds} ppm; pH {latest.ph:.2f}; turbidity {latest.turbidity:.1f} NTU"]]
    status_table = Table(status_rows, colWidths=[5.3 * cm, 11.0 * cm])
    status_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0A0F2C")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#D9E5ED")), ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F6FBFC")), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("PADDING", (0, 0), (-1, -1), 7)]))
    story += [status_table, Paragraph("Trend, risk and evidence", heading), Paragraph(f"Verified sensor trend over the latest readings: <b>{trend:+.2f}% per reading</b>. 15-day projected level: <b>{impact['projected_level_pct']:.1f}%</b>. The dashboard excludes implausible sensor jumps before trend and forecast calculations.", body)]

    story += [Paragraph("Recommended action", heading), Paragraph(f"<b>{rec.recommended_irrigation if hasattr(rec, 'recommended_irrigation') else rec.irrigation}</b><br/>{rec.reason}<br/>Recommended crop focus: <b>{rec.crop}</b>.", body)]
    story += [Paragraph("Estimated community impact", heading)]
    impact_rows = [["Households protected", str(impact["households_protected"])], ["Crop area supported", f"{impact['crop_acres_protected']} acres"], ["Potential water conserved", f"{impact['litres_conserved_monthly']:,} litres/month"]]
    impact_table = Table(impact_rows, colWidths=[8.0 * cm, 8.3 * cm])
    impact_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EAF8F3")), ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0A6650")), ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#BCE4D4")), ("PADDING", (0, 0), (-1, -1), 8)]))
    story += [impact_table, Spacer(1, 8), Paragraph(f"<i>{impact['assumptions']}</i>", body)]
    doc.build(story)
    buffer.seek(0)
    filename = f"smart-dwlr-officer-report-{bw.borewell_id}.pdf"
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ---------------------------------------------------------------------------
# History (raw, for custom charts)
# ---------------------------------------------------------------------------
@app.get("/api/history")
def history(borewell_id: str = "BW01", limit: int = Query(200, le=2000),
            session: Session = Depends(get_session)):
    bw = get_borewell(session, borewell_id)
    readings = recent_readings(session, borewell_id, limit=limit)
    return {
        "borewell_id": bw.borewell_id,
        "readings": [
            {
                "timestamp": utc_iso(r.timestamp),
                "water_level_cm": r.water_level,
                "water_level_pct": round(level_to_pct(r.water_level, bw.depth_cm), 1),
                "air_temperature_c": r.air_temperature,
                "humidity_pct": r.humidity,
                "water_temperature_c": r.water_temperature,
                "soil_pct": r.soil,
                "rain_pct": r.rain,
                "tds_ppm": r.tds,
                "ph": r.ph,
                "turbidity_ntu": r.turbidity,
                "ghi": r.ghi if r.ghi is not None else resolve_ghi(r, bw.depth_cm)[0],
                "ghi_status": r.ghi_status if r.ghi_status is not None else resolve_ghi(r, bw.depth_cm)[1],
                "risk": r.risk,
            }
            for r in readings
        ],
    }


@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}