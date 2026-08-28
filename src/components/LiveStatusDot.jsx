/**
 * Live / idle status pip — one brick for splash, gig-detail badges, and nav.
 * `live` breathes green; idle is a static gray pip.
 */
export default function LiveStatusDot({ live = true, className = "", ...rest }) {
  const cls = ["live-status-dot", live ? "live-status-dot--live" : null, className]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} aria-hidden {...rest} />;
}
