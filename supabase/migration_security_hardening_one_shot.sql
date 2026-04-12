-- =============================================================================
-- CampusGig — ONE-SHOT security hardening (run entire script in Supabase SQL Editor)
--
-- Does:
--   • Splits PII into user_private_contact + tight RLS (self + active/completed counterparty)
--   • Tightens public.users (no phone / payment / email on directory row)
--   • At most one accepted gig_request per gig (partial unique index)
--   • Gig status / taker_id changes only via SECURITY DEFINER RPCs (or poster cancel)
--   • RPCs: request_gig, accept_gig_request, reject_gig_request, complete_gig (atomic + notifications)
--   • Stricter reviews: require completed gig + parties; one review per (gig_id, reviewer)
--   • Stricter notifications INSERT (gig-linked metadata)
--
-- After running: deploy updated src/lib/profile.js (same commit as this file).
--
-- Re-runnable: if users.email is already gone, PII backfill is skipped (already migrated).
-- =============================================================================

BEGIN;

-- ── 0) Helpers ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._cg_set_gig_lifecycle_ok()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('app.gig_lifecycle_ok', 'true', true);
END;
$$;

-- ── 1) Private contact table + backfill ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_private_contact (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  snapchat VARCHAR(255),
  venmo VARCHAR(255),
  cashapp VARCHAR(255),
  paypal VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_private_contact_email_edu CHECK (email ~* '\.edu$')
);

CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_email_key
  ON public.user_private_contact (email);
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_phone_key
  ON public.user_private_contact (phone);
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_snapchat_key
  ON public.user_private_contact (snapchat) WHERE snapchat IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_venmo_key
  ON public.user_private_contact (venmo) WHERE venmo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_cashapp_key
  ON public.user_private_contact (cashapp) WHERE cashapp IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_paypal_key
  ON public.user_private_contact (paypal) WHERE paypal IS NOT NULL;

-- Backfill only when legacy columns still exist (first run). Skip if already migrated.
DO $backfill$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
  ) THEN
    INSERT INTO public.user_private_contact (user_id, email, phone, snapchat, venmo, cashapp, paypal)
    SELECT u.id, u.email, u.phone, u.snapchat, u.venmo, u.cashapp, u.paypal
    FROM public.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.user_private_contact c WHERE c.user_id = u.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END
$backfill$;

-- Column drops remove attached UNIQUE/CHECK constraints automatically.
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
ALTER TABLE public.users DROP COLUMN IF EXISTS snapchat;
ALTER TABLE public.users DROP COLUMN IF EXISTS venmo;
ALTER TABLE public.users DROP COLUMN IF EXISTS cashapp;
ALTER TABLE public.users DROP COLUMN IF EXISTS paypal;

ALTER TABLE public.user_private_contact ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own private contact" ON public.user_private_contact;
DROP POLICY IF EXISTS "Users read counterparty private contact" ON public.user_private_contact;
DROP POLICY IF EXISTS "Users can read private contact when allowed" ON public.user_private_contact;
-- Single SELECT policy (avoids multiple-permissive-policy linter noise)
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

DROP POLICY IF EXISTS "Users insert own private contact" ON public.user_private_contact;
CREATE POLICY "Users insert own private contact"
  ON public.user_private_contact FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own private contact" ON public.user_private_contact;
CREATE POLICY "Users update own private contact"
  ON public.user_private_contact FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_user_private_contact_updated_at ON public.user_private_contact;
CREATE TRIGGER set_user_private_contact_updated_at
  BEFORE UPDATE ON public.user_private_contact
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Public directory: names + avatars + rep only (no PII columns left on users)
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated can view public user directory" ON public.users;
CREATE POLICY "Authenticated can view public user directory"
  ON public.users FOR SELECT TO authenticated
  USING (true);

-- ── 2) One accepted request per gig ───────────────────────────────────────
DROP INDEX IF EXISTS public.gig_requests_one_accepted_per_gig;
CREATE UNIQUE INDEX gig_requests_one_accepted_per_gig
  ON public.gig_requests (gig_id)
  WHERE status = 'accepted';

