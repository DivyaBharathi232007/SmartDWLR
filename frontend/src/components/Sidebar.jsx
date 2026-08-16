import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, BarChart3, Bell, Sprout, User, Waves, FlaskConical, LogOut, Map, Gauge, ShieldCheck } from "lucide-react";
import appLogo from "../assets/logo.png";
import { t } from "../i18n";

const items = [
  { to: "/", key: "dashboard", icon: Home, end: true },
  { to: "/live", key: "liveMonitoring", icon: Waves },
  { to: "/network", key: "networkMap", icon: Map },
  { to: "/planner", key: "waterPlanner", icon: Gauge },
  { to: "/health", key: "sensorHealth", icon: ShieldCheck },
  { to: "/analytics", key: "analytics", icon: BarChart3 },
  { to: "/quality", key: "waterQuality", icon: FlaskConical },
  { to: "/alerts", key: "alerts", icon: Bell },
  { to: "/recommendations", key: "recommendations", icon: Sprout },
  { to: "/portal", key: "officerPortal", icon: User, roles: ["officer", "admin"] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const email = localStorage.getItem("dwlr_user") || "demo@smartdwlr.app";
  const role = localStorage.getItem("dwlr_role") || "farmer";
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(role));

  function logout() {
    localStorage.removeItem("dwlr_user");
    localStorage.removeItem("dwlr_role");
    navigate("/login");
  }

  return (
    <motion.aside initial={{ x: -56, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.45, ease: "easeOut" }} className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-navy-900 lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/95 p-0.5 shadow-sm shadow-teal-400/20">
          <img src={appLogo} alt="Smart DWLR logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-white">{t("appTitle")}</p>
          <p className="text-[10px] text-slate-400">{t("appTag")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {visibleItems.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? "text-teal-400" : ""} />
                {t(key)}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
            }`
          }
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <User size={15} className="text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{email}</p>
            <p className="text-[10px] text-slate-500">{t("viewProfile")}</p>
          </div>
        </NavLink>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-coral-500/10 hover:text-coral-500"
        >
          <LogOut size={16} />
          {t("logout")}
        </button>
      </div>
    </motion.aside>
  );
}
