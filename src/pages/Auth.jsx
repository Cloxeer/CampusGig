import { useState } from "react";
import { ArrowLeft, Mail, Shield, Eye, EyeOff, Loader } from "lucide-react";
import { signUp, login, sendMagicLink, isEduEmail } from "../lib/auth";

export default function Auth({ setScreen, initialMode = "signup" }) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (authMode === "signup") {
        if (!firstName.trim() || !lastName.trim()) {
          setError("First and last name are required.");
          setLoading(false);
          return;
        }
        if (!isEduEmail(email)) {
          setError("Only .edu email addresses are allowed. Please use your university email.");
          setLoading(false);
          return;
        }
        const { error: signUpError } = await signUp({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        // After sign-up, redirect to onboarding to collect phone + optional info
        setScreen("onboarding");
      } else {
        // Login
        if (!isEduEmail(email)) {
          setError("Only .edu email addresses are allowed.");
          setLoading(false);
          return;
        }
        const { error: loginError } = await login({ email, password });
        if (loginError) {
          setError(loginError.message);
          setLoading(false);
          return;
        }
        // Auth state listener in App.jsx will move to "home"
        setScreen("home");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError("");
    if (!isEduEmail(email)) {
      setError("Only .edu email addresses are allowed.");
      return;
    }
    setLoading(true);
    const { error: mlError } = await sendMagicLink(email);
    setLoading(false);
    if (mlError) {
      setError(mlError.message);
      return;
    }
    setScreen("magic");
  };

  return (
    <div className="page fadein">
      <div style={{ padding: "52px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <button
          className="btn bg-btn"
          style={{ padding: 0, gap: 4, marginBottom: 20 }}
          onClick={() => setScreen("splash")}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 2 }}>
          {authMode === "signup" ? "Create account" : "Welcome back"}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          {authMode === "signup"
            ? "Sign up with your .edu email and a password."
            : "Sign in with your .edu email."}
        </div>
      </div>

      <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
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
              placeholder="you@university.edu"
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
              <strong>.edu required.</strong>{" "}
              {authMode === "signup"
                ? "Only verified students can join CampusGig."
                : "Enter the .edu email you signed up with."}
            </span>
          </div>
        </div>

        <div className="field">
          <label className="lbl">Password</label>
          <div className="ig">
            <input
              className="ii"
              placeholder={authMode === "signup" ? "Min 6 characters" : "Your password"}
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg3)",
                display: "flex",
                padding: "0 10px",
              }}
              onClick={() => setShowPw(!showPw)}
              type="button"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

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
          className="btn bp bfull blg"
          onClick={handleSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <Loader size={16} className="spin" />
          ) : authMode === "signup" ? (
            "Create account →"
          ) : (
            "Sign in"
          )}
        </button>

        {authMode === "login" && (
          <>
            <div className="or-row">or</div>
            <button
              className="btn bo bfull"
              onClick={handleMagicLink}
              disabled={loading}
            >
              Send magic link instead
            </button>
          </>
        )}

        <div className="or-row">or</div>

        <button
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
            setAuthMode(authMode === "signup" ? "login" : "signup");
            setError("");
          }}
        >
          {authMode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
        </button>
      </div>
    </div>
  );
}
