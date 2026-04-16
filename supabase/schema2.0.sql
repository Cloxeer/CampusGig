-- ============================================================
-- CampusGig Schema 2.0 (canonical baseline)
-- Consolidates core schema + production migrations into one file.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Users (public profile only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#6366f1',
  avatar_url TEXT,
  rep_score INTEGER NOT NULL DEFAULT 0,
  email_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  app_intro_completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view public user directory" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

CREATE POLICY "Authenticated can view public user directory"
  ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ============================================================
-- User private contact (PII)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_private_contact (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  snapchat VARCHAR(255),
  venmo VARCHAR(255),
  cashapp VARCHAR(255),
  paypal VARCHAR(255),
  instagram VARCHAR(255),
  discord VARCHAR(255),
  zelle VARCHAR(255),
  apple_pay VARCHAR(255),
  google_pay VARCHAR(255),
  contact_favorite_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_private_contact_email_nmsu CHECK (email ~* '@nmsu\.edu$')
);

CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_email_key ON public.user_private_contact (email);
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_phone_key ON public.user_private_contact (phone);
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_snapchat_key ON public.user_private_contact (snapchat) WHERE snapchat IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_venmo_key ON public.user_private_contact (venmo) WHERE venmo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_cashapp_key ON public.user_private_contact (cashapp) WHERE cashapp IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_paypal_key ON public.user_private_contact (paypal) WHERE paypal IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_instagram_key ON public.user_private_contact (instagram) WHERE instagram IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_discord_key ON public.user_private_contact (discord) WHERE discord IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_zelle_key ON public.user_private_contact (zelle) WHERE zelle IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_apple_pay_key ON public.user_private_contact (apple_pay) WHERE apple_pay IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_google_pay_key ON public.user_private_contact (google_pay) WHERE google_pay IS NOT NULL;

ALTER TABLE public.user_private_contact ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read private contact when allowed" ON public.user_private_contact;
DROP POLICY IF EXISTS "Users insert own private contact" ON public.user_private_contact;
DROP POLICY IF EXISTS "Users update own private contact" ON public.user_private_contact;

CREATE POLICY "Users can read private contact when allowed"
  ON public.user_private_contact FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.status IN ('active', 'completed')
        AND g.taker_id IS NOT NULL
        AND (
          (g.poster_id = (SELECT auth.uid()) AND g.taker_id = user_private_contact.user_id)
          OR (g.taker_id = (SELECT auth.uid()) AND g.poster_id = user_private_contact.user_id)
        )
    )
  );
CREATE POLICY "Users insert own private contact"
  ON public.user_private_contact FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own private contact"
  ON public.user_private_contact FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  label VARCHAR(50) NOT NULL UNIQUE,
  icon_name VARCHAR(50) NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT TO authenticated USING (true);

INSERT INTO public.categories (label, icon_name) VALUES
  ('Food', 'Utensils'),
  ('Print', 'Printer'),
  ('Errand', 'Package'),
  ('Notes', 'FileText'),
  ('Delivery', 'Bike'),
  ('Other', 'MessageCircle')
ON CONFLICT (label) DO NOTHING;

-- ============================================================
-- Gigs + requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  taker_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category_id INTEGER NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  location VARCHAR(255),
  estimated_time VARCHAR(100),
  notes TEXT,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'open'
    CONSTRAINT valid_status CHECK (status IN ('open', 'requested', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT expires_after_created CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_gigs_poster ON public.gigs(poster_id);
CREATE INDEX IF NOT EXISTS idx_gigs_taker ON public.gigs(taker_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON public.gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON public.gigs(category_id);
CREATE INDEX IF NOT EXISTS idx_gigs_created ON public.gigs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_open_expires ON public.gigs(expires_at) WHERE status = 'open';

ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view open gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can post gigs" ON public.gigs;
DROP POLICY IF EXISTS "Poster can update own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Poster can delete own gigs" ON public.gigs;

CREATE POLICY "Anyone can view open gigs"
  ON public.gigs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can post gigs"
  ON public.gigs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = poster_id);
CREATE POLICY "Poster can update own gigs"
  ON public.gigs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = poster_id);
CREATE POLICY "Poster can delete own gigs"
  ON public.gigs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = poster_id);

CREATE TABLE IF NOT EXISTS public.gig_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending'
    CONSTRAINT valid_request_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gig_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_gig_requests_gig ON public.gig_requests(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_requests_requester ON public.gig_requests(requester_id);
CREATE UNIQUE INDEX IF NOT EXISTS gig_requests_one_accepted_per_gig
  ON public.gig_requests(gig_id) WHERE status = 'accepted';

ALTER TABLE public.gig_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view relevant requests" ON public.gig_requests;
DROP POLICY IF EXISTS "Poster can update request status" ON public.gig_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.gig_requests;

CREATE POLICY "Users can view relevant requests"
  ON public.gig_requests FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = requester_id
    OR gig_id IN (SELECT id FROM public.gigs WHERE poster_id = (SELECT auth.uid()))
  );
CREATE POLICY "Poster can update request status"
  ON public.gig_requests FOR UPDATE TO authenticated
  USING (gig_id IN (SELECT id FROM public.gigs WHERE poster_id = (SELECT auth.uid())));

