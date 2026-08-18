-- ============================================================
-- CampusGig — Cosmetics & Chests (one-shot, idempotent)
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- GENERATED FILE — the seed (section 14) is produced from
-- src/data/cosmetics.js so the server catalog and the client visuals share ids.
-- Re-run the generator (scratchpad/gen_migration.mjs) after catalog edits.
--
-- Ownership model:
--   • cosmetics       — catalog of WHAT can be owned (id/type/name/rarity/active).
--                       The VISUALS (ring, fx, art) live in the CLIENT catalog
--                       keyed by the SAME id: server decides what you get, the
--                       client knows how it looks. active=false → never rolled
--                       from a chest (tier tags + exclusives); owners keep it.
--   • user_cosmetics  — per-user inventory with duplicate counts.
--   • chest_claims    — one row per opened chest; the roll is committed at open
--                       (server-picked, no re-rolls).
--   • tier_grants     — thresholds that award a SPECIFIC tier tag (not a roll).
--   • users.equipped_tag / equipped_border — public-readable, trigger-validated
--                       (you can only equip what you own).
--   • Every user starts owning + wearing the "New" tier tag (t-tier-new).
-- ============================================================

create schema if not exists private;

-- ---------- 1) Catalog ----------
create table if not exists public.cosmetics (
  id         text primary key,
  type       text not null check (type in ('tag','border')),
  name       text not null,
  rarity     text not null check (rarity in ('common','rare','epic','legendary','cosmic')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.cosmetics enable row level security;
drop policy if exists cosmetics_read on public.cosmetics;
create policy cosmetics_read on public.cosmetics for select to anon, authenticated using (true);

-- ---------- 2) Inventory ----------
create table if not exists public.user_cosmetics (
  user_id        uuid not null references public.users(id) on delete cascade,
  cosmetic_id    text not null references public.cosmetics(id) on delete cascade,
  count          int  not null default 1 check (count >= 1),
  first_acquired timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);
alter table public.user_cosmetics enable row level security;
drop policy if exists user_cosmetics_read_own on public.user_cosmetics;
create policy user_cosmetics_read_own on public.user_cosmetics for select to authenticated using ((select auth.uid()) = user_id);

-- ---------- 3) Chest claims ----------
create table if not exists public.chest_claims (
  user_id    uuid not null references public.users(id) on delete cascade,
  threshold  int  not null check (threshold > 0),
  chest_type text not null check (chest_type in ('standard','legendary','tier')),
  reward     jsonb not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, threshold)
);
alter table public.chest_claims enable row level security;
drop policy if exists chest_claims_read_own on public.chest_claims;
create policy chest_claims_read_own on public.chest_claims for select to authenticated using ((select auth.uid()) = user_id);

-- ---------- 4) Tier grants (threshold -> specific tag) ----------
create table if not exists public.tier_grants (
  threshold   int  primary key check (threshold > 0),
  cosmetic_id text not null references public.cosmetics(id) on delete cascade
);
alter table public.tier_grants enable row level security;
drop policy if exists tier_grants_read on public.tier_grants;
create policy tier_grants_read on public.tier_grants for select to anon, authenticated using (true);

-- ---------- 5) Equipped slots ----------
alter table public.users add column if not exists equipped_tag    text references public.cosmetics(id) on delete set null;
alter table public.users add column if not exists equipped_border text references public.cosmetics(id) on delete set null;

create or replace function private.users_validate_equipped()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.equipped_tag is distinct from old.equipped_tag and new.equipped_tag is not null then
    if not exists (select 1 from public.user_cosmetics uc join public.cosmetics c on c.id = uc.cosmetic_id
      where uc.user_id = new.id and uc.cosmetic_id = new.equipped_tag and c.type = 'tag') then
      raise exception 'cannot equip a tag you do not own';
    end if;
  end if;
  if new.equipped_border is distinct from old.equipped_border and new.equipped_border is not null then
    if not exists (select 1 from public.user_cosmetics uc join public.cosmetics c on c.id = uc.cosmetic_id
      where uc.user_id = new.id and uc.cosmetic_id = new.equipped_border and c.type = 'border') then
      raise exception 'cannot equip a border you do not own';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists users_validate_equipped on public.users;
