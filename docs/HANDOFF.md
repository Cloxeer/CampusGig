# HANDOFF — Two-sided pivot (updated Aug 14, 2026)

Read this first when resuming work. It reflects reality better than older docs.

## What CampusGig is now

Two-sided marketplace. **Anyone** (students + outside "clients": film shoots, shelters, locals)
can POST gigs; only **verified NMSU Main Campus students** can WORK them.

- **Students:** @nmsu.edu + magic link. Verified-student status is DERIVED server-side
  (trigger `stamp_user_account_type` on `public.users` reads the confirmed auth email) —
  never client-declared. Optional 6-digit passcode (set in Settings) for quick login.
- **Clients:** any email, PASSWORDLESS (magic link, same as students; no password at signup).
  Can also set a passcode after joining. Can post, never work gigs.
- **Visibility:** `gigs.audience` ('everyone' | 'students_only') stamped from poster type.
  Anon/public + clients see only open 'everyone' gigs; students see all. Enforced by RLS.
- **Payments:** hands-off forever. App surfaces 25–50% deposit guidance only.
- **Auth UI:** /auth?mode=signup shows an account-type picker (NMSU student / I'm hiring),
  then the right form. Login: Magic link tab (any email) + Passcode tab (universal 6-digit).

## Division of labor (hard rule)

Claude DRAFTS SQL as migrations in `supabase/migrations/`; **Sebastian runs them** in the
Supabase SQL editor. Claude never executes DDL. (Repo rule INV_SCOPE_01, adapted.)

## Critical footguns (learned the hard way)

1. **Prod drift:** `supabase/schema2.0.sql` LIES. Live DB differed 3×: RPC wrappers,
   missing `account_deletion_requests` table, nmsu auth-trigger under a different name.
   NEVER trust the baseline — probe live (introspection query results pending, see below).
2. **RPC wrapper pattern:** gig lifecycle RPC bodies live in `private` schema
   (SECURITY DEFINER, unexposed); `public.<name>` are thin SECURITY INVOKER wrappers.
   `CREATE OR REPLACE public.<rpc> ... SECURITY DEFINER` CLOBBERS the wrapper → advisor 0029.
   Edit the `private.` body instead.
3. **`updated_at` is never an event time** (triggers bump it on any write; migrations bumped
   all gigs once). Use `created_at` / `completed_at`.
4. **CSS `animation ... forwards` retains transforms** → element becomes containing block for
   `position: fixed` descendants (broke modals + rep-chip). `.fadein`/`.slidein` fixed (no
   fill-mode). Don't reintroduce.
5. **Mobile scroll:** window scrolls (<900px); `.scroll` div scrolls on desktop. Detect, don't assume.

## Applied to live DB (all confirmed by Sebastian)

Migrations `2026081400000{0,1,2,4,5,6}` + repairs:
- account types (`users.is_verified_student/account_type` + stamp trigger)
- audience-scoped gig RLS + scoped anon read (users/reviews/categories) + removed
  "Anon can count *" full-row leak policies
- `get_public_stats` private-wrapped RPC → now reads trigger-maintained `public_stats` row,
  realtime-published (welcome page has live websocket counters)
- account deletion: request table + RPCs (repaired — never existed live) + pg_cron worker
  daily 03:17 UTC (job #1) purging expired 15-day grace requests incl. avatars + auth user
- legacy nmsu-only trigger on auth.users dropped BY CONTENT MATCH (name drifted)
- `request_gig` student gate (in private body, wrapper intact)

## PENDING — do these next

1. **Sebastian runs the full introspection query** (one big UNION query Claude provided,
   14 sections: columns/constraints/policies/triggers/function bodies/grants/cron/realtime/
   storage). **Then: rebuild canonical `schema3.0.sql` from results, write corrective
   migrations for gaps, update docs** (`docs/core/invariants.md` INV_AUTH_01 is now WRONG —
   still says students-only; `docs/first.md`, `docs/pages/page-auth.md`, `page-welcome.md` outdated).
2. **Run migration `20260814000003_content_bounds.sql`** (title/description/price CHECK
   bounds — written, NOT confirmed run).
3. **Run migration `20260814000007_lock_gig_audience.sql`** (security fix: audience trigger
   INSERT-only → poster could UPDATE audience post-hoc; re-stamp on UPDATE too). Written, NOT run.
4. **Client signup returned "Database error saving new user"** → the content-match trigger
   drop (00006) was the fix; **retest client signup end-to-end** with a real non-edu inbox:
   picker → I'm hiring → link → onboarding → post gig → verify it appears on the LOGGED-OUT
   home feed (no student badge) — first real proof of the two-sided pipeline.
5. **Welcome/splash copy still students-only** ("student-to-student · @nmsu.edu only · GO
   aggies", eligibility text) — needs two-sided rewrite (auth pages + legal already done).
6. **Launch checklist:** delete founder "TEST THE WEBSITE" gigs; dashboard toggles
   (leaked-password protection, Secure email change ON, eyeball rate limits, CAPTCHA if
   abuse); deploy + confirm vercel.json security headers live; attorney skim of rewritten
   Terms/Privacy (both rewritten Aug 14 for two-sided model, deletion promise now true).

## Key implementation notes

- Legal pages: `src/pages/{Privacy,Terms}.jsx` — rewritten (contact-reveal disclosure,
  public visibility, no-vetting/assumption-of-risk, NMSU non-affiliation, 18+).
- Fonts self-hosted via @fontsource (no Google CDN). Lenis installed (Rep path only).
- Rep path: climb-up redesign (summit top, base camp info bottom, floating return chip
  portaled to <body>, Lenis smooth, draw-in animation).
- Alerts/Activity: date buckets (Today…Older collapsed w/ count; Alerts has "Clear" for old).
- Stats: `useCountUp` hook + localStorage cache + realtime subscription (`subscribePublicStats`).
- Security headers in `vercel.json` (apply on next deploy).
- Home: public for logged-out (outsider gigs only), single "Welcome" topbar button → /welcome
  (has back arrow). GigCard shows green grad-cap `StudentBadge` (gray circle chip) for
  verified-student posters only.
