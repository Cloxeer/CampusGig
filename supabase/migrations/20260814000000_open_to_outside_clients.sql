-- ============================================================
-- CampusGig — Open posting to outside (non-student) clients
-- ------------------------------------------------------------
-- Turns the student-only marketplace into a two-sided one:
--   • ANYONE (student or outside client) may POST a gig.
--   • ONLY verified NMSU students may WORK a gig (request/accept).
--
-- The load-bearing safety rule: "verified student" is derived
-- server-side from the auth email domain + confirmation — it is
-- NEVER settable by the client. A password / non-.edu account can
-- never become a student, no matter what it sends.
--
-- Idempotent one-shot. Safe to re-run. Follows schema2.0 patterns.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Account-type columns on public.users (derived, authoritative)
-- ------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'client';

-- Drop-then-add so a re-run with a changed definition stays clean.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_account_type_valid;
ALTER TABLE public.users
  ADD CONSTRAINT users_account_type_valid CHECK (account_type IN ('student', 'client'));

COMMENT ON COLUMN public.users.is_verified_student IS
  'TRUE only when the auth email is a confirmed @nmsu.edu address. Set by trigger; never trust client input.';
COMMENT ON COLUMN public.users.account_type IS
  'Derived label: student | client. Authoritative source is is_verified_student.';

CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);

-- ------------------------------------------------------------
-- 2. Stamp trigger — derives student status from auth.users
--    Runs on every insert/update so the flag can never be spoofed
--    or drift away from the real verified email domain.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_user_account_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_student BOOLEAN;
BEGIN
  SELECT (a.email ~* '@nmsu\.edu$' AND a.email_confirmed_at IS NOT NULL)
    INTO v_student
  FROM auth.users a
  WHERE a.id = NEW.id;

  v_student := COALESCE(v_student, false);
  NEW.is_verified_student := v_student;
  NEW.account_type := CASE WHEN v_student THEN 'student' ELSE 'client' END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_user_account_type ON public.users;
CREATE TRIGGER trg_stamp_user_account_type
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.stamp_user_account_type();

-- Trigger-only helper: not an RPC. Revoke direct EXECUTE (triggers still fire).
REVOKE ALL ON FUNCTION public.stamp_user_account_type() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 3. Backfill existing users (all pre-existing accounts were .edu)
-- ------------------------------------------------------------
UPDATE public.users u SET
  is_verified_student = EXISTS (
    SELECT 1 FROM auth.users a
    WHERE a.id = u.id AND a.email ~* '@nmsu\.edu$' AND a.email_confirmed_at IS NOT NULL
  ),
  account_type = CASE WHEN EXISTS (
    SELECT 1 FROM auth.users a
    WHERE a.id = u.id AND a.email ~* '@nmsu\.edu$' AND a.email_confirmed_at IS NOT NULL
  ) THEN 'student' ELSE 'client' END;

-- ------------------------------------------------------------
-- 4. Remove the auth.users .edu-only wall (outsiders can now sign up)
--    Student status is now enforced by derivation, not by blocking.
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS enforce_auth_email_nmsu_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.enforce_auth_email_nmsu();

-- ------------------------------------------------------------
-- 5. Contact email — .edu required for students, any valid email for clients
-- ------------------------------------------------------------
ALTER TABLE public.user_private_contact
  DROP CONSTRAINT IF EXISTS user_private_contact_email_nmsu;

CREATE OR REPLACE FUNCTION public.enforce_private_contact_email_nmsu()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student BOOLEAN;
BEGIN
  SELECT u.is_verified_student INTO v_student
  FROM public.users u WHERE u.id = NEW.user_id;

  IF COALESCE(v_student, false) THEN
    -- Students keep the school-email invariant.
    IF NEW.email IS NULL OR NEW.email !~* '@nmsu\.edu$' THEN
      RAISE EXCEPTION 'School email must be an @nmsu.edu address';
    END IF;
  ELSE
    -- Clients: any well-formed email.
    IF NEW.email IS NULL OR NEW.email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION 'Please enter a valid email address';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
-- (trigger trg_private_contact_email_nmsu already bound to this function)

-- ------------------------------------------------------------
-- 6. Posting requires a confirmed email (protects the student worker)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_gig_poster_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_confirmed TIMESTAMPTZ;
BEGIN
  SELECT a.email_confirmed_at INTO v_confirmed
  FROM auth.users a WHERE a.id = NEW.poster_id;
  IF v_confirmed IS NULL THEN
    RAISE EXCEPTION 'Please verify your email before posting a gig.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gig_poster_email_confirmed ON public.gigs;
CREATE TRIGGER trg_gig_poster_email_confirmed
  BEFORE INSERT ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_gig_poster_email_confirmed();

-- Trigger-only helper: not an RPC. Revoke direct EXECUTE (triggers still fire).
REVOKE ALL ON FUNCTION public.enforce_gig_poster_email_confirmed() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 7. request_gig — only verified students may take on work.
--    NOTE: production hides RPC bodies behind the `private` schema with a
--    SECURITY INVOKER wrapper in `public` (advisor 0029). We keep that shape:
--    the student-gate body lives in private.request_gig; public.request_gig is
--    a thin wrapper. (gig_requests INSERT is already REVOKED from clients, so
--    this RPC is the single chokepoint and the check here is authoritative.)
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT  USAGE ON SCHEMA private TO authenticated;
GRANT  USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.request_gig(p_gig_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); g RECORD; rid UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = uid AND is_verified_student) THEN
    RAISE EXCEPTION 'Only verified NMSU students can take on gigs';
  END IF;
  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gig not found'; END IF;
  IF g.poster_id = uid THEN RAISE EXCEPTION 'You cannot request your own gig'; END IF;
  IF g.status NOT IN ('open', 'requested') THEN RAISE EXCEPTION 'Gig is not accepting requests'; END IF;
  INSERT INTO public.gig_requests (gig_id, requester_id, status) VALUES (p_gig_id, uid, 'pending') RETURNING id INTO rid;
  PERFORM public._cg_set_gig_lifecycle_ok();
  IF g.status = 'open' THEN UPDATE public.gigs SET status = 'requested' WHERE id = p_gig_id; END IF;
  RETURN rid;
END;
$$;
REVOKE ALL ON FUNCTION private.request_gig(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.request_gig(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_gig(p_gig_id UUID) RETURNS UUID
LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT private.request_gig(p_gig_id);
$$;
REVOKE ALL ON FUNCTION public.request_gig(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_gig(UUID) TO authenticated, service_role;
COMMENT ON FUNCTION public.request_gig(UUID) IS
  'INVOKER wrapper → private.request_gig(uuid). Body lives in private schema to satisfy advisor 0029.';

COMMIT;
