import { useEffect, useState } from "react";
import { getAvatarUrl } from "../lib/profile";
import AvatarZoomModal from "./AvatarZoomModal";
import CosmeticRing from "./CosmeticRing";
import { COSMETICS } from "../data/cosmetics";
import { getInventory, subscribeInventory } from "../lib/cosmeticsInventory";
import { isSelfId } from "../lib/selfUid";

const SIZES = { xs: 22, sm: 30, md: 36, lg: 44, xl: 56 };

function resolveEquippedBorder() {
  const id = getInventory().equipped.border;
  if (!id) return null;
  return COSMETICS.find((c) => c.id === id && c.type === "border") || null;
}

/** Live equipped-border cosmetic (local inventory) — only when enabled. */
function useEquippedBorder(enabled) {
  const [border, setBorder] = useState(() => (enabled ? resolveEquippedBorder() : null));
  useEffect(() => {
    if (!enabled) {
      setBorder(null);
      return undefined;
    }
    setBorder(resolveEquippedBorder());
    return subscribeInventory(() => setBorder(resolveEquippedBorder()));
  }, [enabled]);
  return enabled ? border : null;
}

/**
 * `withCosmetics` — pass ONLY when this avatar renders the CURRENT user; wraps
 * the photo in their equipped avatar-border ring (local inventory for now).
 */
export default function UserAvatar({ user, size = "md", style, zoomable = false, withCosmetics = false }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  /* Explicit opt-in OR auto-detected self (full user objects carry .id). */
  const isSelf = withCosmetics || isSelfId(user?.id);
  const border = useEquippedBorder(isSelf);
  const ring = border?.ring || null;

  const px = typeof size === "number" ? size : (SIZES[size] || SIZES.md);
  const fontSize = Math.round(px * 0.38);

  if (!user) return null;

  const url = user.resolvedAvatarUrl || (user.avatar_url ? getAvatarUrl(user.avatar_url) : null);
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase();
  const color = user.avatar_color || "#6366f1";

  /* The ring REPLACES the caller's border and stays INSIDE the original
     footprint (wrapper = px), so ringed avatars never shift surrounding layout
     — the photo just gets slightly smaller. CosmeticRing owns all the layering. */
  const { border: _callerBorder, ...ringWrapStyle } = style || {};

  const wrapInRing = (node) =>
    ring ? (
      <CosmeticRing cosmetic={border} size={px} style={ringWrapStyle}>
        {node}
      </CosmeticRing>
    ) : (
      node
    );

  if (url) {
    // Only real photos are zoomable — there's nothing to pinch-zoom on initials.
    const canZoom = zoomable;
    const openZoom = () => setZoomOpen(true);

    return (
      <>
        {wrapInRing(
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
            style={
              ring
                ? {
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    cursor: canZoom ? "zoom-in" : undefined,
                  }
                : {
                    width: px,
                    height: px,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid var(--bd)",
                    cursor: canZoom ? "zoom-in" : undefined,
                    ...style,
                  }
            }
          />
        )}
        {canZoom && zoomOpen && (
          <AvatarZoomModal src={url} onClose={() => setZoomOpen(false)} />
        )}
      </>
    );
  }

  return wrapInRing(
    <div
      style={
        ring
          ? {
              width: "100%",
              height: "100%",
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
            }
          : {
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
            }
      }
    >
      {initials || "?"}
    </div>
  );
}
