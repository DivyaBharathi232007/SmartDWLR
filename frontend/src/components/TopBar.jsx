import { useEffect, useState } from "react";
import { ChevronLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { t, getLang } from "../i18n";

export default function TopBar({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 px-4 py-3.5 lg:px-8 lg:py-5">
      <div className="flex items-center gap-3">
        {back ? (
          <button onClick={() => navigate(-1)} className="text-navy-900 lg:hidden" aria-label="Back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <Menu size={20} className="text-slate-400 lg:hidden" />
        )}
        <div>
          <h1 className="font-display text-[15px] font-semibold text-navy-900 leading-tight lg:text-xl">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 leading-tight lg:text-xs">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 lg:flex">
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute h-2 w-2 text-emerald-500" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {t("bw01Online")}
        </div>
        <p className="hidden text-xs font-medium text-slate-400 lg:block">
          {now.toLocaleString(getLang() === "ta" ? "ta-IN" : "en-IN", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
        </p>
        {right}
      </div>
    </header>
  );
}
