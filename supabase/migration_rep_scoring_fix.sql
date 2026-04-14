-- =============================================================================
-- CampusGig — Rep Scoring Fix
-- Run this entire script in Supabase SQL Editor.
--
-- Changes:
--   1. Post a gig: +1 -> +2
--   2. Mark gig done (poster): +9 -> +8, taker stays +10
--   3. Review 0 stars: -10 rep penalty
--   4. complete_gig RPC notification text: +9 -> +8
-- =============================================================================

BEGIN;

-- ── 1) Post a gig: +2 rep (was +1) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.award_rep_on_gig_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users SET rep_score = rep_score + 2 WHERE id = NEW.poster_id;
  RETURN NEW;
END;
$$;

-- ── 2) Complete gig: poster +8 (was +9), taker +10 (unchanged) ─────────────

CREATE OR REPLACE FUNCTION public.award_rep_on_gig_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.users SET rep_score = rep_score + 8 WHERE id = NEW.poster_id;
    IF NEW.taker_id IS NOT NULL THEN
      UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3) Review rep: 0-star = -10 penalty ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.after_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
  rep_delta INT;
BEGIN
  r_new := ROUND(NEW.rating)::INT;

  IF r_new = 0 THEN
    rep_delta := -10;
  ELSE
    rep_delta := r_new;
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE users SET rep_score = GREATEST(rep_score + rep_delta, 0) WHERE id = NEW.reviewee_id;
  ELSIF TG_OP = 'UPDATE' THEN
    r_old := ROUND(OLD.rating)::INT;
    IF r_new IS DISTINCT FROM r_old THEN
      DECLARE
        old_delta INT;
        adjustment INT;
      BEGIN
        IF r_old = 0 THEN old_delta := -10; ELSE old_delta := r_old; END IF;
        adjustment := rep_delta - old_delta;
        UPDATE users SET rep_score = GREATEST(rep_score + adjustment, 0) WHERE id = NEW.reviewee_id;
      END;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.rating IS NOT DISTINCT FROM OLD.rating
     AND NEW.text IS NOT DISTINCT FROM OLD.text THEN
    RETURN NEW;
  END IF;

  SELECT u.first_name, u.last_name, u.avatar_color INTO rf, rl, ra
  FROM users u WHERE u.id = NEW.reviewer_id;

  disp_name := CASE
    WHEN rl IS NOT NULL AND btrim(rl) <> '' THEN btrim(rf) || ' ' || substring(btrim(rl) FROM 1 FOR 1) || '.'
    ELSE COALESCE(NULLIF(btrim(COALESCE(rf, '')), ''), 'Someone')
  END;

  initials := upper(
    COALESCE(substring(btrim(COALESCE(rf, '')) FROM 1 FOR 1), '?')
    || COALESCE(substring(btrim(COALESCE(rl, '')) FROM 1 FOR 1), '')
  );

  IF TG_OP = 'INSERT' THEN
    IF r_new = 0 THEN
      title_txt := 'You received a 0-star review';
      body_txt := disp_name || ' gave you 0 stars · -10 Rep';
    ELSE
      title_txt := 'You received a ' || r_new || '-star review';
      body_txt := disp_name || ' rated you · +' || r_new || ' Rep';
    END IF;
  ELSE
    IF r_new IS DISTINCT FROM r_old THEN
      title_txt := 'A review was updated (' || r_new || ' stars)';
      body_txt := disp_name || ' changed their rating · your Rep was adjusted';
    ELSE
      title_txt := 'A review was updated';
      body_txt := disp_name || ' edited their review';
    END IF;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
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

-- ── 4) complete_gig RPC: poster notification +8 (was +9) ───────────────────

CREATE OR REPLACE FUNCTION public.complete_gig(p_gig_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  g RECORD;
  tname TEXT;
  pname TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id <> uid THEN
    RAISE EXCEPTION 'Only the poster can mark a gig as done';
  END IF;
  IF g.status <> 'active' THEN
    RAISE EXCEPTION 'Gig must be active to complete';
  END IF;

  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs SET status = 'completed' WHERE id = p_gig_id;

  tname := COALESCE(public._cg_display_name(g.taker_id), 'Someone');
  pname := COALESCE(public._cg_display_name(g.poster_id), 'Someone');

  IF g.taker_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      g.taker_id,
      'gig_completed',
      'Gig completed! +10 Rep',
      g.title || ' · ' || pname || ' marked it done — you earned +10 Rep',
      jsonb_build_object(
        'gig_id', p_gig_id,
        'requester_id', g.taker_id,
        'poster_id', g.poster_id,
        'role', 'requester',
        'other_name', pname
      )
    );
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    uid,
    'gig_completed',
    'Gig marked as done! +8 Rep',
    CASE
      WHEN g.taker_id IS NOT NULL
      THEN g.title || ' · You earned +8 · ' || tname || ' earned +10'
      ELSE g.title || ' · +8 Rep'
    END,
    jsonb_build_object(
      'gig_id', p_gig_id,
      'requester_id', g.taker_id,
      'poster_id', g.poster_id,
      'role', 'poster',
      'other_name', tname
    )
  );
END;
$$;

COMMIT;
