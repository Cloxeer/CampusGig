import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { BrandLockup } from "./Logo";
import NavAlertDot from "./NavAlertDot";

export default function DesktopSidebar({ unreadCount = 0, hasActiveGig = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function Item({ to, icon: Icon, label, dot, live, active }) {
    const on = typeof active === "boolean" ? active : pathname === to;
    return (
      <div className="dsi-wrap">
        <button
          type="button"
          className={`dsi ${on ? "on" : ""}`}
          onClick={() => navigate(to)}
          aria-current={on ? "page" : undefined}
        >
          <NavAlertDot show={!!dot} live={!!live}>
            <Icon size={18} strokeWidth={2} />
          </NavAlertDot>
          <span className="dsi-lbl">{label}</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="desktop-sidebar" aria-label="Primary">
      <div className="dsk-brand">
        <BrandLockup markSize={28} logoSize={13} />
      </div>
      <nav className="dsk-nav" aria-label="Main navigation">
        <Item to="/" icon={Home} label="Home" />
        <Item to="/explore" icon={Search} label="Explore" />
        <Item to="/alerts" icon={Bell} label="Alerts" dot={unreadCount > 0} live={hasActiveGig} />
        <Item to="/profile" icon={User} label="Profile" active={pathname === "/profile" || pathname === "/profile/rep"} />
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
