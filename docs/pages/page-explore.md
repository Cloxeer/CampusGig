# Explore

**Route:** `/explore`

================================================================================

WHAT IT IS

  Search / browse open gigs. Similar to home but search-first UX.
  Tap card → `/gig/:id` full page. Legacy `?gig=` redirects to that route.

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Bottom nav “explore”.

================================================================================

TLA+ IN CAVEMAN

  vars: search_q  all_gigs

  INIT: load open gigs

  type_search → filter list client-side (or server if you add it later)

  open_gig(id) → navigate /gig/:id state.returnTo=/explore

  tab_back_to_visible → optional refresh gigs (visibility listener exists)

  request_gig → RPC success → show requested state

================================================================================

HOW IT MUST BEHAVE

- Same business rules as Home: NMSU-only participants enforced by auth + profile.
- Requesting a gig must be one clear RPC — no double request spam.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Explore.jsx + navigate to `/gig/:id` (OpenGig page).

================================================================================

GAPS TO WATCH

- Search is local filter today — if gig count grows, add server search.
- Deep link: legacy `?gig=` is replaced with `/gig/:id` on load.
