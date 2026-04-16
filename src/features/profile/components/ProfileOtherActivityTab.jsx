export default function ProfileOtherActivityTab({ activityItems, openGig }) {
  if (activityItems.length === 0) {
    return (
      <div style={{ padding: "0 16px" }}>
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg4)", fontSize: 13, fontFamily: "var(--mono)" }}>
          No activity yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px" }}>
      {activityItems.map((a, i, arr) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 0",
            borderBottom: i < arr.length - 1 ? "1px solid var(--bd)" : "none",
            cursor: a.gigId ? "pointer" : "default",
          }}
          onClick={() => a.gigId && openGig(a.gigId)}
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
