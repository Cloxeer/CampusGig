import { APP_VERSION } from "../settingsConstants";

export default function SettingsVersionFooter() {
  return (
    <div
      style={{
        marginTop: 20,
        padding: "14px 0",
        textAlign: "center",
        fontSize: 11,
        color: "var(--fg4)",
        fontFamily: "var(--mono)",
      }}
    >
      GetCampusGig · v{APP_VERSION}
    </div>
  );
}
