"""
Optional fallback simulator — posts fake-but-realistic sensor readings to
the backend's /api/sensor endpoint every few seconds, in the exact same
JSON shape the ESP32 (api_client.cpp) sends.

You said you'll run the real Wokwi simulation instead — you likely won't
need this. It's here in case Wokwi isn't running and you still want to
demo live updates.

Run:  python simulate.py --url http://localhost:5000/api/sensor --interval 5
"""
import argparse
import random
import time

import requests

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://localhost:5000/api/sensor")
parser.add_argument("--interval", type=float, default=5.0, help="seconds between posts")
args = parser.parse_args()

level = 58.0
soil = 40

print(f"Posting simulated readings to {args.url} every {args.interval}s. Ctrl+C to stop.")
while True:
    rain = max(0, int(random.gauss(8, 10)))
    if random.random() < 0.05:
        rain = random.randint(35, 70)

    level = max(5.0, min(100.0, level - random.uniform(0.02, 0.15) + (rain / 100.0) * 0.5))
    soil = max(5, min(90, soil + (rain / 100.0) * 5 - random.uniform(0.2, 1.0)))

    payload = {
        "water_level": round(level, 2),
        "air_temperature": round(29 + random.uniform(-2, 4), 1),
        "humidity": round(60 + random.uniform(-10, 10), 1),
        "water_temperature": round(25 + random.uniform(-1, 2), 1),
        "soil": int(soil),
        "rain": int(rain),
        "tds": max(50, int(random.gauss(340, 60))),
    }
    try:
        r = requests.post(args.url, json=payload, timeout=5)
        print(payload, "->", r.status_code)
    except Exception as e:
        print("POST failed:", e)

    time.sleep(args.interval)
