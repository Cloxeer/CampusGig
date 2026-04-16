import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Star, AlertTriangle, Trash2, Lock, CheckCircle, Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getMyNotifications, markAllNotificationsRead, markNotificationRead,
  deleteNotification, getGigStatusesForNotifications, acceptGigRequest,
  getProfilesByIds,
} from "../lib/profile";
import { queryClient, queryKeys } from "../lib/queryClient";
import { elapsed } from "../utils/helpers";
import TopBar from "../components/TopBar";
import UserAvatar from "../components/UserAvatar";

const GIG_NOTIF_TYPES = new Set([
  "gig_requested", "gig_request_sent", "gig_accepted", "gig_rejected", "gig_completed",
]);
const REVIEW_NOTIF_TYPES = new Set(["review_received"]);

const FALLBACK_STYLE = {
  review: { bg: "#fefce8", color: "#ca8a04", icon: <Star size={16} /> },
  issue: { bg: "#fef2f2", color: "#dc2626", icon: <AlertTriangle size={16} /> },
  default: { bg: "#f4f4f5", color: "#71717a", icon: <Bell size={16} /> },
};

function isDeletable(n, gigStatusMap) {
  if (!n.metadata?.gig_id) return true;
  if (n.type === "gig_completed" || n.type === "gig_rejected") return true;
  const gs = gigStatusMap[n.metadata.gig_id];
  if (!gs) return true;
  if (gs.status === "completed" || gs.status === "cancelled") return true;
  if (gs.status === "open" && n.type !== "gig_request_sent") return true;
  return false;
}

function groupNotifications(notifications) {
  const groups = [];
  const gigRequestBuckets = {};

  for (const n of notifications) {
    if (n.type === "gig_requested" && n.metadata?.gig_id) {
      const key = n.metadata.gig_id;
      if (!gigRequestBuckets[key]) {
        gigRequestBuckets[key] = [];
      }
      gigRequestBuckets[key].push(n);
    } else {
      groups.push({ kind: "single", items: [n] });
    }
  }

  for (const [, bucket] of Object.entries(gigRequestBuckets)) {
    if (bucket.length === 1) {
      groups.push({ kind: "single", items: bucket });
    } else {
      groups.push({ kind: "gig_requests", items: bucket });
    }
  }

  groups.sort((a, b) => {
    const aTime = new Date(a.items[0].created_at).getTime();
    const bTime = new Date(b.items[0].created_at).getTime();
    return bTime - aTime;
  });

  return groups;
}

