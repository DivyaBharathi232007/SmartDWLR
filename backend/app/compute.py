"""
Analytics engine for Smart DWLR.

This ports the logic from the four Colab notebooks (Model1 Forecasting,
Improved Model2 Risk Classification, Model3 GHI, Model4 Crop Recommendation)
so it can run in real time off a single live device instead of a large
historical multi-borewell Excel sheet.

Two things change deliberately from the notebooks, both noted inline:
1. Water-level thresholds are expressed as a PERCENTAGE OF BOREWELL DEPTH
   instead of absolute metres, because the Wokwi prototype uses a 100 cm
   depth (config.h -> BOREWELL_DEPTH_CM), not the multi-metre real
   borewells the training dataset assumed. This keeps the same logic
   correct at any depth once real hardware is deployed.
2. Forecasting uses a trend-line projection over recent readings rather
   than the trained XGBoost/RandomForest regressor, since we don't have
   the historical multi-borewell training data available in this
   environment. Swap `forecast_water_level()` for a joblib-loaded model
   the moment you train Model 1 on real collected data.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

import numpy as np


# ---------------------------------------------------------------------------
# Estimated sensors (pH, Turbidity, Recharge Index) — no physical probe yet
# ---------------------------------------------------------------------------
def estimate_ph(tds: float) -> float:
    """Rough correlation: higher TDS often trends water pH away from neutral.
    Replace with a real pH probe reading (analog pH sensor on an ADC pin)
    the moment it's wired up — this is a placeholder so the GHI/crop logic
    has a value to work with."""
    ph = 7.2 - (tds - 300) / 2500.0
    return float(np.clip(ph, 6.0, 8.5))


def estimate_turbidity(rain_pct: float) -> float:
    """Rough correlation: turbidity spikes with rainfall/runoff. Replace with
    a real turbidity sensor reading once available."""
    turb = 3.0 + (rain_pct / 100.0) * 15.0
    return float(np.clip(turb, 0, 50))


def estimate_recharge_index(rain_pct: float, soil_pct: float) -> float:
    """0-100 index of how favourable current conditions are for natural
    groundwater recharge, from rainfall + soil moisture."""
    idx = 0.6 * rain_pct + 0.4 * soil_pct
    return float(np.clip(idx, 0, 100))


# ---------------------------------------------------------------------------
# Groundwater Health Index  (Model 3 logic, fixed-scale instead of batch minmax)
# ---------------------------------------------------------------------------
def _scale(value: float, lo: float, hi: float, invert: bool = False) -> float:
    s = (value - lo) / (hi - lo) if hi != lo else 0.5
    s = float(np.clip(s, 0, 1)) * 100
    return 100 - s if invert else s


def compute_ghi(level_pct: float, rain_pct: float, soil_pct: float,
                 tds: float, turbidity: float, ph: float,
                 recharge_index: float, trend: float) -> tuple[float, str]:
    water_score = _scale(level_pct, 0, 100)
    recharge_score = _scale(recharge_index, 0, 100)
    rain_score = _scale(rain_pct, 0, 100)
    soil_score = _scale(soil_pct, 0, 100)

    tds_score = _scale(tds, 0, 1200, invert=True)
    turb_score = _scale(turbidity, 0, 50, invert=True)
    ph_score = float(np.clip(100 - abs(ph - 7) * 25, 0, 100))
    quality_score = (tds_score + turb_score + ph_score) / 3

    # trend in %-of-depth per reading, scaled around 0
    trend_score = float(np.clip(50 + trend * 200, 0, 100))

    ghi = (
        0.35 * water_score +
        0.20 * recharge_score +
        0.15 * quality_score +
        0.10 * rain_score +
        0.10 * soil_score +
        0.10 * trend_score
    )
    ghi = round(float(np.clip(ghi, 0, 100)), 1)

    if ghi >= 85:
        status = "Healthy"
    elif ghi >= 70:
        status = "Stable"
    elif ghi >= 50:
        status = "Moderate"
    elif ghi >= 30:
        status = "Warning"
    else:
        status = "Critical"
    return ghi, status


# ---------------------------------------------------------------------------
# Risk Classification (Improved Model 2 logic, thresholds as % of depth)
# ---------------------------------------------------------------------------
def classify_risk(level_pct: float, trend: float, recharge_index: float) -> str:
    if level_pct < 15 or (trend < -1.0 and recharge_index < 40):
        return "Critical"
    elif level_pct < 30:
        return "High"
    elif level_pct < 50:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Forecasting (Model 1 logic, trend-projection stand-in for the trained model)
# ---------------------------------------------------------------------------
@dataclass
class ForecastResult:
    predicted_series: List[float]     # 15 projected % values, Day 1..Day 15
    predicted_level_pct: float        # Day 15 value
    confidence_pct: float             # based on fit quality (R^2-like)
    trend_direction: str              # "Increasing" | "Decreasing" | "Stable"
    depletion_risk: str


def forecast_water_level(history_pct: List[float]) -> Optional[ForecastResult]:
    n = len(history_pct)
    if n < 3:
        return None

    x = np.arange(n)
    y = np.array(history_pct)
    slope, intercept = np.polyfit(x, y, 1)

    y_fit = slope * x + intercept
    ss_res = float(np.sum((y - y_fit) ** 2))
    ss_tot = float(np.sum((y - y.mean()) ** 2)) or 1e-6
    r2 = max(0.0, 1 - ss_res / ss_tot)
    confidence = round(float(np.clip(r2 * 100, 35, 97)), 1)  # floor so the UI never shows near-0%

    future_x = np.arange(n, n + 15)
    predicted = list(np.clip(slope * future_x + intercept, 0, 100))
    predicted = [round(float(v), 2) for v in predicted]

    if slope > 0.05:
        direction = "Increasing"
    elif slope < -0.05:
        direction = "Decreasing"
    else:
        direction = "Stable"

    depletion_risk = classify_risk(predicted[-1], slope, recharge_index=50.0)

    return ForecastResult(
        predicted_series=predicted,
        predicted_level_pct=predicted[-1],
        confidence_pct=confidence,
        trend_direction=direction,
        depletion_risk=depletion_risk,
    )


# ---------------------------------------------------------------------------
# Crop Recommendation (Model 4 logic, thresholds as % of depth)
# ---------------------------------------------------------------------------
@dataclass
class CropRecommendation:
    crop: str
    irrigation: str
    reason: str
    availability: str  # High | Moderate | Low, used for the wireframe's 3 crop cards


def recommend_crop(level_pct: float, rain_pct: float, soil_pct: float,
                    ghi: float, tds: float, ph: float) -> CropRecommendation:
    if ghi < 40 or level_pct < 15:
        return CropRecommendation("Millets", "Drip Irrigation",
                                   "Critical groundwater. Avoid water-intensive crops.", "Low")
    if level_pct >= 60 and rain_pct >= 20 and soil_pct >= 45 and tds < 500 and 6.5 <= ph <= 7.8:
        return CropRecommendation("Rice / Paddy", "Flood Irrigation",
                                   "Excellent groundwater availability and water quality.", "High")
    if level_pct >= 55 and rain_pct >= 15:
        return CropRecommendation("Sugarcane", "Surface Irrigation",
                                   "Good recharge conditions support a high-water crop.", "High")
    if level_pct >= 50 and soil_pct >= 35:
        return CropRecommendation("Groundnut / Maize", "Sprinkler Irrigation",
                                   "Moderate groundwater availability.", "Moderate")
    if level_pct >= 45:
        return CropRecommendation("Maize", "Sprinkler Irrigation",
                                   "Suitable for moderate water conditions.", "Moderate")
    if level_pct >= 40:
        return CropRecommendation("Cotton", "Drip Irrigation",
                                   "Conserve groundwater with a drought-tolerant cash crop.", "Moderate")
    return CropRecommendation("Millets / Pulses", "Drip Irrigation",
                               "Low groundwater. Prefer drought-resistant crops.", "Low")


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
def generate_alerts(level_pct: float, trend: float, tds: float, ph: float,
                     soil_pct: float, rain_pct: float, recharge_index: float,
                     risk: str, timestamp: datetime) -> List[dict]:
    alerts = []
    ts = timestamp.strftime("%d %b %Y, %I:%M %p")

    if risk == "Critical":
        alerts.append({
            "severity": "critical",
            "title": "Groundwater Level Critical",
            "message": "Water level has dropped to a critical threshold in this borewell.",
            "timestamp": ts,
        })
    if rain_pct >= 40 and soil_pct >= 40 and recharge_index >= 60:
        alerts.append({
            "severity": "warning",
            "title": "Recharge Opportunity Detected",
            "message": "Rainfall and soil moisture conditions are favourable for recharge.",
            "timestamp": ts,
        })
    if tds > 800 or ph < 6.5 or ph > 8.5:
        alerts.append({
            "severity": "warning",
            "title": "Water Quality Deterioration",
            "message": "TDS or pH is outside the normal range. Please check.",
            "timestamp": ts,
        })
    if soil_pct < 25:
        alerts.append({
            "severity": "info",
            "title": "Low Soil Moisture",
            "message": "Soil moisture is low. Consider irrigation.",
            "timestamp": ts,
        })
    return alerts


def tds_status(tds: float) -> str:
    if tds < 300:
        return "Good"
    if tds < 600:
        return "Moderate"
    if tds < 900:
        return "Poor"
    return "Unfit"
