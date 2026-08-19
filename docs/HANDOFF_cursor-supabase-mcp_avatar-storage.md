# Handoff → Cursor (Supabase MCP) — Avatar upload still 403 RLS

**Project:** CampusGig · Supabase project ref `hdiguksmsoalrxswrpfq`
**Test user:** `ssalgadonm@gmail.com` · id `54b59a95-b388-4b3d-ab37-128f87f12f3d`
**Symptom:** `POST /storage/v1/object/avatars/<uid>/avatar.jpg` → `400 / {"statusCode":"403","error":"Unauthorized","message":"new row violates row-level security policy"}`
**Your job:** Use the Supabase MCP to run the diagnostics below, decide DB-bug vs platform-bug, and apply the fix if it's a DB bug. **Do NOT weaken the storage RLS policies** (see guardrails).

---

## What is already PROVEN (don't re-litigate)

All tested live against prod today:

| Check | Result |
|---|---|
| Token from a fresh session | Valid. `role: authenticated`, `aud: authenticated`, correct `iss`, unexpired |
| `GET /auth/v1/user` with that token | ✅ 200 — returns the correct user |
| PostgREST with that token | ✅ verifies fine |
| **Storage** upload to the user's **own** folder | ❌ 403 `new row violates RLS` |
| Same upload with a **raw anonymous** request | ❌ 403 — **byte-identical to the authenticated one** |
| Tested with **ES256** current key (JWKS populated) | ❌ 403 |
| Tested with **HS256** current key (after rotating back) | ❌ 403 — **identical** |

**Interpretation:** Storage treats a fully-valid authenticated token exactly like anonymous → `auth.uid()` is `NULL` inside Storage. The signing-key **format is NOT the lever** (both ES256 and HS256 fail identically). The app code, the token, Auth, and PostgREST are all fine. The failure is a **clean RLS denial (role resolves to anon)** — NOT a 500 / missing-relation crash.

> A prior handoff blamed "JWKS empty under HS256" and promoting ES256 was supposed to fix it. That theory is **disproven** — ES256 current + JWKS populated still 403s. Do not chase key formats again.

---

## The ONE decisive experiment

Everything above pokes Storage from the **outside** (HTTP service). We still can't distinguish:

- **(a) Platform bug** — the Storage HTTP service fails to set `auth.uid()` from a valid token. Only Supabase support can fix. → file the ticket (text at bottom).
- **(b) DB bug** — a drifted policy, a missing grant, or a broken INSERT trigger referencing a missing table (`storage.prefixes`?). → **fixable in SQL right now.**

The SQL editor / MCP runs as superuser, so we can **simulate the authenticated user at the DB level** and try the exact insert. Outcome decides (a) vs (b).

### Step 1 — inventory (read-only)

Run via `execute_sql` (or the SQL runner the MCP exposes):

```sql
-- 1. Live policies on storage.objects (compare vs supabase/schema2.0.sql lines ~1194-1207)
select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname='storage' and tablename='objects';

-- 2. Triggers on storage.objects (the newer "prefixes" trigger lives here)
select tgname, pg_get_triggerdef(oid) as def
from pg_trigger where tgrelid='storage.objects'::regclass and not tgisinternal;

-- 3. Does the newer storage.prefixes table exist? (the user recalls "a table that didn't exist")
select table_name from information_schema.tables
where table_schema='storage' order by table_name;

-- 4. Storage schema migration version
select id, name from storage.migrations order by id desc limit 8;

-- 5. Grants to authenticated/anon on storage.objects
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='storage' and table_name='objects'
  and grantee in ('authenticated','anon') order by grantee, privilege_type;

-- 6. The avatars bucket row
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='avatars';
```

### Step 2 — simulate the authenticated upload, rolled back (writes nothing)

```sql
begin;
  select set_config('request.jwt.claims',
    '{"sub":"54b59a95-b388-4b3d-ab37-128f87f12f3d","role":"authenticated"}', true);
  set local role authenticated;

  select auth.uid() as uid_seen, auth.role() as role_seen;

  -- the exact insert the avatar upload performs:
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('avatars',
          '54b59a95-b388-4b3d-ab37-128f87f12f3d/diag.jpg',
          auth.uid(), auth.uid()::text);

  select 'INSERT SUCCEEDED at DB level' as result;
rollback;
```

---

## How to read the results → what to do

**If Step 2 INSERT succeeds:**
- DB, policy, and grants are correct. The block is the **Storage HTTP service** not verifying the token → **platform bug (a)**.
- Action: file the Supabase support ticket (text below). Nothing else to fix in SQL. Optionally try a **project pause → resume** (Dashboard → Settings → General), which forces the Storage container to reload its JWT config and has resolved this class of issue before; then re-test the upload.

