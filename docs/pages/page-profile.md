# Profile (Me)

**Route:** `/profile`

================================================================================

WHAT IT IS

  My face, my rep, my stats, my reviews summary.
  Tabs: Activity (things I did / gigs / reviews I got) and Leaderboard.
  Activity rows navigate to `/gig/:gigId` (full page, `returnTo: /profile`) or to reviewer profile.
  On another student’s profile (`/profile/:userId`), activity gig rows open `/gig/:gigId` (browse / request) with `returnTo` that profile.

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Bottom nav “profile”.

================================================================================

TLA+ IN CAVEMAN

  vars: profile  activity_items  leaderboard  modals

  INIT: load profile + activity + reviews + board

  tap_activity_row:
    if gig → navigate /gig/:id state.returnTo=/profile
    if reviewer → navigate /profile/:reviewerId

  tap_rep_card → navigate /profile/rep (ProfileRep page)

  tap_reviews → open ReviewSheetModal (query param reviews)

  logout → session cleared → welcome tree

================================================================================

HOW IT MUST BEHAVE

- Activity text for rep points must match real DB rules (+10 taker, +8 poster done, +2 post, review points, -10 for zero star).
- Posted gig status: “Taken by X” when taken — not “waiting forever” lie.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  ProfilePage + getMyActivity + navigate to `/gig/:id` (OpenGig → GigDetailView) for owned gig drill-in.

================================================================================

GAPS TO WATCH

- Leaderboard pagination: top 100 only — fine until huge campus.
- After gig actions on `/gig/:id`, returning to `/profile` remounts the page and refetches activity/reviews as queries run again.
