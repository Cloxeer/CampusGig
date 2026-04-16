# User Profile (Someone Else)

**Route:** `/profile/:userId` (legacy `/users/:userId` redirects here)

================================================================================

WHAT IT IS

  Read-only public view of another student. Rep, reviews, activity, stats.
  Same screen family as “me” (`/profile`) but route is `/profile/:userId` (no bottom nav).

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Open from leaderboard row, activity tap, gig cards, etc.

================================================================================

TLA+ IN CAVEMAN

  vars: target_user_id  their_profile  their_reviews  loading  error

  INIT: parse userId from URL

  if userId == me → could redirect to /profile (optional product rule)

  load_data → success or error state

  tap_review / gig → follow existing navigation patterns

================================================================================

HOW IT MUST BEHAVE

- Hide private contact unless business rules say otherwise (email/phone in separate table).
- No editing their profile — only yours.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  `ProfilePage.jsx` (other-user mode) + `getUserProfilePageData(userId)`.

================================================================================

GAPS TO WATCH

- 404 user: show friendly “student not found.”
- Blocked / banned users — if you add moderation later, hook here.
