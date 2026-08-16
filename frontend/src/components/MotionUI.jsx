import { motion, useReducedMotion } from "framer-motion";
import appLogo from "../assets/logo.png";
import { t } from "../i18n";

export function Reveal({ children, delay = 0, className = "" }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.45, delay, ease: "easeOut" }}>{children}</motion.div>;
}

export function MotionButton({ children, className = "", ...props }) {
  const reduced = useReducedMotion();
  return <motion.button {...props} className={`interactive-button ${className}`} whileHover={reduced ? undefined : { scale: 1.025 }} whileTap={reduced ? undefined : { scale: 0.97 }}>{children}</motion.button>;
}

export function WaterLoadingScreen() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-navy-900 text-white"
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
    >
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-3xl animate-blob-slow" />

      <motion.div
        className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/95 p-3 shadow-2xl shadow-teal-500/20 sm:h-32 sm:w-32"
        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={appLogo} alt="Smart DWLR logo" className="h-full w-full object-contain" />
        {!reduced && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-teal-300"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </motion.div>

      <motion.div
        className="relative z-10 text-center"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
      >
        <p className="font-display text-xl font-semibold text-white">{t("appTitle")}</p>
        <p className="mt-1 text-xs font-medium text-teal-200">{t("splashTagline")}</p>
      </motion.div>

      <div className="relative z-10 water-ripple"><span /><span /><span /></div>
    </motion.div>
  );
}

export function PulseMarker({ label = "Live sensor" }) {
  return <span className="map-marker" aria-label={label}><span /> </span>;
}