-- ── 3) Gig lifecycle guard (block raw status/taker changes except poster cancel) ─
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

DROP TRIGGER IF EXISTS trg_guard_gig_lifecycle ON public.gigs;
CREATE TRIGGER trg_guard_gig_lifecycle
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_guard_gig_lifecycle();

-- Poster-only UPDATE on gigs (taker can no longer mutate row)
DROP POLICY IF EXISTS "Poster can update own gigs" ON public.gigs;
CREATE POLICY "Poster can update own gigs"
  ON public.gigs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = poster_id);

-- ── 4) Reviews: drop old pair-unique, require gig + completed participation ─
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_key;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewee_id_unique;

DROP INDEX IF EXISTS public.reviews_one_per_gig_reviewer;
CREATE UNIQUE INDEX reviews_one_per_gig_reviewer
  ON public.reviews (gig_id, reviewer_id)
  WHERE gig_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.trg_reviews_require_completed_gig()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.gig_id IS NULL THEN
      RAISE EXCEPTION 'reviews.gig_id is required';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.gigs g
      WHERE g.id = NEW.gig_id
        AND g.status = 'completed'
        AND g.taker_id IS NOT NULL
        AND NEW.reviewer_id IN (g.poster_id, g.taker_id)
        AND NEW.reviewee_id IN (g.poster_id, g.taker_id)
        AND NEW.reviewer_id <> NEW.reviewee_id
    ) THEN
      RAISE EXCEPTION 'Review not allowed: need completed gig with both parties';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_require_completed_gig ON public.reviews;
CREATE TRIGGER trg_reviews_require_completed_gig
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reviews_require_completed_gig();

-- ── 5) Notifications INSERT (replace permissive) ───────────────────────────
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
      (
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
      )
      OR
      (
        user_id = (SELECT auth.uid())
        AND user_id = ((metadata->>'poster_id')::uuid)
      )
    )
  );

-- ── 6) RPC: display name helper (internal) ────────────────────────────────
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

-- ── 7) request_gig ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_gig(p_gig_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  g RECORD;
  rid UUID;
  pname TEXT;
  rname TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id = uid THEN
    RAISE EXCEPTION 'You cannot request your own gig';
  END IF;
  IF g.status NOT IN ('open', 'requested') THEN
    RAISE EXCEPTION 'Gig is not accepting requests';
  END IF;

  SELECT id INTO rid FROM public.gig_requests
  WHERE gig_id = p_gig_id AND requester_id = uid;
  IF FOUND THEN
    RAISE EXCEPTION 'You already requested this gig';
  END IF;

  INSERT INTO public.gig_requests (gig_id, requester_id, status)
  VALUES (p_gig_id, uid, 'pending')
  RETURNING id INTO rid;

  PERFORM public._cg_set_gig_lifecycle_ok();
  IF g.status = 'open' THEN
    UPDATE public.gigs SET status = 'requested' WHERE id = p_gig_id;
  END IF;

  pname := public._cg_display_name(g.poster_id);
  rname := public._cg_display_name(uid);

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    g.poster_id,
    'gig_requested',
    rname || ' wants to take your gig',
    g.title,
    jsonb_build_object(
      'gig_id', p_gig_id,
      'request_id', rid,
      'requester_id', uid,
      'poster_id', g.poster_id,
      'role', 'poster',
      'other_name', rname
    )
  );

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    uid,
    'gig_request_sent',
    'You requested a gig',
    g.title || ' · Waiting for ' || pname || ' to accept',
    jsonb_build_object(
      'gig_id', p_gig_id,
      'request_id', rid,
      'requester_id', uid,
      'poster_id', g.poster_id,
      'role', 'requester',
      'other_name', pname
    )
  );

  RETURN rid;
END;
$$;

