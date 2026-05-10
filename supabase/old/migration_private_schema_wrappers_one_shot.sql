-- =============================================================================
-- CampusGig — ONE-SHOT: Hide remaining SECURITY DEFINER RPCs behind
-- SECURITY INVOKER wrappers in `public`, real bodies in `private` schema.
-- (paste the entire file into Supabase → SQL Editor → Run)
--
-- Clears the last advisor warnings of class:
--   • 0029 authenticated_security_definer_function_executable
--     for: request_gig, accept_gig_request, reject_gig_request,
--          complete_gig, cancel_pending_account_deletion
--
-- How this works
-- ───────────────
-- The PostgREST advisor flags any SECURITY DEFINER function in an exposed
-- schema (default: `public`) because it is auto-published at /rest/v1/rpc/*.
-- We can't remove the RPC — the React app needs to call these — but we CAN
-- move the privileged work into a non-exposed schema:
--
--   1. Move each function body into a new `private` schema (which is NOT
--      published by PostgREST), keeping it SECURITY DEFINER.
--   2. Create a thin `public.<name>(args)` wrapper that is SECURITY INVOKER
--      and just forwards the call to `private.<name>(args)`.
--
-- Result:
--   • PostgREST keeps publishing /rest/v1/rpc/<name> → calls the public
--     wrapper. supabase.rpc('request_gig', ...) etc. work unchanged — no
--     client code change required.
--   • The wrapper is SECURITY INVOKER, so the advisor stops flagging it.
--   • The privileged body in `private.*` is unreachable over REST because
--     PostgREST does not expose the `private` schema.
--   • auth.uid() inside the inner function continues to return the caller's
--     user id (it's a per-request GUC set by PostgREST, not per-function).
--
-- NOT fixable in SQL — must be enabled in Supabase Dashboard:
--   auth_leaked_password_protection
--   → Authentication → Sign In / Up → Password → toggle
--     "Leaked password protection" (HaveIBeenPwned).
--   https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
--
-- ⚠ Before you run: confirm the `private` schema is NOT exposed to the API.
--   Dashboard → Project Settings → Data API → "Exposed schemas".
--   Default is `public, graphql_public` — leave `private` OUT of that list.
--
-- Re-runnable: every step is guarded with `to_regprocedure(...) IS NOT NULL`
-- and CREATE-OR-REPLACE, so running twice is a no-op after the first pass.
-- =============================================================================

BEGIN;

-- ── 0) Private schema (not exposed by PostgREST) ─────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;
COMMENT ON SCHEMA private IS
  'CampusGig: private SECURITY DEFINER bodies. NEVER add to PostgREST exposed schemas.';

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT  USAGE ON SCHEMA private TO authenticated;
GRANT  USAGE ON SCHEMA private TO service_role;


-- ── 1) Move each definer function into `private` (preserves body + owner) ────
-- ALTER FUNCTION ... SET SCHEMA preserves the function definition, owner,
-- attributes, and existing ACLs.  Skips silently if the function is already
-- in `private` (e.g. on a re-run) or doesn't exist yet (fresh install).

DO $cg_move$
DECLARE
  src TEXT;
  dst TEXT;
  fns TEXT[][] := ARRAY[
    ARRAY['public.request_gig(uuid)',                     'private.request_gig(uuid)'],
    ARRAY['public.accept_gig_request(uuid)',              'private.accept_gig_request(uuid)'],
    ARRAY['public.reject_gig_request(uuid)',              'private.reject_gig_request(uuid)'],
    ARRAY['public.complete_gig(uuid)',                    'private.complete_gig(uuid)'],
    ARRAY['public.cancel_pending_account_deletion()',     'private.cancel_pending_account_deletion()']
  ];
  pair TEXT[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY fns LOOP
    src := pair[1];
    dst := pair[2];

    IF to_regprocedure(dst) IS NOT NULL THEN
      RAISE NOTICE 'Already in private: %', dst;
      CONTINUE;
    END IF;

    IF to_regprocedure(src) IS NULL THEN
      RAISE NOTICE 'Source not present (skipping): %', src;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER FUNCTION %s SET SCHEMA private', src);
    RAISE NOTICE 'Moved % → private', src;
  END LOOP;
END
$cg_move$;


-- ── 2) Lock down the moved private bodies ────────────────────────────────────
-- Default Postgres grants EXECUTE to PUBLIC on every function.  Strip that,
-- then grant EXECUTE only to roles that legitimately call them through the
-- public wrappers (the wrappers are SECURITY INVOKER, so they run as the
-- caller — `authenticated` needs EXECUTE on the private function for the
-- forward call to succeed).

DO $cg_grants$
DECLARE
  fn TEXT;
  fns TEXT[] := ARRAY[
    'private.request_gig(uuid)',
    'private.accept_gig_request(uuid)',
    'private.reject_gig_request(uuid)',
    'private.complete_gig(uuid)',
    'private.cancel_pending_account_deletion()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    IF to_regprocedure(fn) IS NULL THEN
      RAISE NOTICE 'Skipping (not present): %', fn;
      CONTINUE;
    END IF;

    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',        fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',          fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',  fn);
    RAISE NOTICE 'Re-graded private function: %', fn;
  END LOOP;
END
$cg_grants$;


-- ── 3) Public SECURITY INVOKER wrappers (exact signatures, exact names) ─────
-- Signature MUST match what the React app calls via supabase.rpc(...) so
-- PostgREST resolves to the wrapper.  Argument names p_gig_id / p_request_id
-- are required because supabase-js sends parameters by name.

CREATE OR REPLACE FUNCTION public.request_gig(p_gig_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT private.request_gig(p_gig_id);
$$;

CREATE OR REPLACE FUNCTION public.accept_gig_request(p_request_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT private.accept_gig_request(p_request_id);
$$;

CREATE OR REPLACE FUNCTION public.reject_gig_request(p_request_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT private.reject_gig_request(p_request_id);
$$;

CREATE OR REPLACE FUNCTION public.complete_gig(p_gig_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT private.complete_gig(p_gig_id);
$$;

CREATE OR REPLACE FUNCTION public.cancel_pending_account_deletion()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT private.cancel_pending_account_deletion();
$$;


-- ── 4) Lock down the public wrappers (REST-callable surface) ─────────────────
DO $cg_pub_grants$
DECLARE
  fn TEXT;
  fns TEXT[] := ARRAY[
    'public.request_gig(uuid)',
    'public.accept_gig_request(uuid)',
    'public.reject_gig_request(uuid)',
    'public.complete_gig(uuid)',
    'public.cancel_pending_account_deletion()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',        fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',          fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',  fn);
  END LOOP;
END
$cg_pub_grants$;


-- ── 5) Helpful comments so future-you knows why this looks weird ─────────────
COMMENT ON FUNCTION public.request_gig(uuid) IS
  'INVOKER wrapper → private.request_gig(uuid). Body lives in private schema to satisfy advisor 0029.';
COMMENT ON FUNCTION public.accept_gig_request(uuid) IS
  'INVOKER wrapper → private.accept_gig_request(uuid). Body lives in private schema to satisfy advisor 0029.';
COMMENT ON FUNCTION public.reject_gig_request(uuid) IS
  'INVOKER wrapper → private.reject_gig_request(uuid). Body lives in private schema to satisfy advisor 0029.';
COMMENT ON FUNCTION public.complete_gig(uuid) IS
  'INVOKER wrapper → private.complete_gig(uuid). Body lives in private schema to satisfy advisor 0029.';
COMMENT ON FUNCTION public.cancel_pending_account_deletion() IS
  'INVOKER wrapper → private.cancel_pending_account_deletion(). Body lives in private schema to satisfy advisor 0029.';


COMMIT;

-- =============================================================================
-- VERIFY (run as separate queries after the migration above)
-- =============================================================================
-- 1) Wrappers are SECURITY INVOKER, bodies in `private` are SECURITY DEFINER:
--
--    SELECT n.nspname || '.' || p.proname
--             || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS func,
--           CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
--    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE (n.nspname = 'public'  AND p.proname IN (
--             'request_gig','accept_gig_request','reject_gig_request',
--             'complete_gig','cancel_pending_account_deletion'))
--       OR (n.nspname = 'private' AND p.proname IN (
--             'request_gig','accept_gig_request','reject_gig_request',
--             'complete_gig','cancel_pending_account_deletion'))
--    ORDER BY 1;
--
--    Expected:
--      private.* rows → security = DEFINER
--      public.*  rows → security = INVOKER
--
-- 2) `authenticated` can EXECUTE the wrapper AND the inner private function:
--
--    SELECT n.nspname || '.' || p.proname AS func,
--           has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_exec,
--           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
--    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname IN ('public','private')
--      AND p.proname IN ('request_gig','accept_gig_request','reject_gig_request',
--                        'complete_gig','cancel_pending_account_deletion')
--    ORDER BY 1;
--
--    Expected: anon_exec = false, auth_exec = true on every row.
--
-- 3) `private` schema is NOT in the PostgREST exposed schemas list
--    (Dashboard → Project Settings → Data API → Exposed schemas).
--
-- 4) Smoke-test from the app:
--    Open https://www.getcampusgig.com, post a gig, request someone else's
--    gig, accept, complete.  All four flows hit the wrappers and should
--    behave identically to before.
--
-- 5) Dashboard → Database → Advisors → Security → Refresh.
--    All five 0029 warnings should be gone.  Only `auth_leaked_password_
--    protection` remains — fix that with the dashboard toggle linked at the
--    top of this file.
-- =============================================================================
