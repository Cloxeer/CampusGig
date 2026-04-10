import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Plus, Bell, User } from "lucide-react";

export default function BottomNav({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bnav">
      <button
        className={`ni ${pathname === "/" ? "on" : ""}`}
        onClick={() => navigate("/")}
      >
        <Home size={18} />
        <span className="nlbl">home</span>
      </button>

      <button
        className={`ni ${pathname === "/explore" ? "on" : ""}`}
        onClick={() => navigate("/explore")}
      >
        <Search size={18} />
        <span className="nlbl">explore</span>
      </button>

      <div className="npost-wrap">
        <button className="npost-btn" onClick={() => navigate("/post")}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      <button
        className={`ni ${pathname === "/alerts" ? "on" : ""}`}
        onClick={() => navigate("/alerts")}
        style={{ position: "relative" }}
      >
        <Bell size={18} />
        <span className="nlbl">alerts</span>
        {unreadCount > 0 && <div className="nb-dot" />}
      </button>

      <button
        className={`ni ${pathname === "/profile" ? "on" : ""}`}
        onClick={() => navigate("/profile")}
      >
        <User size={18} />
        <span className="nlbl">profile</span>
      </button>
    </nav>
  );
}
