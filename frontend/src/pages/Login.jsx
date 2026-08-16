import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Mail, Lock, Eye, EyeOff, Waves, Sprout, ShieldCheck } from "lucide-react";
import { t, setLang } from "../i18n";

export default function Login() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("farmer");
  const [language, setLanguage] = useState(localStorage.getItem("dwlr_lang") || "en");

  function handleLanguageChange(value) {
    setLanguage(value);
    setLang(value);
  }

  function handleLogin(e) {
    e.preventDefault();
    localStorage.setItem("dwlr_user", email || "demo@smartdwlr.app");
    localStorage.setItem("dwlr_role", role);
    setLang(language);
    navigate("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 px-6 lg:justify-between lg:px-0">
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl animate-blob-slow" />

      {/* Left brand panel — desktop only */}
      <div className="relative z-10 hidden w-1/2 flex-col justify-center px-16 lg:flex">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500">
            <Droplets size={24} className="text-white" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">{t("appTitle")}</p>
            <p className="text-xs text-slate-400">{t("digitWaterLevelRecorder")}</p>
          </div>
        </div>
        <h1 className="max-w-md font-display text-3xl font-semibold leading-tight text-white">
          {t("brandText")}
        </h1>
        <p className="mt-4 max-w-sm text-sm text-slate-400">
          {t("aiotTagline")}
        </p>

        <div className="mt-10 space-y-4">
          <Feature icon={Waves} text={t("feature1")} />
          <Feature icon={ShieldCheck} text={t("feature2")} />
          <Feature icon={Sprout} text={t("feature3")} />
        </div>
      </div>

      {/* Right / mobile-centered form panel */}
      <div className="relative z-10 w-full max-w-sm lg:mr-24">
        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500">
            <Droplets size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">{t("appTitle")}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("digitWaterLevelRecorder")}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl lg:p-8">
          <h2 className="font-display text-lg font-semibold text-navy-900">{t("loginTitle")}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-400">{t("loginSubtitle")}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
              <Mail size={17} className="text-slate-400" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
              <Lock size={17} className="text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="text-slate-400">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </label>

            <label className="block text-sm text-slate-600">
              {t("selectRole")}
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500">
                <option value="farmer">{t("farmer")}</option>
                <option value="officer">{t("officer")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </label>

            <label className="block text-sm text-slate-600">
              {t("language")}
              <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500">
                <option value="en">{t("english")}</option>
                <option value="ta">{t("tamil")}</option>
              </select>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" defaultChecked className="accent-teal-500" />
                {t("rememberMe")}
              </label>
              <span className="font-medium text-teal-500">{t("forgotPassword")}</span>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-navy-900 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 hover:shadow-lg hover:shadow-navy-900/30"
            >
              {t("login")}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            {t("noAccount")} <span className="font-semibold text-teal-500">{t("signUp")}</span>
          </p>
        </div>
        
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <Icon size={16} className="text-teal-300" />
      </div>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}
