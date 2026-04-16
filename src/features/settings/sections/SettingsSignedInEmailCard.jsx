export default function SettingsSignedInEmailCard({ email, isPending }) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--fg3)",
          fontFamily: "var(--mono)",
          padding: "12px 0 6px",
        }}
      >
        Account
      </div>
      <div
        style={{
          background: "var(--bg3)",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r)",
          padding: "12px 14px",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--fg3)", fontFamily: "var(--mono)", marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", wordBreak: "break-all" }}>
          {isPending ? "…" : email || "—"}
        </div>
      </div>
    </>
  );
}
