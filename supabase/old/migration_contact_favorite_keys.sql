-- =============================================================================
-- CampusGig — Favorite contact field order (shown first to counterparties)
-- Run once in Supabase SQL Editor (or via MCP apply_migration).
-- =============================================================================

BEGIN;

ALTER TABLE public.user_private_contact
  ADD COLUMN IF NOT EXISTS contact_favorite_keys JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_private_contact.contact_favorite_keys IS
  'Ordered keys (venmo, discord, etc.) the user wants listed first when contact is shared.';

COMMIT;
