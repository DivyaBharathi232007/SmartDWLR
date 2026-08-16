import { motion, useReducedMotion } from "framer-motion";

export function Card({ children, className = "" }) {
  const reduced = useReducedMotion();
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={reduced ? undefined : { y: -4, boxShadow: "0 18px 36px -18px rgba(47,169,184,.35)" }} transition={{ type: "spring", stiffness: 320, damping: 22 }} className={`premium-card rounded-2xl border border-white/60 bg-white/75 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl ${className}`}>
      {children}
    </motion.div>
  );
}

export function StatTile({ icon: Icon, iconColor, label, value, unit, valueColor }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        {Icon && <Icon size={16} style={{ color: iconColor }} />}
      </div>
      <p className="font-display text-xl font-semibold" style={{ color: valueColor || "#101425" }}>
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
      </p>
    </Card>
  );
}

export function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-500",
    teal: "bg-teal-500/10 text-teal-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-600",
    coral: "bg-coral-500/10 text-coral-500",
    navy: "bg-navy-900/5 text-navy-900",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Loader({ label = "Loading..." }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4" role="status" aria-label={label}>
      <div className="skeleton h-4 w-36" /><div className="skeleton mt-4 h-20 w-full" /><p className="mt-3 text-center text-xs text-slate-400">{label}</p>
    </div>
  );
}

export function ErrorState({ message, hint }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-coral-500/30 bg-coral-500/5 p-4 text-center" role="alert">
      <p className="text-sm font-semibold text-coral-500">{message}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </motion.div>
  );
}
