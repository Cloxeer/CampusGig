import { KeyRound, Sparkles, ShieldCheck, X } from "lucide-react";

/**
 * Profile-gated prompt to set up easy access passcode.
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {() => void} props.onSetPasscode
 * @param {() => void} props.onAskLater
 * @param {() => void} props.onDontAskAgain
 */
export default function PasscodeSetupPromptModal({
  onClose,
  onSetPasscode,
  onAskLater,
  onDontAskAgain,
}) {
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-center-root" onClick={handleBackdrop} role="presentation">
      <div className="modal-center-backdrop" aria-hidden />
      <div
        className="modal-center-card modal-center-card--passcode-prompt"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passcode-prompt-title"
      >
        <button type="button" className="modal-center-close modal-center-close--float" onClick={onClose} aria-label="Close">
          <X size={13} />
        </button>

        <div className="passcode-modal-hero passcode-modal-hero--prompt">
          <div className="passcode-modal-hero__icon passcode-modal-hero__icon--prompt">
            <Sparkles size={22} strokeWidth={2} aria-hidden />
          </div>
          <h2 id="passcode-prompt-title" className="passcode-modal-hero__title">
            Set up easy access?
          </h2>
          <p className="passcode-modal-hero__subtitle">
            Add a <strong>6-digit passcode</strong> so next time you sign in with just your email and code — no
            inbox check.
          </p>
        </div>

        <div className="modal-center-body passcode-modal-body passcode-modal-body--prompt">
          <div className="passcode-prompt-benefits">
            <div className="passcode-prompt-benefit">
              <span className="passcode-prompt-benefit__num">1</span>
              <span>Open Sign in → choose <strong>Passcode</strong></span>
            </div>
            <div className="passcode-prompt-benefit">
              <span className="passcode-prompt-benefit__num">2</span>
              <span>Enter email + your 6 digits</span>
            </div>
            <div className="passcode-prompt-benefit">
              <span className="passcode-prompt-benefit__num">3</span>
              <span>You&apos;re in — magic link still works anytime</span>
            </div>
          </div>

          <p
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              margin: "14px 0 0",
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--fg3)",
            }}
          >
            <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
            <span>
              Keep it private — <strong>never share your passcode</strong> with anyone. The email
              magic link is the most secure way in, and it always works.
            </span>
          </p>
        </div>

        <div className="modal-center-ft passcode-modal-ft">
          <button type="button" className="btn bp bfull passcode-modal-ft__primary" onClick={onSetPasscode}>
            <KeyRound size={15} aria-hidden />
            Set passcode
          </button>
          <button type="button" className="btn bo bfull passcode-modal-ft__secondary" onClick={onAskLater}>
            Ask me later
          </button>
          <button type="button" className="passcode-modal-ft__text" onClick={onDontAskAgain}>
            Don&apos;t ask again
          </button>
        </div>
      </div>
    </div>
  );
}