create trigger users_validate_equipped before update of equipped_tag, equipped_border on public.users
  for each row execute function private.users_validate_equipped();

-- ---------- 6) Grant helpers + starter ----------
create or replace function private.grant_cosmetic(p_user uuid, p_id text)
returns void language sql security definer set search_path = '' as $$
  insert into public.user_cosmetics (user_id, cosmetic_id, count) values (p_user, p_id, 1)
  on conflict (user_id, cosmetic_id) do update set count = public.user_cosmetics.count + 1;
$$;

create or replace function private.grant_starter(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_cosmetics (user_id, cosmetic_id, count) values (p_user, 't-tier-new', 1)
    on conflict (user_id, cosmetic_id) do nothing;
  update public.users set equipped_tag = 't-tier-new' where id = p_user and equipped_tag is null;
end; $$;

create or replace function private.on_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.grant_starter(new.id); return new; end; $$;
drop trigger if exists users_grant_starter on public.users;
create trigger users_grant_starter after insert on public.users
  for each row execute function private.on_user_created();

-- ---------- 7) Roll helpers (tune odds here) ----------
create or replace function private.roll_standard_rarity()
returns text language plpgsql security definer set search_path = '' as $$
declare r numeric := random() * 100;
begin if r < 75 then return 'common'; elsif r < 95 then return 'rare'; else return 'epic'; end if; end; $$;

create or replace function private.roll_legendary_rarity()
returns text language plpgsql security definer set search_path = '' as $$
declare r numeric := random() * 100;
begin if r < 55 then return 'epic'; elsif r < 90 then return 'legendary'; else return 'cosmic'; end if; end; $$;

