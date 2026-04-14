import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Shield, Loader } from "lucide-react";
import { sendMagicLink, isEduEmail } from "../lib/auth";

function modeFromParams(searchParams) {
  return searchParams.get("mode") === "signup" ? "signup" : "login";
}

function magicLinkErrorMessage(mlError, authMode) {
  const code = mlError?.code;
  const msg = (mlError?.message || "").toLowerCase();

  if (
    authMode === "login" &&
    (msg.includes("signups not allowed") || code === "otp_disabled")
  ) {
    return "No account for this email yet. Use Create account if you're new to GetCampusGig.";
  }

  return mlError?.message || "Something went wrong. Please try again.";
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authMode = modeFromParams(searchParams);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (authMode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("First and last name are required.");
        setLoading(false);
        return;
      }
      if (!agreedToTerms) {
        setError("You must agree to the Terms of Service and Privacy Policy to create an account.");
        setLoading(false);
        return;
      }
    }

    if (!isEduEmail(email)) {
      setError("Only @nmsu.edu email addresses are allowed. Please use your NMSU email.");
      setLoading(false);
      return;
    }

    const options =
      authMode === "signup"
        ? { firstName, lastName, shouldCreateUser: true }
        : { shouldCreateUser: false };

    const { error: mlError } = await sendMagicLink(email, options);

    setLoading(false);

    if (mlError) {
      setError(magicLinkErrorMessage(mlError, authMode));
      return;
    }
    
    navigate("/magic", { state: { email } });
  };

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <button
          className="btn bg-btn"
          style={{ padding: 0, gap: 4, marginBottom: 20 }}
          onClick={() => navigate("/welcome")}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 2 }}>
          {authMode === "signup" ? "Create account" : "Welcome back"}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          {authMode === "signup"
            ? "Sign up with your @nmsu.edu email. We'll send a magic link. Already joined? The link signs you in too."
            : "Sign in with your @nmsu.edu email. We'll send a magic link."}
        </div>
      </div>

      <form
        className="scroll"
        style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      >
        {authMode === "signup" && (
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">First name</label>
              <input
                className="inp"
                placeholder="First"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="lbl">Last name</label>
              <input
                className="inp"
                placeholder="Last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="field">
          <label className="lbl">School email</label>
          <div className="ig">
            <div className="iad">
              <Mail size={13} />
            </div>
            <input
              className="ii"
              placeholder="you@nmsu.edu"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="callout" style={{ marginTop: 4 }}>
            <div className="ci">
              <Shield size={13} />
            </div>
            <span className="ct">
              <strong>@nmsu.edu required.</strong>{" "}
              {authMode === "signup"
                ? "Only verified NMSU students can join GetCampusGig."
                : "Enter the @nmsu.edu email you signed up with."}
            </span>
          </div>
        </div>

        {authMode === "signup" && (
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                marginTop: 1,
                accentColor: "var(--ink)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "var(--fg3)", lineHeight: 1.55 }}>
              I agree to the{" "}
              <Link
                to="/terms"
                style={{ color: "var(--fg)", fontWeight: 600, textDecoration: "underline" }}
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                style={{ color: "var(--fg)", fontWeight: 600, textDecoration: "underline" }}
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--r)",
              padding: "10px 12px",
              fontSize: 13,
              color: "#dc2626",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn bp bfull blg"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <Loader size={16} className="spin" />
          ) : (
            "Send Magic Link"
          )}
        </button>

        <div className="or-row">or</div>

        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font)",
            fontSize: 13,
            color: "var(--fg3)",
            textAlign: "center",
            padding: "6px 0",
          }}
          onClick={() => {
            setError("");
            if (authMode === "signup") {
              setSearchParams({});
            } else {
              setSearchParams({ mode: "signup" });
            }
          }}
        >
          {authMode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
        </button>
      </form>
    </div>
  );
}
