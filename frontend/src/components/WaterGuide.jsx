import { motion, useReducedMotion } from "framer-motion";
import { t } from "../i18n";

/**
 * A code-drawn dashboard guide. Because it is SVG + Framer Motion, it has no
 * asset-hosting, watermark, or marketplace licence dependency.
 */
export default function WaterGuide({ status = "Healthy", tip = "Welcome to Smart DWLR." }) {
  const prefersReducedMotion = useReducedMotion();
  const isHealthy = ["Healthy", "Stable"].includes(status);
  const accent = isHealthy ? "#34c48c" : "#e0a020";
  const loop = prefersReducedMotion ? {} : { y: [0, -8, 0], rotate: [0, -1.5, 0, 1.5, 0] };

  return (
    <motion.div
      className="relative h-40 w-32 shrink-0 sm:h-44 sm:w-36"
      animate={loop}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      aria-label={`Animated water guide. Groundwater status: ${status}`}
      role="img"
    >
      <motion.div initial={{ opacity: 0, x: 8, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.6 }} className="assistant-speech absolute -left-28 top-0 w-28 rounded-xl bg-white/95 px-2.5 py-2 text-[9px] font-medium leading-snug text-navy-900 shadow-lg shadow-navy-950/20">
        <motion.span animate={prefersReducedMotion ? {} : { opacity: [1, .65, 1] }} transition={{ duration: .8, repeat: Infinity }}>{tip}</motion.span>
      </motion.div>
      {!prefersReducedMotion && (
        <>
          <motion.span className="water-guide-spark left-1 top-5" animate={{ opacity: [0, 1, 0], y: [8, -10, -18] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} />
          <motion.span className="water-guide-spark right-2 top-10" animate={{ opacity: [0, 1, 0], y: [8, -10, -18] }} transition={{ duration: 2.5, delay: 1.1, repeat: Infinity, ease: "easeOut" }} />
        </>
      )}
      <svg viewBox="0 0 128 160" className="h-full w-full overflow-visible" aria-hidden="true">
        <motion.ellipse cx="64" cy="147" rx="36" ry="7" fill="#020617" opacity="0.28" animate={prefersReducedMotion ? {} : { rx: [36, 29, 36], opacity: [0.28, 0.16, 0.28] }} transition={{ duration: 3.8, repeat: Infinity }} />
        <motion.path d="M38 111c-14 5-19 13-18 20" fill="none" stroke="#73dce4" strokeWidth="9" strokeLinecap="round" animate={prefersReducedMotion ? {} : { rotate: [0, 16, 0, 16, 0] }} style={{ transformOrigin: "40px 112px" }} transition={{ delay: .7, duration: 1.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }} />
        <path d="M90 111c14 5 19 13 18 20" fill="none" stroke="#73dce4" strokeWidth="9" strokeLinecap="round" />
        <path d="M38 143c1-29 10-47 26-47s25 18 26 47" fill="#2fa9b8" />
        <path d="M43 128c8 5 34 5 42 0v15H43z" fill="#1f9d6e" opacity=".85" />
        <circle cx="64" cy="67" r="34" fill="#f7cfae" />
        <path d="M31 67c0-29 16-43 34-43 20 0 34 16 33 39-8-7-18-12-31-12-16 0-27 8-36 16z" fill="#18234f" />
        <path d="M33 59c4-25 19-35 35-35 17 0 28 12 30 28-10-8-20-11-31-10-13 1-24 8-34 17z" fill="#28386f" />
        <motion.ellipse cx="51" cy="68" rx="3.5" ry="3.5" fill="#0a0f2c" animate={prefersReducedMotion ? {} : { ry: [3.5, .3, 3.5] }} transition={{ duration: .18, delay: 2, repeat: Infinity, repeatDelay: 3.4 }} />
        <motion.ellipse cx="77" cy="68" rx="3.5" ry="3.5" fill="#0a0f2c" animate={prefersReducedMotion ? {} : { ry: [3.5, .3, 3.5] }} transition={{ duration: .18, delay: 2, repeat: Infinity, repeatDelay: 3.4 }} />
        <motion.path d="M55 82c5 5 13 5 18 0" fill="none" stroke="#c77061" strokeWidth="2.5" strokeLinecap="round" animate={prefersReducedMotion ? {} : { d: ["M55 82c5 5 13 5 18 0", "M55 82c5 8 13 8 18 0", "M55 82c5 5 13 5 18 0"] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
        <path d="M53 98c6 4 16 4 22 0" fill="none" stroke="white" strokeWidth="2" opacity=".72" />
        <motion.path d="M64 5C49 25 49 32 64 32S79 25 64 5z" fill={accent} animate={prefersReducedMotion ? {} : { scale: [1, 1.12, 1] }} style={{ transformOrigin: "64px 20px" }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
        <path d="M64 14c-6 11-5 16 0 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".65" />
      </svg>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-teal-200 backdrop-blur-sm">{t("yourWaterGuide")}</span>
    </motion.div>
  );
}
