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
