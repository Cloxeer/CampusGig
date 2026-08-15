-- ============================================================
-- CampusGig — Live public stats (trigger-maintained + realtime)
-- ------------------------------------------------------------
-- Replaces per-visitor counting with a single pre-computed stats row:
--   • Triggers on gigs/users keep public.public_stats current — it only
--     changes when the underlying data actually changes.
--   • get_public_stats() becomes a one-row read (microseconds/visitor).
--   • The row is added to the realtime publication, so open welcome
--     pages receive pushed updates instantly over websocket.
-- Idempotent one-shot.
-- ============================================================

BEGIN;

-- 1) Singleton stats row
CREATE TABLE IF NOT EXISTS public.public_stats (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  total_postings BIGINT NOT NULL DEFAULT 0,
  completed BIGINT NOT NULL DEFAULT 0,
  accounts BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_stats ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.public_stats TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read public stats" ON public.public_stats;
CREATE POLICY "Anyone can read public stats"
  ON public.public_stats FOR SELECT TO anon, authenticated USING (true);
-- No INSERT/UPDATE policies: only the trigger-maintained refresh writes it.

-- 2) Recompute helper (SECURITY DEFINER: reads gigs/users regardless of RLS)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.refresh_public_stats() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  INSERT INTO public.public_stats (id, total_postings, completed, accounts, updated_at)
  VALUES (
    true,
    (SELECT count(*) FROM public.gigs),
    (SELECT count(*) FROM public.gigs WHERE status = 'completed'),
    (SELECT count(*) FROM public.users),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_postings = EXCLUDED.total_postings,
    completed = EXCLUDED.completed,
    accounts = EXCLUDED.accounts,
    updated_at = EXCLUDED.updated_at;
END;
$$;
REVOKE ALL ON FUNCTION private.refresh_public_stats() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.trg_refresh_public_stats() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM private.refresh_public_stats();
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION private.trg_refresh_public_stats() FROM PUBLIC, anon, authenticated;

-- 3) Statement-level triggers: stats update only when the data does
DROP TRIGGER IF EXISTS trg_public_stats_gigs ON public.gigs;
CREATE TRIGGER trg_public_stats_gigs
  AFTER INSERT OR DELETE OR UPDATE OF status ON public.gigs
  FOR EACH STATEMENT EXECUTE FUNCTION private.trg_refresh_public_stats();

DROP TRIGGER IF EXISTS trg_public_stats_users ON public.users;
CREATE TRIGGER trg_public_stats_users
  AFTER INSERT OR DELETE ON public.users
  FOR EACH STATEMENT EXECUTE FUNCTION private.trg_refresh_public_stats();

-- 4) Seed the row now
SELECT private.refresh_public_stats();

-- 5) Publish row changes over Supabase Realtime (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.public_stats;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- already published
END;
$$;

-- 6) get_public_stats now reads the maintained row (no counting per visitor).
--    The public INVOKER wrapper from migration 20260814000001 stays as-is.
CREATE OR REPLACE FUNCTION private.get_public_stats()
RETURNS TABLE (total_postings bigint, completed bigint, accounts bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT s.total_postings, s.completed, s.accounts
  FROM public.public_stats s
  WHERE s.id;
$$;
REVOKE ALL ON FUNCTION private.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_public_stats() TO anon, authenticated, service_role;

COMMIT;

-- VERIFY (run separately):
--   SELECT * FROM public.public_stats;                    -- seeded row with real counts
--   SELECT * FROM public.get_public_stats();              -- same numbers via the RPC
