-- CampusGig — Content reports (reviews + gigs). Prefer migration_reports_unified_one_shot.sql for prod.
-- This file creates `public.reports` only (no review_reports).

BEGIN;

CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type  TEXT NOT NULL CHECK (subject_type IN ('review', 'gig')),
  review_id     UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  gig_id        UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
  reporter_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL CHECK (reason IN (
    'harassment',
    'spam',
    'false_info',
    'hate_speech',
    'inappropriate',
    'other'
  )),
  details       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reports_subject_match CHECK (
    (subject_type = 'review' AND review_id IS NOT NULL AND gig_id IS NULL)
    OR (subject_type = 'gig' AND gig_id IS NOT NULL AND review_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_review_reporter
  ON public.reports (reporter_id, review_id)
  WHERE review_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_gig_reporter
  ON public.reports (reporter_id, gig_id)
  WHERE gig_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports (reporter_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_insert_own ON public.reports;
DROP POLICY IF EXISTS reports_select_own ON public.reports;

CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()));

COMMENT ON TABLE public.reports IS
  'User-submitted reports on reviews or gigs; subject_type discriminates.';

COMMIT;
