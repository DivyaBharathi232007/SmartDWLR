import axios from "axios";

// Use environment variable if available, otherwise fallback to localhost
const API_BASE = process.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("API_BASE configured as:", API_BASE);

export const api = axios.create({ baseURL: API_BASE });

export const BOREWELL_ID = "BW01";

const getAppLanguage = () => {
  try {
    return localStorage.getItem("dwlr_lang") || "en";
  } catch {
    return "en";
  }
};

export const getDashboard = () => api.get("/api/dashboard", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getLive = () => api.get("/api/live", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getAlerts = (severity) => api.get("/api/alerts", { params: { borewell_id: BOREWELL_ID, severity, language: getAppLanguage() } }).then(r => r.data);
export const getWaterQuality = () => api.get("/api/water-quality", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getForecast = () => api.get("/api/analytics/forecast", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getRecommendations = () => api.get("/api/recommendations", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getHistory = (limit = 200) => api.get("/api/history", { params: { borewell_id: BOREWELL_ID, limit, language: getAppLanguage() } }).then(r => r.data);
export const getCommunityImpact = () => api.get("/api/community-impact", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getNetworkMap = () => api.get("/api/network", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getWaterBudget = (payload) => api.get("/api/water-budget", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage(), ...payload } }).then(r => r.data);
export const getSensorHealth = () => api.get("/api/sensor-health", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const getPortal = (role = "farmer") => api.get("/api/portal", { params: { role, language: getAppLanguage() } }).then(r => r.data);
export const getNotifications = () => api.get("/api/notifications", { params: { borewell_id: BOREWELL_ID, language: getAppLanguage() } }).then(r => r.data);
export const officerReportUrl = () => `${API_BASE}/api/reports/officer?borewell_id=${encodeURIComponent(BOREWELL_ID)}&language=${encodeURIComponent(getAppLanguage())}`;
