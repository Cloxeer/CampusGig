import { useState } from "react";
import { KeyRound, Loader, ShieldCheck, X } from "lucide-react";
import PasscodeSetupForm, { PASSCODE_SETUP_FORM_ID } from "./PasscodeSetupForm";

/**
 * Modal for create/change passcode.
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {() => void} [props.onSuccess]
 * @param {boolean} [props.isChange]
 */
export default function SetPasscodeModal({ onClose, onSuccess, isChange = false }) {
  const [loading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-center-root" onClick={handleBackdrop} role="presentation">
      <div className="modal-center-backdrop" aria-hidden />
      <div
        className="modal-center-card modal-center-card--passcode"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-passcode-modal-title"
      >
        <button type="button" className="modal-center-close modal-center-close--float" onClick={onClose} aria-label="Close">
          <X size={13} />
        </button>

        <div className="passcode-modal-hero">
          <div className="passcode-modal-hero__icon">
            <KeyRound size={22} strokeWidth={2} aria-hidden />
          </div>
          <h2 id="set-passcode-modal-title" className="passcode-modal-hero__title">
            {isChange ? "Change your passcode" : "Set your passcode"}
          </h2>
          <p className="passcode-modal-hero__subtitle">
            Pick a private 6-digit code for faster sign-in. Magic link always works if you forget it.
          </p>
        </div>

        <div className="modal-center-body passcode-modal-body">
          <PasscodeSetupForm
            isChange={isChange}
            showActions={false}
            onLoadingChange={setLoading}
            onCanSubmitChange={setCanSubmit}
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
          />
        </div>

        <div className="modal-center-ft passcode-modal-ft">
          <button
            type="submit"
            form={PASSCODE_SETUP_FORM_ID}
            className="btn bp bfull passcode-modal-ft__primary"
            disabled={loading || !canSubmit}
          >
            {loading ? <Loader size={16} className="spin" /> : isChange ? "Update passcode" : "Save passcode"}
          </button>
          <button type="button" className="btn bo bfull passcode-modal-ft__secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <div className="passcode-modal-ft__note">
            <ShieldCheck size={13} aria-hidden />
            <span>Exactly 6 digits · never shown after saving</span>
          </div>
        </div>
      </div>
    </div>
  );
}
