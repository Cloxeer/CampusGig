-- "How did you hear about us?" — optional signup attribution.
--
-- Captured on the signup form, carried through auth metadata, and written on the
-- profile insert (src/lib/users.js createProfile). Nullable — most signups may
-- leave it blank. The CHECK whitelists the known codes the app sends; if you add
-- an option in REFERRAL_OPTIONS (src/pages/Auth.jsx), add it here too (or drop
-- the constraint for free-form values). Safe & idempotent.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_source TEXT;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_referral_source_valid;
ALTER TABLE public.users
  ADD CONSTRAINT users_referral_source_valid
  CHECK (referral_source IS NULL OR referral_source IN (
    'search_engine', 'poster', 'friend', 'hackathon', 'social_media', 'other'
  ));

COMMENT ON COLUMN public.users.referral_source IS
  'Optional signup attribution ("how did you hear about us"). One of the codes in REFERRAL_OPTIONS, or NULL.';

-- Attribution report (run anytime):
--   SELECT COALESCE(referral_source, '(not set)') AS source, COUNT(*)
--   FROM public.users GROUP BY 1 ORDER BY 2 DESC;
