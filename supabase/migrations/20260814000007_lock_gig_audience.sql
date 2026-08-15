-- ============================================================
-- CampusGig — Lock gig audience against post-hoc edits
-- ------------------------------------------------------------
-- stamp_gig_audience ran on INSERT only, so a poster could UPDATE
-- their gig's audience afterward (e.g. a student flipping a campus
-- gig to 'everyone', exposing student-to-student work publicly).
-- Re-stamping on every write makes audience permanently derived
-- from the poster's account type. Idempotent.
-- ============================================================

BEGIN;

DROP TRIGGER IF EXISTS trg_stamp_gig_audience ON public.gigs;
CREATE TRIGGER trg_stamp_gig_audience
  BEFORE INSERT OR UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.stamp_gig_audience();

COMMIT;

-- VERIFY (run separately; expect audience unchanged = 'students_only'):
--   UPDATE public.gigs SET audience = 'everyone'
--     WHERE id = (SELECT id FROM public.gigs LIMIT 1) RETURNING audience;
