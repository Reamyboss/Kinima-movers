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
