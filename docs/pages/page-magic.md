# Magic Link Wait

**Route:** `/magic`

================================================================================

WHAT IT IS

  Calm screen: “we emailed you.” Shows which email. Not a login form.

================================================================================

WHO MAY OPEN IT

  Supposed to open ONLY right after Auth sends a link — needs location.state.email.
  If someone bookmarks /magic or opens a new tab here: NO email in state.

================================================================================

TLA+ IN CAVEMAN

  vars: email_from_state

  INIT: read location.state.email

  if email missing → redirect /auth  REPLACE
  if email present → show pretty mail screen

  (Magic link landing after click is handled by Supabase + redirect to / — not this page.)

================================================================================

HOW IT MUST BEHAVE

- Never show a fake “check inbox” without knowing which email (security + trust).
- Direct visit without state → kick to /auth.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  MagicLink.jsx useEffect: if !email navigate /auth.

================================================================================

GAPS TO WATCH

- If React state is lost (hard refresh), user goes to /auth — that is intentional.
