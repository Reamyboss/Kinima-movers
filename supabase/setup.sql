-- Kinma Movers: complete database setup in one paste.
-- Supabase > SQL Editor > New query > paste this whole file > Run. Run it once only.
-- It is the four files in supabase/migrations/ joined in order.

-- ===== supabase/migrations/0001_init.sql =====
-- Kinma Movers core schema: people, pricing, bookings and their status history.

create extension if not exists pgcrypto;

-- People -------------------------------------------------------------------
create type user_role as enum ('customer', 'driver', 'admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create type driver_status as enum ('pending', 'approved', 'suspended');

create table drivers (
  id uuid primary key references profiles on delete cascade,
  status driver_status not null default 'pending',
  vehicle text not null default 'Suzuki Carry',
  plate_number text,
  licence_number text,
  is_online boolean not null default false,
  base_area text not null default 'Ikorodu Garage',
  rating numeric(2,1) not null default 5.0,
  created_at timestamptz not null default now()
);

-- Pricing (editable from admin) ---------------------------------------------
create table pricing_zones (
  id text primary key,            -- 'A'..'E'
  name text not null,
  fare integer not null check (fare >= 0),
  sort int not null default 0
);

create table pricing_areas (
  name text primary key,
  zone_id text not null references pricing_zones on update cascade
);

create table pricing_load_types (
  id text primary key,
  name text not null,
  description text not null default '',
  multiplier numeric(4,2) not null check (multiplier > 0),
  sort int not null default 0
);

create table pricing_settings (
  id boolean primary key default true check (id), -- single row
  helper_fee integer not null default 5000,
  stairs_fee_per_floor integer not null default 2000,
  out_of_hub_pickup_share numeric(3,2) not null default 0.40,
  driver_share numeric(3,2) not null default 0.80
);

-- Bookings -------------------------------------------------------------------
create type booking_status as enum (
  'requested', 'assigned', 'driver_en_route', 'arrived_pickup',
  'in_transit', 'delivered', 'cancelled'
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default ('KM-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6))),
  customer_id uuid references profiles,
  customer_name text not null,
  customer_phone text not null,
  pickup_area text not null references pricing_areas,
  pickup_address text not null,
  pickup_floors int not null default 0,
  dropoff_area text not null references pricing_areas,
  dropoff_address text not null,
  dropoff_floors int not null default 0,
  load_type text not null references pricing_load_types,
  load_notes text,
  helpers int not null default 0,
  scheduled_for timestamptz,
  quote_lines jsonb not null,
  total integer not null,
  driver_earning integer not null,
  payment_method text not null default 'cash_or_transfer',
  status booking_status not null default 'requested',
  driver_id uuid references drivers,
  created_at timestamptz not null default now()
);

create table booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references bookings on delete cascade,
  status booking_status not null,
  actor_id uuid references profiles,
  note text,
  created_at timestamptz not null default now()
);

create index on bookings (status, created_at desc);
create index on bookings (driver_id);

-- Row level security ---------------------------------------------------------
-- The public site never writes directly: bookings go through the server API,
-- which recomputes the price and uses the service role.
alter table profiles enable row level security;
alter table drivers enable row level security;
alter table pricing_zones enable row level security;
alter table pricing_areas enable row level security;
alter table pricing_load_types enable row level security;
alter table pricing_settings enable row level security;
alter table bookings enable row level security;
alter table booking_events enable row level security;

create function is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create policy "pricing readable" on pricing_zones for select using (true);
create policy "pricing readable" on pricing_areas for select using (true);
create policy "pricing readable" on pricing_load_types for select using (true);
create policy "pricing readable" on pricing_settings for select using (true);
create policy "admin edits pricing" on pricing_zones for all using (is_admin()) with check (is_admin());
create policy "admin edits pricing" on pricing_areas for all using (is_admin()) with check (is_admin());
create policy "admin edits pricing" on pricing_load_types for all using (is_admin()) with check (is_admin());
create policy "admin edits pricing" on pricing_settings for all using (is_admin()) with check (is_admin());

create policy "own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "update own profile" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "driver reads self" on drivers for select using (id = auth.uid() or is_admin());
create policy "driver toggles online" on drivers for update using (id = auth.uid() and status = 'approved');
create policy "admin manages drivers" on drivers for all using (is_admin()) with check (is_admin());

create policy "customer reads own bookings" on bookings for select using (customer_id = auth.uid());
create policy "driver reads open and assigned" on bookings for select using (
  exists (select 1 from drivers d where d.id = auth.uid() and d.status = 'approved')
  and (driver_id = auth.uid() or (status = 'requested' and driver_id is null))
);
create policy "admin all bookings" on bookings for all using (is_admin()) with check (is_admin());
create policy "events readable with booking" on booking_events for select using (
  exists (select 1 from bookings b where b.id = booking_id)
);

-- Seed: owner's prices (25 Sep 2026) ------------------------------------------
insert into pricing_zones (id, name, fare, sort) values
  ('A', 'Ikorodu town', 15000, 1),
  ('B', 'Near corridor', 50000, 2),
  ('C', 'Mainland', 60000, 3),
  ('D', 'Island and Lekki', 100000, 4),
  ('E', 'Far Lagos', 120000, 5);

insert into pricing_areas (name, zone_id) values
  ('Ikorodu Garage','A'),('Agric','A'),('Ijede','A'),('Igbogbo','A'),('Ebute','A'),('Owutu','A'),('Odogunyan','A'),('Ikorodu Town','A'),
  ('Mile 12','B'),('Ketu','B'),('Ojota','B'),('Isheri','B'),('Magodo','B'),('Maryland','B'),
  ('Ikeja','C'),('Yaba','C'),('Surulere','C'),('Oshodi','C'),('Ogba','C'),('Gbagada','C'),
  ('Victoria Island','D'),('Ikoyi','D'),('Lekki Phase 1','D'),('Ajah','D'),('Sangotedo','D'),
  ('Badagry','E'),('Epe','E'),('Ibeju-Lekki','E'),('Ikotun','E');

insert into pricing_load_types (id, name, description, multiplier, sort) values
  ('small', 'Small load', 'Boxes, bags, a few items', 1.0, 1),
  ('household', 'Household', 'Room or shop items', 1.3, 2),
  ('furniture', 'Furniture', 'Beds, sofas, fridges', 1.5, 3),
  ('full', 'Full truck', 'Whole flat, one trip', 1.8, 4);

insert into pricing_settings default values;

-- ===== supabase/migrations/0002_driver_flow.sql =====
-- Sign-up creates the profile (and driver record) from sign-up metadata.
-- Only 'customer' or 'driver' can be self-chosen; admins are set by hand.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  wanted text := coalesce(new.raw_user_meta_data->>'role', 'customer');
begin
  insert into profiles (id, role, full_name, phone)
  values (
    new.id,
    case when wanted = 'driver' then 'driver'::user_role else 'customer'::user_role end,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  if wanted = 'driver' then
    insert into drivers (id, plate_number, licence_number)
    values (new.id, new.raw_user_meta_data->>'plate_number', new.raw_user_meta_data->>'licence_number');
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Drivers change bookings only through these two functions, so a driver can
-- never grab a taken job, skip a step, or touch someone else's trip.
create function accept_booking(p_booking uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if not exists (select 1 from drivers where id = auth.uid() and status = 'approved') then
    raise exception 'Your driver account is not approved yet';
  end if;
  if exists (select 1 from bookings where driver_id = auth.uid() and status not in ('delivered', 'cancelled')) then
    raise exception 'Finish your current job first';
  end if;

  update bookings set driver_id = auth.uid(), status = 'assigned'
  where id = p_booking and status = 'requested' and driver_id is null;
  ok := found;
  if ok then
    insert into booking_events (booking_id, status, actor_id) values (p_booking, 'assigned', auth.uid());
  end if;
  return ok;
end $$;

create function advance_booking(p_booking uuid) returns booking_status
language plpgsql security definer set search_path = public as $$
declare cur booking_status; nxt booking_status;
begin
  select status into cur from bookings where id = p_booking and driver_id = auth.uid() for update;
  if cur is null then raise exception 'This job is not assigned to you'; end if;
  nxt := case cur
    when 'assigned' then 'driver_en_route'
    when 'driver_en_route' then 'arrived_pickup'
    when 'arrived_pickup' then 'in_transit'
    when 'in_transit' then 'delivered'
  end;
  if nxt is null then raise exception 'This job is already finished'; end if;
  update bookings set status = nxt where id = p_booking;
  insert into booking_events (booking_id, status, actor_id) values (p_booking, nxt, auth.uid());
  return nxt;
end $$;

revoke execute on function accept_booking(uuid), advance_booking(uuid) from public, anon;
grant execute on function accept_booking(uuid), advance_booking(uuid) to authenticated;

-- Drivers flip only their online switch; everything else on their record is admin-only.
create function set_driver_online(p_online boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update drivers set is_online = p_online where id = auth.uid() and status = 'approved';
  if not found then raise exception 'Your driver account is not approved yet'; end if;
end $$;
drop policy "driver toggles online" on drivers;

-- Open jobs show drivers the trip, load and pay, but not the customer's
-- name, phone or street address until the driver accepts.
create function list_open_jobs() returns table (
  id uuid, ref text, pickup_area text, dropoff_area text, load_type text,
  helpers int, pickup_floors int, dropoff_floors int, driver_earning int,
  scheduled_for timestamptz, created_at timestamptz
) language sql stable security definer set search_path = public as $$
  select b.id, b.ref, b.pickup_area, b.dropoff_area, b.load_type, b.helpers,
         b.pickup_floors, b.dropoff_floors, b.driver_earning, b.scheduled_for, b.created_at
  from bookings b
  where b.status = 'requested' and b.driver_id is null
    and exists (select 1 from drivers d where d.id = auth.uid() and d.status = 'approved' and d.is_online)
  order by coalesce(b.scheduled_for, b.created_at)
$$;

revoke execute on function set_driver_online(boolean), list_open_jobs() from public, anon;
grant execute on function set_driver_online(boolean), list_open_jobs() to authenticated;

drop policy "driver reads open and assigned" on bookings;
create policy "driver reads assigned" on bookings for select using (driver_id = auth.uid());

-- ===== supabase/migrations/0003_driver_location.sql =====
-- Where each driver is right now (by area), so matching can pick the
-- closest truck. Street-level GPS tracking comes in Phase 2.
alter table drivers add column current_area text references pricing_areas;

create function set_driver_area(p_area text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update drivers set current_area = p_area where id = auth.uid() and status = 'approved';
  if not found then raise exception 'Your driver account is not approved yet'; end if;
end $$;

revoke execute on function set_driver_area(text) from public, anon;
grant execute on function set_driver_area(text) to authenticated;

-- AI load assistant usage log (lets the owner see what customers ask for).
create table ai_load_requests (
  id bigint generated always as identity primary key,
  description text not null,
  suggestion jsonb not null,
  created_at timestamptz not null default now()
);
alter table ai_load_requests enable row level security;
create policy "admin reads ai log" on ai_load_requests for select using (is_admin());

-- ===== supabase/migrations/0004_area_notes_and_terms.sql =====
-- Area notes: places where union, market or estate levies are demanded, or
-- where barriers stop trucks. Customers see them before booking and drivers
-- see them before accepting. Levies are passed on at cost, never marked up.
create table if not exists area_notes (
  id bigint generated always as identity primary key,
  place text not null unique,
  area text references pricing_areas on update cascade on delete set null,
  keywords text[] not null default '{}',
  levy_min integer check (levy_min >= 0),
  levy_max integer check (levy_max >= 0),
  note text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table area_notes enable row level security;
drop policy if exists "area notes readable" on area_notes;
create policy "area notes readable" on area_notes for select using (active or is_admin());
drop policy if exists "admin edits area notes" on area_notes;
create policy "admin edits area notes" on area_notes for all using (is_admin()) with check (is_admin());

-- What the customer agreed to and was warned about, and levies actually paid.
alter table bookings add column if not exists terms_version text;
alter table bookings add column if not exists terms_accepted_at timestamptz;
alter table bookings add column if not exists area_warnings jsonb not null default '[]';
alter table bookings add column if not exists levy_paid integer not null default 0;

-- The assigned driver records a levy they paid, with where and how much.
-- It is added to what the customer owes at cost and logged on the timeline.
create or replace function record_levy(p_booking uuid, p_amount integer, p_note text) returns integer
language plpgsql security definer set search_path = public as $$
declare cur booking_status; total_levy integer;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100000 then
    raise exception 'Enter the levy amount you paid (up to ₦100,000)';
  end if;
  if coalesce(trim(p_note), '') = '' then
    raise exception 'Say where you paid it and who collected it';
  end if;
  select status into cur from bookings where id = p_booking and driver_id = auth.uid() for update;
  if cur is null then raise exception 'This job is not assigned to you'; end if;
  if cur in ('delivered', 'cancelled') then raise exception 'This job is already finished'; end if;
  update bookings set levy_paid = levy_paid + p_amount where id = p_booking returning levy_paid into total_levy;
  insert into booking_events (booking_id, status, actor_id, note)
  values (p_booking, cur, auth.uid(), 'Area levy ₦' || p_amount || ': ' || left(trim(p_note), 200));
  return total_levy;
end $$;
revoke execute on function record_levy(uuid, integer, text) from public, anon;
grant execute on function record_levy(uuid, integer, text) to authenticated;

-- Starting notes from the owner's own road experience. Amounts are left
-- blank until the owner confirms them in the admin dashboard.
insert into area_notes (place, area, keywords, note) values
  ('Alaba International Market', null, '{alaba international,alaba intl,alaba market}',
   'Market union collects a gate fee before trucks enter. Trucks can be held at the gate during busy hours.'),
  ('Alaba Suru', null, '{alaba suru,alaba-suru}',
   'Union levy is usually demanded before entry. Confirm with the customer where the truck can park.'),
  ('Mile 2', null, '{mile 2,mile two,mile2}',
   'Park and union touts stop trucks around the Mile 2 axis. Keep the booking number ready.'),
  ('Badagry Expressway corridor', 'Badagry', '{}',
   'Several union points along the Badagry Expressway (Mile 2, Agboju, Alaba, Okokomaiko) may demand levies on the way.'),
  ('Ajah side', 'Ajah', '{}',
   'Some estates and streets around Ajah charge trucks at the gate, and some only allow trucks in at set hours.'),
  ('Abraham Adesanya', 'Ajah', '{abraham adesanya,adesanya}',
   'Estate and union points around Abraham Adesanya may charge trucks before entry.'),
  ('Ibeju-Lekki', 'Ibeju-Lekki', '{}',
   'Community and union levies are common on the Ibeju-Lekki axis. Some roads have barriers for trucks.'),
  ('Admiralty Road, Lekki Phase 1', 'Lekki Phase 1', '{admiralty}',
   'Estate gates and touts on Admiralty Road may charge trucks, and some estates restrict truck hours.')
on conflict (place) do nothing;
