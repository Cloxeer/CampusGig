/**
 * Red badge on the alerts bell. Same component in bottom nav and desktop sidebar.
 */
export default function NavAlertDot({ show, children }) {
  return (
    <span className="nav-alert-icon">
      {children}
      {show ? <span className="nav-alert-dot" data-testid="nav-alert-dot" aria-hidden /> : null}
    </span>
  );
}
