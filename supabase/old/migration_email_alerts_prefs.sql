-- CampusGig — Email alert preference (account-wide, Terms/Privacy aligned)
-- Run once in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
--
-- Purpose:
--   • Store opt-in for transactional emails to the user’s @nmsu.edu address
--     (gig requests, accept/reject, completion, reviews) when you add Resend + Edge Function.
--   • Does NOT send email by itself — backend reads users.email_alerts_enabled + user_private_contact.email.
--
BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_alerts_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.users.email_alerts_enabled IS
  'When true, user may receive transactional emails at their school email for gig alerts and reviews; managed in Settings.';

COMMIT;
