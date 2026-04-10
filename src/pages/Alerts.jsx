import { useState, useEffect } from "react";
import { Bell, CheckCircle, Star, AlertTriangle } from "lucide-react";
import { getMyNotifications, markAllNotificationsRead } from "../lib/profile";
import { elapsed } from "../utils/helpers";
import TopBar from "../components/TopBar";

const NOTIF_STYLE = {
  gig_accepted: { icon: <CheckCircle size={16} />, bg: "#f0fdf4", color: "#16a34a" },
  payment: { icon: <span style={{ fontSize: 16, fontWeight: 700 }}>$</span>, bg: "#f0fdf4", color: "#16a34a" },
  review: { icon: <Star size={16} />, bg: "#fefce8", color: "#ca8a04" },
  issue: { icon: <AlertTriangle size={16} />, bg: "#fef2f2", color: "#dc2626" },
  gig_completed: { icon: <span style={{ fontSize: 14 }}>🏅</span>, bg: "#f0fdf4", color: "#16a34a" },
  gig_expiring: { icon: <span style={{ fontSize: 14 }}>⏱</span>, bg: "#f4f4f5", color: "#71717a" },
  default: { icon: <Bell size={16} />, bg: "#f4f4f5", color: "#71717a" },
};

function getNotifStyle(type) {
  return NOTIF_STYLE[type] || NOTIF_STYLE.default;
}

export default function Alerts({ setScreen }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const { notifications: data } = await getMyNotifications();
    setNotifications(data);
    setLoading(false);
  }

  async function handleMarkRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
                <div className="skel" style={{ width: 36, height: 36, borderRadius: "var(--r)", flexShrink: 0 }} />
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
            const style = getNotifStyle(n.type);
            return (
              <div key={n.id} className={`alert-row ${!n.read ? "unread" : ""}`}>
                <div className="aico" style={{ background: style.bg, color: style.color }}>
                  {style.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", lineHeight: 1.4, marginBottom: 2 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg3)", fontFamily: "var(--mono)" }}>{n.body || ""}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: "var(--fg4)", fontFamily: "var(--mono)" }}>
                    {elapsed(new Date(n.created_at).getTime())}
                  </span>
                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink)" }} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
