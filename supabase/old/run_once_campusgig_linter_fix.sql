-- ============================================================
-- CampusGig — ONE-SHOT: run this entire file in Supabase SQL Editor
--
-- Fixes Supabase linter:
--   • function_search_path_mutable (update_updated_at, rep triggers)
--   • auth_rls_initplan (wrap auth.uid() as (SELECT auth.uid()))
--   • rls_policy_always_true on notifications INSERT
--   • same initplan pattern on storage.objects avatar policies
--
-- Safe to re-run: policies are dropped and recreated; functions replaced.
--
-- NOT fixable in SQL (enable in Dashboard):
--   Leaked password protection → Auth → Password → HaveIBeenPwned
--   https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
-- ============================================================

-- ── 1) Functions: pin search_path ──────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_rep_on_gig_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.users SET rep_score = rep_score + 1 WHERE id = NEW.poster_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_rep_on_gig_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.users SET rep_score = rep_score + 9 WHERE id = NEW.poster_id;
        IF NEW.taker_id IS NOT NULL THEN
            UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Review: +1 Rep per rounded star on insert; rep delta when rating changes; notify reviewee.
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
  FOR EACH ROW EXECUTE FUNCTION public.after_review_change();

CREATE TRIGGER trg_after_review_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.after_review_change();

-- ── 2) RLS policies: (SELECT auth.uid()) ───────────────────

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
CREATE POLICY "Users can delete own profile"
    ON public.users FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can post gigs" ON public.gigs;
CREATE POLICY "Users can post gigs"
    ON public.gigs FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = poster_id);

DROP POLICY IF EXISTS "Poster can update own gigs" ON public.gigs;
CREATE POLICY "Poster can update own gigs"
    ON public.gigs FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = poster_id OR (SELECT auth.uid()) = taker_id);

DROP POLICY IF EXISTS "Poster can delete own gigs" ON public.gigs;
CREATE POLICY "Poster can delete own gigs"
    ON public.gigs FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = poster_id);

DROP POLICY IF EXISTS "Users can view relevant requests" ON public.gig_requests;
CREATE POLICY "Users can view relevant requests"
    ON public.gig_requests FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = requester_id
        OR gig_id IN (SELECT id FROM public.gigs WHERE poster_id = (SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can create requests" ON public.gig_requests;
CREATE POLICY "Users can create requests"
    ON public.gig_requests FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = requester_id);

DROP POLICY IF EXISTS "Poster can update request status" ON public.gig_requests;
CREATE POLICY "Poster can update request status"
    ON public.gig_requests FOR UPDATE TO authenticated
    USING (
        gig_id IN (SELECT id FROM public.gigs WHERE poster_id = (SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews"
    ON public.reviews FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = reviewer_id);

DROP POLICY IF EXISTS "Reviewers can update own reviews" ON public.reviews;
CREATE POLICY "Reviewers can update own reviews"
    ON public.reviews FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = reviewer_id)
    WITH CHECK ((SELECT auth.uid()) = reviewer_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ── 3) Notifications INSERT (replace permissive policy) ─────

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert gig-linked notifications" ON public.notifications;

CREATE POLICY "Users can insert gig-linked notifications"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (
        (metadata ? 'gig_id')
        AND (metadata ? 'poster_id')
        AND ((metadata->>'gig_id')::uuid IS NOT NULL)
        AND ((metadata->>'poster_id')::uuid IS NOT NULL)
        AND EXISTS (
            SELECT 1 FROM public.gigs g
            WHERE g.id = ((metadata->>'gig_id')::uuid)
              AND g.poster_id = ((metadata->>'poster_id')::uuid)
        )
        AND (
            (metadata ? 'requester_id')
            AND ((metadata->>'requester_id')::uuid IS NOT NULL)
            AND (SELECT auth.uid()) IN (
                ((metadata->>'poster_id')::uuid),
                ((metadata->>'requester_id')::uuid)
            )
            AND user_id IN (
                ((metadata->>'poster_id')::uuid),
                ((metadata->>'requester_id')::uuid)
            )
            OR
            (
                user_id = (SELECT auth.uid())
                AND user_id = ((metadata->>'poster_id')::uuid)
            )
        )
    );

-- ── 4) Storage: avatar policies ────────────────────────────

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
