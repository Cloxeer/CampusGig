-- Applied live as schema_migrations 20260826011257_reports_inbox_and_daily_gig_cap
-- Widens reports (gig/review/user/bug/support) and caps gig posts at 3 per 24 hours.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reason_check;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_subject_match;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_subject_type_check;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status = ANY (ARRAY['open'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text]));

ALTER TABLE public.reports
  ADD CONSTRAINT reports_subject_type_check
  CHECK (subject_type = ANY (ARRAY['gig'::text, 'review'::text, 'user'::text, 'bug'::text, 'support'::text]));

ALTER TABLE public.reports
  ADD CONSTRAINT reports_subject_match
  CHECK (
    (subject_type = 'gig' AND gig_id IS NOT NULL AND review_id IS NULL AND reported_user_id IS NULL)
    OR (subject_type = 'review' AND review_id IS NOT NULL AND gig_id IS NULL AND reported_user_id IS NULL)
    OR (subject_type = 'user' AND reported_user_id IS NOT NULL AND gig_id IS NULL AND review_id IS NULL AND reported_user_id <> reporter_id)
    OR (subject_type = 'bug' AND gig_id IS NULL AND review_id IS NULL AND reported_user_id IS NULL)
    OR (subject_type = 'support' AND gig_id IS NULL AND review_id IS NULL AND reported_user_id IS NULL)
  );

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reason_shape
  CHECK (
    (subject_type = ANY (ARRAY['gig'::text, 'review'::text, 'user'::text])
      AND reason = ANY (ARRAY['harassment'::text, 'spam'::text, 'false_info'::text, 'hate_speech'::text, 'inappropriate'::text, 'other'::text]))
    OR (subject_type = 'bug' AND char_length(reason) >= 1 AND char_length(reason) <= 200)
    OR (subject_type = 'support' AND char_length(reason) >= 1 AND char_length(reason) <= 320)
  );

CREATE UNIQUE INDEX IF NOT EXISTS reports_once_per_gig
  ON public.reports (reporter_id, gig_id) WHERE subject_type = 'gig';
CREATE UNIQUE INDEX IF NOT EXISTS reports_once_per_review
  ON public.reports (reporter_id, review_id) WHERE subject_type = 'review';
CREATE UNIQUE INDEX IF NOT EXISTS reports_once_per_user
  ON public.reports (reporter_id, reported_user_id) WHERE subject_type = 'user';
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user
  ON public.reports (reported_user_id);

CREATE OR REPLACE FUNCTION public.enforce_report_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.reports
  WHERE reporter_id = NEW.reporter_id
    AND created_at > NOW() - INTERVAL '1 hour';
  IF cnt >= 8 THEN
    RAISE EXCEPTION 'You can send at most 8 reports per hour. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_rate_limit ON public.reports;
CREATE TRIGGER trg_report_rate_limit
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_report_rate_limit();

CREATE OR REPLACE FUNCTION public.enforce_gig_post_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.gigs
  WHERE poster_id = NEW.poster_id
    AND created_at > NOW() - INTERVAL '24 hours';
  IF cnt >= 3 THEN
    RAISE EXCEPTION 'You can post at most 3 gigs per day. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON TABLE public.reports IS
  'User safety + help inbox. subject_type: gig | review | user | bug | support. Users INSERT own rows; founders read via dashboard SQL.';
