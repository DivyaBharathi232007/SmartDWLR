import { ShieldCheck, TrendingUp, Users } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Loader, ErrorState } from "../components/Card";
import { getPortal } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t, tStatus } from "../i18n";

export default function OfficerPortal() {
  const { data, error } = usePolling(() => getPortal("officer"), 12000, []);

  return (
    <div className="pb-24 lg:pb-8">
      <TopBar title={t("multiUserPortal")} subtitle={t("villageComparison")} />
      <div className="space-y-5 p-4 lg:p-8">
        {error && <ErrorState message={t("unavailable")} hint={error} />}
        {!data && !error && <Loader label={t("officerDash")} />}

        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard icon={Users} label={t("totalWells")} value={data.summary.total_wells} tone="sky" />
              <StatCard icon={ShieldCheck} label={t("criticalSites")} value={data.summary.critical_sites} tone="coral" />
              <StatCard icon={TrendingUp} label={t("avgHealth")} value={`${data.summary.average_health}%`} tone="emerald" />
            </div>

            {data.villages.map((village) => (
              <Card key={village.name} className="card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{village.name}</p>
                    <p className="text-[11px] text-slate-500">{t("priority")}: {tStatus(village.priority)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{village.borewells.length} {t("wells")}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {village.borewells.map((well) => (
                    <div key={well.borewell_id} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-navy-900">{well.borewell_id}</span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700">{tStatus(well.risk)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{t("healthScore")}</span>
                        <span className="font-semibold text-navy-900">{well.health_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const palette = {
    sky: "bg-sky-50 text-sky-600",
    coral: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-navy-900">{value}</p>
    </Card>
  );
}
