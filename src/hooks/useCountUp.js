import { useEffect, useRef, useState } from "react";

/**
 * Animated integer count-up to `target` — Apple-style odometer sweep with an
 * exponential ease-out (fast start, gentle landing). Re-sweeps when the target
 * changes (e.g. once async stats arrive). Respects prefers-reduced-motion by
 * jumping straight to the value.
 *
 * @param {number} target
 * @param {{ duration?: number, delay?: number }} [options] ms
 * @returns {number} the current animated value
 */
export function useCountUp(target, { duration = 1100, delay = 0 } = {}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  /** Where the next sweep starts — live updates animate from the current value, not zero. */
  const fromRef = useRef(0);

  useEffect(() => {
    const to = Number(target) || 0;
    const from = fromRef.current;

    if (from === to) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = to;
      setValue(to);
      return undefined;
    }

    let start;
    const timer = setTimeout(() => {
      const step = (ts) => {
        if (start === undefined) start = ts;
        const t = Math.min(1, (ts - start) / duration);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const next = Math.round(from + (to - from) * eased);
        fromRef.current = next;
        setValue(next);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}
