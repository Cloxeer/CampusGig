# Gig Detail

**Route:** `/gig/:gigId`

================================================================================

WHAT IT IS

  Unified full-page gig detail. Same page serves browse, request, and manage
  depending on who you are (poster, requester, taker, or bystander).
  Replaces the old gig detail modal and the legacy `/gigdetails/:id` route.

================================================================================

WHO MAY OPEN IT

  Logged in + profile. Reached from Home, Explore, Alerts, and Profile activity.
  `returnTo` is carried in navigation state so close returns to the origin.

================================================================================

HOW IT MUST BEHAVE

- Contact info stays locked until the poster accepts a request (INV_GIG_01).
- A user cannot request or accept their own gig (INV_GIG_02).
- Missing / deleted gig → redirect back to `returnTo` (or `-1`).

================================================================================

HOW IT BEHAVES TODAY (CODE)

  OpenGig.jsx (route wrapper) → GigDetailView.jsx + gigDetail/* sections.
  Data via useGigDetailQuery → getGigDetail. Actions via useGigDetailActions
  (requestGig / acceptGigRequest / rejectGigRequest / completeGig).
  Lock + role logic in utils/gigDetailModel.js.

================================================================================

GAPS TO WATCH

- Legacy `?gig=<id>` query param redirects here via useLegacyGigRedirect.
