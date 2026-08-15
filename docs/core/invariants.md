# System Invariants

## Answers

- What are the absolute hard logic rules for this system?
- How do we enforce boundaries for Authentication, Gigs, and Gamification?

These invariants act as hard logic rails. Always align logic to these rules; never bypass them.

## Authentication & Access

- **INV_AUTH_01:** Only users with a valid `.edu` email address may successfully authenticate.
- **INV_AUTH_02:** Magic links are the primary sign-in method and always-available fallback. Users may optionally set a 6-digit easy access passcode (Supabase password) for faster sign-in; signup remains magic-link only.

## Gigs & Privacy

- **INV_GIG_01:** A gig's contact info is NEVER revealed until the poster explicitly accepts a request.
- **INV_GIG_02:** A user cannot request or accept their own posted gig.

## Economy & Gamification

- **INV_KARMA_01:** Karma Kredit is awarded ONLY on explicitly verified task completion.
- **INV_KARMA_02:** Karma Kredit is NEVER awarded upon merely posting a gig, requesting a gig, or accepting a gig.

## Architectural Boundaries

- **INV_SCOPE_01:** The database is off-limits for AI modification. AI work must only execute against `src/components`, `src/pages`, and `src/utils`.
