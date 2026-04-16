-- CampusGig — One-shot: fix duplicate_index on public.reviews
-- Linter: identical indexes { reviews_gig_id_reviewer_id_key, reviews_one_per_gig_reviewer }
--
-- Keeps the UNIQUE constraint index (reviews_gig_id_reviewer_id_key) and drops the redundant
-- standalone index created alongside it. Does not modify other migration files.
--
-- Safe to run once; if reviews_one_per_gig_reviewer is already gone, this is a no-op.

BEGIN;

DROP INDEX IF EXISTS public.reviews_one_per_gig_reviewer;

COMMIT;
