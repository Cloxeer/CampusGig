import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Star, AlertTriangle, Trash2, Lock } from "lucide-react";
import {
  getMyNotifications, markAllNotificationsRead, deleteNotification, getGigStatusesForNotifications,
} from "../lib/profile";
import { elapsed } from "../utils/helpers";
import TopBar from "../components/TopBar";
import AlertDetailModal from "../components/modals/AlertDetailModal";

const GIG_NOTIF_TYPES = new Set([
  "gig_requested", "gig_request_sent", "gig_accepted", "gig_rejected", "gig_completed",
]);

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

function SwipeRow({ children, canDelete, onDelete }) {
  const containerRef = useRef(null);
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
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden" }}>
      {/* Delete action behind */}
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

      {/* Main content */}
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

function NotifAvatar({ notification }) {
  const meta = notification.metadata || {};
  if (meta.other_avatar_url) {
    return (
      <img
        src={meta.other_avatar_url}
        alt=""
        style={{
          width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
          border: "1px solid var(--bd)", flexShrink: 0,
        }}
      />
    );
  }
  if (meta.other_initials) {
    return (
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: meta.other_avatar_color || "#6366f1",
        color: "white", fontSize: 13, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, border: "1px solid var(--bd)",
      }}>
        {meta.other_initials}
      </div>
    );
  }
  const fb = FALLBACK_STYLE[notification.type] || FALLBACK_STYLE.default;
  return (
    <div className="aico" style={{ background: fb.bg, color: fb.color }}>
      {fb.icon}
    </div>
  );
}

export default function Alerts({ setScreen, onNotificationsRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gigStatusMap, setGigStatusMap] = useState({});
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { notifications: data } = await getMyNotifications();
    setNotifications(data);

    const gigIds = [...new Set(
      data.filter((n) => n.metadata?.gig_id).map((n) => n.metadata.gig_id)
    )];
    if (gigIds.length > 0) {
      const map = await getGigStatusesForNotifications(gigIds);
      setGigStatusMap(map);
    }
    setLoading(false);
  }

  async function handleMarkRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onNotificationsRead?.();
  }

  async function handleDelete(notifId) {
    await deleteNotification(notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    onNotificationsRead?.();
  }

  function handleNotifClick(n) {
    if (GIG_NOTIF_TYPES.has(n.type) && n.metadata?.gig_id) {
      setSelectedNotif(n);
    }
  }

  function handleStatusChange() {
    loadNotifications();
    onNotificationsRead?.();
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="page fadein">
      <TopBar
        title="Alerts"
        onBack={() => setScreen("home")}
        right={
          hasUnread ? (
            <button className="btn bg-btn bsm" onClick={handleMarkRead}>Mark read</button>
          ) : null
        }
      />

      <div className="scroll" style={{ paddingBottom: 80 }}>
        {loading ? (
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
        ) : notifications.length === 0 ? (
          <div style={{ padding: "48px 16px", textAlign: "center" }}>
            <Bell size={28} color="var(--fg4)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg3)", marginBottom: 4 }}>No alerts yet</div>
            <div style={{ fontSize: 12, color: "var(--fg4)" }}>You'll see notifications here when something happens.</div>
          </div>
        ) : (
          notifications.map((n) => {
            const canDelete = isDeletable(n, gigStatusMap);
            const isClickable = GIG_NOTIF_TYPES.has(n.type) && n.metadata?.gig_id;

            return (
              <SwipeRow key={n.id} canDelete={canDelete} onDelete={() => handleDelete(n.id)}>
                <div
                  className={`alert-row ${!n.read ? "unread" : ""}`}
                  onClick={() => handleNotifClick(n)}
                  style={{ cursor: isClickable ? "pointer" : "default" }}
                >
                  <NotifAvatar notification={n} />
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
                    {!n.read && (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", background: "var(--ink)",
                      }} />
                    )}
                  </div>
                </div>
              </SwipeRow>
            );
          })
        )}
      </div>

      {selectedNotif && (
        <AlertDetailModal
          notification={selectedNotif}
          onClose={() => { setSelectedNotif(null); loadNotifications(); }}
          onStatusChange={handleStatusChange}
          setScreen={setScreen}
        />
      )}
    </div>
  );
}
