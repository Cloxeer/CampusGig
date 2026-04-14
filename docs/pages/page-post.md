# Post a Gig

**Route:** `/post`

================================================================================

WHAT IT IS

  Form to create a new gig. Title, money, time, category, etc. (whatever the form has).

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Bottom nav big plus button.

================================================================================

TLA+ IN CAVEMAN

  vars: form_fields  submitting  error_msg  success

  INIT: empty form

  submit:
    if invalid → show field errors  STAY
    if ok → insert gig → success true → go home or show toast (whatever code does)

  cancel → go back

================================================================================

HOW IT MUST BEHAVE

- Only authenticated user id as poster (never trust client id for poster_id — RPC/DB default).
- Rep for posting is +2 after migration (DB trigger) — user sees rep change elsewhere.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  PostGig.jsx + insert via supabase / RPC.

================================================================================

GAPS TO WATCH

- Price / time validation — must match DB constraints.
- Failure after submit: user should not think gig posted when it didn’t.