-- ── 8) accept_gig_request ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_gig_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r RECORD;
  g RECORD;
  gtitle TEXT;
  pname TEXT;
  reqname TEXT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id <> uid THEN
    RAISE EXCEPTION 'Only the poster can accept';
  END IF;
  IF g.status NOT IN ('open', 'requested') THEN
    RAISE EXCEPTION 'Gig cannot be accepted in this state';
  END IF;

  UPDATE public.gig_requests SET status = 'accepted' WHERE id = p_request_id;
  UPDATE public.gig_requests
    SET status = 'rejected'
    WHERE gig_id = g.id AND id <> p_request_id AND status = 'pending';

  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs
  SET taker_id = r.requester_id, status = 'active'
  WHERE id = g.id;

  gtitle := g.title;
  pname := public._cg_display_name(uid);
  reqname := public._cg_display_name(r.requester_id);

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    r.requester_id,
    'gig_accepted',
    pname || ' accepted your request!',
    gtitle || ' · Tap to see contact info',
    jsonb_build_object(
      'gig_id', g.id,
      'request_id', p_request_id,
      'requester_id', r.requester_id,
      'poster_id', g.poster_id,
      'role', 'requester',
      'other_name', pname
    )
  );

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    uid,
    'gig_accepted',
    'You accepted ' || reqname || '''s request',
    gtitle || ' · Tap to see contact info',
    jsonb_build_object(
      'gig_id', g.id,
      'request_id', p_request_id,
      'requester_id', r.requester_id,
      'poster_id', g.poster_id,
      'role', 'poster',
      'other_name', reqname
    )
  );
END;
$$;

-- ── 9) reject_gig_request ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_gig_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r RECORD;
  g RECORD;
  pname TEXT;
  pending_left INT;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id <> uid THEN
    RAISE EXCEPTION 'Only the poster can reject';
  END IF;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  UPDATE public.gig_requests SET status = 'rejected' WHERE id = p_request_id AND status = 'pending';

  SELECT COUNT(*) INTO pending_left FROM public.gig_requests
  WHERE gig_id = g.id AND status = 'pending';

  IF pending_left = 0 AND g.status = 'requested' THEN
    PERFORM public._cg_set_gig_lifecycle_ok();
    UPDATE public.gigs SET status = 'open' WHERE id = g.id;
  END IF;

  pname := public._cg_display_name(uid);

  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    r.requester_id,
    'gig_rejected',
    'Your gig request was declined',
    COALESCE(g.title, 'The poster chose someone else'),
    jsonb_build_object(
      'gig_id', g.id,
      'request_id', p_request_id,
      'requester_id', r.requester_id,
      'poster_id', g.poster_id,
      'role', 'requester',
      'other_name', pname
    )
  );
END;
$$;

-- ── 10) complete_gig ─────────────────────────────────────────────────────────
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
    'Gig marked as done! +9 Rep',
    CASE
      WHEN g.taker_id IS NOT NULL
      THEN g.title || ' · You earned +9 · ' || tname || ' earned +10'
      ELSE g.title || ' · +9 Rep'
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

-- Legacy rep triggers: pin search_path (Supabase linter 0011)
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

-- §11 Extra hardening (college / prod): no anonymous RPC; gig_requests rows only via request_gig()
REVOKE ALL ON FUNCTION public.request_gig(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_gig_request(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_gig_request(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_gig(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_gig(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accept_gig_request(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.reject_gig_request(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.complete_gig(UUID) FROM anon;

GRANT EXECUTE ON FUNCTION public.request_gig(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_gig_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_gig_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_gig(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_gig(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_gig_request(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_gig_request(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_gig(UUID) TO service_role;

DROP POLICY IF EXISTS "Users can create requests" ON public.gig_requests;
REVOKE INSERT ON TABLE public.gig_requests FROM authenticated;
REVOKE INSERT ON TABLE public.gig_requests FROM anon;

COMMIT;

-- =============================================================================
-- If CREATE UNIQUE INDEX gig_requests_one_accepted_per_gig fails, you have
-- duplicate accepted rows for one gig — fix data first, then re-run from §2.
-- =============================================================================
