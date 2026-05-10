-- =============================================================================
-- CampusGig — ONE-SHOT: Lock down SECURITY DEFINER functions
-- (paste the entire file into Supabase → SQL Editor → Run)
--
-- Fixes Supabase advisor lints:
--   • 0028 anon_security_definer_function_executable
--   • 0029 authenticated_security_definer_function_executable
--   (for trigger-only helpers that should NEVER be RPC-callable)
--
-- Strategy
-- ─────────
-- Postgres grants EXECUTE to PUBLIC by default on every CREATE FUNCTION, so
-- PostgREST (Supabase) auto-exposes them at /rest/v1/rpc/<name>.  For
-- SECURITY DEFINER functions that's risky: anyone with the anon key could
-- invoke them and run code as the function owner.
--
-- BUT — triggers DO NOT consult EXECUTE privileges.  When a row is inserted
-- or updated the trigger fires regardless of who has EXECUTE on the trigger
-- function.  So we can safely strip ALL grants from trigger-only helpers
-- without breaking anything.
--
-- For the 5 RPCs that are *intentionally* exposed to the app
-- (accept_gig_request, reject_gig_request, request_gig, complete_gig,
-- cancel_pending_account_deletion) we re-affirm the correct grants so the
-- state is explicit even if a previous migration drifted.  Those will still
-- show as 0029 WARNs in the advisor — that is correct and by design; they
-- need to be callable by signed-in users for the app to work.
--
-- NOT fixable in SQL (must be enabled in the Supabase Dashboard):
--   auth_leaked_password_protection
--   → Dashboard → Authentication → Sign In / Up → Password → toggle
--     "Leaked password protection" (HaveIBeenPwned).
--   https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
--
-- Re-runnable: every block is idempotent and skips functions that don't
-- exist in this database (defensive `to_regprocedure(...) IS NOT NULL`).
-- =============================================================================

BEGIN;

-- ── 1) Trigger-only SECURITY DEFINER helpers — revoke EVERYTHING ─────────────
-- These are attached to triggers (INSERT/UPDATE on reviews, gigs, auth.users,
-- etc.).  Triggers run as the table owner, so removing all EXECUTE grants
-- does NOT affect their normal operation.  It only removes the dangerous
-- ability for anyone with the anon key to call them via /rest/v1/rpc.

DO $cg_lockdown$
DECLARE
  fn TEXT;
  trigger_only_functions TEXT[] := ARRAY[
    'public.after_review_change()',
    'public.award_rep_on_gig_post()',
    'public.award_rep_on_gig_complete()',
    'public.enforce_auth_email_nmsu()',
    'public.enforce_nmsu_domain()',
    'public.rls_auto_enable()'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_only_functions LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',        fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',          fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
      RAISE NOTICE 'Locked down trigger function: %', fn;
    ELSE
      RAISE NOTICE 'Skipped (not in this database): %', fn;
    END IF;
  END LOOP;
END
$cg_lockdown$;


-- ── 2) Intentional app-callable RPCs — re-affirm correct grants ──────────────
-- These RPCs are called from src/lib/profile.js:
--   request_gig / accept_gig_request / reject_gig_request / complete_gig
--   cancel_pending_account_deletion / request_account_deletion
-- They MUST remain callable by `authenticated` (and `service_role` for
-- server-side use).  The advisor will still WARN for them — that is the
-- correct, intentional state.

DO $cg_app_rpcs$
DECLARE
  fn TEXT;
  app_rpc_functions TEXT[] := ARRAY[
    'public.request_gig(uuid)',
    'public.accept_gig_request(uuid)',
    'public.reject_gig_request(uuid)',
    'public.complete_gig(uuid)',
    'public.cancel_pending_account_deletion()',
    'public.request_account_deletion()'
  ];
BEGIN
  FOREACH fn IN ARRAY app_rpc_functions LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      -- Strip default PUBLIC + anon access first…
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',   fn);
      -- …then re-grant only to the roles that legitimately call it.
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',  fn);
      RAISE NOTICE 'Re-affirmed app RPC grants: %', fn;
    ELSE
      RAISE NOTICE 'Skipped (not in this database): %', fn;
    END IF;
  END LOOP;
END
$cg_app_rpcs$;


-- ── 3) Internal helpers — also lock down ─────────────────────────────────────
-- These are called only from inside other SECURITY DEFINER functions
-- (qualified by schema), so PUBLIC/anon never need EXECUTE.

DO $cg_internal$
DECLARE
  fn TEXT;
  internal_functions TEXT[] := ARRAY[
    'public._cg_set_gig_lifecycle_ok()',
    'public._cg_display_name(uuid)',
    'public.trg_guard_gig_lifecycle()',
    'public.trg_reviews_require_completed_gig()'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_functions LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',        fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon',          fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
      RAISE NOTICE 'Locked down internal helper: %', fn;
    END IF;
  END LOOP;
END
$cg_internal$;


-- ── 4) Set search_path on every locked-down function (defense in depth) ──────
-- Pinning search_path on SECURITY DEFINER functions blocks
-- search_path-injection attacks (Supabase lint 0011).  No-op if already set.

DO $cg_search_path$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'after_review_change',
        'award_rep_on_gig_post',
        'award_rep_on_gig_complete',
        'enforce_auth_email_nmsu',
        'enforce_nmsu_domain',
        'rls_auto_enable',
        'request_gig',
        'accept_gig_request',
        'reject_gig_request',
        'complete_gig',
        'cancel_pending_account_deletion',
        'request_account_deletion',
        '_cg_set_gig_lifecycle_ok',
        '_cg_display_name',
        'trg_guard_gig_lifecycle',
        'trg_reviews_require_completed_gig'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      rec.schema_name, rec.func_name, rec.args
    );
  END LOOP;
END
$cg_search_path$;


COMMIT;

-- =============================================================================
-- VERIFY (run these as separate queries after the migration above)
-- =============================================================================
-- 1) Confirm locked-down functions have NO EXECUTE for anon/authenticated:
--
--    SELECT n.nspname || '.' || p.proname AS func,
--           pg_get_function_identity_arguments(p.oid) AS args,
--           has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_can_exec,
--           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec
--    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      AND p.proname IN (
--        'after_review_change','award_rep_on_gig_post','award_rep_on_gig_complete',
--        'enforce_auth_email_nmsu','enforce_nmsu_domain','rls_auto_enable'
--      )
--    ORDER BY 1;
--
--    Expected: anon_can_exec = false AND auth_can_exec = false for every row.
--
-- 2) Confirm app RPCs still callable by authenticated:
--
--    SELECT p.proname,
--           has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_can_exec,
--           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec
--    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      AND p.proname IN (
--        'request_gig','accept_gig_request','reject_gig_request','complete_gig',
--        'cancel_pending_account_deletion','request_account_deletion'
--      );
--
--    Expected: anon_can_exec = false AND auth_can_exec = true.
--
-- 3) Then go to Dashboard → Database → Advisors → Security and click
--    "Refresh".  The 0028 warnings (anon) should disappear entirely.
--    0029 warnings will remain ONLY for the 5 intentional app RPCs above —
--    that is the correct, by-design state.
--
-- 4) Finally, fix the last warning by hand:
--    Dashboard → Authentication → Sign In / Up → Password →
--    enable "Leaked password protection".
-- =============================================================================
