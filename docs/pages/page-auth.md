# Auth (Sign In / Create)

**Route:** `/auth`

================================================================================

WHAT IT IS

  Type email. Ask for magic link. Only @nmsu.edu allowed on the client.
  “Create” vs “sign in” is mostly the same OTP — Supabase decides if user exists.

================================================================================

WHO MAY OPEN IT

  Logged-out users. Logged-in users should not need this route (router keeps them inside app).

================================================================================

TLA+ IN CAVEMAN

  vars: email_text  error_msg  loading  cooldown_ok

  INIT: email empty  error none  loading false

  submit_email:
    if not nmsu.edu → error_msg = “wrong school”  STAY
    if cooldown bad → error_msg = “wait X seconds”  STAY
    else → loading true → call signInWithOtp → loading false
         → on success go /magic with state { email }

  back_button → usually /welcome

================================================================================

HOW IT MUST BEHAVE

- Reject non-nmsu emails before hitting Supabase.
- Rate limit magic link spam (client has a cooldown).
- Magic link redirect URL must match production site (env + Supabase dashboard).

================================================================================

HOW IT BEHAVES TODAY (CODE)

  auth.js sendMagicLink + isEduEmail.
  Auth.jsx form. Enter key submits where wired.

================================================================================

GAPS TO WATCH

- Real enforcement of school domain should ALSO exist in Supabase (not only JS).
- Email typo = user confusion — copy should say “NMSU email only”.
