# Handoff — Avatar upload (Storage) + Magic-link login

**Date:** 2026-08-18
**Project:** CampusGig · Supabase project ref `hdiguksmsoalrxswrpfq`
**Status:** Login fix shipped ✅ · Avatar upload fix applied, pending final verification ⏳

---

## TL;DR

Two **separate** problems, both traced to a **JWT signing-key rotation** done in the Supabase dashboard (not to app code):

1. **Photo/avatar upload fails** with `400 — new row violates row-level security policy`.
   Root cause: after enabling **JWT Signing Keys**, the Storage service verifies tokens via **JWKS** (asymmetric public keys). The project was left on **HS256 (shared secret)**, which is **never published to JWKS**, so Storage had **no key to verify the user's token** → treated every upload as anonymous → the (correct) RLS policy denied it.
   Fix: promote an **ES256 (asymmetric)** signing key so Storage has a key in JWKS. **(Done — pending final upload test.)**

2. **Magic-link login fails** — link returns to the app with `?code=…` but the user stays anonymous.
   Root cause: client used **PKCE** flow; magic links opened in a different browser/app than the one that requested them can't complete (the per-browser `code_verifier` is missing).
   Fix: switched magic-link flow to **implicit** in code. **(Shipped to prod.)**

**Neither problem was ever in the code that was blamed** (avatar.js, storage policies, buckets). The app code and RLS policies are correct and unchanged since they last worked (April 2026).

---

## Problem 1 — Avatar upload (Supabase Storage)

### Symptom
`Photo upload failed: new row violates row-level security policy` (HTTP 400) on
`POST /storage/v1/object/avatars/<userId>/avatar.jpg`.

### What we proved (so we stopped guessing)
- **Client-side token is valid.** Live diagnostics showed: `role: authenticated`, token `sub` === `user.id`, not expired, correct `iss`. File was `image/jpeg`, 40 KB (well under limits).
- **Bucket + policies are correct.** Pulled live from the DB:
  - Bucket `avatars`: public, 5 MB limit, allows `image/jpeg,png,gif,webp`.
  - Policies on `storage.objects` (all `TO authenticated`):
    - INSERT `WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)`
    - UPDATE / DELETE `USING (...same...)`
  - These are the **same policies** that successfully stored avatars on **April 10–12, 2026**.
