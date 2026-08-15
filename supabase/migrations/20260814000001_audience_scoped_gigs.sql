-- ============================================================
-- CampusGig — Audience-scoped gig visibility + public feed (v2, corrected)
-- ------------------------------------------------------------
-- Fixes vs the first draft:
--   • Removes the pre-existing "Anon can count gigs/users" policies,
--     which used `USING (true)` and therefore leaked FULL ROWS (not just
--     counts) of every gig and every user to logged-out visitors.
--   • Routes the splash public stats through a private-wrapped RPC so the
--     marketing counts stay accurate WITHOUT exposing any rows.
--   • Avoids RLS "infinite recursion" by doing the verified-student check
--     through a SECURITY DEFINER helper (bypasses users RLS) instead of a
--     users subquery inside the gigs policy (users policy references gigs).
--
-- Safety boundary (enforced in DB, never UI-only):
--   • Student-posted gigs  → verified students only.
--   • Client-posted gigs   → everyone (incl. logged-out), while OPEN.
--   • A poster always sees their own gigs.
--
-- Idempotent one-shot. Depends on migration 20260814000000 (adds
-- users.is_verified_student / account_type) — already applied.
-- ============================================================

BEGIN;

-- 0) Private schema present + usable by anon (for the helpers below).
--    USAGE alone exposes nothing executable; per-function EXECUTE is granted
--    explicitly. PostgREST never publishes the private schema.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- 1) gigs.audience — derived, authoritative
ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS audience VARCHAR(20) NOT NULL DEFAULT 'students_only';
ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_audience_valid;
ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_audience_valid CHECK (audience IN ('everyone', 'students_only'));
CREATE INDEX IF NOT EXISTS idx_gigs_audience ON public.gigs(audience);
COMMENT ON COLUMN public.gigs.audience IS
  'Who may see this gig: everyone (client-posted) | students_only (student-posted). Stamped from poster type at insert.';

CREATE OR REPLACE FUNCTION public.stamp_gig_audience()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_student BOOLEAN;
BEGIN
  SELECT is_verified_student INTO v_student FROM public.users WHERE id = NEW.poster_id;
  NEW.audience := CASE WHEN COALESCE(v_student, false) THEN 'students_only' ELSE 'everyone' END;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_stamp_gig_audience ON public.gigs;
CREATE TRIGGER trg_stamp_gig_audience
  BEFORE INSERT ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.stamp_gig_audience();
REVOKE ALL ON FUNCTION public.stamp_gig_audience() FROM PUBLIC, anon, authenticated;

UPDATE public.gigs g SET audience = CASE
  WHEN EXISTS (SELECT 1 FROM public.users u WHERE u.id = g.poster_id AND u.is_verified_student)
  THEN 'students_only' ELSE 'everyone' END;

-- 2) Non-recursive verified-student check.
--    SECURITY DEFINER => reads users WITHOUT triggering users RLS, so the
--    gigs policy below never cycles back through the users anon policy.
CREATE OR REPLACE FUNCTION private.is_verified_student(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = uid AND is_verified_student); $$;
REVOKE ALL ON FUNCTION private.is_verified_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_verified_student(uuid) TO anon, authenticated, service_role;

-- 3) gigs visibility — replace BOTH permissive SELECT policies
DROP POLICY IF EXISTS "Anon can count gigs" ON public.gigs;            -- the leak
DROP POLICY IF EXISTS "Anyone can view open gigs" ON public.gigs;
DROP POLICY IF EXISTS "Audience-scoped gig visibility" ON public.gigs;
CREATE POLICY "Audience-scoped gig visibility"
  ON public.gigs FOR SELECT TO anon, authenticated
  USING (
    (audience = 'everyone' AND status = 'open')            -- public: open outsider gigs
    OR poster_id = (SELECT auth.uid())                     -- poster manages own
    OR private.is_verified_student((SELECT auth.uid()))    -- students see all
  );

-- 4) users — drop the anon full-directory leak; add scoped anon read.
--    Authenticated directory policy is left untouched.
DROP POLICY IF EXISTS "Anon can count users" ON public.users;          -- the leak
DROP POLICY IF EXISTS "Anon can view posters of open outsider gigs" ON public.users;
CREATE POLICY "Anon can view posters of open outsider gigs"
  ON public.users FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.gigs g
    WHERE g.poster_id = users.id AND g.audience = 'everyone' AND g.status = 'open'
  ));

-- 5) reviews — scoped anon read (poster rating on public cards)
DROP POLICY IF EXISTS "Anon can view reviews of open outsider posters" ON public.reviews;
CREATE POLICY "Anon can view reviews of open outsider posters"
  ON public.reviews FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.gigs g
    WHERE g.poster_id = reviews.reviewee_id AND g.audience = 'everyone' AND g.status = 'open'
  ));

-- 6) categories — anon read (labels on public cards)
DROP POLICY IF EXISTS "Anon can read categories" ON public.categories;
CREATE POLICY "Anon can read categories"
  ON public.categories FOR SELECT TO anon USING (true);

-- 7) Table grants for anon (RLS still gates which rows)
GRANT SELECT ON public.gigs TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.categories TO anon;

-- 8) Public splash stats via private-wrapped RPC.
--    Replaces the deleted "Anon can count *" policies: accurate global
--    counts, zero row exposure, and no advisor 0028/0029 warning (INVOKER
--    wrapper in public, DEFINER body in the unexposed private schema).
CREATE OR REPLACE FUNCTION private.get_public_stats()
RETURNS TABLE (total_postings bigint, completed bigint, accounts bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    (SELECT count(*) FROM public.gigs),
    (SELECT count(*) FROM public.gigs WHERE status = 'completed'),
    (SELECT count(*) FROM public.users);
$$;
REVOKE ALL ON FUNCTION private.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_public_stats() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE (total_postings bigint, completed bigint, accounts bigint)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$ SELECT * FROM private.get_public_stats(); $$;
REVOKE ALL ON FUNCTION public.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_public_stats() IS
  'INVOKER wrapper → private.get_public_stats(). Body in private schema to satisfy advisor 0029.';

COMMIT;
