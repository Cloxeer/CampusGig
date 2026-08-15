# App Intro

**Route:** `/app-intro`

================================================================================

WHAT IT IS

  One-time introduction shown after onboarding, before the main app unlocks.
  Gated by `app_intro_completed_at` on the user profile.

================================================================================

WHO MAY OPEN IT

  Logged in + has profile + intro not yet completed. While `needsAppIntro`
  is true (App.jsx), every other route redirects here.

================================================================================

HOW IT MUST BEHAVE

- Completing the intro sets `app_intro_completed_at` and unlocks the app shell.
- Terms / Privacy remain reachable from here.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  pages/AppIntro.jsx, gated by the `needsAppIntro` branch in App.jsx.

================================================================================

GAPS TO WATCH

- Only the intro, terms, and privacy routes exist while gated.
