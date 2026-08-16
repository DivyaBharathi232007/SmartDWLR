import { useEffect, useState } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import TopBar from "../components/TopBar";
import { Card, Pill, Loader, ErrorState } from "../components/Card";
import { DonutGauge } from "../components/Gauges";
import { getForecast, getHistory } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t, tStatus } from "../i18n";

const riskTone = { Low: "emerald", Medium: "amber", High: "coral", Critical: "coral" };

export default function AnalyticsForecast() {
  const [tab, setTab] = useState("forecast");
  const [history, setHistory] = useState(null);
  const { data: forecast, error } = usePolling(getForecast, 12000, [tab]);

  useEffect(() => {
    getHistory(50).then((d) => setHistory(d.readings)).catch(() => setHistory(null));
  }, [forecast?.borewell_id]);

  return (
    <div className="pb-24 lg:pb-10">
      <TopBar title={t("analytics")} subtitle={t("analyticsSubtitle")} />
      <div className="p-4 lg:p-8">
        <div className="mb-4 flex max-w-md gap-2 lg:mb-6">
          <TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}>{t("forecast")}</TabButton>
          <TabButton active={tab === "trend"} onClick={() => setTab("trend")}>{t("trendTab")}</TabButton>
        </div>

        {error && <ErrorState message={t("unavailable")} hint={error} />}

        {tab === "forecast" && (
          <>
            {!forecast && !error && <Loader label={t("fittingTrend")} />}
            {forecast && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <p className="mb-1 text-sm font-semibold text-navy-900">
                    {t("predictedGroundwater")}
                  </p>
                  <p className="mb-3 text-[11px] text-slate-400">{t("ofDepth")}</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={forecast.predicted_series}>
                      <defs>
                        <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2fa9b8" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#2fa9b8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip />
                      <Area isAnimationActive animationDuration={900} type="monotone" dataKey="predicted_level_pct" stroke="#2fa9b8" strokeWidth={2.5} fill="url(#fc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  
                </Card>

                <div className="space-y-4">
                  <Card className="flex flex-col items-center justify-center py-6">
                    <p className="mb-1 text-[11px] font-medium text-slate-400">{t("depletionRisk")}</p>
                    <Pill tone={riskTone[forecast.depletion_risk] || "slate"}>{tStatus(forecast.depletion_risk)}</Pill>
                    <p className="mt-2 text-[11px] text-slate-400">{t("trendDirLabel")} {tStatus(forecast.trend_direction)}</p>
                  </Card>
                  <Card className="flex flex-col items-center justify-center py-6">
                    <p className="mb-2 text-[11px] font-medium text-slate-400">{t("confidenceScore")}</p>
                    <DonutGauge pct={forecast.confidence_pct} color="#1f9d6e" size={100} strokeWidth={10} />
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "trend" && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-navy-900">{t("recentWaterTrend")}</p>
            {!history && <Loader label={t("loadingHistory")} />}
            {history && (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip labelFormatter={(t) => new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} />
                  <Line isAnimationActive animationDuration={850} type="monotone" dataKey="water_level_pct" stroke="#1f9d6e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
        active ? "bg-navy-900 text-white" : "bg-white text-slate-500 border border-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
