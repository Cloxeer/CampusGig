# Edit Profile

**Route:** `/profile/edit`

================================================================================

WHAT IT IS

  Change name, photo, maybe color — whatever fields EditProfile exposes.
  No bottom nav on this route (full screen flow).

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Reach from Profile “Edit” chip.

================================================================================

TLA+ IN CAVEMAN

  vars: draft_profile  saving  avatar_url

  INIT: load current profile into form

  save:
    if invalid → stay
    if ok → update DB → on success go back /profile

  cancel → back

  upload_avatar:
    upload → public URL → save pointer on user row

================================================================================

HOW IT MUST BEHAVE

- Never write another user’s row (RLS).
- Avatar in storage: path should include user id folder — already common pattern.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  EditProfile.jsx (supabase update + storage).

================================================================================

GAPS TO WATCH

- Large image uploads: compress client-side if you add later.
- Mid-save navigation: disable double submit.
