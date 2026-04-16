-- CampusGig — Unified `public.reports` (review + gig). Drops legacy `review_reports`.
--
-- Safe INSERT: only rows that satisfy FKs (review exists, reporter exists in public.users).
-- Run once in Supabase SQL Editor. If it still fails, check error message (often FK or permissions).

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
CREATE INDEX IF NOT EXISTS idx_reports_review ON public.reports (review_id) WHERE review_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_gig ON public.reports (gig_id) WHERE gig_id IS NOT NULL;

-- Copy legacy rows only when FKs are valid (avoids failed INSERT rolling back the whole transaction)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'review_reports'
  ) THEN
    INSERT INTO public.reports (subject_type, review_id, gig_id, reporter_id, reason, details, created_at)
    SELECT
      'review',
      rr.review_id,
      NULL,
      rr.reporter_id,
      rr.reason,
      rr.details,
      rr.created_at
    FROM public.review_reports rr
    INNER JOIN public.reviews rv ON rv.id = rr.review_id
    INNER JOIN public.users u ON u.id = rr.reporter_id
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.reports x
      WHERE x.subject_type = 'review'
        AND x.review_id = rr.review_id
        AND x.reporter_id = rr.reporter_id
    );
  END IF;
END $$;

DROP TABLE IF EXISTS public.review_reports CASCADE;

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
  'User reports on reviews or gigs (subject_type). Legacy review_reports removed.';

COMMIT;
