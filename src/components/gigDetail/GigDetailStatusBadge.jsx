const STATUS_CONFIG = {
  requested: { label: "Pending Approval", color: "var(--amber)", bg: "var(--amber-bg)", bd: "var(--amber-bd)" },
  active: { label: "Active", color: "var(--green-d)", bg: "var(--green-bg)", bd: "var(--green-bd)" },
  completed: { label: "Completed", color: "var(--green-d)", bg: "var(--green-bg)", bd: "var(--green-bd)" },
  cancelled: { label: "Cancelled", color: "var(--fg3)", bg: "var(--bg3)", bd: "var(--bd)" },
  open: { label: "Open", color: "var(--green-d)", bg: "var(--green-bg)", bd: "var(--green-bd)" },
  open_unavailable: { label: "Unavailable", color: "var(--fg3)", bg: "var(--bg3)", bd: "var(--bd)" },
  time_ended: { label: "Time Ended", color: "var(--err)", bg: "var(--err-bg)", bd: "#fecaca" },
};

export default function GigDetailStatusBadge({ status, expired }) {
  let displayStatus = status;
  if (expired && (status === "active" || status === "requested")) displayStatus = "time_ended";
  else if (expired && status === "open") displayStatus = "open_unavailable";

  const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.open;
  const isLive =
    !expired &&
    (displayStatus === "open" || displayStatus === "requested" || displayStatus === "active");
  const dotColor = isLive ? "#22c55e" : "#a1a1aa";

  return (
    <div
      className="gig-detail-status-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "var(--mono)",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.bd}`,
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
      {cfg.label}
    </div>
  );
}
