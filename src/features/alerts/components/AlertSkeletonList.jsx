export default function AlertSkeletonList() {
  return (
    <div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "13px 16px",
            borderBottom: "1px solid var(--bd)",
          }}
        >
          <div className="skel skel-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ width: "70%", height: 13, marginBottom: 6 }} />
            <div className="skel" style={{ width: "45%", height: 11 }} />
          </div>
          <div className="skel" style={{ width: 30, height: 10, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
