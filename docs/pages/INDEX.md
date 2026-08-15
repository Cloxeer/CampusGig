# GetCampusGig Page Rules Index

Each file is one screen. Read any file in 30 seconds.

- docs/pages/page-welcome.md — route `/welcome` — logged-out gate + stats + tutorial
- docs/pages/page-auth.md — route `/auth` — email + magic link
- docs/pages/page-magic.md — route `/magic` — “check your inbox” (needs state from auth)
- docs/pages/page-onboarding.md — route `/onboarding` — first-time profile setup
- docs/pages/page-home.md — route `/` — main gig feed
- docs/pages/page-explore.md — route `/explore` — search open gigs
- docs/pages/page-post.md — route `/post` — create a gig
- docs/pages/page-alerts.md — route `/alerts` — notifications inbox
- docs/pages/page-profile.md — route `/profile` — me + activity + board
- docs/pages/page-profile-edit.md — route `/profile/edit` — change my profile
- docs/pages/page-user-profile.md — route `/profile/:id` — someone else’s profile

MORE ROUTES

- docs/pages/page-gig-detail.md — route `/gig/:gigId` — unified gig detail (browse / request / manage)
- docs/pages/page-settings.md — route `/settings` — account, passcode, alerts, danger zone
- docs/pages/page-app-intro.md — route `/app-intro` — one-time intro gate after onboarding
- docs/pages/page-profile-rep.md — route `/profile/rep` — reputation path detail
- route `/asnmsu/discounts` — ASNMSU student discounts (no dedicated doc yet)

APP SHELL (not a page)

- Logged out: only welcome, auth, magic. Anything else → `/welcome`
- Logged in, no profile row: only onboarding. Anything else → `/onboarding`
- Logged in + profile, intro not completed: only `/app-intro`. Anything else → `/app-intro`
- Logged in + profile + intro done: home, explore, post, alerts, profile in bottom nav. Edit profile, user profile, settings, gig detail, profile rep, and ASNMSU discounts are extra routes without nav highlight tricks.
