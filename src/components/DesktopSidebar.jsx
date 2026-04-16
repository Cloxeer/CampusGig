import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { LogoMark } from "./Logo";

export default function DesktopSidebar({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function Item({ to, icon: Icon, label, dot }) {
    const on = pathname === to;
    return (
      <div className="dsi-wrap">
        <button
          type="button"
          className={`dsi ${on ? "on" : ""}`}
          onClick={() => navigate(to)}
          aria-current={on ? "page" : undefined}
        >
          <Icon size={18} strokeWidth={2} />
          <span className="dsi-lbl">{label}</span>
        </button>
        {dot ? <span className="dsi-dot" aria-hidden /> : null}
      </div>
    );
  }

  return (
    <aside className="desktop-sidebar" aria-label="Primary">
      <div className="dsk-brand">
        <LogoMark size={28} />
        <span className="dsk-brand-title">GetCampusGig</span>
      </div>
      <nav className="dsk-nav" aria-label="Main navigation">
        <Item to="/" icon={Home} label="Home" />
        <Item to="/explore" icon={Search} label="Explore" />
        <Item to="/alerts" icon={Bell} label="Alerts" dot={unreadCount > 0} />
        <Item to="/profile" icon={User} label="Profile" />
      </nav>
      <div className="dsk-post">
        <button type="button" className="dsk-post-btn" onClick={() => navigate("/post")}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
          Post a gig
        </button>
      </div>
    </aside>
  );
}
