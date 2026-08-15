-- ============================================================
-- CampusGig — Account deletion worker
-- ------------------------------------------------------------
-- Makes the Privacy Policy's deletion promise TRUE: a daily job that
-- permanently purges accounts whose 15-day grace period has passed.
--
-- Deletion order per user:
--   1. Avatar files in the storage bucket (public URLs stop resolving).
--   2. public.users row — FK cascades wipe user_private_contact (PII incl.
--      phone), passcode record, notifications, reviews, gig_requests,
--      posted gigs, and reports. taker_id on others' gigs → NULL.
--      (account_deletion_requests row cascades away too — data minimization.)
--   3. auth.users row — removes the login identity itself.
--
-- Requires the pg_cron extension. If CREATE EXTENSION fails, enable it in
-- Dashboard → Database → Extensions → pg_cron, then re-run this file.
-- Idempotent one-shot.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.process_due_account_deletions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage, pg_temp
AS $$
DECLARE
  r RECORD;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT user_id
    FROM public.account_deletion_requests
    WHERE status = 'pending' AND grace_ends_at <= now()
  LOOP
    DELETE FROM storage.objects
      WHERE bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = r.user_id::text;
    DELETE FROM public.users WHERE id = r.user_id;
    DELETE FROM auth.users WHERE id = r.user_id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

-- Trigger-style privileged helper: never callable over the API.
REVOKE ALL ON FUNCTION private.process_due_account_deletions() FROM PUBLIC, anon, authenticated;

-- Daily at 03:17 UTC. Unschedule-then-schedule keeps re-runs clean.
DO $$
BEGIN
  PERFORM cron.unschedule('campusgig-process-account-deletions');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job didn't exist yet
END;
$$;

SELECT cron.schedule(
  'campusgig-process-account-deletions',
  '17 3 * * *',
  $$SELECT private.process_due_account_deletions();$$
);

COMMIT;

-- VERIFY (run separately):
--   SELECT jobname, schedule FROM cron.job;                       -- job exists
--   SELECT private.process_due_account_deletions();               -- manual run; returns count purged
