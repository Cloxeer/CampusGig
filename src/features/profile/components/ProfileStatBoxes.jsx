export default function ProfileStatBoxes({ gigStats, rank, totalUsers, setPTab, isOwnProfile = true }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
      <div className="stat-box" onClick={() => setPTab("activity")}>
        <div className="sval">{gigStats.completed}</div>
        <div className="skey">gigs done</div>
        <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
      </div>
      <div className="stat-box" onClick={() => setPTab("activity")}>
        <div className="sval">{gigStats.posted}</div>
        <div className="skey">gigs posted</div>
        <div style={{ fontSize: 9, color: "var(--green-d)", fontFamily: "var(--mono)", marginTop: 2 }}>tap →</div>
      </div>
      <div
        className="stat-box"
        onClick={isOwnProfile ? () => setPTab("leaderboard") : undefined}
        style={isOwnProfile ? undefined : { cursor: "default" }}
      >
        <div className="sval">#{rank || "—"}</div>
        <div className="skey">campus rank</div>
        <div
          style={{
            fontSize: 9,
            color: isOwnProfile ? "var(--green-d)" : "var(--fg4)",
            fontFamily: "var(--mono)",
            marginTop: 2,
          }}
        >
          {isOwnProfile ? "tap →" : `of ${totalUsers}`}
        </div>
      </div>
    </div>
  );
}
