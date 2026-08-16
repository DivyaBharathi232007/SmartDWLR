import { motion, useReducedMotion } from "framer-motion";

const gaugeTransition = { duration: 1.15, ease: [0.22, 1, 0.36, 1] };

// Semi-circle gauge, e.g. current water level as % of borewell depth
export function SemiGauge({ pct, size = 220, gradientId = "semiGaugeGradient" }) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e0577a" />
          <stop offset="45%" stopColor="#e0a020" />
          <stop offset="75%" stopColor="#2fa9b8" />
          <stop offset="100%" stopColor="#34c48c" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M 14 ${cy} A ${r} ${r} 0 0 1 ${size - 14} ${cy}`}
        fill="none"
        stroke="#e6ebf5"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <motion.path
        d={`M 14 ${cy} A ${r} ${r} 0 0 1 ${size - 14} ${cy}`}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="16"
        strokeLinecap="round"
        filter={`url(#${gradientId}-glow)`}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: clamped / 100 }}
        transition={gaugeTransition}
      />
      {/* needle tip dot */}
      {(() => {
        const angle = Math.PI - (clamped / 100) * Math.PI;
        const tx = cx + r * Math.cos(angle);
        const ty = cy - r * Math.sin(angle);
        return <motion.circle cx={14} cy={cy} r={7} fill="#fff" stroke="#101425" strokeWidth={2} initial={reduced ? false : { cx: 14, cy }} animate={{ cx: tx, cy: ty }} transition={gaugeTransition} />;
      })()}
    </svg>
  );
}

// Donut gauge, e.g. GHI score or forecast confidence
export function DonutGauge({ pct, color = "#1f9d6e", trackColor = "#e6ebf5", size = 84, strokeWidth = 9, showLabel = true }) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const gid = `donut-${color.replace("#", "")}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: clamped / 100 }}
        transition={gaugeTransition}
      />
      {showLabel && (
        <text x={cx} y={cy + 5} textAnchor="middle" className="font-display" fontSize="16" fontWeight="600" fill="#ffffff">
          {Math.round(clamped)}
        </text>
      )}
    </svg>
  );
}

// Animated water-fill tank, purely decorative — used on the desktop dashboard
// hero to make the borewell level feel tangible rather than just a number.
export function WaterTank({ pct, width = 90, height = 160 }) {
  const reduced = useReducedMotion();
  const clamped = Math.max(2, Math.min(100, pct));
  const fillHeight = (clamped / 100) * (height - 10);
  const waterY = height - 5 - fillHeight;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <clipPath id="tankClip">
          <rect x="5" y="5" width={width - 10} height={height - 10} rx="14" />
        </clipPath>
        <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fc4d1" />
          <stop offset="100%" stopColor="#2fa9b8" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width={width - 10} height={height - 10} rx="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
      <g clipPath="url(#tankClip)">
        <motion.rect x="0" width={width} fill="url(#waterFill)" opacity="0.9" initial={reduced ? false : { y: height, height: 0 }} animate={{ y: waterY, height: fillHeight + 5 }} transition={gaugeTransition} />
        <motion.path
          d={`M0 ${waterY} q ${width / 4} -6 ${width / 2} 0 t ${width / 2} 0 v40 h -${width} z`}
          fill="rgba(255,255,255,0.25)"
          className="animate-wave"
          initial={reduced ? false : { y: height - waterY }}
          animate={{ y: 0 }}
          transition={gaugeTransition}
        />
      </g>
    </svg>
  );
}
