# Welcome (Splash)

**Route:** `/welcome`

================================================================================

WHAT IT IS

  Front door. Stranger land. No account required to SEE this screen.
  Shows live-ish numbers (postings, completed, accounts) if the DB allows.
  Buttons: tutorial, create account, sign in.

================================================================================

WHO MAY OPEN IT

  Anyone not logged in. If you ARE logged in, the app does not send you here
  (router sends you inside the app). So in practice: logged-out users only.

================================================================================

TLA+ IN CAVEMAN (STATES)

  vars: tutorial_open  stats_loaded  user_logged_in

  INIT: user_logged_in = false  tutorial_open = false  stats_loaded = maybe

  open_tutorial → tutorial_open = true
  close_tutorial → tutorial_open = false
  tap_create → go /auth with mode signup
  tap_signin → go /auth with mode signin
  session_appears → user_logged_in = true  (App kicks you out of this tree)

================================================================================

HOW IT MUST BEHAVE

- Numbers should load from server. If server fails, show 0 or “—” — not a crash.
- Tutorial is slides. Last slide should send people to sign in / auth path.
- Do not show the main app feed here. Gate stays closed.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Splash.jsx + getPublicStats().
  Tutorial toggles inside same page.
  Navigate to /auth for account flows.

================================================================================

GAPS TO WATCH

- Stats RPC must stay public-read safe in Supabase (no private data in that call).
- If getPublicStats errors, UI should still render (graceful).
