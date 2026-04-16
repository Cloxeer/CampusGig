import { Smartphone, ChevronRight } from "lucide-react";

export default function SettingsEditContactsNavRow({ onNavigateEditContacts }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={onNavigateEditContacts}
      style={{
        width: "100%",
        justifyContent: "space-between",
        padding: "14px 14px",
        border: "1px solid var(--bd)",
        borderRadius: "var(--r)",
        background: "var(--bg)",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--fg)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Smartphone size={18} color="var(--fg3)" />
        Edit contacts &amp; payment methods
      </span>
      <ChevronRight size={18} color="var(--fg4)" />
    </button>
  );
}
