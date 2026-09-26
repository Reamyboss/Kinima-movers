-- Pay before pickup (Paystack). The customer pays once a driver is assigned,
-- the driver starts only after payment, and a 4-digit code given by the
-- customer at delivery completes the job.

alter table bookings add column if not exists payment_required boolean not null default false;
alter table bookings add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'pending', 'paid', 'refunded'));
alter table bookings add column if not exists customer_email text;
alter table bookings add column if not exists paystack_reference text unique;
alter table bookings add column if not exists paid_amount integer not null default 0;
alter table bookings add column if not exists paid_at timestamptz;
alter table bookings add column if not exists refunded_amount integer not null default 0;
alter table bookings add column if not exists driver_payout integer not null default 0;
alter table bookings add column if not exists driver_payout_status text not null default 'none'
  check (driver_payout_status in ('none', 'owed', 'paid'));

-- Kept apart from bookings so drivers can never read them: the link to the
-- customer's booking page and the delivery code.
create table if not exists booking_secrets (
  booking_id uuid primary key references bookings on delete cascade,
  access_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  delivery_code text not null default lpad((floor(random() * 10000))::int::text, 4, '0'),
  created_at timestamptz not null default now()
);
alter table booking_secrets enable row level security;
drop policy if exists "admin reads secrets" on booking_secrets;
create policy "admin reads secrets" on booking_secrets for select using (is_admin());

-- Replaces the one-argument version: delivery now needs the customer's code.
drop function if exists advance_booking(uuid);
create or replace function advance_booking(p_booking uuid, p_code text default null) returns booking_status
language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; nxt booking_status; code text;
begin
  select * into b from bookings where id = p_booking and driver_id = auth.uid() for update;
  if b.id is null then raise exception 'This job is not assigned to you'; end if;
  nxt := case b.status
    when 'assigned' then 'driver_en_route'
    when 'driver_en_route' then 'arrived_pickup'
    when 'arrived_pickup' then 'in_transit'
    when 'in_transit' then 'delivered'
  end;
  if nxt is null then raise exception 'This job is already finished'; end if;
  if nxt = 'driver_en_route' and b.payment_required and b.payment_status <> 'paid' then
    raise exception 'Wait for the customer to pay before you start driving';
  end if;
  if nxt = 'delivered' then
    select delivery_code into code from booking_secrets where booking_id = p_booking;
    if code is not null and coalesce(trim(p_code), '') <> code then
      raise exception 'Wrong delivery code. Ask the customer for the 4-digit code on their booking page';
    end if;
  end if;
  update bookings set status = nxt,
    driver_payout = case when nxt = 'delivered' and b.payment_status = 'paid' then b.driver_earning else driver_payout end,
    driver_payout_status = case when nxt = 'delivered' and b.payment_status = 'paid' then 'owed' else driver_payout_status end
  where id = p_booking;
  insert into booking_events (booking_id, status, actor_id) values (p_booking, nxt, auth.uid());
  return nxt;
end $$;
revoke execute on function advance_booking(uuid, text) from public, anon;
grant execute on function advance_booking(uuid, text) to authenticated;

-- A driver can hand back a job the customer hasn't paid for, so it goes
-- back on the board for someone else.
create or replace function release_unpaid_job(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update bookings set driver_id = null, status = 'requested'
  where id = p_booking and driver_id = auth.uid() and status = 'assigned'
    and payment_required and payment_status <> 'paid';
  if not found then raise exception 'Only an unpaid job that has not started can be released'; end if;
  insert into booking_events (booking_id, status, actor_id, note)
  values (p_booking, 'requested', auth.uid(), 'Released by driver: customer had not paid');
end $$;
revoke execute on function release_unpaid_job(uuid) from public, anon;
grant execute on function release_unpaid_job(uuid) to authenticated;
