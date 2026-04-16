-- CampusGig — One-shot: duplicate index on reviews only.
-- For unified reporting table use migration_reports_unified_one_shot.sql (creates public.reports, drops review_reports).

BEGIN;

DROP INDEX IF EXISTS public.reviews_one_per_gig_reviewer;

COMMIT;
