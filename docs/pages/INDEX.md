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
- docs/pages/page-user-profile.md — route `/users/:id` — someone else’s profile

APP SHELL (not a page)

- Logged out: only welcome, auth, magic. Anything else → `/welcome`
- Logged in, no profile row: only onboarding. Anything else → `/onboarding`
- Logged in + profile: home, explore, post, alerts, profile in bottom nav. Edit profile and user profile are extra routes without nav highlight tricks.
