import { useState } from "react";
import { getAvatarUrl } from "../lib/profile";
import AvatarZoomModal from "./AvatarZoomModal";

const SIZES = { xs: 22, sm: 30, md: 36, lg: 44, xl: 56 };

export default function UserAvatar({ user, size = "md", style, zoomable = false }) {
  const [zoomOpen, setZoomOpen] = useState(false);

  const px = typeof size === "number" ? size : (SIZES[size] || SIZES.md);
  const fontSize = Math.round(px * 0.38);

  if (!user) return null;

  const url = user.resolvedAvatarUrl || (user.avatar_url ? getAvatarUrl(user.avatar_url) : null);
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase();
  const color = user.avatar_color || "#6366f1";

  if (url) {
    // Only real photos are zoomable — there's nothing to pinch-zoom on initials.
    const canZoom = zoomable;
    const openZoom = () => setZoomOpen(true);

    return (
      <>
        <img
          src={url}
          alt=""
          onClick={canZoom ? openZoom : undefined}
          onKeyDown={
            canZoom
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openZoom();
                  }
                }
              : undefined
          }
          role={canZoom ? "button" : undefined}
          tabIndex={canZoom ? 0 : undefined}
          aria-label={canZoom ? "View profile photo" : undefined}
          style={{
            width: px,
            height: px,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: "1px solid var(--bd)",
            cursor: canZoom ? "zoom-in" : undefined,
            ...style,
          }}
        />
        {canZoom && zoomOpen && (
          <AvatarZoomModal src={url} onClose={() => setZoomOpen(false)} />
        )}
      </>
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
