import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Shield, Loader, GraduationCap, Briefcase, ChevronRight } from "lucide-react";
import { sendMagicLink, signInWithPasscode, isEduEmail } from "../lib/auth";
import AuthSignInMethodToggle from "../components/auth/AuthSignInMethodToggle";
import PasscodeInput from "../components/auth/PasscodeInput";

function modeFromParams(searchParams) {
  return searchParams.get("mode") === "signup" ? "signup" : "login";
}

/* Account type lives in the URL (?type=student|client), not React state, so
   leaving the page (e.g. tapping Terms) and coming back keeps you on the same
   step instead of dumping you back on the account-type picker. */
function accountTypeFromParams(searchParams) {
  const t = searchParams.get("type");
  return t === "student" || t === "client" ? t : null;
}

/* Remember the sign-in method WITHIN a session so leaving + returning to
   "Welcome back" reopens on whatever you last used (e.g. passcode). Uses
   sessionStorage on purpose: a brand-new visit still defaults to magic link —
   we only remember your choice while you're moving around this session. */
const SIGNIN_METHOD_KEY = "cg_signin_method";

function loadSignInMethod() {
  try {
    return sessionStorage.getItem(SIGNIN_METHOD_KEY) === "passcode" ? "passcode" : "magic";
  } catch {
    return "magic";
  }
}

function saveSignInMethod(method) {
  try {
    sessionStorage.setItem(SIGNIN_METHOD_KEY, method);
  } catch {
    /* private mode / storage disabled — fall back to the magic-link default */
  }
}

/* Optional "How did you hear about us?" — value is a stable code we store; the
   label is what the user sees. Keep the list short and unambiguous. */
const REFERRAL_OPTIONS = [
  { value: "search_engine", label: "Search engine (Google, etc.)" },
  { value: "poster", label: "Poster on campus" },
  { value: "friend", label: "Recommended by a friend" },
  { value: "hackathon", label: "Hackathon or event" },
  { value: "social_media", label: "Social media" },
  { value: "other", label: "Other" },
];

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

