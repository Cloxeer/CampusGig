import { useEffect, useState } from "react";
import { COSMETICS, RARITIES, tierTagForLabel } from "../data/cosmetics";
import { getInventory, subscribeInventory } from "../lib/cosmeticsInventory";

/**
 * Live equipped profile TAG (local inventory). Returns the cosmetic or null.
 */
export function useEquippedTag() {
  const [tagId, setTagId] = useState(() => getInventory().equipped.tag);
  useEffect(() => subscribeInventory(() => setTagId(getInventory().equipped.tag)), []);
  return tagId ? COSMETICS.find((c) => c.id === tagId && c.type === "tag") || null : null;
}

/**
 * THE tag to DISPLAY for the current user, single source of truth: the equipped
 * cosmetic tag, or — when nothing is equipped ("None") — the current tier's tag
 * (New/Reliable/…). Every "worn tag" surface (profile header, rep-path hero,
 * Inventory preview) uses this so they can never disagree when equipped changes.
 * @param {string} tierLabel a REP_LEVELS label ("New"/"Reliable"/…)
 */
export function useDisplayTag(tierLabel) {
  const equipped = useEquippedTag();
  return equipped || (tierLabel ? tierTagForLabel(tierLabel) : null);
}

/**
 * THE tag badge — the single source of truth for how a profile tag renders
 * app-wide: standard `.badge` shape, tinted in the tag's RARITY color.
 */
export function TagBadge({ cosmetic, small, full }) {
  const r = RARITIES[cosmetic.rarity];
  /* Cosmic's near-white tint would render as a blank pill — cosmic badges get
     their own look instead: drifting clouds + soft outer glow (borderFx.css). */
  const cosmic = cosmetic.rarity === "cosmic";
  return (
    <span
      className={cosmic ? "badge tag-badge--cosmic" : "badge"}
      style={{
        fontSize: small ? 10 : 11,
        ...(cosmic
          ? null
          : {
              background: `color-mix(in srgb, ${r.color} 12%, transparent)`,
              color: r.textOnLight,
              border: `1px solid color-mix(in srgb, ${r.color} 30%, transparent)`,
            }),
        /* Longest catalog names ("Caffeine Based Lifeform") fit every current
           surface at 375px, but tags render inside layouts we don't control
           from here — never wrap or spill. `minWidth:0` lets the badge shrink
           so the inner span (not the badge) does the truncating — otherwise
           flex+overflow eats the badge's right padding and the text jams the edge. */
        maxWidth: "100%",
        minWidth: 0,
        /* `full` shows the entire tag name — wrapping to a second line if the
           container is narrow — instead of truncating. Used where the layout
           has vertical room (the rep card) and the name must read in full. */
        ...(full ? { whiteSpace: "normal" } : null),
      }}
    >
      <span
        style={
          full
            ? { minWidth: 0, whiteSpace: "normal", overflowWrap: "anywhere", textAlign: "center" }
            : {
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }
        }
      >
        {cosmetic.name}
      </span>
    </span>
  );
}
