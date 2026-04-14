import { useState, useEffect } from "react";
import { REP_LEVELS } from "../data/repLevels";

/**
 * Returns the Rep level info for a given score.
 */
export function getLevel(rep) {
  const idx = REP_LEVELS.findIndex((r) => rep >= r.min && rep <= r.max);
  const l = REP_LEVELS[idx];
  const next = REP_LEVELS[idx + 1];
  const pct = next ? Math.round(((rep - l.min) / (l.max - l.min)) * 100) : 100;
  return {
    ...l,
    pct: Math.min(pct, 100),
    next: next?.label,
    nextColor: next?.color,
    toNext: next ? next.min - rep : 0,
  };
}

/**
 * Hook that ticks every second. Useful for live-updating timestamps.
 */
export function useTimer() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/**
 * Human-readable elapsed time string.
 */
export function elapsed(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Returns remaining time until a deadline as { text, expired }.
 * If deadline is null/undefined, returns null (no deadline set).
 */
export function countdown(deadlineMs) {
  if (!deadlineMs) return null;
  const diff = deadlineMs - Date.now();
  if (diff <= 0) return { text: "Time ended", expired: true };
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return { text: `${h}:${pad(m)}:${pad(s)}`, expired: false };
  return { text: `${m}:${pad(s)}`, expired: false };
}
