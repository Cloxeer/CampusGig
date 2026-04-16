import { Link } from "react-router-dom";

export default function DesktopFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="shell-footer" role="contentinfo">
      <div className="shell-footer-inner">
        <span className="shell-footer-copy">© {year} GetCampusGig · NMSU students</span>
        <span className="shell-footer-links">
          <Link to="/terms">Terms</Link>
          <span className="shell-footer-sep" aria-hidden>
            ·
          </span>
          <Link to="/privacy">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
