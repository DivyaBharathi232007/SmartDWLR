import { Thermometer, Droplet } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Pill, Loader, ErrorState } from "../components/Card";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { getWaterQuality } from "../api";
import { motion } from "framer-motion";
import { usePolling } from "../hooks/usePolling";
import { t, tStatus } from "../i18n";

const statusTone = { Good: "emerald", Moderate: "amber", Poor: "coral", Unfit: "coral" };
const bands = [
  { label: "Good", max: 300, color: "#34c48c" },
  { label: "Moderate", max: 600, color: "#e0a020" },
  { label: "Poor", max: 900, color: "#e0577a" },
  { label: "Unfit", max: 1200, color: "#b3234a" },
];

export default function WaterQuality() {
  const { data, error } = usePolling(getWaterQuality, 10000, []);

  const tdsPct = data ? Math.min(100, (data.tds_ppm / 1200) * 100) : 0;

  return (
    <div className="pb-24 lg:pb-10">
      <TopBar title={t("waterQuality")} subtitle={t("waterQualitySubtitle")} back />
      <div className="space-y-4 p-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0 lg:p-8">
        {error && <ErrorState message={t("qualityUnavailable")} hint={error} />}
        {!data && !error && <Loader label={t("readingSensors")} />}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-2 lg:gap-4">
              <Card className="card-hover">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{t("tdsLevel")}</span>
                  <Droplet size={16} className="text-[#7c6cf0]" />
                </div>
                <p className="font-display text-xl font-semibold text-navy-900">
                  <AnimatedNumber value={data.tds_ppm} /> ppm
                </p>
                <Pill tone={statusTone[data.tds_status]}>{tStatus(data.tds_status)}</Pill>
              </Card>
              <Card className="card-hover">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{t("waterTempLabel")}</span>
                  <Thermometer size={16} className="text-coral-500" />
                </div>
                <p className="font-display text-xl font-semibold text-navy-900">
                  <AnimatedNumber value={data.water_temperature_c} decimals={1} /> °C
                </p>
              </Card>

              <Card className="col-span-2">
                <p className="mb-3 text-sm font-semibold text-navy-900">{t("tdsRangeLabel")}</p>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-full">
                    {bands.map((b) => (
                      <div key={b.label} className="h-full flex-1" style={{ backgroundColor: b.color }} />
                    ))}
                  </div>
                  <motion.div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-navy-900 shadow transition-all duration-700"
                    initial={{ left: "0%" }}
                    animate={{ left: `${tdsPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  {bands.map((b) => (
                    <span key={b.label}>{tStatus(b.label)}</span>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/10">
                    <Droplet size={18} className="text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">{t("waterQualityStatusLabel")}</p>
                    <p className="text-sm font-semibold text-navy-900">{tStatus(data.tds_status)}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{data.status_message}</p>
              </Card>

              <p className="text-[11px] text-slate-400">
                {t("phTurbidityNote").replace("{ph}", data.ph).replace("{turb}", data.turbidity_ntu)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
