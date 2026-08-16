import { NavLink } from "react-router-dom";
import { Home, BarChart3, Bell, Sprout, User, Map, Gauge, ShieldCheck } from "lucide-react";
import { t } from "../i18n";

const items = [
  { to: "/", key: "home", icon: Home, end: true },
  { to: "/network", key: "map", icon: Map },
  { to: "/planner", key: "planner", icon: Gauge },
  { to: "/health", key: "health", icon: ShieldCheck },
  { to: "/alerts", key: "alerts", icon: Bell },
  { to: "/profile", key: "profile", icon: User },
  { to: "/portal", key: "portal", icon: User, roles: ["officer", "admin"] },
];

export default function BottomNav() {
  const role = localStorage.getItem("dwlr_role") || "farmer";
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-slate-200 lg:hidden">
      <ul className="flex items-stretch justify-between px-2">
        {visibleItems.map(({ to, key, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? "text-teal-500" : "text-slate-400"
                }`
              }
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{t(key)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
