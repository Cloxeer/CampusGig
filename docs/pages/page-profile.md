# Profile (Me)

**Route:** `/profile`

================================================================================

WHAT IT IS

  My face, my rep, my stats, my reviews summary.
  Tabs: Activity (things I did / gigs / reviews I got) and Leaderboard.
  Activity rows open gig detail (AlertDetailModal) or reviewer profile.

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Bottom nav “profile”.

================================================================================

TLA+ IN CAVEMAN

  vars: profile  activity_items  leaderboard  modals  selected_gig_id

  INIT: load profile + activity + reviews + board

  tap_activity_row:
    if gig → selected_gig_id = gig
    if reviewer → navigate /users/:reviewerId

  tap_rep_card → open RepDetailModal (query param rep)

  tap_reviews → open ReviewSheetModal (query param reviews)

  logout → session cleared → welcome tree

================================================================================

HOW IT MUST BEHAVE

- Activity text for rep points must match real DB rules (+10 taker, +8 poster done, +2 post, review points, -10 for zero star).
- Posted gig status: “Taken by X” when taken — not “waiting forever” lie.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Profile.jsx + getMyActivity + UserAvatar + AlertDetailModal for owned gig drill-in.

================================================================================

GAPS TO WATCH

- Leaderboard pagination: top 100 only — fine until huge campus.
- Refresh after modal actions: onClose reloads profile data in places — keep consistent.
