# Smart DWLR — AIoT Groundwater Monitoring & Early Warning System

> Real-time groundwater intelligence for rural India — from an ESP32 sensor node to a full analytics dashboard, with AI-driven risk alerts, crop recommendations, and community impact reporting.

---

## What is Smart DWLR?

**DWLR** stands for **Digital Water Level Recorder**. Traditional DWLRs are expensive, offline devices that require manual field visits. Smart DWLR replaces that with a low-cost ESP32-based IoT sensor node that continuously monitors borewell conditions and streams data to a cloud-connected dashboard — giving farmers, village officers, and district admins real-time groundwater intelligence in their pocket.

The system detects critical groundwater depletion, estimates recharge potential, recommends drought-resilient crops, forecasts 15-day water levels, and triggers SMS/Telegram alerts before a crisis hits.

---

## Key Features

| Feature | Description |
|---|---|
| **Live Dashboard** | Real-time water level, temperature, humidity, TDS, soil moisture, and rainfall |
| **Groundwater Health Index (GHI)** | Composite 0–100 score derived from 8 sensor parameters |
| **Risk Classification** | Four-tier risk engine (Low / Medium / High / Critical) with automatic alerts |
| **15-Day Forecast** | Trend-based water level projection with confidence score |
| **Water Quality Analysis** | TDS, pH, and turbidity assessment with potability status |
| **Crop Recommendation** | AI rule engine suggesting optimal crops and irrigation method |
| **Water Budget Planner** | Daily supply vs. demand calculator per crop, area, and irrigation type |
| **Borewell Network View** | Block-level map of multiple borewells with cluster health score |
| **SMS / Telegram Alerts** | Instant notifications on High or Critical risk events |
| **Officer Report (PDF)** | One-click downloadable status report for field officers |
| **Multilingual Support** | English and Tamil alert messages |

---

## System Architecture

```
┌─────────────────────┐        Wi-Fi / Tunnel        ┌──────────────────────┐
│   ESP32 Sensor Node │  ──── POST /api/ingest ────►  │   FastAPI Backend    │
│   (Wokwi / Real HW) │                               │   Python + SQLModel  │
│                     │                               │   MySQL / SQLite     │
│  Sensors:           │                               └──────────┬───────────┘
│  • HC-SR04 (level)  │                                          │ REST API
│  • DHT22 (air)      │                                          │
│  • DS18B20 (water)  │                               ┌──────────▼───────────┐
│  • Soil moisture    │                               │   React Frontend     │
│  • Rain sensor      │                               │   Vite + Tailwind    │
│  • TDS probe        │                               │   Recharts + Framer  │
└─────────────────────┘                               └──────────────────────┘
                                                                 │
                                                       ┌─────────▼──────────┐
                                                       │  SMS / Telegram    │
                                                       │  Alert Delivery    │
                                                       └────────────────────┘
```

---

## Project Structure

