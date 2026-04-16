-- One-shot: gigs.completed_at + 48h review window (align with schema2.0.sql)
BEGIN;

ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE public.gigs
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.trg_reviews_require_completed_gig()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  g RECORD;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.gig_id IS NULL THEN
      RAISE EXCEPTION 'reviews.gig_id is required';
    END IF;
    SELECT * INTO g FROM public.gigs WHERE id = NEW.gig_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Review not allowed: need completed gig with both parties';
    END IF;
    IF g.status <> 'completed' OR g.taker_id IS NULL
       OR NEW.reviewer_id NOT IN (g.poster_id, g.taker_id)
       OR NEW.reviewee_id NOT IN (g.poster_id, g.taker_id)
       OR NEW.reviewer_id = NEW.reviewee_id THEN
      RAISE EXCEPTION 'Review not allowed: need completed gig with both parties';
    END IF;
    IF now() > COALESCE(g.completed_at, g.updated_at) + interval '2 days' THEN
      RAISE EXCEPTION 'Review window closed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_gig(p_gig_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); g RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND OR g.poster_id <> uid THEN RAISE EXCEPTION 'Only the poster can mark a gig as done'; END IF;
  IF g.status <> 'active' THEN RAISE EXCEPTION 'Gig must be active to complete'; END IF;
  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs SET status = 'completed', completed_at = now() WHERE id = p_gig_id;
END;
$$;

COMMIT;
