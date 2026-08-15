import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { groupByDateBucket } from "../../../utils/dateBuckets";
import ProfileActivitySkeleton from "./ProfileActivitySkeleton";

export default function ProfileActivityTab({
  activityItems,
  activityLoading = false,
  navigate,
  returnToPath = "/profile",
  emptyMessage = "No activity yet — complete or post a gig to get started.",
}) {
  const [olderOpen, setOlderOpen] = useState(false);

  if (activityLoading) {
    return <ProfileActivitySkeleton />;
  }

  if (activityItems.length === 0) {
    return (
      <div style={{ padding: "0 16px" }}>
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  /* Date buckets keep long histories tidy: recent sections stay visible,
     everything older collapses behind a count. Activity is history — no deletes. */
  const buckets = groupByDateBucket(activityItems, (a) => a.time);

  function renderItem(a, key, isLast) {
    return (
      <div
        key={key}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 0",
          borderBottom: isLast ? "none" : "1px solid var(--bd)",
          cursor: (a.gigId || a.reviewerId) ? "pointer" : "default",
        }}
        onClick={() => {
          if (a.gigId) {
            navigate(`/gig/${a.gigId}`, { state: { returnTo: returnToPath } });
          } else if (a.reviewerId) {
            navigate(`/profile/${a.reviewerId}`);
          }
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--r)",
            background: a.expired ? "var(--err-bg)" : "var(--bg3)",
            border: `1px solid ${a.expired ? "#fecaca" : "var(--bd)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: a.expired ? "var(--err)" : "var(--fg3)",
          }}
        >
          {a.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{a.t}</div>
          <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginTop: 1 }}>{a.s}</div>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--mono)",
            color: a.expired ? "var(--err)" : a.pos ? "var(--green-d)" : "var(--fg3)",
            flexShrink: 0,
          }}
        >
          {a.d}
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px" }}>
      {buckets.map((bucket) => {
        if (bucket.key !== "older") {
          return (
            <div key={bucket.key}>
              <div className="date-hd date-hd--flush">{bucket.label}</div>
              {bucket.items.map((a, i) => renderItem(a, `${bucket.key}-${i}`, i === bucket.items.length - 1))}
            </div>
          );
        }

        return (
          <div key="older">
            <div
              className="older-hd older-hd--flush"
              role="button"
              tabIndex={0}
              aria-expanded={olderOpen}
              onClick={() => setOlderOpen((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOlderOpen((v) => !v);
                }
              }}
            >
              <span className="older-hd__label">Older · {bucket.items.length}</span>
              <ChevronDown size={12} className={`older-hd__chev${olderOpen ? " older-hd__chev--open" : ""}`} />
            </div>
            <div className={`older-body${olderOpen ? " older-body--open" : ""}`} aria-hidden={!olderOpen}>
              <div>
                {bucket.items.map((a, i) => renderItem(a, `older-${i}`, i === bucket.items.length - 1))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
