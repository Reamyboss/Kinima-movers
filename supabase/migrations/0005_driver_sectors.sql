-- Driver sectors: which trips a driver takes, by how far from Ikorodu.
--   local = Ikorodu town only (zone A)
--   lagos = anywhere up to Island and Lekki (zones A to D)
--   far   = anywhere, including Badagry, Epe and Ibeju-Lekki (zone E)
do $$ begin
  create type driver_sector as enum ('local', 'lagos', 'far');
exception when duplicate_object then null; end $$;

-- Existing drivers keep seeing every job until the owner narrows them.
alter table drivers add column if not exists sector driver_sector not null default 'far';

-- 1 = local, 2 = lagos, 3 = far. A trip needs the reach of its farthest end.
create or replace function sector_rank(s driver_sector) returns int language sql immutable as
$$ select case s when 'local' then 1 when 'lagos' then 2 else 3 end $$;

create or replace function trip_rank(p_pickup text, p_dropoff text) returns int language sql stable set search_path = public as $$
  select max(case a.zone_id when 'A' then 1 when 'E' then 3 else 2 end)
  from pricing_areas a where a.name in (p_pickup, p_dropoff)
$$;

-- Sign-up can ask for a sector; anything else falls back to Lagos-wide.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  wanted text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  sec text := new.raw_user_meta_data->>'sector';
begin
  insert into profiles (id, role, full_name, phone)
  values (
    new.id,
    case when wanted = 'driver' then 'driver'::user_role else 'customer'::user_role end,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  if wanted = 'driver' then
    insert into drivers (id, plate_number, licence_number, sector)
    values (new.id, new.raw_user_meta_data->>'plate_number', new.raw_user_meta_data->>'licence_number',
            case when sec in ('local', 'lagos', 'far') then sec::driver_sector else 'lagos' end);
  end if;
  return new;
end $$;

-- Open jobs now only list trips inside the driver's sector.
create or replace function list_open_jobs() returns table (
  id uuid, ref text, pickup_area text, dropoff_area text, load_type text,
  helpers int, pickup_floors int, dropoff_floors int, driver_earning int,
  scheduled_for timestamptz, created_at timestamptz
) language sql stable security definer set search_path = public as $$
  select b.id, b.ref, b.pickup_area, b.dropoff_area, b.load_type, b.helpers,
         b.pickup_floors, b.dropoff_floors, b.driver_earning, b.scheduled_for, b.created_at
  from bookings b
  join drivers d on d.id = auth.uid() and d.status = 'approved' and d.is_online
  where b.status = 'requested' and b.driver_id is null
    and trip_rank(b.pickup_area, b.dropoff_area) <= sector_rank(d.sector)
  order by coalesce(b.scheduled_for, b.created_at)
$$;

-- Accepting enforces the same rule, so a job outside the sector can't be taken.
create or replace function accept_booking(p_booking uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean; my_rank int; need int;
begin
  select sector_rank(sector) into my_rank from drivers where id = auth.uid() and status = 'approved';
  if my_rank is null then
    raise exception 'Your driver account is not approved yet';
  end if;
  if exists (select 1 from bookings where driver_id = auth.uid() and status not in ('delivered', 'cancelled')) then
    raise exception 'Finish your current job first';
  end if;
  select trip_rank(pickup_area, dropoff_area) into need from bookings where id = p_booking;
  if need > my_rank then
    raise exception 'This trip is outside your sector';
  end if;

  update bookings set driver_id = auth.uid(), status = 'assigned'
  where id = p_booking and status = 'requested' and driver_id is null;
  ok := found;
  if ok then
    insert into booking_events (booking_id, status, actor_id) values (p_booking, 'assigned', auth.uid());
  end if;
  return ok;
end $$;
