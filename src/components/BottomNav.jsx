import { Home, Search, Plus, Bell, User } from "lucide-react";

export default function BottomNav({ screen, setScreen, unreadCount = 0 }) {
  return (
    <nav className="bnav">
      <button
        className={`ni ${screen === "home" ? "on" : ""}`}
        onClick={() => setScreen("home")}
      >
        <Home size={18} />
        <span className="nlbl">home</span>
      </button>

      <button
        className={`ni ${screen === "explore" ? "on" : ""}`}
        onClick={() => setScreen("explore")}
      >
        <Search size={18} />
        <span className="nlbl">explore</span>
      </button>

      <div className="npost-wrap">
        <button className="npost-btn" onClick={() => setScreen("post")}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      <button
        className={`ni ${screen === "alerts" ? "on" : ""}`}
        onClick={() => setScreen("alerts")}
        style={{ position: "relative" }}
      >
        <Bell size={18} />
        <span className="nlbl">alerts</span>
        {unreadCount > 0 && <div className="nb-dot" />}
      </button>

      <button
        className={`ni ${screen === "profile" ? "on" : ""}`}
        onClick={() => setScreen("profile")}
      >
        <User size={18} />
        <span className="nlbl">profile</span>
      </button>
    </nav>
  );
}
