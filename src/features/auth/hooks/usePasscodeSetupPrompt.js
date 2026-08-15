import { useEffect, useState } from "react";
import { deferPasscodePrompt, isPasscodePromptDeferred } from "../passcodePromptStorage";
import { updateMyProfile, profileHasEasyAccessPasscode } from "../../../lib/profile";
import { queryClient, queryKeys } from "../../../lib/queryClient";

/**
 * Manages profile-gated easy access passcode setup prompt.
 * @param {object} options
 * @param {boolean} options.enabled - Own profile, loaded, no passcode set
 * @param {object | null | undefined} options.profile
 */
export function usePasscodeSetupPrompt({ enabled, profile }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [setPasscodeOpen, setSetPasscodeOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const shouldOffer =
    enabled &&
    profile &&
    !profileHasEasyAccessPasscode(profile) &&
    !profile.easy_access_passcode_prompt_dismissed_at &&
    !isPasscodePromptDeferred();

  useEffect(() => {
    if (shouldOffer) {
      setPromptOpen(true);
    }
  }, [shouldOffer]);

  function closePrompt() {
    setPromptOpen(false);
  }

  function openSetPasscode() {
    setPromptOpen(false);
    setSetPasscodeOpen(true);
  }

  function closeSetPasscode() {
    setSetPasscodeOpen(false);
  }

  function handleAskLater() {
    deferPasscodePrompt();
    closePrompt();
  }

  async function handleDontAskAgain() {
    setDismissing(true);
    const { error } = await updateMyProfile({
      easy_access_passcode_prompt_dismissed_at: new Date().toISOString(),
    });
    setDismissing(false);

    if (!error) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
    }

    closePrompt();
  }

  function handlePasscodeSaved() {
    setSetPasscodeOpen(false);
    setPromptOpen(false);
  }

  return {
    promptOpen,
    setPasscodeOpen,
    dismissing,
    closePrompt,
    openSetPasscode,
    closeSetPasscode,
    handleAskLater,
    handleDontAskAgain,
    handlePasscodeSaved,
  };
}
