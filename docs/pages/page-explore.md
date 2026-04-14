# Explore

**Route:** `/explore`

================================================================================

WHAT IT IS

  Search / browse open gigs. Similar to home but search-first UX.
  Tap card → GigDetailModal (modal param `gig` in URL).

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Bottom nav “explore”.

================================================================================

TLA+ IN CAVEMAN

  vars: search_q  all_gigs  gig_modal_id  requested_flag

  INIT: load open gigs

  type_search → filter list client-side (or server if you add it later)

  open_gig(id) → set URL param ?gig=  → modal opens

  tab_back_to_visible → optional refresh gigs (visibility listener exists)

  request_gig → RPC success → show requested state

================================================================================

HOW IT MUST BEHAVE

- Same business rules as Home: NMSU-only participants enforced by auth + profile.
- Requesting a gig must be one clear RPC — no double request spam.

================================================================================

HOW IT BEHAVES TODAY (CODE)

  Explore.jsx + useModalParam("gig") + GigDetailModal.

================================================================================

GAPS TO WATCH

- Search is local filter today — if gig count grows, add server search.
- Modal state vs URL: deep link to ?gig= should open correct gig.
