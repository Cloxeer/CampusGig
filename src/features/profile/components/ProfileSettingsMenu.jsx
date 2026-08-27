import { Settings, Pencil, LogOut, Loader, HelpCircle, Shield, FileText, BookOpen, Bug } from "lucide-react";

const MENU_ITEM_STYLE = {
  width: "100%",
  justifyContent: "flex-start",
  gap: 8,
  padding: "8px 10px",
  fontSize: 13,
  fontWeight: 500,
  border: "none",
  background: "transparent",
};

function MenuSection({ title, children }) {
  return (
    <>
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
        {title}
      </div>
      {children}
    </>
  );
}

function MenuRow({ icon: Icon, children, ...rest }) {
  return (
    <button type="button" role="menuitem" className="btn" style={MENU_ITEM_STYLE} {...rest}>
      <Icon size={15} />
      {children}
    </button>
  );
}

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
  onOpenBugReport,
  onOpenSupportReport,
}) {
  function closeThen(fn) {
    setProfileMenuOpen(false);
    fn();
  }

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
            maxWidth: "min(100vw - 32px, 280px)",
            padding: 6,
            borderRadius: "var(--r)",
            border: "1px solid var(--bd)",
            background: "var(--bg)",
            boxShadow:
              "0 0 0 0.5px rgba(0, 0, 0, 0.04), 0 8px 28px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05)",
          }}
          onAnimationEnd={handleProfileMenuAnimationEnd}
        >
          <MenuRow icon={Settings} onClick={() => closeThen(() => navigate("/settings"))}>
            Settings
          </MenuRow>
          <MenuRow
            icon={Pencil}
            onClick={() => closeThen(() => navigate("/profile/edit?tab=profile", { state: { returnTo: "/profile" } }))}
          >
            Edit profile
          </MenuRow>
          <MenuRow
            icon={BookOpen}
            onClick={() => closeThen(() => navigate("/app-intro", { state: { returnTo: "/profile" } }))}
          >
            View onboarding tutorial
          </MenuRow>

          <MenuSection title="Help & support">
            <MenuRow
              icon={HelpCircle}
              onClick={() => closeThen(() => {
                if (onOpenSupportReport) onOpenSupportReport();
              })}
            >
              Help & support
            </MenuRow>
            {onOpenBugReport && (
              <MenuRow
                icon={Bug}
                onClick={() => closeThen(() => onOpenBugReport())}
              >
                Report a bug
              </MenuRow>
            )}
          </MenuSection>

          <MenuSection title="Legal">
            <MenuRow icon={FileText} onClick={() => closeThen(() => navigate("/terms"))}>
              Terms of service
            </MenuRow>
            <MenuRow icon={Shield} onClick={() => closeThen(() => navigate("/privacy"))}>
              Privacy policy
            </MenuRow>
          </MenuSection>

          <div style={{ height: 1, background: "var(--bd)", margin: "4px 4px" }} />
          <button
            type="button"
            role="menuitem"
            className="btn"
            onClick={onLogout}
            disabled={loggingOut}
            style={{
              ...MENU_ITEM_STYLE,
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
