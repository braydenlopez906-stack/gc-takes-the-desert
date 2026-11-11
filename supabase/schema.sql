-- ─────────────────────────────────────────────────────────────────────────────
--  GC TAKES THE DESERT · Coachella 2027 · database
--  Paste this whole file into Supabase → SQL Editor → Run. Safe to run again.
--
--  How it works
--  • Nobody makes an account. Each phone gets a random "device token" that the
--    site keeps in the browser. The token links that phone to one pass.
--  • Everyone can READ everything (the roster is public to the group).
--  • Nobody can write to tables directly. All writes go through the functions
--    below, which check the device token and block duplicates:
--      one pass per name, one weekend vote per person, one heart per house
--      per person, one listing per house link.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── tables ──────────────────────────────────────────────────────────────────

create table if not exists public.attendees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 24),
  name_key    text not null unique,                       -- lowercased, for duplicate checks
  status      text not null check (status in ('in', 'maybe')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Private: which device token belongs to which pass. Never readable by the site.
create table if not exists public.attendee_devices (
  device_token text primary key check (char_length(device_token) between 20 and 100),
  attendee_id  uuid not null references public.attendees(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table if not exists public.artist_picks (
  attendee_id uuid primary key references public.attendees(id) on delete cascade,
  artist      text not null check (char_length(artist) between 1 and 40),
  artist_key  text not null,                               -- lowercased, merges "frank ocean" + "Frank Ocean"
  updated_at  timestamptz not null default now()
);

create table if not exists public.weekend_votes (
  attendee_id uuid primary key references public.attendees(id) on delete cascade,
  weekend     smallint not null check (weekend in (1, 2)),
  updated_at  timestamptz not null default now()
);

create table if not exists public.properties (
  id              uuid primary key default gen_random_uuid(),
  url             text not null check (url ~* '^https?://' and char_length(url) <= 2000),
  url_key         text not null unique,                    -- host + path, so the same listing can't be added twice
  nickname        text check (char_length(nickname) <= 40),
  est_total_price numeric(10, 2) check (est_total_price >= 0 and est_total_price < 10000000),
  guests          int check (guests between 1 and 50),
  preview_title   text check (char_length(preview_title) <= 200),
  preview_image   text check (preview_image ~* '^https://' and char_length(preview_image) <= 2000),
  added_by        uuid references public.attendees(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists public.property_votes (
  property_id uuid not null references public.properties(id) on delete cascade,
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (property_id, attendee_id)
);

create index if not exists property_votes_attendee_idx on public.property_votes (attendee_id);
create index if not exists attendee_devices_attendee_idx on public.attendee_devices (attendee_id);

-- ── access: read everything, write nothing directly ─────────────────────────

alter table public.attendees        enable row level security;
alter table public.attendee_devices enable row level security;
alter table public.artist_picks     enable row level security;
alter table public.weekend_votes    enable row level security;
alter table public.properties       enable row level security;
alter table public.property_votes   enable row level security;

drop policy if exists "group can read" on public.attendees;
drop policy if exists "group can read" on public.artist_picks;
drop policy if exists "group can read" on public.weekend_votes;
drop policy if exists "group can read" on public.properties;
drop policy if exists "group can read" on public.property_votes;
create policy "group can read" on public.attendees      for select to anon, authenticated using (true);
create policy "group can read" on public.artist_picks   for select to anon, authenticated using (true);
create policy "group can read" on public.weekend_votes  for select to anon, authenticated using (true);
create policy "group can read" on public.properties     for select to anon, authenticated using (true);
create policy "group can read" on public.property_votes for select to anon, authenticated using (true);
-- attendee_devices has RLS on and no policy, so the site can never read tokens.

grant usage on schema public to anon, authenticated;
grant select on
  public.attendees, public.artist_picks, public.weekend_votes,
  public.properties, public.property_votes
to anon, authenticated;

revoke insert, update, delete, truncate on
  public.attendees, public.attendee_devices, public.artist_picks,
  public.weekend_votes, public.properties, public.property_votes
from anon, authenticated;
revoke select on public.attendee_devices from anon, authenticated;

-- ── helpers ─────────────────────────────────────────────────────────────────

create or replace function public._norm(t text) returns text
language sql immutable as $$
  select lower(regexp_replace(btrim(coalesce(t, '')), '\s+', ' ', 'g'))
$$;

-- "https://www.airbnb.com/rooms/123?check_in=…#x" → "airbnb.com/rooms/123"
create or replace function public._url_key(u text) returns text
language sql immutable as $$
  select regexp_replace(
           regexp_replace(
             regexp_replace(lower(btrim(u)), '^https?://(www\.|m\.)?', ''),
             '[?#].*$', ''),
           '/+$', '')
$$;

create or replace function public._attendee_for(p_device text) returns uuid
language sql stable security definer set search_path = public as $$
  select attendee_id from public.attendee_devices where device_token = p_device
$$;

-- ── actions the site can call ───────────────────────────────────────────────

-- Who am I on this device? Returns the pass id or null.
create or replace function public.whoami(p_device text) returns uuid
language sql stable security definer set search_path = public as $$
  select public._attendee_for(p_device)
$$;

-- Create or update your pass. Errors:
--   NAME_TAKEN  someone else (another device) already has that name.
--               Send p_claim = true if it's really you on a new phone.
create or replace function public.join_trip(
  p_device text, p_name text, p_status text, p_artist text, p_claim boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_name   text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_artist text := regexp_replace(btrim(coalesce(p_artist, '')), '\s+', ' ', 'g');
  v_mine   uuid;
  v_owner  uuid;
begin
  if p_device is null or char_length(p_device) < 20 then raise exception 'BAD_DEVICE'; end if;
  if char_length(v_name) not between 1 and 24 then raise exception 'BAD_NAME'; end if;
  if p_status not in ('in', 'maybe') then raise exception 'BAD_STATUS'; end if;
  if char_length(v_artist) not between 1 and 40 then raise exception 'BAD_ARTIST'; end if;

  v_mine  := public._attendee_for(p_device);
  select id into v_owner from public.attendees where name_key = public._norm(v_name);

  if v_owner is not null and v_owner is distinct from v_mine then
    if not coalesce(p_claim, false) then raise exception 'NAME_TAKEN'; end if;
    -- "That's me on a new phone": move this device onto the existing pass.
    delete from public.attendee_devices where device_token = p_device;
    insert into public.attendee_devices (device_token, attendee_id) values (p_device, v_owner);
    v_mine := v_owner;
  end if;

  if v_mine is null then
    if (select count(*) from public.attendees) >= 200 then raise exception 'ROSTER_FULL'; end if;
    insert into public.attendees (name, name_key, status)
      values (v_name, public._norm(v_name), p_status)
      returning id into v_mine;
    insert into public.attendee_devices (device_token, attendee_id) values (p_device, v_mine);
  else
    update public.attendees
       set name = v_name, name_key = public._norm(v_name), status = p_status, updated_at = now()
     where id = v_mine;
  end if;

  insert into public.artist_picks (attendee_id, artist, artist_key)
    values (v_mine, v_artist, public._norm(v_artist))
  on conflict (attendee_id) do update
    set artist = excluded.artist, artist_key = excluded.artist_key, updated_at = now();

  return v_mine;
end $$;

-- One vote per person; voting again switches your vote.
create or replace function public.vote_weekend(p_device text, p_weekend int) returns void
language plpgsql security definer set search_path = public as $$
declare v_me uuid := public._attendee_for(p_device);
begin
  if v_me is null then raise exception 'NOT_JOINED'; end if;
  if p_weekend not in (1, 2) then raise exception 'BAD_WEEKEND'; end if;
  insert into public.weekend_votes (attendee_id, weekend) values (v_me, p_weekend)
  on conflict (attendee_id) do update set weekend = excluded.weekend, updated_at = now();
end $$;

-- Add a house. Errors: NOT_JOINED, BAD_URL, DUPLICATE_PROPERTY, TOO_MANY_PROPERTIES.
create or replace function public.add_property(
  p_device text, p_url text, p_nickname text default null, p_price numeric default null,
  p_guests int default null, p_title text default null, p_image text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me  uuid := public._attendee_for(p_device);
  v_url text := btrim(coalesce(p_url, ''));
  v_id  uuid;
begin
  if v_me is null then raise exception 'NOT_JOINED'; end if;
  if v_url !~* '^https?://[^\s/]+\.[^\s]+$' or char_length(v_url) > 2000 then raise exception 'BAD_URL'; end if;
  if exists (select 1 from public.properties where url_key = public._url_key(v_url)) then
    raise exception 'DUPLICATE_PROPERTY';
  end if;
  if (select count(*) from public.properties) >= 100 then raise exception 'TOO_MANY_PROPERTIES'; end if;
  if p_price is not null and (p_price < 0 or p_price >= 10000000) then raise exception 'BAD_PRICE'; end if;
  if p_guests is not null and p_guests not between 1 and 50 then raise exception 'BAD_GUESTS'; end if;

  insert into public.properties (url, url_key, nickname, est_total_price, guests, preview_title, preview_image, added_by)
  values (
    v_url, public._url_key(v_url),
    nullif(left(btrim(coalesce(p_nickname, '')), 40), ''),
    p_price, p_guests,
    nullif(left(btrim(coalesce(p_title, '')), 200), ''),
    case when p_image ~* '^https://' and char_length(p_image) <= 2000 then p_image end,
    v_me
  ) returning id into v_id;
  return v_id;
end $$;

-- Heart / un-heart a house. Returns true when the heart is now on.
create or replace function public.toggle_property_vote(p_device text, p_property uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_me uuid := public._attendee_for(p_device);
begin
  if v_me is null then raise exception 'NOT_JOINED'; end if;
  if not exists (select 1 from public.properties where id = p_property) then raise exception 'NO_PROPERTY'; end if;
  delete from public.property_votes where property_id = p_property and attendee_id = v_me;
  if found then return false; end if;
  insert into public.property_votes (property_id, attendee_id) values (p_property, v_me);
  return true;
end $$;

-- Remove a house you added.
create or replace function public.remove_property(p_device text, p_property uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_me uuid := public._attendee_for(p_device);
begin
  if v_me is null then raise exception 'NOT_JOINED'; end if;
  delete from public.properties where id = p_property and added_by = v_me;
  if not found then raise exception 'NOT_YOURS'; end if;
end $$;

revoke all on function public._attendee_for(text) from public, anon, authenticated;
grant execute on function
  public.whoami(text),
  public.join_trip(text, text, text, text, boolean),
  public.vote_weekend(text, int),
  public.add_property(text, text, text, numeric, int, text, text),
  public.toggle_property_vote(text, uuid),
  public.remove_property(text, uuid)
to anon, authenticated;

-- ── live updates ────────────────────────────────────────────────────────────
-- Lets every open phone refresh the moment someone joins, votes or adds a house.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['attendees', 'artist_picks', 'weekend_votes', 'properties', 'property_votes'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
