/**
 * Trust tiers. Colors are the RARITY colors of each tier's earned tag
 * (New=common, Reliable=rare, Trusted=epic, Legend=legendary) — see
 * TIER_TAGS in cosmetics.js — so the rep card, hero, badges, and the tag you
 * unlock all read as one system. Thresholds are the level schedule; the
 * Rep-path grants tags on their own 100-rep cadence.
 */
export const REP_LEVELS = [
  { label: "New", min: 0, max: 49, cls: "lv-new", color: "#16a34a", bg: "rgba(22,163,74,.12)", border: "rgba(22,163,74,.2)" },
  { label: "Reliable", min: 50, max: 149, cls: "lv-reliable", color: "#2563eb", bg: "rgba(37,99,235,.12)", border: "rgba(37,99,235,.2)" },
  { label: "Trusted", min: 150, max: 299, cls: "lv-trusted", color: "#7c3aed", bg: "rgba(124,58,237,.12)", border: "rgba(124,58,237,.2)" },
  { label: "Legend", min: 300, max: Infinity, cls: "lv-legend", color: "#ca8a04", bg: "rgba(234,179,8,.14)", border: "rgba(234,179,8,.28)" },
];
