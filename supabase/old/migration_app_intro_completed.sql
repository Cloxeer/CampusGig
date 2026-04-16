-- In-app tutorial completion (first-time walkthrough after profile exists).
-- NULL = user has not finished the tutorial yet (show on next visit to main app).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS app_intro_completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.app_intro_completed_at IS
  'Set when the user finishes the in-app tutorial (Home/Explore/Post/Alerts/Profile + optional email opt-in). NULL means gate main app until completed.';

-- Optional: skip the tutorial for accounts that already existed before this migration (uncomment and run once if you want):
-- UPDATE public.users SET app_intro_completed_at = now() WHERE app_intro_completed_at IS NULL;
