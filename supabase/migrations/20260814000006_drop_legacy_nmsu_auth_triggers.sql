-- ============================================================
-- CampusGig — Drop legacy nmsu-only guards on auth.users (by content)
-- ------------------------------------------------------------
-- Client signups fail with "Database error saving new user": a trigger
-- on auth.users still rejects non-@nmsu.edu emails. Migration
-- 20260814000000 dropped it by the baseline's name, but prod drift means
-- the live trigger may be named differently. This finds ANY custom
-- trigger on auth.users whose function source mentions nmsu and drops
-- both trigger and function. Idempotent; no-ops when nothing matches.
-- ============================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname, p.proname AS func_name, n.nspname AS func_schema
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace cn ON cn.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE cn.nspname = 'auth'
      AND c.relname = 'users'
      AND NOT t.tgisinternal
      AND p.prosrc ILIKE '%nmsu%'
  LOOP
    EXECUTE format('DROP TRIGGER %I ON auth.users', r.tgname);
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I() CASCADE', r.func_schema, r.func_name);
    RAISE NOTICE 'Dropped auth.users trigger % (function %.%)', r.tgname, r.func_schema, r.func_name;
  END LOOP;
END;
$$;

COMMIT;

-- VERIFY (run separately) — lists every remaining custom trigger on auth.users:
--   SELECT t.tgname, n.nspname || '.' || p.proname AS func
--   FROM pg_trigger t
--   JOIN pg_class c ON c.oid = t.tgrelid
--   JOIN pg_namespace cn ON cn.oid = c.relnamespace
--   JOIN pg_proc p ON p.oid = t.tgfoid
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE cn.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;
