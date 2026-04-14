import { getAvatarUrl } from "../lib/profile";

const SIZES = { xs: 22, sm: 30, md: 36, lg: 44, xl: 56 };

export default function UserAvatar({ user, size = "md", style }) {
  const px = typeof size === "number" ? size : (SIZES[size] || SIZES.md);
  const fontSize = Math.round(px * 0.38);

  if (!user) return null;

  const url = user.resolvedAvatarUrl || (user.avatar_url ? getAvatarUrl(user.avatar_url) : null);
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase();
  const color = user.avatar_color || "#6366f1";

  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid var(--bd)",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        background: color,
        color: "white",
        fontSize,
        fontWeight: 700,
        fontFamily: "var(--mono)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "1px solid var(--bd)",
        ...style,
      }}
    >
      {initials || "?"}
    </div>
  );
}
