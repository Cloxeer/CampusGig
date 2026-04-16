export default function SettingsScreenHeader({ onBack }) {
  return (
    <div style={{ padding: "16px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
      <button
        type="button"
        className="btn bg-btn bico"
        onClick={onBack}
        aria-label="Back to profile"
        style={{ marginBottom: 10 }}
      >
        <span style={{ fontSize: 15 }}>←</span>
      </button>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 4 }}>
        Settings
      </div>
      <div style={{ fontSize: 13, color: "var(--fg3)" }}>
        Account, alerts, and how CampusGig behaves on this device.
      </div>
    </div>
  );
}
