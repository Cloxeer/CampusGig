-- ============================================================
-- CampusGig — Server-side content bounds
-- ------------------------------------------------------------
-- gigs.title/description/notes are unbounded TEXT and price has no
-- range check, so oversized or nonsense values could be written
-- straight through the API regardless of UI. These CHECKs are the
-- authoritative guard (UI caps are cosmetics).
-- Idempotent one-shot.
-- ============================================================

BEGIN;

ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_title_len;
ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_title_len CHECK (char_length(title) BETWEEN 1 AND 120);

ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_description_len;
ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_description_len CHECK (description IS NULL OR char_length(description) <= 5000);

ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_notes_len;
ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_notes_len CHECK (notes IS NULL OR char_length(notes) <= 2000);

ALTER TABLE public.gigs DROP CONSTRAINT IF EXISTS gigs_price_bounds;
ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_price_bounds CHECK (price >= 0 AND price <= 10000);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_text_len;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_text_len CHECK (text IS NULL OR char_length(text) <= 2000);

COMMIT;
