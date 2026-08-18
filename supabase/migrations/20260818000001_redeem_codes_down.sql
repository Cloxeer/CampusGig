-- ============================================================================
-- TEARDOWN of 20260818000000_redeem_codes.sql — removes everything it created.
-- Run once in the Supabase SQL Editor. Safe to re-run (all guarded with IF EXISTS).
--
-- Drop order matters: functions first (they reference the tables), then the
-- ledger table (code_redemptions FKs redeem_codes), then the catalog table.
-- Dropping a function removes its GRANTs; dropping a table removes its RLS
-- policies — so no separate revoke/drop-policy statements are needed.
-- ============================================================================

-- 1) RPC surface (public INVOKER wrapper + private SECURITY DEFINER body)
drop function if exists public.redeem_code(text);
drop function if exists private.redeem_code(text);

-- 2) Per-user redemption ledger (references redeem_codes → drop first)
drop table if exists public.code_redemptions;

-- 3) Codes catalog
drop table if exists public.redeem_codes;
