-- CampusGig — Account deletion request (15-day grace; actual purge via ops / Edge Function later)
-- Run once in Supabase SQL Editor.
--
-- Records intent + grace window. Final removal of auth + rows may require a scheduled job
-- or manual admin step after grace_ends_at. RLS: users may only read their own row.

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grace_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_grace ON public.account_deletion_requests (grace_ends_at)
  WHERE status = 'pending';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own deletion request" ON public.account_deletion_requests;
CREATE POLICY "Users read own deletion request"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Inserts only via RPC (SECURITY DEFINER), not direct client INSERT

CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.account_deletion_requests (user_id, requested_at, grace_ends_at, status)
  VALUES (uid, now(), now() + interval '15 days', 'pending')
  ON CONFLICT (user_id) DO UPDATE SET
    requested_at = EXCLUDED.requested_at,
    grace_ends_at = EXCLUDED.grace_ends_at,
    status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;

COMMENT ON TABLE public.account_deletion_requests IS
  'User-initiated deletion schedule; 15-day reclaim window; see Settings + Privacy policy.';

COMMIT;
