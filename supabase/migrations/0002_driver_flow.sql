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
