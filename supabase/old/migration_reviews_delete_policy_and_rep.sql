-- Allow reviewers to delete their own rows; adjust reviewee rep when a review is removed.

BEGIN;

DROP POLICY IF EXISTS "Reviewers can delete own reviews" ON public.reviews;
CREATE POLICY "Reviewers can delete own reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.after_review_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r_old INT;
BEGIN
  r_old := ROUND(OLD.rating)::INT;
  UPDATE public.users SET rep_score = rep_score - r_old WHERE id = OLD.reviewee_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_review_delete ON public.reviews;
CREATE TRIGGER trg_after_review_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.after_review_delete();

COMMENT ON FUNCTION public.after_review_delete() IS
  'Subtracts reviewee rep by deleted review star value (mirrors INSERT in after_review_change).';

COMMIT;
