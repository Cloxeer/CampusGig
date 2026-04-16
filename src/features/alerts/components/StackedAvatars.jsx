import UserAvatar from "../../../components/UserAvatar";
import { getOtherUserId } from "../notificationModel";

export default function StackedAvatars({ items, profileMap }) {
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
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--bg3)",
                border: "2px solid var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "var(--fg4)",
                fontWeight: 700,
              }}
            >
              ?
            </div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -10,
            zIndex: 0,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--bg3)",
            border: "2px solid var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--fg3)",
            fontFamily: "var(--mono)",
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
