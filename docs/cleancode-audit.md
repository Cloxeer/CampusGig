# Clean Code Audit (Phase 0)

Read-only audit of `src/`, `docs/`, and `supabase/migrations/` against [cleancode.md](./cleancode.md).
This is the tracking artifact for the phased cleanup. No behavior or UI changes are recorded here — only findings and the phase that owns each fix.

## Baseline

- Source: ~140 JS/JSX files, ~12.5k lines.
- `npm run build`: green (1820 modules transformed) before any cleanup.
- Largest module: [src/lib/profile.js](../src/lib/profile.js) — 1,194 lines, ~48 live exports across 9 domains.

## Findings by category

### 1. Dead code

| Item | Location | Status | Phase |
|------|----------|--------|-------|
| `GigDetailModal.jsx` | `src/components/modals/` | Already deleted in working tree | — |
| `AlertDetailModal.jsx` | `src/components/modals/` | Already deleted in working tree | — |
| `GigDetails.jsx` | `src/pages/` | Already deleted in working tree | — |
| `ProfileOtherActivityTab.jsx` | `src/features/profile/components/` | Already deleted in working tree | — |
| `buildOtherUserActivityItems.js` | `src/features/profile/mappers/` | Already deleted in working tree | — |
| `ReportReviewModal.jsx` | `src/components/modals/` | Live thin wrapper, zero imports | 1 |
| `reportReview` export | `src/lib/profile.js` | No importers | 1 |
| `reportGig` export | `src/lib/profile.js` | No importers | 1 |
| `deleteMyProfile` export | `src/lib/profile.js` | No importers (deletion uses RPC) | 1 |
| `useSearchParams()` dead line | `src/pages/Explore.jsx:13` | Called without import; result unused | 1 |

### 2. DRY — contact field metadata duplicated in four places

| File | Owns |
|------|------|
| [src/utils/contactFields.js](../src/utils/contactFields.js) | keys + display labels (`OPTIONAL_CONTACT_FIELD_*`) |
| [src/components/ContactFields.jsx](../src/components/ContactFields.jsx) | duplicate keys + `prefix`/`placeholder` + `FAVORABLE_CONTACT_KEYS` |
| [src/utils/profileForm.js](../src/utils/profileForm.js) | `EMPTY_CONTACT_PROFILE` keys + `profileContactsToApi` field list |
| [src/lib/profile.js](../src/lib/profile.js) | `USER_PRIVATE_SELECT` string + `PRIVATE_USER_FIELDS` set |

Known label drift: `apple_pay` is `"Apple Pay"` (display) vs `"Apple Pay / Apple Cash"` (form). Resolution: single source keeps both via a `formLabel` override so neither surface changes. Owner: Phase 2.

Other DRY: `getMyGigStats`/`getUserGigStats` and `getMyActivity`/`getUserActivity` share query bodies. Owner: Phase 5 (internal only, identical return shapes).

### 3. SRP — `src/lib/profile.js` god module

Split target (Phase 4), domain modules behind a re-export barrel so all existing import paths keep working:

- `shared.js` — `mergeUserPrivateContact`, `USER_PRIVATE_SELECT`, review-window helpers
- `avatar.js` — `uploadAvatar`, `getAvatarUrl`
- `users.js` — profile read/write, passcode flags, account deletion, `getUserProfilePageData`
- `reviews.js` — reviews + reports
- `rep.js` — stats, rank, leaderboard, activity
- `gigs.js` — feed, normalize, CRUD, requests, lifecycle, detail
- `notifications.js` — notifications

All cross-references occur inside function bodies, so the module graph is a load-safe DAG.

### 4. Folder consistency (Phase 3)

- Thin page shims: `pages/Profile.jsx`, `pages/Alerts.jsx`, `pages/Settings.jsx` re-export feature screens. Decision: keep as intentional routing adapters and document (lowest-risk; avoids touching `App.jsx` route wiring).
- Gig-detail hooks (`useGigDetail*.js`) live in `src/hooks/`; alerts hooks live at `features/alerts/` root while profile/settings use `features/*/hooks/`. Normalize alerts hooks into `features/alerts/hooks/`.
- Truly shared hooks (`useModalParam`, `useLegacyGigRedirect`, `useOpenGigsQuery`) stay in `src/hooks/`.

### 5. Docs out of sync (Phase 1)

| Doc | Issue |
|-----|-------|
| [page-home.md](./pages/page-home.md) | "GigDetailModal asPage" / "actions inside modal" — now `/gig/:id` full page |
| [page-alerts.md](./pages/page-alerts.md) | references `AlertDetailModal` — now navigates to `/gig/:id` |
| [page-profile.md](./pages/page-profile.md) | `/gigdetails/:id` + `AlertDetailModal` + `RepDetailModal` — now `/gig/:id` and `/profile/rep` |
| [systems/auth.md](./systems/auth.md) | migration path points to `supabase/old/...`; canonical is `supabase/migrations/20250607000000_easy_access_passcode.sql` |
| [index.md](./index.md) | missing links to `cleancode.md` and `first.md` |
| [pages/INDEX.md](./pages/INDEX.md) | missing `/gig/:id`, `/settings`, `/app-intro`, `/profile/rep`, `/asnmsu/discounts` |

### 6. Remaining cleancode rule items (Phase 5)

- P6 NO MAGIC: gig post rate limit (`5`/`60*60*1000`), activity `limit(10)` → named constants in extracted modules.
- P7 COMMENTS: stale "wire Gig detail Report to this next" comment removed with `reportGig`; "for alert detail modal" header is outdated.
- P4 SRP: large components (`ProfilePage.jsx`, `ProfileRep.jsx`) flagged for internal helper extraction only — out of scope unless explicitly requested (touching them risks UI).

## Verification protocol per phase

`npm run build` green + grep moved symbols resolve + no route/queryKey/RPC/table renames.
