/** @typedef {"magic" | "passcode"} AuthSignInMethod */

/**
 * Pill segmented control for sign-in method (magic link vs passcode).
 * @param {object} props
 * @param {AuthSignInMethod} props.method
 * @param {(method: AuthSignInMethod) => void} props.onChange
 */
export default function AuthSignInMethodToggle({ method, onChange }) {
  return (
    <div className="auth-seg" role="tablist" aria-label="Sign-in method">
      <div
        className="auth-seg-indicator"
        data-active={method}
        aria-hidden
      />
      <button
        type="button"
        role="tab"
        aria-selected={method === "magic"}
        className={`auth-seg-btn${method === "magic" ? " on" : ""}`}
        onClick={() => onChange("magic")}
      >
        Magic link
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={method === "passcode"}
        className={`auth-seg-btn${method === "passcode" ? " on" : ""}`}
        onClick={() => onChange("passcode")}
      >
        PIN
      </button>
    </div>
  );
}
