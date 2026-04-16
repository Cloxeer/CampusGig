/** Shimmer rows matching ProfileActivityTab layout while activity query is pending. */
export default function ProfileActivitySkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: "0 16px" }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 0",
            borderBottom: i < rows - 1 ? "1px solid var(--bd)" : "none",
          }}
        >
          <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="skel" style={{ height: 13, width: "78%", maxWidth: 260, marginBottom: 5 }} />
            <div className="skel" style={{ height: 11, width: "42%", maxWidth: 140 }} />
          </div>
          <div className="skel" style={{ width: 44, height: 12, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