-- ---------- 8) open_chest (committed roll; tier thresholds grant a fixed tag) ----------
create or replace function private.open_chest(p_threshold int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_rep int; v_type text; v_reward jsonb;
  v_rarity text; v_pick text; v_tier text; v_opts text[] := '{}'; i int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if not (p_threshold = 1 or p_threshold % 10 = 0) then raise exception 'not a chest threshold'; end if;
  select rep_score into v_rep from public.users where id = v_uid;
  if coalesce(v_rep, 0) < p_threshold then raise exception 'threshold not reached'; end if;

  select reward into v_reward from public.chest_claims where user_id = v_uid and threshold = p_threshold;
  if found then return v_reward; end if;

  select cosmetic_id into v_tier from public.tier_grants where threshold = p_threshold;
  if v_tier is not null then
    perform private.grant_cosmetic(v_uid, v_tier);
    v_reward := jsonb_build_object('status','granted','cosmetic_id',v_tier);
    insert into public.chest_claims (user_id, threshold, chest_type, reward) values (v_uid, p_threshold, 'tier', v_reward);
    return v_reward;
  end if;

  v_type := case when p_threshold % 50 = 0 then 'legendary' else 'standard' end;

  if v_type = 'standard' then
    v_rarity := private.roll_standard_rarity();
    select id into v_pick from public.cosmetics where active and rarity = v_rarity order by random() limit 1;
    if v_pick is null then select id into v_pick from public.cosmetics where active and rarity in ('common','rare','epic') order by random() limit 1; end if;
    if v_pick is null then raise exception 'cosmetics catalog is empty'; end if;
    perform private.grant_cosmetic(v_uid, v_pick);
    v_reward := jsonb_build_object('status','granted','cosmetic_id',v_pick);
  else
    for i in 1..3 loop
      v_rarity := private.roll_legendary_rarity();
      select id into v_pick from public.cosmetics where active and rarity = v_rarity and not (id = any(v_opts)) order by random() limit 1;
      if v_pick is null then select id into v_pick from public.cosmetics where active and rarity in ('epic','legendary','cosmic') and not (id = any(v_opts)) order by random() limit 1; end if;
      exit when v_pick is null;
      v_opts := array_append(v_opts, v_pick);
    end loop;
    if coalesce(array_length(v_opts,1),0) = 0 then raise exception 'cosmetics catalog is empty'; end if;
    v_reward := jsonb_build_object('status','pending','options',to_jsonb(v_opts));
  end if;

  insert into public.chest_claims (user_id, threshold, chest_type, reward) values (v_uid, p_threshold, v_type, v_reward);
  return v_reward;
end; $$;

-- ---------- 9) pick_chest_option (settle a legendary chest) ----------
create or replace function private.pick_chest_option(p_threshold int, p_cosmetic text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_claim public.chest_claims%rowtype; v_reward jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_claim from public.chest_claims where user_id = v_uid and threshold = p_threshold;
  if not found then raise exception 'chest not opened'; end if;
  if v_claim.chest_type <> 'legendary' then raise exception 'not a legendary chest'; end if;
  if v_claim.reward->>'status' <> 'pending' then return v_claim.reward; end if;
  if not (v_claim.reward->'options') ? p_cosmetic then raise exception 'not one of your options'; end if;
  perform private.grant_cosmetic(v_uid, p_cosmetic);
  v_reward := v_claim.reward || jsonb_build_object('status','picked','picked',p_cosmetic);
  update public.chest_claims set reward = v_reward where user_id = v_uid and threshold = p_threshold;
  return v_reward;
end; $$;

-- ---------- 10) equip / unequip ----------
create or replace function private.equip_cosmetic(p_cosmetic text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_type text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select c.type into v_type from public.user_cosmetics uc join public.cosmetics c on c.id = uc.cosmetic_id
    where uc.user_id = v_uid and uc.cosmetic_id = p_cosmetic;
  if v_type is null then raise exception 'you do not own this cosmetic'; end if;
  if v_type = 'tag' then update public.users set equipped_tag = p_cosmetic where id = v_uid;
  else update public.users set equipped_border = p_cosmetic where id = v_uid; end if;
end; $$;

create or replace function private.unequip_cosmetic(p_type text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_type = 'tag' then update public.users set equipped_tag = null where id = v_uid;
  elsif p_type = 'border' then update public.users set equipped_border = null where id = v_uid;
  else raise exception 'unknown cosmetic type'; end if;
end; $$;

-- ---------- 11) get_my_inventory (one round-trip: owned counts + equipped + claims) ----------
create or replace function private.get_my_inventory()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_res jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select jsonb_build_object(
    'owned', coalesce((select jsonb_object_agg(cosmetic_id, count) from public.user_cosmetics where user_id = v_uid), '{}'::jsonb),
    'equipped', (select jsonb_build_object('tag', equipped_tag, 'border', equipped_border) from public.users where id = v_uid),
    'claims', coalesce((select jsonb_agg(threshold) from public.chest_claims where user_id = v_uid), '[]'::jsonb)
  ) into v_res;
  return v_res;
end; $$;

-- ---------- 12) Public INVOKER wrappers (PostgREST surface) ----------
create or replace function public.open_chest(p_threshold int) returns jsonb language sql security invoker set search_path = '' as $$ select private.open_chest(p_threshold) $$;
create or replace function public.pick_chest_option(p_threshold int, p_cosmetic text) returns jsonb language sql security invoker set search_path = '' as $$ select private.pick_chest_option(p_threshold, p_cosmetic) $$;
create or replace function public.equip_cosmetic(p_cosmetic text) returns void language sql security invoker set search_path = '' as $$ select private.equip_cosmetic(p_cosmetic) $$;
create or replace function public.unequip_cosmetic(p_type text) returns void language sql security invoker set search_path = '' as $$ select private.unequip_cosmetic(p_type) $$;
create or replace function public.get_my_inventory() returns jsonb language sql security invoker set search_path = '' as $$ select private.get_my_inventory() $$;

-- ---------- 13) Grants ----------
grant usage on schema private to authenticated;
grant execute on function private.open_chest(int), private.pick_chest_option(int,text), private.equip_cosmetic(text), private.unequip_cosmetic(text), private.get_my_inventory() to authenticated;
grant execute on function public.open_chest(int), public.pick_chest_option(int,text), public.equip_cosmetic(text), public.unequip_cosmetic(text), public.get_my_inventory() to authenticated;

