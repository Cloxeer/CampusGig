-- CampusGig — One review per completed gig (per reviewer), aligned with src/lib/profile.js submitReview()
--
-- App behavior today:
--   • submitReview() upserts by (reviewer_id, gig_id): new gig → new row; same gig → UPDATE.
--   • Legacy schema had UNIQUE(reviewer_id, reviewee_id) which blocked multiple reviews across gigs.
--
-- This migration:
--   1) Drops the old pair-unique constraint if it still exists.
--   2) Sets gig_id NOT NULL (required for per-gig reviews). If this fails, delete or backfill rows
--      where gig_id IS NULL first.
--   3) Unique index on (gig_id, reviewer_id) — one review row per gig per reviewer.
--   4) Trigger on INSERT + UPDATE: completed gig + both parties (same rules as migration_security_hardening).
--   5) Reviews RLS policies: (SELECT auth.uid()) for auth_rls_initplan linter.
--
-- Run order: apply after migration_security_hardening_one_shot.sql if you use that stack; this file is
-- idempotent for constraints/index names but will fail if duplicate (gig_id, reviewer_id) rows exist.

BEGIN;

-- ── 1) Remove legacy “one review per pair forever” ─────────────────────────
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_key;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_unique;

-- ── 2) Require gig_id on every review ─────────────────────────────────────
ALTER TABLE public.reviews ALTER COLUMN gig_id SET NOT NULL;

-- ── 3) One row per (gig, reviewer) — single UNIQUE constraint (one index; avoids duplicate_index lint) ──
DROP INDEX IF EXISTS public.reviews_one_per_gig_reviewer;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_gig_id_reviewer_id_key;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_gig_reviewer_unique;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_gig_reviewer_unique UNIQUE (gig_id, reviewer_id);

-- ── 4) INSERT + UPDATE: completed gig + both parties ───────────────────────
CREATE OR REPLACE FUNCTION public.trg_reviews_require_completed_gig()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.gig_id IS NULL THEN
      RAISE EXCEPTION 'reviews.gig_id is required';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = NEW.gig_id
        AND g.status = 'completed'
        AND g.taker_id IS NOT NULL
        AND NEW.reviewer_id IN (g.poster_id, g.taker_id)
        AND NEW.reviewee_id IN (g.poster_id, g.taker_id)
        AND NEW.reviewer_id <> NEW.reviewee_id
    ) THEN
      RAISE EXCEPTION 'Review not allowed: need completed gig with both parties';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_require_completed_gig ON public.reviews;
CREATE TRIGGER trg_reviews_require_completed_gig
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reviews_require_completed_gig();

COMMENT ON FUNCTION public.trg_reviews_require_completed_gig() IS
  'Ensures each review references a completed gig where reviewer/reviewee are poster/taker.';

-- ── 5) Reviews RLS: auth_rls_initplan ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Reviewers can update own reviews" ON public.reviews;
CREATE POLICY "Reviewers can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()))
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

COMMIT;
