const VARIANT_TABS = {
  self: [
    ["activity", "Activity"],
    ["leaderboard", "Board"],
  ],
  other: [
    ["reviews", "Reviews"],
    ["activity", "Activity"],
  ],
};

/** Shared `.ptab` bar (profile, inventory, edit profile). Pass `tabs` to reuse it. */
export default function ProfileTabBar({ pTab, setPTab, variant = "self", tabs, ariaLabel }) {
  const resolved = tabs ?? VARIANT_TABS[variant] ?? VARIANT_TABS.self;
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{ display: "flex", borderBottom: "1px solid var(--bd)" }}
    >
      {resolved.map(([k, l]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={pTab === k}
          className={`ptab ${pTab === k ? "on" : ""}`}
          onClick={() => setPTab(k)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
