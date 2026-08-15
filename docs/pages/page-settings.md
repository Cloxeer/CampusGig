# Settings

**Route:** `/settings`

================================================================================

WHAT IT IS

  Account settings: display name, easy access passcode, email alert prefs,
  toast position, legal links, and the danger zone (account deletion).

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Reached from the profile settings menu.

================================================================================

HOW IT MUST BEHAVE

- Passcode card reflects whether a passcode is set (systems/auth.md).
- Account deletion schedules a grace-period deletion; a fresh sign-in cancels it.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  pages/Settings.jsx → features/settings/SettingsScreen.jsx + sections/*.
  Hooks in features/settings/hooks/* (name editor, alert toggle, device prefs).
  Passcode set/change via SettingsPasscodeCard + SetPasscodeModal.

================================================================================

GAPS TO WATCH

- Deletion schedule copy must match the real grace window in deletionSchedule.js.
