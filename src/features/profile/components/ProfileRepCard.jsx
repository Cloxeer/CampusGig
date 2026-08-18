import { TagBadge } from "../../../components/EquippedTagBadge";
import { tierTagForLabel } from "../../../data/cosmetics";

/** The trust ladder shown along the bottom of the card. */
const TIER_LABELS = ["New", "Reliable", "Trusted", "Legend"];

/**
 * THE rep card — one component used everywhere (profile, Home feed). Its color
 * comes entirely from `lvl` (the tier's rarity color) and its badge is the
 * shared TagBadge, so the tier you see is the tag you earn on the Rep path.
 *
 * @param {"self"|"other"|"guest"} variant
 *   self  — your card: rank row + "how to earn" footer, tappable.
 *   other — someone else's: badge only, not tappable.
 *   guest — logged-out marketing card (Home).
 */
export default function ProfileRepCard({ repScore, lvl, rank, totalUsers, onRepPath, variant = "self" }) {
  if (variant === "guest") {
    return (
      <div
        className="rep-card"
        style={{ cursor: onRepPath ? "pointer" : undefined }}
        onClick={onRepPath}
        role={onRepPath ? "button" : undefined}
        tabIndex={onRepPath ? 0 : undefined}
        onKeyDown={onRepPath ? (e) => keyActivate(e, onRepPath) : undefined}
      >
        <div className="rc-ey">Rep path · tap to explore</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: "var(--green)", letterSpacing: "-.025em", margin: "4px 0 7px", lineHeight: 1.18 }}>
          Post a task — a verified student gets it done.
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.55, marginBottom: 16 }}>
          Anyone can post work. Verified NMSU students take it on and earn rep on every job.
        </div>
        <div className="rc-track">
          <div className="rc-fill" style={{ width: "12%", background: "var(--green)" }} />
        </div>
        <div className="rc-labels">
          {TIER_LABELS.map((l) => (
            <span key={l} className="rc-lbl">
              {l}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const interactive = variant === "self";
  const tierTag = tierTagForLabel(lvl.label);
  const showRank = interactive && rank != null && totalUsers != null;

  /* The tier badge IS the earned tag (rarity-colored, no icon). Falls back to a
     plain colored pill only if a tier somehow has no mapped tag. */
  const badge = tierTag ? (
    <TagBadge cosmetic={tierTag} />
  ) : (
    <span className="badge" style={{ fontSize: 11, background: lvl.bg, color: lvl.color, border: `1px solid ${lvl.border}` }}>
      {lvl.label}
    </span>
  );

  return (
    <div
      className="rep-card"
      style={{ marginBottom: 16, cursor: interactive && onRepPath ? "pointer" : undefined }}
      onClick={interactive && onRepPath ? onRepPath : undefined}
      role={interactive && onRepPath ? "button" : undefined}
      tabIndex={interactive && onRepPath ? 0 : undefined}
      onKeyDown={interactive && onRepPath ? (e) => keyActivate(e, onRepPath) : undefined}
    >
      <div className="rc-ey">{interactive ? "Rep path · tap to open" : "Rep Score"}</div>
      <div className="rc-row">
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span className="rc-score" style={{ color: lvl.color }}>
            {repScore}
          </span>
          <span className="rc-pts">pts</span>
        </div>
        {showRank ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: 4 }}>{badge}</div>
            <div style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--mono)" }}>
              #{rank || "—"} of {totalUsers} student{totalUsers !== 1 ? "s" : ""}
            </div>
          </div>
        ) : (
          badge
        )}
      </div>
      <div className="rc-track">
        <div className="rc-fill" style={{ width: `${lvl.pct}%`, background: lvl.color }} />
      </div>
      <div className="rc-labels">
        {TIER_LABELS.map((l) => (
          <span key={l} className="rc-lbl" style={lvl.label === l ? { color: lvl.color, fontWeight: 600 } : undefined}>
            {l}
          </span>
        ))}
      </div>
      {interactive ? (
        <div className="rc-footer">
          {lvl.next ? (
            <>
              +{lvl.toNext} pts to <span style={{ color: lvl.nextColor }}>{lvl.next}</span> · +8 marking done · +10 as taker · +2 per post
            </>
          ) : (
            "Max level reached"
          )}
        </div>
      ) : null}
    </div>
  );
}

function keyActivate(e, fn) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}
