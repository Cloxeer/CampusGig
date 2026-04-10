import { Mail } from "lucide-react";

export default function MagicLink({ setScreen, email }) {
  return (
    <div
      className="page fadein"
      style={{ alignItems: "center", justifyContent: "center", padding: "0 32px", gap: 0 }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: "var(--green-bg)",
          border: "1px solid var(--green-bd)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Mail size={24} color="var(--green-d)" />
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.03em", marginBottom: 8, textAlign: "center" }}>
        Check your inbox
      </div>

      <div style={{ fontSize: 14, color: "var(--fg3)", textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>
        We sent a magic link to
        <br />
        <strong style={{ color: "var(--fg)" }}>{email || "your university email"}</strong>
        <br />
        Click it to sign in instantly — no password needed.
      </div>


      <button className="btn bg-btn bfull" style={{ marginTop: 8 }} onClick={() => setScreen("auth")}>
        Use a different email
      </button>
    </div>
  );
}
