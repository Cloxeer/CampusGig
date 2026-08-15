const DEFER_KEY = "cg_passcode_prompt_deferred";

export function isPasscodePromptDeferred() {
  try {
    return sessionStorage.getItem(DEFER_KEY) === "1";
  } catch {
    return false;
  }
}

export function deferPasscodePrompt() {
  try {
    sessionStorage.setItem(DEFER_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearPasscodePromptDefer() {
  try {
    sessionStorage.removeItem(DEFER_KEY);
  } catch {
    /* ignore */
  }
}
