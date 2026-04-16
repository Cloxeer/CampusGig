import { Settings, Pencil, LogOut, Loader, HelpCircle, Shield, FileText, BookOpen } from "lucide-react";

export default function ProfileSettingsMenu({
  navigate,
  onLogout,
  loggingOut,
  profileMenuRef,
  profileMenuOpen,
  setProfileMenuOpen,
  profileMenuShow,
  profileMenuLeave,
  handleProfileMenuAnimationEnd,
  toggleProfileMenu,
}) {
  return (
    <div ref={profileMenuRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn bg-btn bico"
        aria-label="Open profile menu"
        aria-expanded={profileMenuOpen}
        aria-haspopup="menu"
        onClick={toggleProfileMenu}
      >
        <Settings size={17} strokeWidth={2} />
      </button>
      {profileMenuShow && (
        <div
          role="menu"
          className={`profile-menu-dropdown${profileMenuLeave ? " profile-menu-dropdown--leave" : ""}`}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: 208,
            padding: 6,
            borderRadius: "var(--r)",
            border: "1px solid var(--bd)",
            background: "var(--bg)",
            boxShadow:
              "0 0 0 0.5px rgba(0, 0, 0, 0.04), 0 8px 28px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05)",
          }}
          onAnimationEnd={handleProfileMenuAnimationEnd}
        >
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/settings");
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            <Settings size={15} />
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/profile/edit", { state: { returnTo: "/profile" } });
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            <Pencil size={15} />
            Edit contacts
          </button>
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/app-intro", { state: { returnTo: "/profile" } });
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            <BookOpen size={15} />
            View onboarding tutorial
          </button>
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={() => {
              setProfileMenuOpen(false);
              window.location.href = "mailto:support@getcampusgig.com?subject=CampusGig%20help";
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            <HelpCircle size={15} />
            Help &amp; support
          </button>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--fg3)",
              fontFamily: "var(--mono)",
              padding: "6px 10px 4px",
            }}
          >
            Legal
          </div>
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/terms");
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            <FileText size={15} />
            Terms of service
          </button>
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={() => {
              setProfileMenuOpen(false);
              navigate("/privacy");
            }}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            <Shield size={15} />
            Privacy policy
          </button>
          <div style={{ height: 1, background: "var(--bd)", margin: "4px 4px" }} />
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={onLogout}
            disabled={loggingOut}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: 8,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              background: "#fef2f2",
              color: "#dc2626",
            }}
          >
            {loggingOut ? <Loader size={15} className="spin" /> : <LogOut size={15} />}
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
