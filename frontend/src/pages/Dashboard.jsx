import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Waves, Droplet, Sprout as Leaf, CloudRain, Thermometer, Wind, HeartPulse, ChevronRight, Sparkles, FileDown, House, Wheat } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Pill, Loader, ErrorState } from "../components/Card";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { WaterTank, DonutGauge } from "../components/Gauges";
import WaterGuide from "../components/WaterGuide";
import { getDashboard, getHistory, getCommunityImpact, officerReportUrl } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t, tStatus } from "../i18n";

const ghiTone = { Healthy: "emerald", Stable: "teal", Moderate: "amber", Warning: "amber", Critical: "coral" };

export default function Dashboard() {
  const { data, error } = usePolling(getDashboard, 5000, []);
  const [trend, setTrend] = useState(null);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    getHistory(40).then((d) => setTrend(d.readings)).catch(() => setTrend(null));
    getCommunityImpact().then(setImpact).catch(() => setImpact(null));
  }, [data?.borewell_id]);

  return (
    <div className="pb-24 lg:pb-10">
      <TopBar title={t("dashboard")} subtitle={t("dashboardSubtitle")} />
      <div className="space-y-5 p-4 lg:space-y-6 lg:p-8">
        {error && <ErrorState message={t("unavailable")} hint={error} />}
        {!data && !error && <Loader label={t("loadingMsg")} />}

        {data && (
          <>
            {/* ---- Hero banner: mobile gets a compact strip, desktop gets the full scene ---- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
              <div className="hero-wave hero-wave-one" /><div className="hero-wave hero-wave-two" />
              <div className="water-particles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-teal-500/25 blur-3xl animate-blob" />
              <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl animate-blob-slow" />

              <div className="relative flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-8">
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-teal-300">
                    <Sparkles size={13} /> {data.borewell_name} · {tStatus(data.status)}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold lg:text-3xl">
                    <span className="shimmer-text">
                      <AnimatedNumber value={data.water_level_pct} decimals={1} />%
                    </span>{" "}
                    <span className="text-base font-normal text-slate-300 lg:text-lg">%</span> <span className="text-base font-normal text-slate-300 lg:text-lg">{t("depthRemaining")}</span>
                  </h2>
                  

                  <div className="mt-5 hidden gap-6 lg:flex">
                    <HeroStat label={t("ghiScore")} value={data.ghi} tone={data.ghi_status} />
                    <HeroStat label={t("riskLevel")} value={tStatus(data.risk)} isText />
                    <HeroStat label={t("waterLevel")} value={`${data.water_level_cm} cm`} isText />
                  </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-10">
                  <div className="hidden sm:block">
                    <WaterGuide status={data.status} tip={data.status === "Healthy" ? t("qualityGood") : t("levelUpdated")} />
                  </div>
                  <WaterTank pct={data.water_level_pct} width={80} height={150} />
                  <div className="hidden flex-col items-center gap-1 lg:flex">
                    <DonutGauge pct={data.ghi} color="#34c48c" size={104} strokeWidth={10} />
                    <p className="text-[11px] font-medium text-slate-300">{t("groundwaterHealth")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Stat grid ---- */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <Tile icon={Waves} color="#2fa9b8" label={t("waterLevel")} value={data.water_level_cm} unit="cm" sub={`${data.water_level_pct}${t("ofDepth")}`} />
              <Tile icon={Droplet} color="#7c6cf0" label={t("tdsUnit")} value={data.tds_ppm} unit="ppm" />
              <Tile icon={Leaf} color="#1f9d6e" label={t("soilMoistureLabel")} value={data.soil_moisture_pct} unit="%" />
              <Tile icon={CloudRain} color="#2f7bb8" label={t("rainfallLabel")} value={data.rainfall_pct} unit="%" />
              <Tile icon={Thermometer} color="#e0a020" label={t("airTempLabel")} value={data.air_temperature_c} unit="°C" />
              <Tile icon={Wind} color="#4fc4d1" label={t("humidityLabel")} value={data.humidity_pct} unit="%" />
              <Tile icon={Thermometer} color="#e0577a" label={t("waterTempTile")} value={data.water_temperature_c} unit="°C" />
              <Card className="card-hover flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{t("groundwaterHealth")}</span>
                  <HeartPulse size={16} className="text-emerald-500" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-display text-xl font-semibold text-navy-900">
                    <AnimatedNumber value={data.ghi} decimals={1} />
                  </span>
                  <Pill tone={ghiTone[data.ghi_status] || "slate"}>{tStatus(data.ghi_status)}</Pill>
                </div>
              </Card>
            </div>

            {impact && <Card className="border-teal-500/15 bg-gradient-to-r from-teal-500/10 via-white/80 to-emerald-500/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Sparkles size={16} className="text-teal-500" /> {t("communityImpact")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("estimatedBenefit")}</p>
                </div>
                <a href={officerReportUrl()} className="interactive-button inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-navy-900/15 hover:bg-navy-800" download><FileDown size={15} /> {t("downloadReport")}</a>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <ImpactMetric icon={House} value={impact.households_protected} label={t("householdsProtected")} />
                <ImpactMetric icon={Wheat} value={impact.crop_acres_protected} label={t("cropAcresSupported")} />
                <ImpactMetric icon={Droplet} value={`${(impact.litres_conserved_monthly / 1000).toFixed(1)}k`} label={t("litresConserved")} />
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-400">{impact.assumptions}</p>
            </Card>}

            {/* ---- Desktop: trend chart + quick links side-by-side ---- */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-900">{t("recentTrend")}</p>
                  <Link to="/analytics" className="text-xs font-semibold text-teal-500 hover:underline">
                    {t("fullForecast")} →
                  </Link>
                </div>
                {!trend && <Loader label={t("loadingTrend")} />}
                {trend && (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trend}>
                      <defs>
                        <linearGradient id="dashTrend" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#e0577a" />
                          <stop offset="50%" stopColor="#e0a020" />
                          <stop offset="100%" stopColor="#34c48c" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(t) => new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip labelFormatter={(t) => new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} />
                      <Line type="monotone" dataKey="water_level_pct" stroke="url(#dashTrend)" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <div className="space-y-4">
                <Link to="/live">
                  <Card className="card-hover flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{t("liveMonitoring")}</p>
                      <p className="text-xs text-slate-400">{t("liveMonitoringCard")}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </Card>
                </Link>
                <Link to="/quality">
                  <Card className="card-hover flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{t("waterQuality")}</p>
                      <p className="text-xs text-slate-400">{t("waterQualityCard")}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </Card>
                </Link>
                <Link to="/recommendations">
                  <Card className="card-hover flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{t("cropAdvisory")}</p>
                      <p className="text-xs text-slate-400">{t("bestCrop")}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </Card>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HeroStat({ label, value, tone, isText }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`font-display text-lg font-semibold ${isText ? "text-white" : "text-teal-300"}`}>{value}</p>
    </div>
  );
}

function Tile({ icon: Icon, color, label, value, unit, sub }) {
  return (
    <Card className="card-hover flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="font-display text-xl font-semibold text-navy-900">
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
        {unit && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </Card>
  );
}

function ImpactMetric({ icon: Icon, value, label }) {
  return <div className="rounded-xl bg-white/70 p-3 text-center"><Icon size={16} className="mx-auto text-teal-500" /><p className="mt-1 font-display text-lg font-semibold text-navy-900">{value}</p><p className="text-[10px] text-slate-500">{label}</p></div>;
}
