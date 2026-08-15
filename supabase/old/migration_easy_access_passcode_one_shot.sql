-- =============================================================================
-- CampusGig — ONE-SHOT: Easy Access Passcode (6-digit PIN) — linter-safe
-- Paste entire file into Supabase → SQL Editor → Run
--
-- What this does
-- ──────────────
-- 1. Adds profile flags on public.users (UI + prompt state).
-- 2. Creates user_easy_access_passcode — bcrypt hash, owner-only RLS.
-- 3. Adds set_easy_access_passcode_record(p_passcode) as SECURITY INVOKER
--    (fixes advisor lint 0029: no SECURITY DEFINER RPC for signed-in users).
--
-- Auth model (two layers)
-- ───────────────────────
-- • Sign-in: Supabase Auth password (signInWithPassword) — set from the app.
-- • Postgres: bcrypt hash + has_easy_access_passcode flag. Plaintext never
--   stored in public.users.
--
-- Dashboard (manual — cannot be fixed in SQL)
-- ───────────────────────────────────────────
-- 1. Authentication → Providers → Email
--    Enable password sign-in alongside magic link. Min password length = 6.
--
-- 2. Authentication → Sign In / Up → Password
--    Enable "Leaked password protection" (HaveIBeenPwned).
--    Fixes advisor lint: auth_leaked_password_protection
--    https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
--
-- Re-runnable: IF NOT EXISTS / CREATE OR REPLACE throughout.
-- Safe to re-run if you already applied an older DEFINER version of this RPC.
-- =============================================================================

BEGIN;

-- ── 1) Users profile flags ───────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS has_easy_access_passcode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS easy_access_passcode_set_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS easy_access_passcode_prompt_dismissed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.has_easy_access_passcode IS
  'True when the user has configured a 6-digit easy access passcode.';

COMMENT ON COLUMN public.users.easy_access_passcode_set_at IS
  'Timestamp when passcode was last set or changed. NULL = not configured.';

COMMENT ON COLUMN public.users.easy_access_passcode_prompt_dismissed_at IS
  'Set when user taps Don''t ask again on the profile setup prompt.';

-- ── 2) Private passcode hash table (owner-only RLS) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.user_easy_access_passcode (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  passcode_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.user_easy_access_passcode IS
  'Bcrypt hash of 6-digit easy access passcode. Owner-only via RLS; not joined in public profile queries.';

ALTER TABLE public.user_easy_access_passcode ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own passcode record" ON public.user_easy_access_passcode;
DROP POLICY IF EXISTS "Owner can insert own passcode record" ON public.user_easy_access_passcode;
DROP POLICY IF EXISTS "Owner can update own passcode record" ON public.user_easy_access_passcode;
DROP POLICY IF EXISTS "Owner can delete own passcode record" ON public.user_easy_access_passcode;

CREATE POLICY "Owner can read own passcode record"
  ON public.user_easy_access_passcode FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Owner can insert own passcode record"
  ON public.user_easy_access_passcode FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Owner can update own passcode record"
  ON public.user_easy_access_passcode FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Owner can delete own passcode record"
  ON public.user_easy_access_passcode FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_user_easy_access_passcode_updated_at ON public.user_easy_access_passcode;
CREATE TRIGGER set_user_easy_access_passcode_updated_at
  BEFORE UPDATE ON public.user_easy_access_passcode
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 3) RPC: SECURITY INVOKER (runs as caller; RLS enforces owner-only writes) ─

CREATE OR REPLACE FUNCTION public.set_easy_access_passcode_record(p_passcode TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  uid UUID := (SELECT auth.uid());
  trimmed TEXT;
  trivial TEXT[] := ARRAY[
    '000000', '111111', '222222', '333333', '444444', '555555',
    '666666', '777777', '888888', '999999', '123456', '654321',
    '012345', '543210', '121212', '101010'
  ];
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  trimmed := trim(p_passcode);

  IF trimmed !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'Passcode must be exactly 6 digits';
  END IF;

  IF trimmed = ANY (trivial) THEN
    RAISE EXCEPTION 'Choose a less obvious passcode';
  END IF;

  INSERT INTO public.user_easy_access_passcode (user_id, passcode_hash, updated_at)
  VALUES (uid, crypt(trimmed, gen_salt('bf', 10)), CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO UPDATE
    SET passcode_hash = EXCLUDED.passcode_hash,
        updated_at = CURRENT_TIMESTAMP;

  UPDATE public.users
  SET has_easy_access_passcode = true,
      easy_access_passcode_set_at = CURRENT_TIMESTAMP
  WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.set_easy_access_passcode_record(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_easy_access_passcode_record(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_easy_access_passcode_record(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_easy_access_passcode_record(TEXT) TO service_role;

COMMIT;

-- =============================================================================
-- After running: re-check Database → Advisors (or Security Advisor).
-- Expected: authenticated_security_definer_function_executable for this RPC
--           should be GONE (function is now SECURITY INVOKER).
--
-- auth_leaked_password_protection remains until you enable it in the Dashboard
-- (see header section 2 above).
-- =============================================================================
