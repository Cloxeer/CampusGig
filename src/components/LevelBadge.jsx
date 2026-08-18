import { useDisplayTag, TagBadge } from "./EquippedTagBadge";
import { isSelfId } from "../lib/selfUid";

/**
 * Trust-level badge. `label` picks the level color. For the CURRENT user it
 * renders the shared TagBadge for their DISPLAY tag (equipped cosmetic, else
 * their tier tag) — the same resolver the rep-path hero and Inventory use, so
 * they always agree. Other users' badges use the plain tier label. `text`
 * remains as an explicit override.
 */
export default function LevelBadge({ label, text, userId, small }) {
  const displayTag = useDisplayTag(label);

  if (!text && displayTag && isSelfId(userId)) {
    return <TagBadge cosmetic={displayTag} small={small} />;
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
