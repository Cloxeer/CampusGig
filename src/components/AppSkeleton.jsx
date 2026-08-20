/**
 * THE first-paint skeleton for the Home feed. One shared component so the
 * loading state reserves the SAME layout the real page lands in — topbar (52px)
 * + rep card + tabs + gig grid — instead of a centered spinner that gets fully
 * replaced (which is the dominant Cumulative Layout Shift source).
 *
 * Rendered by:
 *   - App.jsx  while auth / profile resolve (see <AppLoading/>)
 *   - Home.jsx before its profile query settles (showFullSkeleton)
 *
 * It mirrors the real Home body spacing exactly (same margins/paddings) and
 * reuses the real rep-card structural classes (.rc-ey/.rc-row/.rc-track/
 * .rc-labels/.rc-footer) so the card's vertical rhythm matches the rendered
 * self-variant of <ProfileRepCard/> — including the footer line, which the old
 * inline skeleton omitted and which used to shove the whole gig list on swap.
 * Keep this in lockstep with Home's real render.
 */

import { FILTERABLE_CATEGORY_LABELS } from "../data/categories";

/* Same tab list as Home (shared catalog) so the skeleton doesn't flash the
   wrong tabs before the real feed lands. */
const TABS = ["All", ...FILTERABLE_CATEGORY_LABELS];
const TIER_LABELS = ["New", "Reliable", "Trusted", "Legend"];

export default function AppSkeleton() {
  return (
    <div className="page fadein">
      <div className="topbar">
        <div className="tlogo">
          <div className="skel" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <div className="skel" style={{ width: 90, height: 16 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="skel" style={{ width: 34, height: 34, borderRadius: "var(--r)" }} />
          <div className="skel skel-circle" style={{ width: 30, height: 30 }} />
        </div>
      </div>

      <div className="scroll scroll--nav-pad scroll--fine-scrollbar">
        <div style={{ margin: "14px 16px 0" }}>
          <div className="rep-card" style={{ marginBottom: 16 }}>
            <div className="rc-ey">
              <div className="skel-rep" style={{ width: 140, height: 10 }} />
            </div>
            <div className="rc-row">
              <div className="skel-rep" style={{ width: 84, height: 30, borderRadius: 5 }} />
              <div className="skel-rep" style={{ width: 60, height: 22, borderRadius: 5 }} />
            </div>
            <div className="rc-track" />
            <div className="rc-labels">
              {TIER_LABELS.map((l) => (
                <div key={l} className="skel-rep" style={{ width: 40, height: 9 }} />
              ))}
            </div>
            <div className="rc-footer">
              <div className="skel-rep" style={{ width: 180, height: 11 }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          <div className="tabs" style={{ margin: "14px -16px 0", padding: "0 16px", gap: 8 }}>
            {TABS.map((t) => (
              <div key={t} className="skel" style={{ width: 52, height: 28, borderRadius: 6, flexShrink: 0 }} />
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 10px" }}>
          <div className="skel" style={{ width: 80, height: 14, borderRadius: 4 }} />
        </div>

        <div className="gig-grid" style={{ padding: "0 16px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ width: "100%", height: 88, borderRadius: "var(--rlg)" }} />
          ))}
        </div>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
