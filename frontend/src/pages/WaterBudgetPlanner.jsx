import { useMemo, useState } from "react";
import { Droplets, Sprout, Tractor } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Loader, ErrorState } from "../components/Card";
import { getWaterBudget } from "../api";
import { t, tStatus } from "../i18n";

export default function WaterBudgetPlanner() {
  const [form, setForm] = useState({
    land_area_acres: 2.5,
    crop: "groundnut",
    irrigation_method: "drip",
    pumping_hours: 4,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const summary = useMemo(() => {
    if (!data) return null;
    const tone = data.status === "Surplus" ? "emerald" : "amber";
    return { tone };
  }, [data]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await getWaterBudget(form);
      setData(result);
    } catch (e) {
      setError(e?.response?.data?.detail || t("plannerCalcFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 lg:pb-8">
      <TopBar title={t("plannerTopTitle")} subtitle={t("plannerTopSubtitle")} />
      <div className="space-y-5 p-4 lg:p-8">
        <Card>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Land area (acres)
              <input type="number" step="0.1" value={form.land_area_acres} onChange={(e) => setForm({ ...form, land_area_acres: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-teal-500" />
            </label>
            <label className="text-sm text-slate-600">
              Crop
              <select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-teal-500">
                <option value="groundnut">{t("cropGroundnut")}</option>
                <option value="maize">{t("cropMaize")}</option>
                <option value="paddy">{t("cropPaddy")}</option>
                <option value="sugarcane">{t("cropSugarcane")}</option>
                <option value="cotton">{t("cropCotton")}</option>
                <option value="millet">{t("cropMillet")}</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Irrigation method
              <select value={form.irrigation_method} onChange={(e) => setForm({ ...form, irrigation_method: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-teal-500">
                <option value="drip">{t("irrDrip")}</option>
                <option value="sprinkler">{t("irrSprinkler")}</option>
                <option value="surface">{t("irrSurface")}</option>
                <option value="flood">{t("irrFlood")}</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Pumping hours / day
              <input type="number" step="0.5" value={form.pumping_hours} onChange={(e) => setForm({ ...form, pumping_hours: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-teal-500" />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Tractor size={16} /> {loading ? t("calculating") : t("calculateBalance")}
              </button>
            </div>
          </form>
        </Card>

        {error && <ErrorState message={t("calcFailed")} hint={error} />}
        {!data && !error && <Loader label={t("preparingBalance")} />}

        {data && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-emerald-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">{t("available")}</span>
                <Droplets className="text-emerald-600" size={18} />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold text-navy-900">{data.available_liters_per_day.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">{t("litresPerDay")}</p>
            </Card>
            <Card className="bg-amber-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700">{t("demand")}</span>
                <Sprout className="text-amber-600" size={18} />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold text-navy-900">{data.demand_liters_per_day.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">{t("litresPerDay")}</p>
            </Card>
            <Card className={data.status === "Surplus" ? "bg-emerald-50" : "bg-orange-50"}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${data.status === "Surplus" ? "text-emerald-700" : "text-orange-700"}`}>{tStatus(data.status)}</span>
                <Droplets className={data.status === "Surplus" ? "text-emerald-600" : "text-orange-600"} size={18} />
              </div>
              <p className="mt-3 font-display text-2xl font-semibold text-navy-900">{Math.abs(data.surplus_liters_per_day).toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">{t("litresPerDay")} {data.status === "Surplus" ? t("extra") : t("shortfall")}</p>
            </Card>
          </div>
        )}

        {data && (
          <Card>
            <p className="text-sm font-semibold text-navy-900">{t("planningInsight")}</p>
            <p className="mt-2 text-sm text-slate-600">{data.recommendation}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 p-3">{t("groundwaterLevelLine")} <span className="font-semibold">{data.groundwater_level_pct}%</span></div>
              <div className="rounded-xl bg-slate-50 p-3">{t("irrigationMethodLine")} <span className="font-semibold">{data.irrigation_method}</span></div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
