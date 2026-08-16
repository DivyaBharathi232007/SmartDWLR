import { useEffect, useState } from "react";
import { Sprout, Droplets, Sparkles } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card, Pill, Loader, ErrorState } from "../components/Card";
import { getRecommendations } from "../api";
import { usePolling } from "../hooks/usePolling";
import { t, tf } from "../i18n";

const availTone = { High: "emerald", Moderate: "amber", Low: "coral" };

const cropVisuals = {
  paddy: { image: "./src/assets/crops/paddy.jpg", accent: "from-emerald-600/70 to-teal-600/30", labelKey: "cropLabelPaddy" },
  banana: { image: "./src/assets/crops/banana.jpg", accent: "from-amber-600/70 to-orange-500/20", labelKey: "cropLabelBanana" },
  groundnut: { image: "./src/assets/crops/groundnut.jpg", accent: "from-yellow-600/70 to-amber-500/20", labelKey: "cropLabelGroundnut" },
  maize: { image: "./src/assets/crops/maize.jpg", accent: "from-amber-700/70 to-orange-600/20", labelKey: "cropLabelMaize" },
  millet: { image: "./src/assets/crops/millet.jpg", accent: "from-lime-600/70 to-emerald-500/20", labelKey: "cropLabelMillet" },
  pulse: { image: "./src/assets/crops/pulse.jpg", accent: "from-rose-600/70 to-coral-500/20", labelKey: "cropLabelPulse" },
};

const irrigationVisuals = {
  drip: { image: "./src/assets/irrigation/drip.jpg", labelKey: "irrLabelDrip" },
  sprinkler: { image: "./src/assets/irrigation/sprinkler.jpg", labelKey: "irrLabelSprinkler" },
  furrow: { image: "./src/assets/irrigation/furrow.jpg", labelKey: "irrLabelFurrow" },
  rainwater: { image: "./src/assets/irrigation/rainwater.jpg", labelKey: "irrLabelRainwater" },
};

function getCropVisual(cropName = "") {
  const key = cropName.toLowerCase();
  if (key.includes("paddy")) return cropVisuals.paddy;
  if (key.includes("banana")) return cropVisuals.banana;
  if (key.includes("groundnut")) return cropVisuals.groundnut;
  if (key.includes("maize")) return cropVisuals.maize;
  if (key.includes("millet")) return cropVisuals.millet;
  if (key.includes("pulse")) return cropVisuals.pulse;
  return cropVisuals.paddy;
}

function getIrrigationVisual(method = "") {
  const key = method.toLowerCase();
  if (key.includes("drip")) return irrigationVisuals.drip;
  if (key.includes("sprinkler")) return irrigationVisuals.sprinkler;
  if (key.includes("furrow")) return irrigationVisuals.furrow;
  if (key.includes("rainwater")) return irrigationVisuals.rainwater;
  return irrigationVisuals.drip;
}

function getMethodTips(method = "") {
  const m = method.toLowerCase();
  if (m.includes("drip")) return [t("tipDrip1"), t("tipDrip2"), t("tipDrip3")];
  if (m.includes("sprinkler")) return [t("tipSprinkler1"), t("tipSprinkler2"), t("tipSprinkler3")];
  if (m.includes("furrow")) return [t("tipFurrow1"), t("tipFurrow2"), t("tipFurrow3")];
  return [t("tipRain1"), t("tipRain2"), t("tipRain3")];
}

export default function Recommendations() {
  const [tab, setTab] = useState("crop");
  const { data, error } = usePolling(getRecommendations, 15000, []);

  return (
    <div className="pb-24">
      <TopBar title={t("recommendations")} subtitle={t("recommendationsSubtitle")} />
      <div className="p-4 lg:p-8">
        <div className="mb-4 flex max-w-md gap-2 lg:mb-6">
          <TabButton active={tab === "crop"} onClick={() => setTab("crop")}>{t("cropRec")}</TabButton>
          <TabButton active={tab === "irrigation"} onClick={() => setTab("irrigation")}>{t("irrigationAdv")}</TabButton>
        </div>

        {error && <ErrorState message={t("recUnavailable")} hint={error} />}
        {!data && !error && <Loader label={t("matchingCrops")} />}

        {data && tab === "crop" && (
          <div className="space-y-4 lg:max-w-3xl">
            <Card className="overflow-hidden border-emerald-500/20 bg-emerald-500/5 p-0">
              <div className="relative h-44 w-full bg-slate-200">
                <img
                  src={getCropVisual(data.recommended_crop).image}
                  alt={data.recommended_crop}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${getCropVisual(data.recommended_crop).accent}`} />
                <div className="absolute bottom-3 left-3 right-3">
                  <Pill tone="teal">{tf("recommendedForAvail", { avail: data.current_availability })}</Pill>
                  <p className="mt-2 text-lg font-semibold text-white">{data.recommended_crop}</p>
                  <p className="text-xs text-white/80">{t(getCropVisual(data.recommended_crop).labelKey)}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Sparkles size={16} />
                  <p className="text-sm font-semibold">{tf("whyCrop", { crop: data.recommended_crop })}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{data.reason}</p>
              </div>
            </Card>
          </div>
        )}

        {data && tab === "irrigation" && (() => {

          const irrigationVisual = getIrrigationVisual(data.recommended_irrigation);
          const tips = getMethodTips(data.recommended_irrigation);
          return (
            <div className="space-y-4 lg:max-w-3xl">
              <Card className="overflow-hidden p-0">
                <div className="relative h-48 w-full bg-slate-200">
                  <img
                    src={irrigationVisual.image}
                    alt={data.recommended_irrigation}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Pill tone="teal">{t("recommendedMethod")}</Pill>
                    <p className="mt-2 text-lg font-semibold text-white">{data.recommended_irrigation}</p>
                    <p className="text-xs text-white/80">{t(irrigationVisual.labelKey)}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <Droplets size={18} className="mt-0.5 text-teal-500" />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{t("whyFitsField")}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {tf("recommendedForCrop", { crop: data.recommended_crop, avail: data.current_availability })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {tips.map((tip) => (
                      <div key={tip} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center text-[11px] font-medium text-slate-600">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}
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
