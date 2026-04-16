-- ============================================================
-- CampusGig — Complete Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
--
-- GIGS — canonical fields (source of truth in the database)
--   title          Short headline for the listing
--   description    Full task details (what the app labels “Task description”)
--   expires_at     When the listing disappears from the open feed (timestamptz, NULL = no expiry)
--   estimated_time Optional free-text hint only (e.g. “~20 min”), NOT the listing deadline
--
-- REVIEWS — stars
--   rating         1–5 (numeric); app may send whole numbers. Half-star display is UI-only.
--   RLS must allow UPDATE on own rows so upsert/edit review works (see policy below).
--
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
        CONSTRAINT email_must_be_nmsu CHECK (email ~* '@nmsu\.edu$'),
    phone VARCHAR(255) UNIQUE NOT NULL,
    snapchat VARCHAR(255) UNIQUE,
    venmo VARCHAR(255) UNIQUE,
    cashapp VARCHAR(255) UNIQUE,
    paypal VARCHAR(255) UNIQUE,
    avatar_color VARCHAR(20) DEFAULT '#6366f1',
    avatar_url TEXT,
    rep_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users"
    ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON users FOR DELETE TO authenticated
    USING (auth.uid() = id);

-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    icon_name VARCHAR(50) NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
    ON categories FOR SELECT TO authenticated USING (true);

-- Seed default categories
INSERT INTO categories (label, icon_name) VALUES
    ('Food',     'Utensils'),
    ('Print',    'Printer'),
    ('Errand',   'Package'),
    ('Notes',    'FileText'),
    ('Delivery', 'Bike'),
    ('Other',    'MessageCircle')
ON CONFLICT (label) DO NOTHING;

-- ============================================================
-- 3. GIGS TABLE
-- ============================================================

CREATE TABLE gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    location VARCHAR(255),
    estimated_time VARCHAR(100),
    notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'open'
        CONSTRAINT valid_status CHECK (status IN ('open', 'requested', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expires_after_created CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX idx_gigs_poster ON gigs(poster_id);
CREATE INDEX idx_gigs_taker ON gigs(taker_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_category ON gigs(category_id);
CREATE INDEX idx_gigs_created ON gigs(created_at DESC);
CREATE INDEX idx_gigs_open_expires ON gigs (expires_at)
    WHERE status = 'open';

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see open gigs
CREATE POLICY "Anyone can view open gigs"
    ON gigs FOR SELECT TO authenticated
    USING (true);

-- Only authenticated users can post gigs (as themselves)
CREATE POLICY "Users can post gigs"
    ON gigs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = poster_id);

-- Poster can update their own gigs (e.g. cancel, edit)
-- Taker updates handled by poster accepting
CREATE POLICY "Poster can update own gigs"
    ON gigs FOR UPDATE TO authenticated
    USING (auth.uid() = poster_id OR auth.uid() = taker_id);

-- Only poster can delete their gig
CREATE POLICY "Poster can delete own gigs"
    ON gigs FOR DELETE TO authenticated
    USING (auth.uid() = poster_id);

-- ============================================================
-- 4. GIG REQUESTS TABLE
--    (when a user wants to take a gig, before poster accepts)
-- ============================================================

CREATE TABLE gig_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending'
        CONSTRAINT valid_request_status CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, requester_id)
);

CREATE INDEX idx_gig_requests_gig ON gig_requests(gig_id);
CREATE INDEX idx_gig_requests_requester ON gig_requests(requester_id);

ALTER TABLE gig_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can see their own requests; poster can see requests on their gigs
CREATE POLICY "Users can view relevant requests"
    ON gig_requests FOR SELECT TO authenticated
    USING (
        auth.uid() = requester_id
        OR gig_id IN (SELECT id FROM gigs WHERE poster_id = auth.uid())
    );

CREATE POLICY "Users can create requests"
    ON gig_requests FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Poster can update request status"
    ON gig_requests FOR UPDATE TO authenticated
    USING (
        gig_id IN (SELECT id FROM gigs WHERE poster_id = auth.uid())
    );

