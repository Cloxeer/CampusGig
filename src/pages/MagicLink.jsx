import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";

export default function MagicLink() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/auth", { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

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

      <div style={{ fontSize: 14, color: "var(--fg3)", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
        We sent a magic link to
        <br />
        <strong style={{ color: "var(--fg)" }}>{email}</strong>
        <br />
        Click it to sign in instantly — no password needed.
      </div>

      <div
        style={{
          fontSize: 13,
          color: "var(--fg3)",
          textAlign: "center",
          lineHeight: 1.55,
          marginBottom: 28,
          maxWidth: 300,
        }}
      >
        Don&apos;t see it within a few minutes? Check your <strong style={{ color: "var(--fg)" }}>spam</strong> or{" "}
        <strong style={{ color: "var(--fg)" }}>junk</strong> folder — magic links often land there.
      </div>

      <button
        className="btn bg-btn bfull"
        style={{ marginTop: 8 }}
        onClick={() => navigate("/auth?mode=login")}
      >
        Use a different email
      </button>
    </div>
  );
}
