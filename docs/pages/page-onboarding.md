# Onboarding

**Route:** `/onboarding`

================================================================================

WHAT IT IS

  First-time setup after Supabase says you exist but our `users` row might be new.
  Collect name (and whatever else the screen asks). Save profile. Then enter app.

================================================================================

WHO MAY OPEN IT

  Logged in AND profile missing or incomplete (App.jsx sets hasProfile false).
  Any other URL while in this mode → forced back to /onboarding.

================================================================================

TLA+ IN CAVEMAN

  vars: profile_saved  fields_valid

  INIT: profile_saved = false

  submit_profile:
    if invalid → stay + show error
    if ok → write profile → profile_saved = true → App sets hasProfile true → user goes /

  session_lost → boot to welcome tree

================================================================================

HOW IT MUST BEHAVE

- Cannot reach home feed until profile row exists.
- Errors from save must show human text — not silent fail.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Onboarding.jsx + onComplete callback to App.

================================================================================

GAPS TO WATCH

- Network fail mid-save: user might retry — idempotent save is ideal.
- Avatar upload timing if added later — don’t block name save forever.
