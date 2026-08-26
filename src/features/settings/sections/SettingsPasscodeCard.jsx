import { useState } from "react";
import { KeyRound, LayoutTemplate, ShieldCheck } from "lucide-react";
import SetPasscodeModal from "../../../components/auth/SetPasscodeModal";
import PasscodeSetupPromptModal from "../../../components/auth/PasscodeSetupPromptModal";
import { profileHasEasyAccessPasscode } from "../../../lib/profile";
import { useToast } from "../../../components/toast/ToastProvider";

/**
 * @param {object} props
 * @param {object | null | undefined} props.profile
 * @param {boolean} props.isPending
 */
export default function SettingsPasscodeCard({ profile, isPending }) {
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [promptPreviewOpen, setPromptPreviewOpen] = useState(false);
  const { showToast } = useToast();

  const hasPasscode = profileHasEasyAccessPasscode(profile);

  function handlePasscodeSaved() {
    showToast({
      title: hasPasscode ? "PIN updated" : "PIN saved",
      body: "Use the PIN tab on the Sign in page next time.",
    });
  }

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
        Easy access
      </div>
      <div className="settings-passcode-card">
        <div className="settings-passcode-card__header">
          <div
            className={`settings-passcode-card__icon${hasPasscode ? " settings-passcode-card__icon--on" : " settings-passcode-card__icon--off"}`}
          >
            <KeyRound size={20} color={hasPasscode ? "var(--green-d)" : "var(--fg3)"} aria-hidden />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="settings-passcode-card__title-row">
              <span className="settings-passcode-card__title">PIN sign-in</span>
              <span
                className={`settings-passcode-card__badge${hasPasscode ? " settings-passcode-card__badge--on" : " settings-passcode-card__badge--off"}`}
              >
                {isPending ? "…" : hasPasscode ? "Active" : "Not set"}
              </span>
            </div>
            <p className="settings-passcode-card__desc">
              {hasPasscode
                ? "Your 6-digit PIN is ready. On sign-in, choose PIN — no inbox check needed."
                : "Create a private 6-digit PIN for faster sign-in on the PIN tab."}
            </p>
          </div>
        </div>

        {hasPasscode ? (
          <div className="settings-passcode-card__masked" aria-label="PIN saved, hidden">
            <span className="settings-passcode-card__dots" aria-hidden>
              ••••••
            </span>
          </div>
        ) : null}

        <div className="settings-passcode-card__actions">
          <button
            type="button"
            className="btn bp bfull settings-passcode-card__btn"
            disabled={isPending}
            onClick={() => setSetModalOpen(true)}
          >
            {hasPasscode ? "Change PIN" : "Set up PIN"}
          </button>
          <button
            type="button"
            className="btn bo bfull settings-passcode-card__btn settings-passcode-card__btn--secondary"
            disabled={isPending}
            onClick={() => setPromptPreviewOpen(true)}
          >
            <LayoutTemplate size={14} aria-hidden />
            Preview setup prompt
          </button>
        </div>

        <div className="settings-passcode-card__note">
          <ShieldCheck size={15} color="var(--fg3)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
          <p>
            Opens a popup to set or change your code. Enter exactly <strong>6 digits</strong> — magic link always works
            if you forget it.
          </p>
        </div>
      </div>

      {setModalOpen ? (
        <SetPasscodeModal
          isChange={hasPasscode}
          onClose={() => setSetModalOpen(false)}
          onSuccess={handlePasscodeSaved}
        />
      ) : null}

      {promptPreviewOpen ? (
        <PasscodeSetupPromptModal
          onClose={() => setPromptPreviewOpen(false)}
          onSetPasscode={() => {
            setPromptPreviewOpen(false);
            setSetModalOpen(true);
          }}
          onAskLater={() => setPromptPreviewOpen(false)}
          onDontAskAgain={() => {
            setPromptPreviewOpen(false);
            showToast({ title: "Preview only", body: "On your profile, this would hide the prompt permanently." });
          }}
        />
      ) : null}
    </>
  );
}
