# Future plans

**Scope:** Product direction — **not implemented**. Roadmap + stakeholder conversations only.

================================================================================

WHAT IT IS

  Ideas for what CampusGig might do next: trust, matching, activity, ops.
  Nothing here is a promise; ship order TBD.

================================================================================

WHY IT EXISTS

  So “high-rep with high-rep” and “everyday activity” live in one readable place
  instead of scattered notes. Align with `supabase/` migrations when something ships.

================================================================================

TRUST & MATCHING (IDEAS)

  Goal: reward everyday activity and reputation — not only new signups.

  • Rep-aware surfacing — prefer flows where both sides have history (e.g. minimum
    Rep for certain gig types or surfaces).

  • Positive pairing — when it fits the product, surface high-Rep posters with
    high-Rep takers so reliable people find each other; feels safer.

  • Activity loops — light daily/weekly nudges (complete a gig, respond within X hours)
    without rewarding spam.

================================================================================

TECHNICAL DIRECTION (LATER)

  • Queries / indexes on `users.rep_score`, `gigs.status`, timestamps.

  • Optional tables: e.g. `user_preferences` (“prefer trusted counterparties”), feature flags.

  • PII unchanged — contact stays in `user_private_contact` + RLS; matching uses public
    profile + Rep only.

================================================================================

OPERATIONAL / SCALE

  • Moderation hooks (report user / gig) if the pilot grows.

  • Analytics with privacy in mind — aggregates only where possible.

================================================================================

GAPS TO WATCH

  • Rep gating can feel elitist — tune copy and thresholds for a campus.

  • “Trusted pairing” needs clear UX so it does not hide all gigs from new users.

================================================================================

LAST TOUCHED

  2026 — refresh when a bullet ships or dies.