/** Step 1 of signup: pick the account type. Clean, tappable cards. */
function AccountTypePicker({ onPick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button type="button" className="auth-choice" onClick={() => onPick("student")}>
        <span className="auth-choice__icon auth-choice__icon--student">
          <GraduationCap size={22} strokeWidth={2} />
        </span>
        <span className="auth-choice__body">
          <span className="auth-choice__title" style={{ display: "block" }}>
            NMSU student
          </span>
          <span className="auth-choice__desc" style={{ display: "block" }}>
            Verify with your @nmsu.edu email. Take on gigs, post your own, earn rep.
          </span>
        </span>
        <ChevronRight size={18} className="auth-choice__chev" />
      </button>

      <button type="button" className="auth-choice" onClick={() => onPick("client")}>
        <span className="auth-choice__icon">
          <Briefcase size={20} strokeWidth={2} />
        </span>
        <span className="auth-choice__body">
          <span className="auth-choice__title" style={{ display: "block" }}>
            I&apos;m hiring
          </span>
          <span className="auth-choice__desc" style={{ display: "block" }}>
            Post tasks for verified NMSU students to get done. Any email works.
          </span>
        </span>
        <ChevronRight size={18} className="auth-choice__chev" />
      </button>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authMode = modeFromParams(searchParams);
  const accountType = accountTypeFromParams(searchParams); // signup: null → picker
  const [signInMethod, setSignInMethod] = useState(loadSignInMethod);

  /* Pick / clear the account type by writing it to the URL (preserving mode). */
  function setAccountType(type) {
    const next = { mode: "signup" };
    if (type) next.type = type;
    setSearchParams(next);
  }

  /* Persist every method switch so it survives leaving + re-entering the page. */
  function chooseSignInMethod(method) {
    setSignInMethod(method);
    saveSignInMethod(method);
  }
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignupPicker = authMode === "signup" && accountType === null;
  const isStudentSignup = authMode === "signup" && accountType === "student";
  const isClientSignup = authMode === "signup" && accountType === "client";
  const isLoginPasscode = authMode === "login" && signInMethod === "passcode";

  function validateSignupBasics() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return false;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy to create an account.");
      return false;
    }
    return true;
  }

  const handleStudentMagicSubmit = async () => {
    setError("");
    setLoading(true);

    if (authMode === "signup" && !validateSignupBasics()) {
      setLoading(false);
      return;
    }

    if (authMode === "signup" && !isEduEmail(email)) {
      setError(
        "Only NMSU Main Campus (Las Cruces) addresses ending in @nmsu.edu are allowed — not extension campus emails like @dacc.nmsu.edu or @global.nmsu.edu."
      );
      setLoading(false);
      return;
    }

    const options =
      authMode === "signup"
        ? { firstName, lastName, shouldCreateUser: true, referralSource: referralSource || undefined }
        : { shouldCreateUser: false, allowAnyEmail: true };

    const { error: mlError } = await sendMagicLink(email, options);

    setLoading(false);

    if (mlError) {
      setError(magicLinkErrorMessage(mlError, authMode));
      return;
    }

    navigate("/magic", { state: { email } });
  };

  const handleClientSignupSubmit = async () => {
    setError("");
    setLoading(true);

    if (!validateSignupBasics()) {
      setLoading(false);
      return;
    }

    if (isEduEmail(email)) {
      setError('That\'s an NMSU student email — go back and choose "NMSU student" so you sign up verified.');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await sendMagicLink(email, {
      firstName,
      lastName,
      shouldCreateUser: true,
      allowAnyEmail: true,
      referralSource: referralSource || undefined,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    navigate("/magic", { state: { email } });
  };

  const handleLoginPasscodeSubmit = async () => {
    setError("");
    setLoading(true);

    if (passcode.length !== 6) {
      setError("Enter your 6-digit PIN.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await signInWithPasscode(email, passcode);
    setLoading(false);
    if (signInError) setError(signInError.message);
    // Session is picked up by App.jsx onAuthStateChange — no redirect needed.
  };

  const handleSubmit = () => {
    if (isClientSignup) {
      handleClientSignupSubmit();
    } else if (isLoginPasscode) {
      handleLoginPasscodeSubmit();
    } else {
      handleStudentMagicSubmit();
    }
  };

  const title = authMode === "signup" ? "Create account" : "Welcome back";
  const subtitle = isSignupPicker
    ? "Two ways to join — pick yours."
    : isStudentSignup
      ? "Sign up with your Main Campus @nmsu.edu email. We'll send a magic link. Already joined? The link signs you in too."
      : isClientSignup
        ? "Post work for verified NMSU students. Use any email — we'll send you a sign-in link."
        : signInMethod === "passcode"
          ? "Sign in with your email and 6-digit PIN — no inbox check needed."
          : "Enter the email you joined with. We'll send a sign-in link.";

  return (
    <div className="page fadein">
      <div style={{ padding: "16px 20px 18px", borderBottom: "1px solid var(--bd)" }}>
        <button
          className="btn bg-btn"
          style={{ padding: 0, gap: 4, marginBottom: 20 }}
          onClick={() => {
            if (authMode === "signup" && accountType !== null) {
              setAccountType(null);
              setError("");
            } else {
              navigate("/welcome");
            }
          }}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.035em", marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>{subtitle}</div>
      </div>

      {isSignupPicker ? (
        <div className="scroll" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <AccountTypePicker
            onPick={(type) => {
              setAccountType(type);
              setError("");
            }}
          />
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
              setSearchParams({});
            }}
          >
            Already have an account? Sign in
          </button>
        </div>
      ) : (
        <form
          className="scroll"
          style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {authMode === "login" && (
            <AuthSignInMethodToggle
              method={signInMethod}
              onChange={(method) => {
                chooseSignInMethod(method);
                setError("");
              }}
            />
          )}

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
            <label className="lbl">{isStudentSignup ? "School email" : "Email"}</label>
            <div className="ig">
              <div className="iad">
                <Mail size={13} />
              </div>
              <input
                className="ii"
                placeholder={isStudentSignup ? "you@nmsu.edu" : isClientSignup ? "you@example.com" : "you@nmsu.edu or your email"}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {isStudentSignup && (
              <div className="callout" style={{ marginTop: 4 }}>
                <div className="ci">
                  <Shield size={13} />
                </div>
                <span className="ct">
                  <strong>Main Campus @nmsu.edu only (Las Cruces).</strong>{" "}
                  Login must be exactly <strong>@nmsu.edu</strong> — not{" "}
                  <strong>@dacc.nmsu.edu</strong>, <strong>@alamogordo.nmsu.edu</strong>,{" "}
                  <strong>@grants.nmsu.edu</strong>, <strong>@global.nmsu.edu</strong>, or other NMSU
                  extension domains. Off-campus and branch-campus emails cannot be used.
                </span>
              </div>
            )}
            {isClientSignup && (
              <div className="callout" style={{ marginTop: 4 }}>
                <div className="ci">
                  <Shield size={13} />
                </div>
                <span className="ct">
                  <strong>Hiring account.</strong> You can post gigs for verified students — client
                  accounts can&apos;t take on gigs. NMSU students should use the student option
                  instead so they get verified.
                </span>
              </div>
            )}
          </div>

          {isLoginPasscode && (
            <div className="field">
              <label className="lbl">6-digit PIN</label>
              <PasscodeInput
                value={passcode}
                onChange={setPasscode}
                disabled={loading}
                label="6-digit PIN for sign in"
              />
              <div className="hint" style={{ marginTop: 6, textAlign: "center" }}>
                Set yours in Settings after joining. Forgot it?{" "}
                <button
                  type="button"
                  className="auth-inline-link"
                  onClick={() => {
                    chooseSignInMethod("magic");
                    setPasscode("");
                    setError("");
                  }}
                >
                  Use a magic link
                </button>
              </div>
            </div>
          )}

          {authMode === "signup" && (
            <div className="field">
              <label className="lbl">
                How did you hear about us?{" "}
                <span style={{ color: "var(--fg4)", fontSize: 11, fontWeight: 400 }}>— optional</span>
              </label>
              <select
                className="inp"
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                style={{ appearance: "auto", cursor: "pointer", color: referralSource ? "var(--fg)" : "var(--fg4)" }}
              >
                <option value="">Select one…</option>
                {REFERRAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ color: "var(--fg)" }}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            ) : isClientSignup ? (
              "Send sign-in link"
            ) : isLoginPasscode ? (
              "Sign in"
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
      )}
    </div>
  );
}
