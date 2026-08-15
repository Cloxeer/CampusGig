/**
 * Shared date bucketing for time-ordered feeds (Alerts, Profile activity).
 * Buckets: Today / Yesterday / This week / This month / Older.
 * Rolling windows anchored to local midnight — predictable and timezone-correct.
 */

const DAY_MS = 86_400_000;

export const BUCKET_ORDER = ["today", "yesterday", "week", "month", "older"];

export const BUCKET_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  month: "This month",
  older: "Older",
};

/** @param {number} ts epoch ms @param {number} [now] epoch ms */
export function bucketForTime(ts, now = Date.now()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const t0 = startOfToday.getTime();

  if (ts >= t0) return "today";
  if (ts >= t0 - DAY_MS) return "yesterday";
  if (ts >= t0 - 6 * DAY_MS) return "week";
  if (ts >= t0 - 29 * DAY_MS) return "month";
  return "older";
}

/**
 * Groups items into ordered, non-empty date buckets.
 * @template T
 * @param {T[]} items newest-first
 * @param {(item: T) => number} getTime epoch ms per item
 * @param {number} [now]
 * @returns {{ key: string, label: string, items: T[] }[]}
 */
export function groupByDateBucket(items, getTime, now = Date.now()) {
  const byBucket = new Map();
  for (const item of items) {
    const key = bucketForTime(getTime(item), now);
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key).push(item);
  }
  return BUCKET_ORDER.filter((k) => byBucket.has(k)).map((k) => ({
    key: k,
    label: BUCKET_LABELS[k],
    items: byBucket.get(k),
  }));
}
