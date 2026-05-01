# Home

**Route:** `/`

================================================================================

WHAT IT IS

  Main gig feed for logged-in users. See gigs. Tap card → `/gig/:id` full page (browse / request).
  This is the default after login + profile.

================================================================================

WHO MAY OPEN IT

  Logged in + has profile. Bottom nav “home” highlights here.

================================================================================

TLA+ IN CAVEMAN

  vars: gig_list  loading  current_user_id

  INIT: load gigs from DB

  open_card(gig_id) → navigate /gig/:id state.returnTo=/
  legacy ?gig=id → replace navigate /gig/:id

  pull_refresh / remount → reload gig_list

  actions inside modal: request / cancel request — must obey RPC + RLS rules

================================================================================

HOW IT MUST BEHAVE

- Show open gigs the user is allowed to see (RLS truth).
- Poster should not “take” own gig — server should block; UI should hide dumb actions.
- Expired gigs should look dead / filtered depending on product rule.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Home.jsx + navigate to `/gig/:id` (OpenGig + GigDetailModal asPage) + normalizeGig / getOpenGigs.
  User avatar in header uses UserAvatar.

================================================================================

GAPS TO WATCH

- Stale list after action: modal close should refresh or subscribe — check UX.
- Big lists: pagination not always on small apps — watch perf at scale.
