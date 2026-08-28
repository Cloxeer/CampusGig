/**
 * Alerts-bell overlays. Same component in bottom nav and desktop sidebar:
 * red unread pip, plus a green live pip (same box) when a gig is in progress.
 */
export default function NavAlertDot({ show, live, children }) {
  return (
    <span className="nav-alert-icon">
      {children}
      {live ? (
        <span className="nav-alert-dot nav-alert-dot--live" data-testid="nav-alert-live" aria-hidden />
      ) : null}
      {show ? <span className="nav-alert-dot" data-testid="nav-alert-dot" aria-hidden /> : null}
    </span>
  );
}
