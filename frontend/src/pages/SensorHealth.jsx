import { BatteryCharging, Wifi, CalendarClock, ShieldAlert, Activity } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Loader, ErrorState } from "../components/Card";
import { getSensorHealth } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t, tStatus } from "../i18n";

export default function SensorHealth() {
  const { data, error } = usePolling(getSensorHealth, 10000, []);

  return (
    <div className="pb-24 lg:pb-8">
      <TopBar title={t("maintenanceTitle")} subtitle={t("maintenanceSubtitle")} />
      <div className="space-y-5 p-4 lg:p-8">
        {error && <ErrorState message={t("sensorHUnavailable")} hint={error} />}
        {!data && !error && <Loader label={t("checkingHealth")} />}

        {data && (
          <>
            <Card className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-teal-200">{t("systemHealth")}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">{data.health_score}%</h2>
                </div>
                <div className="rounded-full bg-white/10 p-3"><Activity size={22} className="text-teal-300" /></div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={BatteryCharging} label={t("battery")} value={`${data.battery_percent}%`} tone="emerald" />
              <StatCard icon={Wifi} label={t("wifiLabel")} value={`${data.wifi_signal_dbm} dBm`} tone="sky" />
              <StatCard icon={CalendarClock} label={t("lastUpdate")} value={data.last_sensor_update_local} tone="amber" />
              <StatCard icon={ShieldAlert} label={t("faults")} value={data.sensor_faults.length ? data.sensor_faults.length : 0} tone="coral" />
            </div>

            <Card>
              <p className="text-sm font-semibold text-navy-900">{t("maintenanceDetails")}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                <div className="rounded-xl bg-slate-50 p-3">{t("powerStatusLine")} <span className="font-semibold">{tStatus(data.power_status)}</span></div>
                <div className="rounded-xl bg-slate-50 p-3">{t("wifiQualityLine")} <span className="font-semibold">{tStatus(data.wifi_signal_quality)}</span></div>
                <div className="rounded-xl bg-slate-50 p-3">{t("dataGapsLine")} <span className="font-semibold">{data.data_gaps_hours} {t("hrs")}</span></div>
                <div className="rounded-xl bg-slate-50 p-3">{t("lastCalibLine")} <span className="font-semibold">{new Date(data.last_calibration).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-navy-900">{t("warnings")}</p>
              {data.sensor_faults.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-600">{t("noFaults")}</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {data.sensor_faults.map((fault) => (
                    <li key={fault} className="flex items-center gap-2 rounded-xl bg-amber-50 p-2 text-amber-700"><ShieldAlert size={16} /> {fault}</li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    coral: "bg-red-50 text-red-600",
  };

  return (
    <Card className="card-hover">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-navy-900">{value}</p>
    </Card>
  );
}
