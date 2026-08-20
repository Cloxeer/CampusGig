-- Category taxonomy v2 — collapse the 6 errand-flavored categories into 5 broad
-- umbrellas that match the app's single source of truth (src/data/categories.js).
--
--   Food   ─┐
--   Delivery┘→ Delivery      (food & coffee runs, pickups, drop-offs)
--   Errand   → Errands       (moving help, wait in line, setup, rides)
--   Print  ─┐
--   Notes  ─┘→ Academics     (tutoring, notes, printing, proofreading)   [NEW]
--            → Creative       (design, coding, writing, video, social)    [NEW]
--   Other    → Other         (catch-all, unchanged)
--
-- Run this in the Supabase SQL editor BEFORE (or with) deploying the app change.
-- Categories are looked up by exact label when posting, so the labels below must
-- match the app. `icon_name` is now unused by the app (it has its own icon map)
-- but the column is NOT NULL, so we still provide values.
-- Safe to run more than once.

BEGIN;

-- 1. Add the two new umbrellas.
INSERT INTO public.categories (label, icon_name) VALUES
  ('Academics', 'GraduationCap'),
  ('Creative',  'Sparkles')
ON CONFLICT (label) DO NOTHING;

-- 2. Rename Errand -> Errands (only if 'Errands' isn't already present).
UPDATE public.categories
   SET label = 'Errands', icon_name = 'Package'
 WHERE label = 'Errand'
   AND NOT EXISTS (SELECT 1 FROM public.categories WHERE label = 'Errands');

-- 3. Repoint existing gigs off the retired categories.
--    Food -> Delivery
UPDATE public.gigs g
   SET category_id = cnew.id
  FROM public.categories cold, public.categories cnew
 WHERE g.category_id = cold.id
   AND cold.label = 'Food'
   AND cnew.label = 'Delivery';

--    Print, Notes -> Academics
UPDATE public.gigs g
   SET category_id = cnew.id
  FROM public.categories cold, public.categories cnew
 WHERE g.category_id = cold.id
   AND cold.label IN ('Print', 'Notes')
   AND cnew.label = 'Academics';

-- 4. Drop the now-unreferenced retired categories.
DELETE FROM public.categories WHERE label IN ('Food', 'Print', 'Notes');

-- 5. Tidy kept categories' icon_name to match the app (optional/cosmetic).
UPDATE public.categories SET icon_name = 'Bike'          WHERE label = 'Delivery';
UPDATE public.categories SET icon_name = 'MessageCircle' WHERE label = 'Other';

COMMIT;

-- Sanity check (run separately):
--   SELECT label, icon_name FROM public.categories ORDER BY id;
-- Expected labels: Delivery, Other, Errands, Academics, Creative