**If Step 2 INSERT fails with `relation "storage.prefixes" does not exist` (or a trigger error):**
- This is the user's "missing table." The storage schema is **half-migrated** — the `objects` insert trigger references machinery that isn't there.
- Action: bring the storage schema up to date. Safest is to let Supabase re-run storage migrations (pause/resume, or contact support to re-apply), OR create the missing `storage.prefixes` table + its trigger to match the current storage version. **Confirm the exact missing object from the error before creating anything** — don't hand-author storage internals blindly; prefer the platform re-running its own migration.

**If Step 2 INSERT fails with `permission denied for table objects`:**
- Missing grant. Fix: `grant insert, select, update, delete on storage.objects to authenticated;` (re-check Step 1 #5 first).

**If Step 2 INSERT fails with `new row violates row-level security policy` even here:**
- Then `auth.uid()` came back NULL/mismatched at the DB level — check the `uid_seen` output. If `uid_seen` is null, the `set_config` claims shape differs from what this project's `auth.uid()` reads; re-test with `select set_config('request.jwt.claim.sub','54b59a95-b388-4b3d-ab37-128f87f12f3d', true);` as well. If `uid_seen` is correct but insert still denies, the live policy has drifted — compare Step 1 #1 against the expected policy below and restore it.

**If Step 1 shows policies drifted** from the expected set, restore exactly these (from `supabase/schema2.0.sql`), no broader:

```sql
-- expected, correct policies — per-user folder isolation:
-- INSERT  WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
-- UPDATE  USING      (bucket_id='avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
-- DELETE  USING      (bucket_id='avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
-- all TO authenticated
```

---

## Guardrails (do NOT do these)

- ❌ **Do not** add an `anon`/`public` INSERT policy or loosen the folder check to make uploads pass. That lets anyone write into any user's folder — a security hole. The current policies are correct.
- ❌ **Do not** revoke the **Legacy HS256** signing key — the app's `anon` API key is a legacy JWT signed by it; revoking breaks the whole app until the anon/publishable key is migrated in `.env.local` **and** Vercel.
- ❌ **Do not** "fix" `src/lib/avatar.js` — the client is correct (`avatars/<uid>/avatar.<ext>`, contentType set, upsert).

---

## Verify the fix (after any DB change)

Re-run the real HTTP upload with a fresh token (this is what the app does):

```
POST https://hdiguksmsoalrxswrpfq.supabase.co/storage/v1/object/avatars/54b59a95-b388-4b3d-ab37-128f87f12f3d/avatar.jpg
Headers: apikey: <VITE_SUPABASE_ANON_KEY from .env.local>
         authorization: Bearer <fresh access_token>
         content-type: image/jpeg
         x-upsert: true
Body: a small JPEG
Expect: 200  (not 403)
```

Or just sign in as the test user in the app → Edit Profile → upload a photo → expect success and a new row in `storage.objects` under `avatars/54b59a95-.../`.

---

## Support ticket text (if Step 2 proves platform bug)

> **Project ref `hdiguksmsoalrxswrpfq` — Storage rejects all valid JWTs as anonymous.**
> After enabling JWT Signing Keys, Storage (`*.storage.supabase.co`) returns `400 / "new row violates row-level security policy"` for authenticated uploads to the user's own folder. Live tests show Storage returns a **byte-identical response** for (a) a valid authenticated token and (b) a raw anonymous request — so `auth.uid()` is NULL inside Storage. The **same token is accepted by `/auth/v1/user` (200) and PostgREST**. We tested with **both an ES256 current key (JWKS populated) and a legacy HS256 current key** — Storage rejects both identically. A superuser-simulated insert into `storage.objects` with `request.jwt.claims` set **succeeds** at the DB level, so the RLS policies and grants are correct. Storage is not verifying our project's signing key. Please resync Storage's JWT verification / re-run storage migrations.

---

## Appendix — reference facts

- Client: `src/lib/avatar.js` uploads to `avatars/${user.id}/avatar.${ext}`, `{ upsert:true, contentType:file.type }`.
- Auth: `src/lib/supabase.js` uses `flowType: "implicit"` (magic-link fix, already shipped).
- Expected storage setup lives in `supabase/schema2.0.sql` (bucket insert + 3 policies, ~lines 1186-1207).
- Anon key (`.env.local` `VITE_SUPABASE_ANON_KEY`) is a **legacy HS256** JWT, role `anon` — public, safe to use as the `apikey` header.
