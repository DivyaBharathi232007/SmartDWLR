# Smart DWLR — Frontend

React 19 + Vite + Tailwind CSS frontend for the Smart DWLR groundwater monitoring system.

## Setup

```bash
npm install
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build locally
npm run lint       # oxlint
```

## Environment

Create a `frontend/.env` file:

```env
VITE_API_URL=http://localhost:8000
```

Change this to your tunnel URL when testing with Wokwi.

## Structure

```
src/
├── pages/         # One file per screen (Dashboard, Alerts, etc.)
├── components/    # Shared UI — Gauges, Cards, Sidebar, TopBar, WaterGuide
├── hooks/         # usePolling — auto-refreshes API data every 5 s
├── assets/        # Crop and irrigation images + SVG icons
├── api.js         # Axios client — all API calls in one place
└── i18n.js        # English / Tamil label maps
```

See the [root README](../README.md) for full project documentation.
