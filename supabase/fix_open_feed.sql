-- Run in Supabase → SQL Editor (one shot).
-- Use if open gigs vanished after adding expires_at / migration.
-- Also deploy the app fix: getOpenGigs() must use .or(`expires_at.is.null,expires_at.gt."${nowIso}"`)

-- 1) Ensure column exists (safe if already there)
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2) Open gigs that already expired: clear deadline so they stay visible until you re-post or set a new time
UPDATE gigs
SET expires_at = NULL
WHERE status = 'open'
  AND expires_at IS NOT NULL
  AND expires_at <= now();

-- 3) Optional — if a bad backfill set weird values, wipe listing deadlines on ALL open gigs (they never expire until you edit)
-- Uncomment only if you need it:
-- UPDATE gigs SET expires_at = NULL WHERE status = 'open';

-- 4) Verify
SELECT id, status, title, expires_at, created_at
FROM gigs
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 25;
