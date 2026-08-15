-- ============================================================
-- CampusGig — Repair: account deletion request table + RPCs
-- ------------------------------------------------------------
-- Production drift: public.account_deletion_requests (and its RPCs)
-- existed in the repo baseline (schema2.0.sql) but were never applied
-- to the live database — so the Settings "Delete account" flow has
-- been silently failing, and the new deletion worker had nothing to
-- read. This creates the table, RLS, and both RPCs using the
-- private-body / public-INVOKER-wrapper pattern (advisor-clean).
-- Idempotent one-shot.
-- ============================================================

BEGIN;

-- 1) Table + index + RLS
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grace_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_grace
  ON public.account_deletion_requests (grace_ends_at)
  WHERE status = 'pending';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.account_deletion_requests TO authenticated;

DROP POLICY IF EXISTS "Users read own deletion request" ON public.account_deletion_requests;
CREATE POLICY "Users read own deletion request"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
-- No INSERT/UPDATE policies: writes happen only through the RPCs below.

-- 2) Private schema present + usable
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 3) Privileged bodies in private (SECURITY DEFINER, not exposed to REST)
CREATE OR REPLACE FUNCTION private.request_account_deletion() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.account_deletion_requests (user_id, requested_at, grace_ends_at, status)
  VALUES (uid, now(), now() + interval '15 days', 'pending')
  ON CONFLICT (user_id) DO UPDATE
    SET requested_at = EXCLUDED.requested_at,
        grace_ends_at = EXCLUDED.grace_ends_at,
        status = 'pending';
END;
$$;
REVOKE ALL ON FUNCTION private.request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.request_account_deletion() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.cancel_pending_account_deletion() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid UUID := auth.uid(); n INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.account_deletion_requests
    SET status = 'cancelled'
    WHERE user_id = uid AND status = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;
REVOKE ALL ON FUNCTION private.cancel_pending_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.cancel_pending_account_deletion() TO authenticated, service_role;

-- 4) Public INVOKER wrappers (what the app calls via supabase.rpc)
CREATE OR REPLACE FUNCTION public.request_account_deletion() RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT private.request_account_deletion();
$$;
REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated, service_role;
COMMENT ON FUNCTION public.request_account_deletion() IS
  'INVOKER wrapper → private.request_account_deletion(). Body lives in private schema to satisfy advisor 0029.';

CREATE OR REPLACE FUNCTION public.cancel_pending_account_deletion() RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT private.cancel_pending_account_deletion();
$$;
REVOKE ALL ON FUNCTION public.cancel_pending_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_pending_account_deletion() TO authenticated, service_role;
COMMENT ON FUNCTION public.cancel_pending_account_deletion() IS
  'INVOKER wrapper → private.cancel_pending_account_deletion(). Body lives in private schema to satisfy advisor 0029.';

COMMIT;

-- VERIFY (run separately):
--   SELECT to_regclass('public.account_deletion_requests');        -- not null
--   SELECT private.process_due_account_deletions();                -- now returns 0 (no due requests)