-- ============================================================
-- Reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating NUMERIC(2,1) NOT NULL
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5 AND (rating * 2) = ROUND(rating * 2)),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_self_review CHECK (reviewer_id <> reviewee_id),
  CONSTRAINT reviews_gig_reviewer_unique UNIQUE (gig_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_gig ON public.reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviewers can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviewers can delete own reviews" ON public.reviews;

CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = (SELECT auth.uid()));
CREATE POLICY "Reviewers can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()))
  WITH CHECK (reviewer_id = (SELECT auth.uid()));
CREATE POLICY "Reviewers can delete own reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

-- ============================================================
-- Notifications + reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert gig-linked notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
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
      (
        (metadata ? 'requester_id')
        AND ((metadata->>'requester_id')::uuid IS NOT NULL)
        AND (SELECT auth.uid()) IN (((metadata->>'poster_id')::uuid), ((metadata->>'requester_id')::uuid))
        AND user_id IN (((metadata->>'poster_id')::uuid), ((metadata->>'requester_id')::uuid))
      )
      OR (user_id = (SELECT auth.uid()) AND user_id = ((metadata->>'poster_id')::uuid))
    )
  );

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('review', 'gig')),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('harassment','spam','false_info','hate_speech','inappropriate','other')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reports_subject_match CHECK (
    (subject_type = 'review' AND review_id IS NOT NULL AND gig_id IS NULL)
    OR (subject_type = 'gig' AND gig_id IS NOT NULL AND review_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_review_reporter ON public.reports (reporter_id, review_id) WHERE review_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_gig_reporter ON public.reports (reporter_id, gig_id) WHERE gig_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_review ON public.reports (review_id) WHERE review_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_gig ON public.reports (gig_id) WHERE gig_id IS NOT NULL;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_insert_own ON public.reports;
DROP POLICY IF EXISTS reports_select_own ON public.reports;
CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = (SELECT auth.uid()));
CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated USING (reporter_id = (SELECT auth.uid()));

-- ============================================================
-- Account deletion queue
-- ============================================================
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grace_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'completed'))
);
CREATE INDEX IF NOT EXISTS idx_account_deletion_grace ON public.account_deletion_requests (grace_ends_at)
  WHERE status = 'pending';
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own deletion request" ON public.account_deletion_requests;
CREATE POLICY "Users read own deletion request"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- Functions/triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_private_contact_email_nmsu()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~* '@nmsu\.edu$' THEN
    RAISE EXCEPTION 'School email must be an @nmsu.edu address';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_gig_post_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.gigs
  WHERE poster_id = NEW.poster_id
    AND created_at > NOW() - INTERVAL '1 hour';
  IF cnt >= 5 THEN
    RAISE EXCEPTION 'You can post at most 5 gigs per hour. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public._cg_set_gig_lifecycle_ok()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.gig_lifecycle_ok', 'true', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_guard_gig_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.taker_id IS NOT DISTINCT FROM OLD.taker_id THEN
    RETURN NEW;
  END IF;

  IF COALESCE(current_setting('app.gig_lifecycle_ok', true), '') = 'true' THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.uid()) = OLD.poster_id
     AND NEW.status = 'cancelled'
     AND OLD.status IN ('open', 'requested')
     AND NEW.taker_id IS NOT DISTINCT FROM OLD.taker_id THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Gig status or taker may only change through app actions (RPC) or poster cancel';
END;
$$;

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

CREATE OR REPLACE FUNCTION public.award_rep_on_gig_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.users SET rep_score = rep_score + 9 WHERE id = NEW.poster_id;
    IF NEW.taker_id IS NOT NULL THEN
      UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.after_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rf TEXT; rl TEXT; ra TEXT; disp_name TEXT; initials TEXT;
  title_txt TEXT; body_txt TEXT; r_new INT; r_old INT;
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
    NEW.reviewee_id, 'review_received', title_txt, body_txt,
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

