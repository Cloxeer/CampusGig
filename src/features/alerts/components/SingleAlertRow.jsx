import { CheckCircle, Loader } from "lucide-react";
import UserAvatar from "../../../components/UserAvatar";
import { elapsed } from "../../../utils/helpers";
import { GIG_NOTIF_TYPES, REVIEW_NOTIF_TYPES } from "../notificationTypes";
import { isDeletable } from "../notificationModel";
import { resolveNotifAvatar } from "../resolveNotificationAvatar";
import NotificationFallbackAvatar from "./NotificationFallbackAvatar";
import SwipeRow from "./SwipeRow";

export default function SingleAlertRow({
  notification: n,
  profileMap,
  gigStatusMap,
  acceptingId,
  onRowClick,
  onDelete,
  onInlineAccept,
}) {
  const canDelete = isDeletable(n, gigStatusMap);
  const isGigClickable = GIG_NOTIF_TYPES.has(n.type) && n.metadata?.gig_id;
  const isReviewClickable = REVIEW_NOTIF_TYPES.has(n.type) && n.metadata?.reviewer_id;
  const isClickable = isGigClickable || isReviewClickable;
  const showInlineAccept = n.type === "gig_requested" && n.metadata?.request_id;
  const gigStatus = n.metadata?.gig_id ? gigStatusMap[n.metadata.gig_id] : null;
  const alreadyAccepted =
    gigStatus && (gigStatus.status === "active" || gigStatus.status === "completed");

  const user = resolveNotifAvatar(n, profileMap);

  return (
    <SwipeRow canDelete={canDelete} onDelete={() => onDelete(n.id)}>
      <div
        className={`alert-row ${!n.read ? "unread" : ""}`}
        onClick={() => onRowClick(n)}
        style={{ cursor: isClickable ? "pointer" : "default" }}
      >
        {user ? (
          <UserAvatar user={user} size="md" />
        ) : (
          <NotificationFallbackAvatar type={n.type} />
        )}
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
            {n.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
            {n.body || ""}
          </div>
          {isClickable && (
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
          )}
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
            {elapsed(new Date(n.created_at).getTime())}
          </span>
          {showInlineAccept && !alreadyAccepted ? (
            <button
              className="btn bgreen bsm"
              onClick={(e) => onInlineAccept(e, n)}
              disabled={acceptingId === n.id}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                gap: 4,
                opacity: acceptingId === n.id ? 0.6 : 1,
              }}
            >
              {acceptingId === n.id ? (
                <Loader size={11} className="spin" />
              ) : (
                <CheckCircle size={11} />
              )}
              Accept
            </button>
          ) : showInlineAccept && alreadyAccepted ? (
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
          ) : !n.read ? (
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--err)",
              }}
            />
          ) : null}
        </div>
      </div>
    </SwipeRow>
  );
}
