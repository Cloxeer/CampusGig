import { elapsed } from "../../../utils/helpers";
import { isDeletable } from "../notificationModel";
import SwipeRow from "./SwipeRow";
import StackedAvatars from "./StackedAvatars";

export default function GigRequestGroupRow({
  items,
  profileMap,
  gigStatusMap,
  onRowClick,
  onDeleteGroup,
}) {
  const latest = items[0];
  const gigTitle = latest.metadata?.gig_title || latest.body || "your gig";
  const anyUnread = items.some((n) => !n.read);
  const allDeletable = items.every((n) => isDeletable(n, gigStatusMap));
  const gigStatus = latest.metadata?.gig_id ? gigStatusMap[latest.metadata.gig_id] : null;
  const alreadyAccepted =
    gigStatus && (gigStatus.status === "active" || gigStatus.status === "completed");

  return (
    <SwipeRow canDelete={allDeletable} onDelete={() => onDeleteGroup(items)}>
      <div
        className={`alert-row ${anyUnread ? "unread" : ""}`}
        onClick={() => onRowClick(items)}
        style={{ cursor: "pointer" }}
      >
        <StackedAvatars items={items} profileMap={profileMap} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--fg)",
              lineHeight: 1.4,
              marginBottom: 2,
            }}
          >
            {items.length} people requested your gig
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--fg3)",
              fontFamily: "var(--mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {gigTitle}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--ink)",
              fontFamily: "var(--mono)",
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Tap for details ›
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
            {elapsed(new Date(latest.created_at).getTime())}
          </span>
          {!alreadyAccepted ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "var(--mono)",
                color: "var(--amber)",
                background: "var(--amber-bg)",
                border: "1px solid var(--amber-bd)",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              {items.length} pending
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "var(--mono)",
                color: "var(--green-d)",
              }}
            >
              ✓ Accepted
            </span>
          )}
        </div>
      </div>
    </SwipeRow>
  );
}
