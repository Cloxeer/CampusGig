import { Bell, BellRing, Mail } from "lucide-react";
import SettingsRowToggle from "../../../components/SettingsRowToggle";

export default function SettingsAlertsCard({
  notifyGigUpdates,
  setNotifyGigUpdates,
  notifyAlerts,
  setNotifyAlerts,
  emailAlerts,
  onEmailAlertsChange,
  emailAlertsSaving,
}) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--fg3)",
          fontFamily: "var(--mono)",
          padding: "16px 0 6px",
        }}
      >
        Alerts
      </div>
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r)",
          padding: "0 14px",
        }}
      >
        <SettingsRowToggle
          icon={Bell}
          label="Gig activity"
          hint="In-app updates about gigs you’re in—requests, acceptances, declines, completions. This browser only; does not change your email."
          checked={notifyGigUpdates}
          onChange={setNotifyGigUpdates}
        />
        <SettingsRowToggle
          icon={BellRing}
          label="Alert banners"
          hint="Show a toast banner when there’s something new in the Alerts tab. Uses the corner you pick under Toast position. This device only."
          checked={notifyAlerts}
          onChange={setNotifyAlerts}
        />
        <SettingsRowToggle
          icon={Mail}
          label="Email to your @nmsu.edu"
          hint="Transactional email for important gig and review notices (not marketing)."
          checked={emailAlerts}
          onChange={onEmailAlertsChange}
          isLast
        />
      </div>
      {emailAlertsSaving ? (
        <p style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", lineHeight: 1.45, margin: "0 0 0 0" }}>
          Saving email preference…
        </p>
      ) : (
        <p style={{ fontSize: 11, color: "var(--fg4)", fontFamily: "var(--mono)", lineHeight: 1.45, margin: 0 }}>
          Gig activity and alert banners are stored on this device. Email follows your account and @nmsu.edu inbox.
        </p>
      )}
    </>
  );
}
