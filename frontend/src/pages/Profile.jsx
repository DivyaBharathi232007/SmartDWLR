import { useNavigate } from "react-router-dom";
import { User, Droplets, Bell, SlidersHorizontal, HelpCircle, Info, LogOut, ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { t } from "../i18n";

const rows = [
  { icon: Droplets, key: "myBorewells" },
  { icon: Bell, key: "notifSettings" },
  { icon: SlidersHorizontal, key: "unitsPrefs" },
  { icon: HelpCircle, key: "helpSupport" },
  { icon: Info, key: "aboutApp" },
];

export default function Profile() {
  const navigate = useNavigate();
  const email = localStorage.getItem("dwlr_user") || "demo@smartdwlr.app";

  function logout() {
    localStorage.removeItem("dwlr_user");
    navigate("/login");
  }

  return (
    <div className="pb-24">
      <TopBar title={t("profile")} subtitle={t("profileSubtitle")} />
      <div className="space-y-4 p-4 lg:mx-auto lg:max-w-xl lg:space-y-5 lg:p-8">
        <Card className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <User size={22} className="text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-900">{t("userName")}</p>
            <p className="text-xs text-slate-400">{email}</p>
          </div>
        </Card>

        <Card className="divide-y divide-slate-100 p-0">
          {rows.map(({ icon: Icon, key }) => (
            <button key={key} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
              <span className="flex items-center gap-3 text-sm text-navy-900">
                <Icon size={17} className="text-slate-400" />
                {t(key)}
              </span>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </Card>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl border border-coral-500/20 bg-coral-500/5 px-4 py-3.5 text-sm font-semibold text-coral-500"
        >
          <LogOut size={17} />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