-- ============================================================
-- 5. REVIEWS TABLE
-- ============================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL
        CONSTRAINT valid_rating CHECK (
            rating >= 1 AND rating <= 5
            AND (rating * 2) = ROUND(rating * 2)
        ),
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, reviewee_id),
    CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_gig ON reviews(gig_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
    ON reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reviews"
    ON reviews FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews"
    ON reviews FOR UPDATE TO authenticated
    USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- 6. ALERTS / NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_gigs_updated_at
    BEFORE UPDATE ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. REP SCORE TRIGGER
--    +1 for posting a gig, +9 poster / +10 taker when a gig is completed,
--    +N Rep when reviewed (N = rounded star rating); rating edits adjust rep by delta
-- ============================================================

-- Award +1 rep to poster when a gig is created
CREATE OR REPLACE FUNCTION award_rep_on_gig_post()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET rep_score = rep_score + 1 WHERE id = NEW.poster_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_rep_gig_post
    AFTER INSERT ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION award_rep_on_gig_post();

-- Award +9 rep to poster and +10 to taker when gig status changes to 'completed'
CREATE OR REPLACE FUNCTION award_rep_on_gig_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE users SET rep_score = rep_score + 9 WHERE id = NEW.poster_id;
        IF NEW.taker_id IS NOT NULL THEN
            UPDATE users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_rep_gig_complete
    AFTER UPDATE ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION award_rep_on_gig_complete();

-- Rep + notification when reviewed (see supabase/review_rep_and_notify_trigger.sql for full DDL)
CREATE OR REPLACE FUNCTION after_review_change()
RETURNS TRIGGER AS $$
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
    UPDATE users SET rep_score = rep_score + r_new WHERE id = NEW.reviewee_id;
  ELSIF TG_OP = 'UPDATE' THEN
    r_old := ROUND(OLD.rating)::INT;
    IF r_new IS DISTINCT FROM r_old THEN
      UPDATE users SET rep_score = rep_score + (r_new - r_old) WHERE id = NEW.reviewee_id;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_after_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION after_review_change();

CREATE TRIGGER trg_after_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION after_review_change();

-- ============================================================
-- 9. AVATAR STORAGE BUCKET
--    Stores profile photos. Each user gets one file at
--    {user_id}/avatar.{ext}, upserted on change.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload/overwrite their own avatar
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly viewable"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- 10. MIGRATION SNIPPETS (existing databases — run in SQL Editor)
-- ============================================================
-- You do NOT run this whole block on a brand-new project that used sections 1–9 above.
-- Use these only when upgrading from an older CampusGig schema.
--
-- DISCARD (frontend / old patterns):
--   • Storing listing deadlines as ISO strings inside estimated_time VARCHAR.
--   • Relying only on the client to hide expired gigs (keep a client filter as backup).
--   • Broken reviews RLS: INSERT without matching UPDATE policy breaks submitReview() upsert.
--
-- ADD listing expiry column
--   ALTER TABLE gigs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
--
-- Backfill expires_at from legacy ISO values stuffed into estimated_time, then clear the varchar
--   UPDATE gigs
--   SET expires_at = estimated_time::timestamptz
--   WHERE expires_at IS NULL
--     AND estimated_time ~ '^\d{4}-\d{2}-\d{2}';
--   UPDATE gigs
--   SET estimated_time = NULL
--   WHERE expires_at IS NOT NULL
--     AND estimated_time ~ '^\d{4}-\d{2}-\d{2}';
--
-- Optional: enforce ordering (skip if any row violates; fix data first)
--   ALTER TABLE gigs DROP CONSTRAINT IF EXISTS expires_after_created;
--   ALTER TABLE gigs ADD CONSTRAINT expires_after_created
--     CHECK (expires_at IS NULL OR expires_at > created_at) NOT VALID;
--   ALTER TABLE gigs VALIDATE CONSTRAINT expires_after_created;
--
-- Index for open-feed queries
--   CREATE INDEX IF NOT EXISTS idx_gigs_open_expires ON gigs (expires_at) WHERE status = 'open';
--
-- REVIEWS — stars + upsert
--   ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
--   -- If rating CHECK still allows 0.5, align with app (whole/half stars 1–5):
--   ALTER TABLE reviews DROP CONSTRAINT IF EXISTS valid_rating;
--   ALTER TABLE reviews ADD CONSTRAINT valid_rating CHECK (
--     rating >= 1 AND rating <= 5 AND (rating * 2) = ROUND(rating * 2)
--   );
--   DROP POLICY IF EXISTS "Participants can write reviews" ON reviews;
--   CREATE POLICY "Users can insert own reviews"
--     ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
--   DROP POLICY IF EXISTS "Reviewers can update own reviews" ON reviews;
--   CREATE POLICY "Reviewers can update own reviews"
--     ON reviews FOR UPDATE TO authenticated
--     USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);
--   DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
--   CREATE TRIGGER set_reviews_updated_at
--     BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
--
-- If gig_id FK still ON DELETE CASCADE and you need SET NULL (optional):
--   ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_gig_id_fkey;
--   ALTER TABLE reviews ADD CONSTRAINT reviews_gig_id_fkey
--     FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE SET NULL;
--
-- --- FEED EMPTY AFTER MIGRATION? (copy-paste below, run as plain SQL — not comments) ---