-- ---------- 14) Seed catalog (generated from src/data/cosmetics.js) ----------
insert into public.cosmetics (id, type, name, rarity, active) values
  ('t-tier-new','tag','New','common',false),
  ('t-tier-reliable','tag','Reliable','rare',false),
  ('t-tier-trusted','tag','Trusted','epic',false),
  ('t-tier-legend','tag','Legend','legendary',false),
  ('t-tier-cosmic','tag','Beyond Legend','cosmic',false),
  ('t-certified-goober','tag','Certified Goober','common',true),
  ('t-professional-amateur','tag','Professional Amateur','common',true),
  ('t-broke-but-motivated','tag','Broke But Motivated','common',true),
  ('t-ramen-funded','tag','Ramen Funded','common',true),
  ('t-financial-aid-recipient','tag','Financial Aid Recipient','common',true),
  ('t-doing-my-best','tag','Doing My Best','common',true),
  ('t-chronically-available','tag','Chronically Available','common',true),
  ('t-will-work-for-snacks','tag','Will Work for Snacks','common',true),
  ('t-mildly-employable','tag','Mildly Employable','common',true),
  ('t-just-happy-to-be-here','tag','Just Happy to Be Here','common',true),
  ('t-desert-rat','tag','Desert Rat','common',true),
  ('t-frenger-fueled','tag','Frenger Fueled','common',true),
  ('t-late-night-library','tag','Late Night Library','common',true),
  ('t-gpa-optional','tag','GPA Optional','common',true),
  ('t-slightly-feral','tag','Slightly Feral','common',true),
  ('t-caffeine-based-lifeform','tag','Caffeine Based Lifeform','common',true),
  ('t-down-for-whatever','tag','Down for Whatever','common',true),
  ('t-no-thoughts-just-gigs','tag','No Thoughts, Just Gigs','common',true),
  ('t-touch-grass-expert','tag','Touch Grass Expert','common',true),
  ('t-napping-champion','tag','Napping Champion','common',true),
  ('t-dialed-in','tag','Dialed In','rare',true),
  ('t-certified-hustler','tag','Certified Hustler','rare',true),
  ('t-overbooked','tag','Overbooked','rare',true),
  ('t-first-to-reply','tag','First to Reply','rare',true),
  ('t-zero-excuses','tag','Zero Excuses','rare',true),
  ('t-clock-in-cash-out','tag','Clock In, Cash Out','rare',true),
  ('t-always-on-time','tag','Always On Time','rare',true),
  ('t-the-reliable-one','tag','The Reliable One','rare',true),
  ('t-booked-and-busy','tag','Booked & Busy','rare',true),
  ('t-aggie-grinder','tag','Aggie Grinder','rare',true),
  ('t-sun-belt-baller','tag','Sun Belt Baller','rare',true),
  ('t-dead-week-survivor','tag','Dead Week Survivor','rare',true),
  ('t-575-local','tag','575 Local','rare',true),
  ('t-crimson-regular','tag','Crimson Regular','rare',true),
  ('t-main-character','tag','Main Character','epic',true),
  ('t-the-plug','tag','The Plug','epic',true),
  ('t-known-on-campus','tag','Known On Campus','epic',true),
  ('t-big-rep-energy','tag','Big Rep Energy','epic',true),
  ('t-five-star-energy','tag','Five Star Energy','epic',true),
  ('t-built-different','tag','Built Different','epic',true),
  ('t-menace-to-society','tag','Menace to Society','epic',true),
  ('t-organ-mountain-high','tag','Organ Mountain High','epic',true),
  ('t-the-standard','tag','The Standard','epic',true),
  ('t-campus-legend','tag','Campus Legend','legendary',true),
  ('t-founding-hustler','tag','Founding Hustler','legendary',true),
  ('t-top-of-the-board','tag','Top of the Board','legendary',true),
  ('t-gig-lord','tag','Gig Lord','legendary',true),
  ('t-untouchable','tag','Untouchable','legendary',true),
  ('t-cosmic-aura','tag','Cosmic Aura','cosmic',true),
  ('t-lucky-pull','tag','Lucky Pull','cosmic',true),
  ('t-im-the-best','tag','The One','cosmic',true),
  ('b-crimson-ring','border','Crimson Ring','common',true),
  ('b-forest-ring','border','Forest Ring','common',true),
  ('b-cobalt-ring','border','Cobalt Ring','common',true),
  ('b-charcoal-ring','border','Charcoal Ring','common',true),
  ('b-tangerine-ring','border','Tangerine Ring','common',true),
  ('b-grape-ring','border','Grape Ring','common',true),
  ('b-teal-ring','border','Teal Ring','common',true),
  ('b-rose-ring','border','Rose Ring','common',true),
  ('b-bronze-ring','border','Bronze Ring','common',true),
  ('b-slate-ring','border','Slate Ring','common',true),
  ('b-sunset-fade','border','Sunset Fade','rare',true),
  ('b-ocean-fade','border','Ocean Fade','rare',true),
  ('b-ember-fade','border','Ember Fade','rare',true),
  ('b-twilight-fade','border','Twilight Fade','rare',true),
  ('b-toxic-fade','border','Toxic Fade','rare',true),
  ('b-gold-fade','border','Gold Fade','rare',true),
  ('b-poke-ball','border','Poke Ball','rare',true),
  ('b-candy-stripe','border','Candy Stripe','rare',true),
  ('b-hazard-stripes','border','Hazard Stripes','rare',true),
  ('b-segmented','border','Segmented','rare',true),
  ('b-aggie-kit','border','Aggie Kit','rare',true),
  ('b-radar-sweep','border','Radar Sweep','epic',true),
  ('b-comet-tail','border','Comet Tail','epic',true),
  ('b-orbit','border','Orbit','epic',true),
  ('b-pulse','border','Pulse','epic',true),
  ('b-heartbeat','border','Heartbeat','epic',true),
  ('b-marquee','border','Marquee','epic',true),
  ('b-snake','border','Snake','epic',true),
  ('b-prism-overdrive','border','Prism Overdrive','epic',true),
  ('b-neon-sign','border','Neon Sign','epic',true),
  ('b-lava-flow','border','Lava Flow','epic',true),
  ('b-deep-current','border','Deep Current','epic',true),
  ('b-warning-lights','border','Warning Lights','epic',true),
  ('b-static-charge','border','Static Charge','epic',true),
  ('b-wildfire','border','Wildfire','legendary',true),
  ('b-blue-blaze','border','Blue Blaze','legendary',true),
  ('b-shadow-flame','border','Shadow Flame','legendary',true),
  ('b-high-voltage','border','High Voltage','legendary',true),
  ('b-crimson-storm','border','Crimson Storm','legendary',true),
  ('b-molten-core','border','Molten Core','legendary',true),
  ('b-toxic-meltdown','border','Toxic Meltdown','legendary',true),
  ('b-frostbite','border','Frostbite','legendary',true),
  ('b-supersonic','border','Supersonic','legendary',true),
  ('b-gold-standard','border','Gold Standard','legendary',true),
  ('b-event-horizon','border','Event Horizon','cosmic',true),
  ('b-clouds','border','Founders Crimson','cosmic',true),
  ('b-wind','border','Silver Shine','legendary',true),
  ('b-wind-clouds','border','Founders Wind','cosmic',true),
  ('b-founders-kingdom','border','Founders Kingdom','cosmic',false),
  ('b-founders-aura','border','Aurora','epic',true),
  ('b-glitch-og','border','Glitch OG','cosmic',false),
  ('b-glitch','border','Glitch','cosmic',false)
on conflict (id) do update set name = excluded.name, type = excluded.type, rarity = excluded.rarity, active = excluded.active;

-- ---------- 15) Seed tier grants ----------
insert into public.tier_grants (threshold, cosmetic_id) values
  (200,'t-tier-reliable'),
  (300,'t-tier-trusted'),
  (400,'t-tier-legend'),
  (500,'t-tier-cosmic')
on conflict (threshold) do update set cosmetic_id = excluded.cosmetic_id;

-- ---------- 16) Backfill: give every existing user the starter tag ----------
do $$ declare u record; begin
  for u in select id from public.users loop perform private.grant_starter(u.id); end loop;
end $$;
