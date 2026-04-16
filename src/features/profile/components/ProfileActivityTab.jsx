import ProfileActivitySkeleton from "./ProfileActivitySkeleton";

export default function ProfileActivityTab({ activityItems, activityLoading, navigate, setSelectedGigId }) {
  if (activityLoading) {
    return <ProfileActivitySkeleton />;
  }

  return (
    <div style={{ padding: "0 16px" }}>
      {activityItems.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
          No activity yet — complete or post a gig to get started.
        </div>
      )}
      {activityItems.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 0",
            borderBottom: i < activityItems.length - 1 ? "1px solid var(--bd)" : "none",
            cursor: (a.gigId || a.reviewerId) ? "pointer" : "default",
          }}
          onClick={() => {
            if (a.gigId) setSelectedGigId(a.gigId);
            else if (a.reviewerId) navigate(`/profile/${a.reviewerId}`);
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
      ))}
    </div>
  );
}
