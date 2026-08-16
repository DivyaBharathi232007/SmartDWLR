import { MapPinned } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Loader, ErrorState } from "../components/Card";
import { getNetworkMap } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t, tStatus } from "../i18n";

const riskColors = {
  Low: "bg-emerald-500",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Critical: "bg-red-500",
};

export default function BorewellNetwork() {
  const { data, error } = usePolling(getNetworkMap, 15000, []);

  return (
    <div className="pb-24 lg:pb-8">
      <TopBar title={t("networkMap")} subtitle={t("networkSubtitle")} />
      <div className="space-y-5 p-4 lg:p-8">
        {error && <ErrorState message={t("unavailable")} hint={error} />}
        {!data && !error && <Loader label={t("fieldNetwork")} />}

        {data && (
          <>
            <Card className="bg-gradient-to-r from-navy-900 via-sky-950 to-navy-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">{t("blockHealth")}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">{data.block_health_pct}%</h2>
                </div>
                <div className="rounded-full bg-white/10 p-3">
                  <MapPinned size={22} className="text-teal-300" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-300">{data.source_note}</p>
            </Card>

            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.25) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />

              {data.wells.map((well) => (
                <div
                  key={well.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${well.x}%`, top: `${well.y}%` }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${riskColors[well.risk] || "bg-emerald-500"}`}>
                      {well.live && <span className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="rounded-xl border border-white/80 bg-white/90 px-2 py-1 text-center shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-700">{well.name}</p>
                      <p className="text-[9px] text-slate-500">{well.level_pct}% / {tStatus(well.risk)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {data.wells.map((well) => (
                <Card key={well.id} className="card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{well.name}</p>
                      <p className="text-[11px] text-slate-500">{well.id}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold text-white ${riskColors[well.risk] || "bg-slate-500"}`}>
                      {well.risk}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-2"><div className="font-semibold text-navy-900">{well.level_pct}%</div><div>{t("depth")}</div></div>
                    <div className="rounded-xl bg-slate-50 p-2"><div className="font-semibold text-navy-900">{well.trend_pct >= 0 ? "+" : ""}{well.trend_pct}</div><div>{t("trend")}</div></div>
                    <div className="rounded-xl bg-slate-50 p-2"><div className="font-semibold text-navy-900">{tStatus(well.status)}</div><div>{t("status")}</div></div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
