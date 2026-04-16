-- CampusGig — Cancel scheduled account deletion when user signs in again (fresh SIGNED_IN)
-- Run after migration_account_deletion_request.sql
--
-- Product rule: logging out and completing magic-link sign-in proves control of @nmsu.edu
-- and clears a pending deletion request. Page refresh (INITIAL_SESSION) does not cancel.

BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_pending_account_deletion()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  n int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.account_deletion_requests
  SET status = 'cancelled'
  WHERE user_id = uid AND status = 'pending';

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_pending_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_pending_account_deletion() TO authenticated;

COMMENT ON FUNCTION public.cancel_pending_account_deletion() IS
  'Sets pending deletion to cancelled when user re-authenticates; invoked from client on SIGNED_IN only.';

COMMIT;
