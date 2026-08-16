"""
Backfills ~7 days of realistic hourly readings for BW01 so the dashboard,
live trend chart, forecast, and alerts all have something to show the
moment you open the frontend — before the Wokwi simulation has posted a
single live reading.

Run once:  python seed.py
Safe to re-run: it wipes and re-seeds BW01's history each time.
"""
import random
from datetime import datetime, timedelta

from app.db import Borewell, Reading, engine, init_db
from app import compute
from sqlmodel import Session, select, delete

random.seed(42)

BOREWELL_ID = "BW01"
DEPTH_CM = 100.0
HOURS_OF_HISTORY = 24 * 7


def level_to_pct(level, depth):
    return max(0, min(100, (level / depth) * 100))


def main():
    init_db()
    with Session(engine) as session:
        bw = session.exec(select(Borewell).where(Borewell.borewell_id == BOREWELL_ID)).first()
        if not bw:
            bw = Borewell(borewell_id=BOREWELL_ID, name="Borewell 01", district="Chennai", depth_cm=DEPTH_CM)
            session.add(bw)
            session.commit()
            session.refresh(bw)

        session.exec(delete(Reading).where(Reading.borewell_id == BOREWELL_ID))
        session.commit()

        start = datetime.utcnow() - timedelta(hours=HOURS_OF_HISTORY)
        level = 58.0          # cm below top, starting point (~58% of a 100cm prototype depth)
        soil = 40
        readings_buffer = []

        for i in range(HOURS_OF_HISTORY):
            ts = start + timedelta(hours=i)
            hour = ts.hour

            # gentle daily decline with random rain-driven recharge bumps
            rain = max(0, int(random.gauss(8, 10)))
            if random.random() < 0.08:
                rain = random.randint(35, 70)  # occasional rain event

            decline = random.uniform(0.05, 0.25)
            recharge_bump = (rain / 100.0) * random.uniform(0.5, 1.5)
            level = max(5.0, min(DEPTH_CM, level - decline + recharge_bump))

            soil = max(5, min(90, soil + (rain / 100.0) * 8 - random.uniform(0.5, 2.0)))
            air_temp = 28 + 6 * (1 if 10 <= hour <= 16 else 0) + random.uniform(-1.5, 1.5)
            humidity = max(30, min(95, 70 - (air_temp - 30) * 2 + random.uniform(-5, 5)))
            water_temp = 24 + random.uniform(-1, 2)
            tds = max(50, int(random.gauss(340, 60)))

            level_pct = level_to_pct(level, bw.depth_cm)
            ph = compute.estimate_ph(tds)
            turbidity = compute.estimate_turbidity(rain)
            recharge_index = compute.estimate_recharge_index(rain, soil)

            recent_pcts = [level_to_pct(r.water_level, bw.depth_cm) for r in readings_buffer[-10:]]
            trend = (level_pct - recent_pcts[0]) / len(recent_pcts) if len(recent_pcts) >= 2 else 0.0

            ghi, ghi_status = compute.compute_ghi(
                level_pct, rain, soil, tds, turbidity, ph, recharge_index, trend
            )
            risk = compute.classify_risk(level_pct, trend, recharge_index)

            reading = Reading(
                borewell_id=BOREWELL_ID,
                timestamp=ts,
                water_level=round(level, 2),
                air_temperature=round(air_temp, 1),
                humidity=round(humidity, 1),
                water_temperature=round(water_temp, 1),
                soil=int(soil),
                rain=int(rain),
                tds=tds,
                ph=round(ph, 2),
                turbidity=round(turbidity, 1),
                recharge_index=round(recharge_index, 1),
                ghi=ghi,
                ghi_status=ghi_status,
                risk=risk,
            )
            session.add(reading)
            readings_buffer.append(reading)

        bw.status = "Online"
        session.add(bw)
        session.commit()
        print(f"Seeded {HOURS_OF_HISTORY} hourly readings for {BOREWELL_ID}.")


if __name__ == "__main__":
    main()
