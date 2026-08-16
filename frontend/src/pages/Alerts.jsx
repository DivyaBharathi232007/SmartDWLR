import { useEffect, useState } from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Loader } from "../components/Card";
import { getAlerts } from "../api";
import { t } from "../i18n";

const filterKeys = [
  { key: "All", label: "all" },
  { key: "Critical", label: "critical" },
  { key: "Warning", label: "warning" },
  { key: "Info", label: "info" },
];

const styles = {
  critical: { icon: AlertCircle, bg: "bg-coral-500/10", fg: "text-coral-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/10", fg: "text-amber-500" },
  info: { icon: Info, bg: "bg-teal-500/10", fg: "text-teal-500" },
};

export default function Alerts() {
  const [active, setActive] = useState("All");
  const [alerts, setAlerts] = useState(null);

  async function load(filter) {
    const data = await getAlerts(filter === "All" ? null : filter);
    setAlerts(data.alerts);
  }

  useEffect(() => {
    load(active);
    const id = setInterval(() => load(active), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="pb-24">
      <TopBar title={t("alerts")} subtitle={t("alertsSubtitle")} />
      <div className="p-4 lg:p-8">
        <div className="mb-4 flex gap-2 overflow-x-auto lg:mb-6">
          {filterKeys.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                active === key ? "bg-navy-900 text-white" : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {!alerts && <Loader label={t("checkingAlerts")} />}
        {alerts && alerts.length === 0 && (
          <Card className="text-center text-sm text-slate-400">{t("noAlerts")}</Card>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {alerts?.map((a, i) => {
            const s = styles[a.severity] || styles.info;
            const Icon = s.icon;
            return (
              <Card key={i} className="card-hover flex gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${s.bg}`}>
                  <Icon size={18} className={s.fg} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{a.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{a.timestamp}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
