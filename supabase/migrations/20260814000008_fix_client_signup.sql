-- ============================================================
-- CampusGig — Fix client signup ("Database error saving new user")
-- ------------------------------------------------------------
-- Non-@nmsu.edu (client) signups still fail at the GoTrue auth.users
-- INSERT with "Database error saving new user". That error is raised
-- when a BEFORE trigger on auth.users throws. Migration 00006 dropped
-- auth.users triggers whose function body literally contained 'nmsu',
-- but prod drift means a leftover email-domain guard whose body checks
-- '.edu' (or reads a domains table) without the literal string 'nmsu'
-- survives 00006 and keeps rejecting clients.
--
-- The two-sided design relies on NO custom trigger on auth.users:
-- the public.users profile row is created client-side by Onboarding,
-- and verified-student status is derived by public.stamp_user_account_type
-- (a trigger on public.users, untouched here). So the definitive fix is
-- to drop every remaining NON-INTERNAL trigger on auth.users along with
-- its owning function. Supabase's own internal triggers (tgisinternal)
-- are left in place.
--
-- Idempotent one-shot. No-ops once auth.users has no custom triggers.
-- ============================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname,
           p.proname     AS func_name,
           n.nspname     AS func_schema,
           pg_get_function_identity_arguments(p.oid) AS func_args
    FROM pg_trigger t
    JOIN pg_class      c  ON c.oid  = t.tgrelid
    JOIN pg_namespace  cn ON cn.oid = c.relnamespace
    JOIN pg_proc       p  ON p.oid  = t.tgfoid
    JOIN pg_namespace  n  ON n.oid  = p.pronamespace
    WHERE cn.nspname = 'auth'
      AND c.relname  = 'users'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
    -- Drop the owning function too, but never one that lives in a Supabase
    -- system schema (auth/storage/etc.) — only app-owned functions.
    IF r.func_schema NOT IN ('auth', 'storage', 'extensions', 'graphql', 'realtime', 'pgbouncer') THEN
      EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                     r.func_schema, r.func_name, r.func_args);
    END IF;
    RAISE NOTICE 'Dropped auth.users trigger % (function %.%(%))',
      r.tgname, r.func_schema, r.func_name, r.func_args;
  END LOOP;
END;
$$;

COMMIT;

-- VERIFY (run separately) — expect ZERO rows (no custom auth.users triggers):
--   SELECT t.tgname, n.nspname || '.' || p.proname AS func
--   FROM pg_trigger t
--   JOIN pg_class c       ON c.oid  = t.tgrelid
--   JOIN pg_namespace cn  ON cn.oid = c.relnamespace
--   JOIN pg_proc p        ON p.oid  = t.tgfoid
--   JOIN pg_namespace n   ON n.oid  = p.pronamespace
--   WHERE cn.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;
--
-- Then smoke-test end-to-end with a real NON-.edu inbox:
--   picker → "I'm hiring" → magic link → onboarding → post a gig →
--   confirm it shows on the LOGGED-OUT home feed with no student badge.
