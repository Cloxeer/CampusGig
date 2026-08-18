-- ============================================================================
-- Redeem codes (v2, corrected) — fundraiser / promo codes that grant a cosmetic.
--
-- Replaces the withdrawn 20260818000000_redeem_codes.sql. Fixes vs that version:
--   • code_redemptions.user_id now references public.users(id) — the project
--     convention (user_cosmetics / chest_claims), NOT auth.users(id).
--   • dropped the redundant redeem_codes.uses counter: the redemption count is
--     DERIVED from code_redemptions, so there is no second copy of the same fact
--     to keep in sync.
--
-- Two tables, distinct roles (not duplicates):
--   • redeem_codes      = CATALOG: what codes exist and what each one grants.
--                         One row per code. (Analogous to public.cosmetics.)
--   • code_redemptions  = LEDGER: who has already claimed a code. One row per
--                         (code, user) — enforces one-per-user and lets us count
--                         total uses. A shared code = 1 catalog row + N ledger
--                         rows. (Analogous to public.chest_claims.)
--
-- Idempotent: drops the old objects first, so running this file alone fully
-- replaces any prior version.
-- ============================================================================

-- ---------- 0) Drop any prior version (functions first, then ledger, catalog) ----------
drop function if exists public.redeem_code(text);
drop function if exists private.redeem_code(text);
drop table if exists public.code_redemptions;
drop table if exists public.redeem_codes;

-- ---------- 1) Codes catalog (SECRET — never client-readable) ----------
create table public.redeem_codes (
  code            text primary key,                         -- store normalized: UPPER, no spaces
  reward_kind     text not null default 'fixed' check (reward_kind in ('fixed','roll')),
  reward_cosmetic text references public.cosmetics(id) on delete cascade,  -- for 'fixed'
  reward_rarity   text,                                     -- for 'roll' (common..cosmic); null = any active
  max_redemptions int,                                      -- null = unlimited; 1 = single-use
  active          boolean not null default true,
  expires_at      timestamptz,                              -- null = never expires
  note            text,                                     -- campaign / fundraiser label (admin only)
  created_at      timestamptz not null default now(),
  constraint redeem_codes_fixed_has_cosmetic
    check (reward_kind <> 'fixed' or reward_cosmetic is not null)
);
-- RLS on, NO policy: codes are secret. Only the SECURITY DEFINER function (which
-- runs as the table owner and bypasses RLS) may read them; PostgREST cannot.
alter table public.redeem_codes enable row level security;

-- ---------- 2) Per-user redemption ledger ----------
create table public.code_redemptions (
  code        text not null references public.redeem_codes(code) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  cosmetic_id text not null references public.cosmetics(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code, user_id)                               -- one redemption per user per code
);
alter table public.code_redemptions enable row level security;
drop policy if exists code_redemptions_read_own on public.code_redemptions;
create policy code_redemptions_read_own on public.code_redemptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------- 3) redeem_code (validate → grant → record) ----------
create or replace function private.redeem_code(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_code  text := upper(regexp_replace(btrim(coalesce(p_code, '')), '\s+', '', 'g'));
  v_row   public.redeem_codes%rowtype;
  v_used  int;
  v_pick  text;
  v_dup   boolean;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if v_code = '' then return jsonb_build_object('status','invalid'); end if;

  -- lock the code row so concurrent redemptions can't oversell max_redemptions
  select * into v_row from public.redeem_codes where code = v_code for update;
  if not found or not v_row.active then
    return jsonb_build_object('status','invalid');
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('status','expired');
  end if;
  if v_row.max_redemptions is not null then
    select count(*) into v_used from public.code_redemptions where code = v_code;
    if v_used >= v_row.max_redemptions then
      return jsonb_build_object('status','depleted');
    end if;
  end if;
  if exists (select 1 from public.code_redemptions where code = v_code and user_id = v_uid) then
    return jsonb_build_object('status','already_redeemed');
  end if;

  -- resolve the reward
  if v_row.reward_kind = 'fixed' then
    v_pick := v_row.reward_cosmetic;
  else
    -- chest-style roll from the requested rarity (fallback to any active cosmetic)
    select id into v_pick from public.cosmetics
      where active and (v_row.reward_rarity is null or rarity = v_row.reward_rarity)
      order by random() limit 1;
    if v_pick is null then
      select id into v_pick from public.cosmetics where active order by random() limit 1;
    end if;
  end if;
  if v_pick is null then raise exception 'reward could not be resolved'; end if;

  v_dup := exists (select 1 from public.user_cosmetics where user_id = v_uid and cosmetic_id = v_pick);

  perform private.grant_cosmetic(v_uid, v_pick);
  insert into public.code_redemptions (code, user_id, cosmetic_id) values (v_code, v_uid, v_pick);

  return jsonb_build_object('status','ok','cosmetic_id',v_pick,'dup',v_dup,'kind',v_row.reward_kind);
end; $$;

-- ---------- 4) Public INVOKER wrapper + grants ----------
create or replace function public.redeem_code(p_code text)
  returns jsonb language sql security invoker set search_path = ''
  as $$ select private.redeem_code(p_code) $$;

grant execute on function private.redeem_code(text) to authenticated;
grant execute on function public.redeem_code(text)  to authenticated;

-- ============================================================================
-- Minting codes (admin, run manually). Codes are stored normalized: UPPERCASE,
-- no spaces — the RPC normalizes user input the same way.
--
--   -- Shared fundraiser code: one fixed border, each user once, 500 total cap,
--   -- expiring end of the fall drive:
--   insert into public.redeem_codes (code, reward_kind, reward_cosmetic, max_redemptions, expires_at, note)
--   values ('FALLFEST25', 'fixed', 'b-founders-kingdom', 500, '2026-12-01', 'Fall 2026 fundraiser');
--
--   -- Single-use handout (works exactly once, ever):
--   insert into public.redeem_codes (code, reward_kind, reward_cosmetic, max_redemptions, note)
--   values ('GOLDENTICKET', 'fixed', 'b-founders-aura', 1, 'Raffle grand prize');
--
--   -- Shared code granting a random EPIC roll to each redeemer:
--   insert into public.redeem_codes (code, reward_kind, reward_rarity, note)
--   values ('MYSTERYBOX', 'roll', 'epic', 'Event mystery reward');
-- ============================================================================
