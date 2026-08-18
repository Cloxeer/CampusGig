import { useDisplayTag, TagBadge } from "./EquippedTagBadge";
import { isSelfId } from "../lib/selfUid";
import { useRegisteredEquipped } from "../lib/equippedRegistry";
import { COSMETICS, tierTagForLabel } from "../data/cosmetics";

/**
 * Trust-level badge — renders the shared TagBadge for the user's DISPLAY tag so
 * a worn tag looks identical to EVERYONE, not just its owner:
 *   • you (self)     — resolved live from local inventory (equipped, else tier).
 *   • anyone else    — resolved from their public `equippedTagId`, else their
 *                      tier tag by `label`. Callers pass `equippedTagId` from
 *                      the profile/gig row's `equipped_tag` column.
 * `text` remains an explicit override (e.g. a non-tier label).
 */
export default function LevelBadge({ label, text, userId, equippedTagId, small }) {
  const self = isSelfId(userId);
  const selfDisplayTag = useDisplayTag(label); // hook must run every render
  /* Others → the registry's freshest-known tag, so this badge agrees with every
     other surface showing the same person; fall back to the row's own value. */
  const registered = useRegisteredEquipped(self ? null : userId);

  if (!text) {
    const otherTagId = registered?.tag ?? equippedTagId;
    const displayTag = self
      ? selfDisplayTag
      : (otherTagId && COSMETICS.find((c) => c.id === otherTagId && c.type === "tag")) ||
        tierTagForLabel(label);
    if (displayTag) return <TagBadge cosmetic={displayTag} small={small} />;
  }

  const cls =
    { New: "lv-new", Reliable: "lv-reliable", Trusted: "lv-trusted", Legend: "lv-legend" }[label] ||
    "lv-new";

  return (
    <span className={`badge ${cls}`} style={{ fontSize: small ? 10 : 11 }}>
      {text || label}
    </span>
  );
}
