import { useEffect, useRef, useState } from "react";

/** Animates a number from its previous value to `value` whenever it changes. */
export function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(value ?? 0);
  const prevRef = useRef(value ?? 0);
  const frameRef = useRef();

  useEffect(() => {
    if (value === undefined || value === null || Number.isNaN(value)) return;
    const from = prevRef.current;
    const to = value;
    const start = performance.now();

    cancelAnimationFrame(frameRef.current);
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

export function AnimatedNumber({ value, decimals = 0, className = "" }) {
  const display = useCountUp(value);
  return <span className={className}>{display.toFixed(decimals)}</span>;
}
