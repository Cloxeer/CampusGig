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
        UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.poster_id;
        IF NEW.taker_id IS NOT NULL THEN
            UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_rep_on_5star_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.rating = 5 THEN
        UPDATE public.users SET rep_score = rep_score + 5 WHERE id = NEW.reviewee_id;
    END IF;
    RETURN NEW;
END;
$$;

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
