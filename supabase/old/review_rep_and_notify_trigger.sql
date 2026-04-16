-- Paste this whole file into Supabase → SQL Editor → Run once.
-- Rep: +1 per rounded star on new review; on rating edit, applies delta (e.g. 5→4 = -1).
-- Alerts: inserts type `review_received` for the reviewee (SECURITY DEFINER bypasses RLS).

DROP TRIGGER IF EXISTS trg_rep_5star_review ON public.reviews;
DROP TRIGGER IF EXISTS trg_after_review_insert ON public.reviews;
DROP TRIGGER IF EXISTS trg_after_review_update ON public.reviews;
DROP FUNCTION IF EXISTS public.award_rep_on_5star_review();

CREATE OR REPLACE FUNCTION public.after_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rf TEXT;
  rl TEXT;
  ra TEXT;
  disp_name TEXT;
  initials TEXT;
  title_txt TEXT;
  body_txt TEXT;
  r_new INT;
  r_old INT;
BEGIN
  r_new := ROUND(NEW.rating)::INT;

  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET rep_score = rep_score + r_new WHERE id = NEW.reviewee_id;
  ELSIF TG_OP = 'UPDATE' THEN
    r_old := ROUND(OLD.rating)::INT;
    IF r_new IS DISTINCT FROM r_old THEN
      UPDATE public.users SET rep_score = rep_score + (r_new - r_old) WHERE id = NEW.reviewee_id;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.rating IS NOT DISTINCT FROM OLD.rating
     AND NEW.text IS NOT DISTINCT FROM OLD.text THEN
    RETURN NEW;
  END IF;

  SELECT u.first_name, u.last_name, u.avatar_color INTO rf, rl, ra
  FROM public.users u WHERE u.id = NEW.reviewer_id;

  disp_name := CASE
    WHEN rl IS NOT NULL AND btrim(rl) <> '' THEN btrim(rf) || ' ' || substring(btrim(rl) FROM 1 FOR 1) || '.'
    ELSE COALESCE(NULLIF(btrim(COALESCE(rf, '')), ''), 'Someone')
  END;

  initials := upper(
    COALESCE(substring(btrim(COALESCE(rf, '')) FROM 1 FOR 1), '?')
    || COALESCE(substring(btrim(COALESCE(rl, '')) FROM 1 FOR 1), '')
  );

  IF TG_OP = 'INSERT' THEN
    title_txt := 'You received a ' || r_new || '-star review';
    body_txt := disp_name || ' rated you · +' || r_new || ' Rep';
  ELSE
    IF r_new IS DISTINCT FROM r_old THEN
      title_txt := 'A review was updated (' || r_new || ' stars)';
      body_txt := disp_name || ' changed their rating · your Rep was adjusted';
    ELSE
      title_txt := 'A review was updated';
      body_txt := disp_name || ' edited their review';
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    NEW.reviewee_id,
    'review_received',
    title_txt,
    body_txt,
    jsonb_build_object(
      'reviewer_id', NEW.reviewer_id,
      'reviewee_id', NEW.reviewee_id,
      'gig_id', NEW.gig_id,
      'rating', NEW.rating,
      'other_avatar_color', COALESCE(ra, '#6366f1'),
      'other_initials', initials,
      'other_name', disp_name
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_after_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.after_review_change();

CREATE TRIGGER trg_after_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.after_review_change();
