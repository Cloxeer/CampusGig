import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import PasscodeInput from "./PasscodeInput";
import { setPasscode, validatePasscode } from "../../lib/auth";
import { persistEasyAccessPasscode } from "../../lib/profile";
import { queryClient, queryKeys } from "../../lib/queryClient";

export const PASSCODE_SETUP_FORM_ID = "passcode-setup-form";

/**
 * Shared 6-digit passcode create/change form.
 * @param {object} props
 * @param {boolean} [props.isChange]
 * @param {() => void} [props.onSuccess]
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.showActions]
 * @param {string} [props.submitLabel]
 * @param {(loading: boolean) => void} [props.onLoadingChange]
 * @param {(canSubmit: boolean) => void} [props.onCanSubmitChange]
 */
export default function PasscodeSetupForm({
  isChange = false,
  onSuccess,
  onCancel,
  showActions = true,
  submitLabel,
  onLoadingChange,
  onCanSubmitChange,
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = pin.length === 6 && confirmPin.length === 6 && !loading;
  const label = submitLabel ?? (isChange ? "Save new passcode" : "Save passcode");

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onCanSubmitChange?.(canSubmit);
  }, [canSubmit, onCanSubmitChange]);

  async function handleSave(e) {
    e?.preventDefault?.();
    setError("");

    const validation = validatePasscode(pin);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (pin !== confirmPin) {
      setError("Passcodes don't match. Enter the same 6 digits in both fields.");
      return;
    }

    setLoading(true);

    const { error: authErr } = await setPasscode(pin);
    if (authErr) {
      setLoading(false);
      setError(authErr.message);
      return;
    }

    const { error: persistErr } = await persistEasyAccessPasscode(pin);
    setLoading(false);

    if (persistErr) {
      setError(persistErr.message || "Passcode saved for sign-in, but profile sync failed. Try again.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    setPin("");
    setConfirmPin("");
    onSuccess?.();
  }

  return (
    <form id={PASSCODE_SETUP_FORM_ID} className="passcode-setup-form" onSubmit={handleSave}>
      <div className="field">
        <label className="lbl">
          {isChange ? "New 6-digit passcode" : "Choose 6-digit passcode"}
        </label>
        <PasscodeInput
          value={pin}
          onChange={setPin}
          disabled={loading}
          label="New 6-digit passcode"
        />
      </div>
      <div className="field">
        <label className="lbl">Confirm passcode</label>
        <PasscodeInput
          value={confirmPin}
          onChange={setConfirmPin}
          disabled={loading}
          label="Confirm 6-digit passcode"
        />
      </div>

      {error ? (
        <div className="passcode-setup-form__error" role="alert">
          {error}
        </div>
      ) : null}

      {showActions ? (
        <div className="passcode-setup-form__actions">
          <button type="submit" className="btn bp bfull" disabled={!canSubmit}>
            {loading ? <Loader size={16} className="spin" /> : label}
          </button>
          {onCancel ? (
            <button type="button" className="btn bo bfull" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