CREATE OR REPLACE FUNCTION public.after_review_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE r_old INT;
BEGIN
  r_old := ROUND(OLD.rating)::INT;
  UPDATE public.users SET rep_score = rep_score - r_old WHERE id = OLD.reviewee_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public._cg_display_name(uid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN u.last_name IS NOT NULL AND btrim(u.last_name::text) <> ''
    THEN btrim(u.first_name::text) || ' ' || substring(btrim(u.last_name::text) FROM 1 FOR 1) || '.'
    ELSE COALESCE(NULLIF(btrim(COALESCE(u.first_name::text, '')), ''), 'Someone')
  END
  FROM public.users u WHERE u.id = uid;
$$;

-- Request/accept/reject/complete RPCs are sourced from security hardening.
CREATE OR REPLACE FUNCTION public.request_gig(p_gig_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); g RECORD; rid UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gig not found'; END IF;
  IF g.poster_id = uid THEN RAISE EXCEPTION 'You cannot request your own gig'; END IF;
  IF g.status NOT IN ('open', 'requested') THEN RAISE EXCEPTION 'Gig is not accepting requests'; END IF;
  INSERT INTO public.gig_requests (gig_id, requester_id, status) VALUES (p_gig_id, uid, 'pending') RETURNING id INTO rid;
  PERFORM public._cg_set_gig_lifecycle_ok();
  IF g.status = 'open' THEN UPDATE public.gigs SET status = 'requested' WHERE id = p_gig_id; END IF;
  RETURN rid;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_gig_request(p_request_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); r RECORD; g RECORD;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;
  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND OR g.poster_id <> uid THEN RAISE EXCEPTION 'Only the poster can accept'; END IF;
  IF g.status NOT IN ('open', 'requested') THEN RAISE EXCEPTION 'Gig cannot be accepted in this state'; END IF;
  UPDATE public.gig_requests SET status = 'accepted' WHERE id = p_request_id;
  UPDATE public.gig_requests SET status = 'rejected' WHERE gig_id = g.id AND id <> p_request_id AND status = 'pending';
  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs SET taker_id = r.requester_id, status = 'active' WHERE id = g.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_gig_request(p_request_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); r RECORD; g RECORD; pending_left INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;
  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND OR g.poster_id <> uid THEN RAISE EXCEPTION 'Only the poster can reject'; END IF;
  UPDATE public.gig_requests SET status = 'rejected' WHERE id = p_request_id AND status = 'pending';
  SELECT COUNT(*) INTO pending_left FROM public.gig_requests WHERE gig_id = g.id AND status = 'pending';
  IF pending_left = 0 AND g.status = 'requested' THEN
    PERFORM public._cg_set_gig_lifecycle_ok();
    UPDATE public.gigs SET status = 'open' WHERE id = g.id;
  END IF;
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

CREATE OR REPLACE FUNCTION public.request_account_deletion() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.account_deletion_requests (user_id, requested_at, grace_ends_at, status)
  VALUES (uid, now(), now() + interval '15 days', 'pending')
  ON CONFLICT (user_id) DO UPDATE SET requested_at = EXCLUDED.requested_at, grace_ends_at = EXCLUDED.grace_ends_at, status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pending_account_deletion() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); n INT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.account_deletion_requests SET status = 'cancelled' WHERE user_id = uid AND status = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS set_gigs_updated_at ON public.gigs;
DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
DROP TRIGGER IF EXISTS set_user_private_contact_updated_at ON public.user_private_contact;
DROP TRIGGER IF EXISTS trg_gig_rate_limit ON public.gigs;
DROP TRIGGER IF EXISTS trg_guard_gig_lifecycle ON public.gigs;
DROP TRIGGER IF EXISTS trg_reviews_require_completed_gig ON public.reviews;
DROP TRIGGER IF EXISTS trg_rep_gig_post ON public.gigs;
DROP TRIGGER IF EXISTS trg_rep_gig_complete ON public.gigs;
DROP TRIGGER IF EXISTS trg_after_review_insert ON public.reviews;
DROP TRIGGER IF EXISTS trg_after_review_update ON public.reviews;
DROP TRIGGER IF EXISTS trg_after_review_delete ON public.reviews;
DROP TRIGGER IF EXISTS trg_private_contact_email_nmsu ON public.user_private_contact;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_gigs_updated_at BEFORE UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_user_private_contact_updated_at BEFORE UPDATE ON public.user_private_contact FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_gig_rate_limit BEFORE INSERT ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.enforce_gig_post_rate_limit();
CREATE TRIGGER trg_guard_gig_lifecycle BEFORE UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.trg_guard_gig_lifecycle();
CREATE TRIGGER trg_reviews_require_completed_gig BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.trg_reviews_require_completed_gig();
CREATE TRIGGER trg_rep_gig_post AFTER INSERT ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.award_rep_on_gig_post();
CREATE TRIGGER trg_rep_gig_complete AFTER UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.award_rep_on_gig_complete();
CREATE TRIGGER trg_after_review_insert AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.after_review_change();
CREATE TRIGGER trg_after_review_update AFTER UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.after_review_change();
CREATE TRIGGER trg_after_review_delete AFTER DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.after_review_delete();
CREATE TRIGGER trg_private_contact_email_nmsu
  BEFORE INSERT OR UPDATE OF email ON public.user_private_contact
  FOR EACH ROW EXECUTE FUNCTION public.enforce_private_contact_email_nmsu();

-- auth.users email domain guard (requires auth schema privileges)
CREATE OR REPLACE FUNCTION public.enforce_auth_email_nmsu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~* '@nmsu\.edu$' THEN
    RAISE EXCEPTION 'Only @nmsu.edu email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_auth_email_nmsu_trigger ON auth.users;
CREATE TRIGGER enforce_auth_email_nmsu_trigger
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_auth_email_nmsu();

-- ============================================================
-- Storage (avatars)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- RPC privileges + direct insert hardening
REVOKE ALL ON FUNCTION public.request_gig(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_gig_request(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_gig_request(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_gig(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_pending_account_deletion() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.request_gig(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_gig_request(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_gig_request(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_gig(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_pending_account_deletion() TO authenticated;

REVOKE INSERT ON TABLE public.gig_requests FROM authenticated, anon;

COMMIT;
