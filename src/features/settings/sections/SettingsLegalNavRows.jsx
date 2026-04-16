import { Info, Shield, ChevronRight } from "lucide-react";

export default function SettingsLegalNavRows({ onTerms, onPrivacy }) {
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
        Legal
      </div>
      <button
        type="button"
        className="btn"
        onClick={onTerms}
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "12px 14px",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r)",
          background: "var(--bg)",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Info size={17} color="var(--fg3)" />
          Terms of service
        </span>
        <ChevronRight size={18} color="var(--fg4)" />
      </button>
      <button
        type="button"
        className="btn"
        onClick={onPrivacy}
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "12px 14px",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r)",
          background: "var(--bg)",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={17} color="var(--fg3)" />
          Privacy policy
        </span>
        <ChevronRight size={18} color="var(--fg4)" />
      </button>
    </>
  );
}