- **Grants are intact.** The "DB hardening" migration only touched gig RPCs / `gig_requests`, never `storage.objects`.
- **Public reads work; authenticated writes fail.** A public avatar URL loads fine (no token needed). Only operations that must *verify the token* fail.
- **Postgres works, Storage doesn't, with the same token.** PostgREST (profile/gig queries) verifies the token and returns 200; Storage rejects it. They are **separate services that each verify the JWT independently.**
- **JWKS is empty.** `…/auth/v1/.well-known/jwks.json` returned nothing — expected when the only key is HS256 (shared secrets aren't published to JWKS).

### Root cause
When **JWT Signing Keys** was enabled and rotated, the newer Storage service (separate host `hdiguksmsoalrxswrpfq.storage.supabase.co`) verifies tokens using the **JWKS/asymmetric** path. With the current signing key set to **Legacy HS256**, JWKS is empty → Storage has **no key** → it can't establish identity → `auth.uid()` is `NULL` inside Storage → the correct RLS policy denies the insert → `new row violates row-level security policy`.

This is why "going back to HS256 like April" could not work: April predates the signing-keys feature. Once that feature is on, Storage needs an **asymmetric** key.

### Fix (done in the Supabase dashboard — no code, no policy change)
In **Project Settings → JWT Keys**:
1. Created an **ES256** standby key.
2. Waited for it to be picked up by all components.
3. **Rotated keys** to promote ES256 to **Current**.
4. **Kept the Legacy HS256 key** (did **not** revoke — the `anon` API key is a legacy JWT signed by it).
5. Signed out / signed back in to mint a token signed by the new key.

> User reports steps 1–4 completed. **Remaining: confirm JWKS now lists a key, then test the upload end-to-end.**

### ⚠️ Do NOT
- **Do not edit the storage RLS policies.** They are correct. The only way editing them "helps" is by allowing `anon`/`public` inserts — a security hole (anyone could upload into any user's folder). Leave them as-is.
- **Do not revoke the Legacy HS256 key** while the app's `anon` key depends on it (would break the whole app until the anon/publishable key is migrated to the new `sb_publishable_…` format in `.env.local` **and** Vercel).

### How to verify it's fixed
1. Open `…/auth/v1/.well-known/jwks.json` → should now **show a key with a `kid`** (was empty).
2. Sign in, go to Edit Profile, upload a photo → should succeed (no RLS error).
3. Confirm a new row appears in `storage.objects` for `avatars` under the user's folder.

### Fallback if upload STILL fails after ES256 is Current + JWKS populated
It's then a Supabase-side Storage key-sync issue → open a support ticket at
`https://supabase.com/dashboard/support/new` with:
> "After enabling JWT Signing Keys, Storage (`*.storage.supabase.co`) rejects valid tokens as anon — `400 / new row violates RLS` — while `/auth/v1/user` and PostgREST accept the same token. Now on an ES256 current key with JWKS populated and it still fails. Need Storage to verify our current signing key. Project ref `hdiguksmsoalrxswrpfq`."

---

## Problem 2 — Magic-link login

### Symptom
Clicking "Sign in to CampusGig" in the email returns to the site with `…/?code=…`
in the URL but the user stays **anonymous** (guest welcome screen). **6-digit passcode
login works fine** — which proved auth/keys are healthy and this is specific to the link flow.

### Root cause
The client used `flowType: "pkce"`. PKCE stores a per-browser `code_verifier` when the
link is **requested**; the link can only complete **in that same browser**. Magic links are
routinely opened in a different context (email app webview, desktop→browser handoff), so the
verifier is missing → `?code=` can't be exchanged → no session.

### Fix (code — shipped)
`src/lib/supabase.js`: changed `flowType: "pkce"` → `flowType: "implicit"`.
Implicit flow returns the session in the URL **fragment** (`#access_token=…`) and completes
in any browser — the correct trade-off for emailed links.

- Commit `909a1b8` — "fix(auth): use implicit flow for magic links…"
- Deployed to production (`www.getcampusgig.com`).

### Important nuance for testing
The flow is decided **when the link is requested**, by whichever build made the request.
A link requested from an **old cached build** is still a PKCE (`?code=`) link and will still fail.
To test the fix:
1. Hard-refresh prod (Ctrl+Shift+R) or use a fresh private window to load the new build.
2. Request a **brand-new** magic link.
3. Click it — the return URL should now show `#access_token=…` and log you in.

> Open item: user last saw `?code=` — likely tested with an old email / cached build. Needs a
> fresh link from the new build to confirm. Passcode login is a working fallback in the meantime.

---

## Code changes made this session

| File | Change | Commit |
|---|---|---|
| `src/lib/supabase.js` | Magic-link flow `pkce` → `implicit` | `909a1b8` |
| (feature work) cosmetics/chests/inventory + rep-path | Large feature batch (unrelated to the two bugs) | `e0b38ad` |

Both deployed to Vercel production.

## Supabase dashboard changes made this session (not in git)

- Enabled/rotated **JWT Signing Keys**:
  - Revoked the original ECC P-256 key `24B0070F…` (this was a misstep — removed the one asymmetric key Storage could read).
  - Current key was Legacy HS256 `714A16C8…`.
  - Created a **new ES256 standby** key `3EF10F26…` and rotated it to Current (Problem 1 fix).
- `anon` key verified correct across `.env.local`, Supabase dashboard, and Vercel (not the problem).

---

## Current state / next actions

- [x] Login: implicit-flow fix shipped to prod.
- [ ] Login: confirm with a **fresh** magic link from the new build (expect `#access_token=`).
- [x] Upload: ES256 key promoted to Current, legacy kept, re-logged in.
- [ ] Upload: confirm **JWKS now lists a key**, then upload a photo successfully.
- [ ] If upload still fails → Supabase support ticket (text above).

## Key facts for whoever picks this up
- The app **code and RLS policies were never the bug** — don't "fix" them.
- Two independent issues, both downstream of the JWT signing-key rotation.
- Working login fallback today: **6-digit passcode**.
- Never revoke the Legacy HS256 key unless the `anon`/publishable key is migrated first.