function SwipeRow({ children, canDelete, onDelete }) {
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const THRESHOLD = 72;

  const handleTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    swipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx > 0 && !swiped) return;
    if (Math.abs(dx) > 8) swipingRef.current = true;
    const clamp = Math.max(Math.min(swiped ? dx - THRESHOLD : dx, 0), -THRESHOLD);
    currentXRef.current = clamp;
    setOffset(clamp);
  }, [swiped]);

  const handleTouchEnd = useCallback(() => {
    if (currentXRef.current < -THRESHOLD * 0.5) {
      setOffset(-THRESHOLD);
      setSwiped(true);
    } else {
      setOffset(0);
      setSwiped(false);
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (swipingRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  const resetSwipe = useCallback(() => {
    setOffset(0);
    setSwiped(false);
  }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: THRESHOLD,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: canDelete ? "var(--err)" : "var(--bg3)",
        transition: "background .15s",
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canDelete) onDelete();
            else resetSwipe();
          }}
          style={{
            background: "none", border: "none", cursor: canDelete ? "pointer" : "not-allowed",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: canDelete ? "white" : "var(--fg4)", fontSize: 10, fontWeight: 600,
            fontFamily: "var(--mono)",
          }}
        >
          {canDelete ? <Trash2 size={16} /> : <Lock size={14} />}
          {canDelete ? "Delete" : "Active"}
        </button>
      </div>

      <div
        style={{
          position: "relative", zIndex: 1, background: "var(--bg)",
          transform: `translateX(${offset}px)`,
          transition: swipingRef.current ? "none" : "transform .2s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

function getOtherUserId(meta) {
  if (meta.reviewer_id) return meta.reviewer_id;

  if (meta.role === "poster") return meta.requester_id;
  if (meta.role === "requester") return meta.poster_id;

  return meta.requester_id || meta.other_user_id || meta.poster_id;
}

function collectUserIds(notifications) {
  const ids = new Set();
  for (const n of notifications) {
    const m = n.metadata;
    if (!m) continue;
    if (m.requester_id) ids.add(m.requester_id);
    if (m.poster_id) ids.add(m.poster_id);
    if (m.reviewer_id) ids.add(m.reviewer_id);
    if (m.other_user_id) ids.add(m.other_user_id);
  }
  return [...ids];
}

function resolveNotifAvatar(notification, profileMap) {
  const meta = notification.metadata || {};
  const otherId = getOtherUserId(meta);
  const liveProfile = otherId ? profileMap[otherId] : null;

  if (liveProfile) return liveProfile;

  if (meta.other_avatar_url) {
    return {
      resolvedAvatarUrl: meta.other_avatar_url,
      avatar_color: meta.other_avatar_color || "#6366f1",
      first_name: "",
      last_name: "",
    };
  }

  return null;
}

function StackedAvatars({ items, profileMap }) {
  const seen = new Set();
  const users = [];
  for (const n of items) {
    const uid = getOtherUserId(n.metadata || {});
    if (uid && !seen.has(uid)) {
      seen.add(uid);
      users.push(profileMap[uid] || null);
    }
  }
  const show = users.slice(0, 3);
  const overflow = users.length - show.length;

  return (
    <div style={{ display: "flex", flexShrink: 0 }}>
      {show.map((u, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: show.length - i }}>
          {u ? (
            <UserAvatar user={u} size={30} style={{ border: "2px solid var(--bg)" }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: "var(--bg3)",
              border: "2px solid var(--bg)", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 10, color: "var(--fg4)", fontWeight: 700,
            }}>?</div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div style={{
          marginLeft: -10, zIndex: 0, width: 30, height: 30, borderRadius: "50%",
          background: "var(--bg3)", border: "2px solid var(--bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "var(--fg3)", fontFamily: "var(--mono)",
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

function updateNotificationsCache(updater) {
  queryClient.setQueryData(queryKeys.notifications, (old) => {
    if (!old) return old;
    return { ...old, notifications: updater(old.notifications) };
  });
}

export default function Alerts({ currentUserId }) {
  const navigate = useNavigate();
  const [acceptingId, setAcceptingId] = useState(null);

  const { data: alertsData, isPending: alertsPending } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { notifications: data } = await getMyNotifications();

      const gigIds = [...new Set(
        data.filter((n) => n.metadata?.gig_id).map((n) => n.metadata.gig_id)
      )];
      const userIds = collectUserIds(data);

      const [statusMap, profiles] = await Promise.all([
        gigIds.length > 0 ? getGigStatusesForNotifications(gigIds) : {},
        userIds.length > 0 ? getProfilesByIds(userIds) : {},
      ]);

      return { notifications: data, gigStatusMap: statusMap, profileMap: profiles };
    },
    staleTime: 60_000,
  });

  const notifications = alertsData?.notifications || [];
  const gigStatusMap = alertsData?.gigStatusMap || {};
  const profileMap = alertsData?.profileMap || {};

  useEffect(() => {
    markAllNotificationsRead().then(() => {
      updateNotificationsCache((items) => items.map((n) => ({ ...n, read: true })));
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    });
  }, []);

  async function handleMarkRead() {
    await markAllNotificationsRead();
    updateNotificationsCache((items) => items.map((n) => ({ ...n, read: true })));
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
  }

  async function handleDelete(notifId) {
    await deleteNotification(notifId);
    updateNotificationsCache((items) => items.filter((n) => n.id !== notifId));
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
  }

  async function handleDeleteGroup(items) {
    await Promise.all(items.map((n) => deleteNotification(n.id)));
    const ids = new Set(items.map((n) => n.id));
    updateNotificationsCache((all) => all.filter((n) => !ids.has(n.id)));
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
  }

  async function handleNotifClick(n) {
    if (!n.read) {
      markNotificationRead(n.id);
      updateNotificationsCache((items) =>
        items.map((notif) => notif.id === n.id ? { ...notif, read: true } : notif)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    }
    if (GIG_NOTIF_TYPES.has(n.type) && n.metadata?.gig_id) {
      navigate(`/gigdetails/${n.metadata.gig_id}`, {
        state: { source: "alerts", notification: n, returnTo: "/alerts" },
      });
      return;
    }
    if (REVIEW_NOTIF_TYPES.has(n.type) && n.metadata?.reviewer_id) {
      navigate(`/profile?reviews=1&reviewer=${encodeURIComponent(n.metadata.reviewer_id)}`, {
        state: { returnTo: "/alerts" },
      });
    }
  }

  async function handleGroupClick(items) {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
      updateNotificationsCache((all) =>
        all.map((n) => unreadIds.includes(n.id) ? { ...n, read: true } : n)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    }
    const latest = items[0];
    if (latest.metadata?.gig_id) {
      navigate(`/gigdetails/${latest.metadata.gig_id}`, {
        state: { source: "alerts", notification: latest, returnTo: "/alerts" },
      });
    }
  }

  async function handleInlineAccept(e, n) {
    e.stopPropagation();
    const meta = n.metadata || {};
    if (!meta.request_id || !meta.gig_id || !meta.requester_id) return;

    setAcceptingId(n.id);
    const { error } = await acceptGigRequest(meta.request_id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.openGigs });
    }
    setAcceptingId(null);
  }

  const hasUnread = notifications.some((n) => !n.read);
  const groups = groupNotifications(notifications);

  return (
    <div className="page fadein">
      <TopBar
        title="Alerts"
        right={
          hasUnread ? (
            <button className="btn bg-btn bsm" onClick={handleMarkRead}>Mark read</button>
          ) : null
        }
      />

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        {alertsPending ? (
          <div>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "13px 16px", borderBottom: "1px solid var(--bd)",
              }}>
                <div className="skel skel-circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ width: "70%", height: 13, marginBottom: 6 }} />
                  <div className="skel" style={{ width: "45%", height: 11 }} />
                </div>
                <div className="skel" style={{ width: 30, height: 10, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <Bell size={28} color="var(--fg4)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginBottom: 4 }}>No alerts yet</div>
            <div style={{ fontSize: 12, color: "var(--fg4)" }}>You'll see notifications here when something happens.</div>
          </div>
        ) : (
          groups.map((group) => {
            if (group.kind === "gig_requests") {
              const items = group.items;
              const latest = items[0];
              const gigTitle = latest.metadata?.gig_title || latest.body || "your gig";
              const anyUnread = items.some((n) => !n.read);
              const allDeletable = items.every((n) => isDeletable(n, gigStatusMap));
              const gigStatus = latest.metadata?.gig_id ? gigStatusMap[latest.metadata.gig_id] : null;
              const alreadyAccepted = gigStatus && (gigStatus.status === "active" || gigStatus.status === "completed");

              return (
                <SwipeRow
                  key={`grp-${latest.metadata.gig_id}`}
                  canDelete={allDeletable}
                  onDelete={() => handleDeleteGroup(items)}
                >
                  <div
                    className={`alert-row ${anyUnread ? "unread" : ""}`}
                    onClick={() => handleGroupClick(items)}
                    style={{ cursor: "pointer" }}
                  >
                    <StackedAvatars items={items} profileMap={profileMap} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: "var(--fg)",
                        lineHeight: 1.4, marginBottom: 2,
                      }}>
                        {items.length} people requested your gig
                      </div>
                      <div style={{
                        fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {gigTitle}
                      </div>
                      <div style={{
                        fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)",
                        fontWeight: 600, marginTop: 4,
                      }}>
                        Tap for details ›
                      </div>
                    </div>
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-end",
                      gap: 6, flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                        {elapsed(new Date(latest.created_at).getTime())}
                      </span>
                      {!alreadyAccepted ? (
                        <span style={{
                          fontSize: 10, fontWeight: 600, fontFamily: "var(--mono)",
                          color: "var(--amber)", background: "var(--amber-bg)",
                          border: "1px solid var(--amber-bd)", borderRadius: 4,
                          padding: "2px 6px",
                        }}>
                          {items.length} pending
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 600, fontFamily: "var(--mono)",
                          color: "var(--green-d)",
                        }}>
                          ✓ Accepted
                        </span>
                      )}
                    </div>
                  </div>
                </SwipeRow>
              );
            }

            const n = group.items[0];
            const canDelete = isDeletable(n, gigStatusMap);
            const isGigClickable = GIG_NOTIF_TYPES.has(n.type) && n.metadata?.gig_id;
            const isReviewClickable = REVIEW_NOTIF_TYPES.has(n.type) && n.metadata?.reviewer_id;
            const isClickable = isGigClickable || isReviewClickable;
            const showInlineAccept = n.type === "gig_requested" && n.metadata?.request_id;
            const gigStatus = n.metadata?.gig_id ? gigStatusMap[n.metadata.gig_id] : null;
            const alreadyAccepted = gigStatus && (gigStatus.status === "active" || gigStatus.status === "completed");

            return (
              <SwipeRow key={n.id} canDelete={canDelete} onDelete={() => handleDelete(n.id)}>
                <div
                  className={`alert-row ${!n.read ? "unread" : ""}`}
                  onClick={() => handleNotifClick(n)}
                  style={{ cursor: isClickable ? "pointer" : "default" }}
                >
                  {(() => {
                    const user = resolveNotifAvatar(n, profileMap);
                    if (user) return <UserAvatar user={user} size="md" />;
                    const fb = FALLBACK_STYLE[n.type] || FALLBACK_STYLE.default;
                    return <div className="aico" style={{ background: fb.bg, color: fb.color }}>{fb.icon}</div>;
                  })()}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: "var(--fg)",
                      lineHeight: 1.4, marginBottom: 2,
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>
                      {n.body || ""}
                    </div>
                    {isClickable && (
                      <div style={{
                        fontSize: 10, color: "var(--ink)", fontFamily: "var(--mono)",
                        fontWeight: 600, marginTop: 4,
                      }}>
                        Tap for details ›
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-end",
                    gap: 6, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                      {elapsed(new Date(n.created_at).getTime())}
                    </span>
                    {showInlineAccept && !alreadyAccepted ? (
                      <button
                        className="btn bgreen bsm"
                        onClick={(e) => handleInlineAccept(e, n)}
                        disabled={acceptingId === n.id}
                        style={{
                          fontSize: 11, padding: "3px 10px", gap: 4,
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
                      <span style={{
                        fontSize: 10, fontWeight: 600, fontFamily: "var(--mono)",
                        color: "var(--green-d)",
                      }}>
                        ✓ Accepted
                      </span>
                    ) : !n.read ? (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", background: "var(--err)",
                      }} />
                    ) : null}
                  </div>
                </div>
              </SwipeRow>
            );
          })
        )}
      </div>
    </div>
  );
}
