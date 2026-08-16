import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import TopBar from "../components/TopBar";
import { Card, Loader, ErrorState, Pill } from "../components/Card";
import { SemiGauge } from "../components/Gauges";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { getLive } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t } from "../i18n";

export default function LiveMonitoring() {
  const { data, error } = usePolling(getLive, 6000, []);

  return (
    <div className="pb-24 lg:pb-10">
      <TopBar title={t("liveMonitoring")} subtitle={t("liveSubtitle")} back />
      <div className="space-y-4 p-4 lg:p-8">
        {error && <ErrorState message={t("unavailable")} hint={error} />}
        {!data && !error && <Loader label={t("connect")} />}

        {data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="flex flex-col items-center py-6 lg:col-span-2 lg:justify-center">
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute h-2 w-2 text-teal-500" />
                  <span className="relative h-2 w-2 rounded-full bg-teal-500" />
                </span>
                <p className="text-xs font-medium text-slate-400">{t("currentWaterLevel")}</p>
              </div>
              <div className="relative">
                <SemiGauge pct={data.current_level_pct} size={240} />
                <div className="absolute inset-x-0 bottom-3 text-center">
                  <p className="font-display text-3xl font-semibold text-navy-900">
                    <AnimatedNumber value={data.current_level_cm} decimals={1} /> cm
                  </p>
                  <p className="text-[11px] text-slate-400">{data.current_level_pct}{t("ofDepth")}</p>
                </div>
              </div>
              <div className="mt-2 flex w-full max-w-[240px] justify-between text-[11px] text-slate-400">
                <span>0 cm</span>
                <span>{data.depth_cm} cm</span>
              </div>
              <Pill tone="teal">{t("borewellDepth")}: {data.depth_cm} cm</Pill>
            </Card>

            <Card className="lg:col-span-3">
              <p className="mb-3 text-sm font-semibold text-navy-900">{t("waterLevelTrend")}</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trend_last_7}>
                  <defs>
                    <linearGradient id="liveTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2fa9b8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2fa9b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip />
                  <Line isAnimationActive animationDuration={850} type="monotone" dataKey="value_pct" stroke="#2fa9b8" strokeWidth={2.5} dot={{ r: 4, fill: "#2fa9b8" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
