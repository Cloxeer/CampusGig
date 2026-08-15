const TRIVIAL_PASSCODES = new Set([
  "000000",
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "123456",
  "654321",
  "012345",
  "543210",
  "121212",
  "101010",
]);

/**
 * @param {string} pin
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePasscode(pin) {
  const trimmed = String(pin ?? "").trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, message: "Passcode must be exactly 6 digits." };
  }

  if (TRIVIAL_PASSCODES.has(trimmed)) {
    return { valid: false, message: "Choose a less obvious passcode." };
  }

  return { valid: true };
}
