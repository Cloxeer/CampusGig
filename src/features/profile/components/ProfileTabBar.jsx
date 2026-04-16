/** @param {"self"|"other"} variant */
export default function ProfileTabBar({ pTab, setPTab, variant = "self" }) {
  const tabs =
    variant === "other"
      ? [
          ["reviews", "Reviews"],
          ["activity", "Activity"],
        ]
      : [
          ["activity", "Activity"],
          ["leaderboard", "Board"],
        ];
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--bd)" }}>
      {tabs.map(([k, l]) => (
        <button key={k} type="button" className={`ptab ${pTab === k ? "on" : ""}`} onClick={() => setPTab(k)}>
          {l}
        </button>
      ))}
    </div>
  );
}
