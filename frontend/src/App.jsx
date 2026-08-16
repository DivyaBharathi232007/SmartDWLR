import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { WaterLoadingScreen } from "./components/MotionUI";
import appLogo from "./assets/logo.png";
import { t, getLang } from "./i18n";
import WaterGuide from "./components/WaterGuide";
import BottomNav from "./components/BottomNav";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveMonitoring from "./pages/LiveMonitoring";
import Alerts from "./pages/Alerts";
import AnalyticsForecast from "./pages/AnalyticsForecast";
import WaterQuality from "./pages/WaterQuality";
import Recommendations from "./pages/Recommendations";
import Profile from "./pages/Profile";
import BorewellNetwork from "./pages/BorewellNetwork";
import WaterBudgetPlanner from "./pages/WaterBudgetPlanner";
import SensorHealth from "./pages/SensorHealth";
import OfficerPortal from "./pages/OfficerPortal";

function isAuthed() {
  return Boolean(localStorage.getItem("dwlr_user"));
}

function getCurrentRole() {
  return localStorage.getItem("dwlr_role") || "farmer";
}

function canAccessPortal() {
  const role = getCurrentRole();
  return role === "officer" || role === "admin";
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedShell({ children }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (location.pathname === "/portal" && !canAccessPortal()) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="app-background relative h-screen overflow-hidden bg-[#eef1f8] lg:flex">
      <div className="dashboard-bubbles" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="app-watermark" aria-hidden="true">
        <img src={appLogo} alt="" />
      </div>
      <Sidebar />
      <div className="app-content min-h-0 flex-1 overflow-x-hidden overflow-y-auto lg:ml-64">
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
      {location.pathname !== "/" && <PageAssistant path={location.pathname} />}
      <BottomNav />
    </div>
  );
}

function PageAssistant({ path }) {
  const messages = {
    "/live": t("pageAssistantHealthy"),
    "/analytics": t("pageAssistantForecast"),
    "/quality": t("pageAssistantQuality"),
    "/alerts": t("pageAssistantAlerts"),
    "/recommendations": t("pageAssistantRecommend"),
    "/profile": t("pageAssistantProfile"),
    "/network": t("pageAssistantNetwork"),
    "/planner": t("pageAssistantPlanner"),
    "/health": t("pageAssistantHealth"),
    "/portal": t("pageAssistantPortal"),
  };
  return <div className="page-assistant"><WaterGuide status="Healthy" tip={messages[path] || t("appTag")} /></div>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedShell><Dashboard /></ProtectedShell>} />
        <Route path="/live" element={<ProtectedShell><LiveMonitoring /></ProtectedShell>} />
        <Route path="/quality" element={<ProtectedShell><WaterQuality /></ProtectedShell>} />
        <Route path="/analytics" element={<ProtectedShell><AnalyticsForecast /></ProtectedShell>} />
        <Route path="/alerts" element={<ProtectedShell><Alerts /></ProtectedShell>} />
        <Route path="/recommendations" element={<ProtectedShell><Recommendations /></ProtectedShell>} />
        <Route path="/network" element={<ProtectedShell><BorewellNetwork /></ProtectedShell>} />
        <Route path="/planner" element={<ProtectedShell><WaterBudgetPlanner /></ProtectedShell>} />
        <Route path="/health" element={<ProtectedShell><SensorHealth /></ProtectedShell>} />
        <Route path="/portal" element={<ProtectedShell><OfficerPortal /></ProtectedShell>} />
        <Route path="/profile" element={<ProtectedShell><Profile /></ProtectedShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    document.documentElement.lang = getLang() === "ta" ? "ta" : "en";
    const timer = setTimeout(() => setBooting(false), 1100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <AnimatePresence mode="wait">
      {booting ? (
        <WaterLoadingScreen key="splash" />
      ) : (
        <BrowserRouter key="app">
          <AnimatedRoutes />
        </BrowserRouter>
      )}
    </AnimatePresence>
  );
}