```
smart-dwlr/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes — all 12 API endpoints
│   │   ├── db.py            # SQLModel ORM — Reading & Borewell tables
│   │   ├── compute.py       # AI engine — GHI, risk, forecast, crop logic
│   │   └── schemas.py       # Pydantic payload schema (ESP32 → API)
│   ├── seed.py              # Backfills 7 days of realistic history
│   ├── simulate.py          # Posts live fake readings (demo without Wokwi)
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── pages/           # 12 screens: Dashboard, LiveMonitoring, Alerts…
│       ├── components/      # Gauges, Cards, Sidebar, TopBar, WaterGuide
│       ├── hooks/           # usePolling — auto-refresh every 5 s
│       └── api.js           # Axios client wired to VITE_API_URL
│
└── sensor-c/                # ESP32 Arduino sketch (Wokwi-compatible)
    ├── sketch.ino           # Main loop
    ├── sensors.cpp/.h       # HC-SR04, DHT22, DS18B20, soil, rain, TDS
    ├── api_client.cpp/.h    # Wi-Fi POST to backend
    └── config.h             # Pin definitions and borewell depth constant
```

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API framework
- [SQLModel](https://sqlmodel.tiangolo.com/) — ORM over SQLAlchemy (SQLite for dev, MySQL for production)
- [NumPy](https://numpy.org/) — GHI computation and trend forecasting
- [ReportLab](https://www.reportlab.com/) — PDF officer report generation
- [PyMySQL](https://pymysql.readthedocs.io/) — MySQL connector

**Frontend**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) — sensor trend charts
- [Framer Motion](https://www.framer.com/motion/) — animated UI transitions
- [React Router v7](https://reactrouter.com/)

**Hardware / Firmware**
- ESP32 (simulated on [Wokwi](https://wokwi.com/projects/468059626618861569))
- HC-SR04 ultrasonic — water level distance
- DHT22 — air temperature & humidity
- DS18B20 — water temperature
- Capacitive soil moisture sensor
- Rain sensor module
- TDS (Total Dissolved Solids) probe

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL (or use the default SQLite — no setup needed)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env         # then edit .env with your DB credentials
```

**`.env` configuration:**
```env
# Database — leave DATABASE_URL empty to use SQLite (no setup needed)
USE_MYSQL=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_dwlr

# Alerts — Fast2SMS (free for Indian numbers, sign up at fast2sms.com)
FAST2SMS_API_KEY=your_api_key_here
SMS_TO_NUMBER=+91XXXXXXXXXX
```

```bash
# Seed 7 days of realistic history (needed for charts and forecast)
python seed.py

# Start the backend
uvicorn app.main:app --port 8000 --reload
```

Backend runs at `http://localhost:8000`
Interactive API docs available at `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

The frontend reads `VITE_API_URL` from `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Login with any email/password — auth is mocked for the demo.

---

### 3. Connecting the ESP32 / Wokwi Simulation

Open the Wokwi project: [https://wokwi.com/projects/468059626618861569](https://wokwi.com/projects/468059626618861569)

Since the Wokwi browser simulator cannot reach `localhost`, expose your backend with a tunnel:

```bash
npx localtunnel --port 8000
# → your url is: https://xxxx-xxxx.loca.lt
```

Then update `sensor-c/secrets.cpp`:
```cpp
const char* API_URL = "https://xxxx-xxxx.loca.lt/api/sensor";
```

The ESP32 sketch POSTs this JSON payload every ~10 seconds:
```json
{
  "borewell_id": "BW01",
  "water_level": 54.3,
  "air_temperature": 32.1,
  "humidity": 68.4,
  "water_temperature": 28.0,
  "soil": 42,
  "rain": 5,
  "tds": 340
}
```

No changes needed to the sketch — the payload shape matches the backend schema exactly.

**Running without Wokwi?** Use the simulator script:
```bash
cd backend
python simulate.py   # posts realistic fake readings every 10 s
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest` | Receive sensor payload from ESP32 |
| `GET` | `/api/dashboard` | Latest reading + GHI + risk summary |
| `GET` | `/api/live` | Current level + 7-reading trend |
| `GET` | `/api/alerts` | Generated alerts based on current conditions |
| `GET` | `/api/analytics/forecast` | 15-day water level forecast |
| `GET` | `/api/water-quality` | TDS, pH, turbidity assessment |
| `GET` | `/api/recommendations` | Crop and irrigation recommendation |
| `GET` | `/api/water-budget` | Supply vs. demand calculator |
| `GET` | `/api/sensor-health` | Battery, Wi-Fi signal, data gap status |
| `GET` | `/api/network` | Block-level borewell cluster view |
| `GET` | `/api/community-impact` | Households and acres protected estimate |
| `GET` | `/api/reports/officer` | Download PDF status report |

---

## AI / Analytics Models

All models run in real time from `backend/app/compute.py`:

| Model | Source | Implementation |
|---|---|---|
| **Groundwater Health Index** | Model 3 (notebook) | Weighted composite of 8 sensor parameters — water level (35%), recharge (20%), quality (15%), rainfall (10%), soil (10%), trend (10%) |
| **Risk Classification** | Model 2 (notebook) | Rule-based: Critical if level < 15% depth or rapid decline + low recharge |
| **15-Day Forecast** | Model 1 (notebook) | Linear trend projection over recent readings; swap in the trained XGBoost `.pkl` when available |
| **Crop Recommendation** | Model 4 (notebook) | Decision table: maps GHI + water level + TDS + pH to optimal crop and irrigation method |

---

## What's Real vs. Estimated

| Parameter | Status | Notes |
|---|---|---|
| Water level | **Real sensor** | HC-SR04 ultrasonic distance → depth % |
| Air temperature & humidity | **Real sensor** | DHT22 |
| Water temperature | **Real sensor** | DS18B20 |
| Soil moisture | **Real sensor** | Capacitive analog sensor |
| Rainfall | **Real sensor** | Analog rain sensor module |
| TDS | **Real sensor** | TDS probe on ADC |
| pH | **Estimated** | Derived from TDS until a physical pH probe is added |
| Turbidity | **Estimated** | Derived from rainfall until a turbidity sensor is added |

pH and turbidity estimates are clearly disclosed in the Water Quality screen. Replacing them with real probes requires only adding the fields to `SensorPayload` in `schemas.py` and removing the `estimate_*` calls in `ingest()`.

---

## SMS Alerts

Alerts fire automatically at ingest time when risk is **High** or **Critical**.

**Provider: Fast2SMS** (free for Indian numbers, no DLT registration needed)
1. Sign up at [fast2sms.com](https://www.fast2sms.com)
2. Go to **Dev API** → copy your Authorization Key
3. Set `FAST2SMS_API_KEY` in `.env`

If no API key is set, alerts log to the console as `[SMS DEMO]` so the app works in development without any configuration.

---

## Screenshots

| Screen | Description |
|---|---|
| Dashboard | Live GHI gauge, risk level, water level, all sensor KPIs |
| Live Monitoring | 7-reading trend chart with current level |
| Analytics & Forecast | 15-day projection with trend direction |
| Water Quality | TDS / pH / turbidity with potability status |
| Alerts | Active warnings with severity badges |
| Recommendations | Crop cards by water availability tier |
| Water Budget Planner | Supply / demand calculator with surplus/deficit status |
| Sensor Health | Battery %, Wi-Fi signal, data gaps, fault list |
| Borewell Network | Block map with cluster health score |
| Officer Portal | Village-level summary for field officers |

---

## Useful Commands

```bash
# Backend
python seed.py          # Backfill 7 days of history
python simulate.py      # Post fake live readings (demo mode)

# Frontend
npm run dev             # Start dev server
npm run build           # Production build
npm run lint            # Run oxlint

# Tunnel (expose local backend to Wokwi)
npx localtunnel --port 8000
```

---

## License

MIT — built for the Smart India Hackathon. Free to use, adapt, and deploy.
