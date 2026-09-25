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
