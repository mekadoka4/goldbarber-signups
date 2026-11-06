create table if not exists public.barber_working_hours (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references auth.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_working boolean not null default false,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  constraint barber_working_hours_valid_interval check (
    not is_working
    or (start_time is not null and end_time is not null and start_time < end_time)
  ),
  constraint barber_working_hours_barber_day_unique unique (barber_id, day_of_week)
);

create table if not exists public.barber_services (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 100),
  description text check (description is null or length(description) <= 500),
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes integer not null check (
    duration_minutes between 5 and 480 and duration_minutes % 5 = 0
  ),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists barber_services_owner_enabled_name_idx
  on public.barber_services (barber_id, is_enabled, name);

alter table public.barber_working_hours enable row level security;
alter table public.barber_services enable row level security;

revoke all on table public.barber_working_hours from anon, authenticated;
revoke all on table public.barber_services from anon, authenticated;
grant select, insert, update, delete on table public.barber_working_hours to authenticated;
grant select, insert, update, delete on table public.barber_services to authenticated;

drop policy if exists barber_working_hours_select_own on public.barber_working_hours;
create policy barber_working_hours_select_own
  on public.barber_working_hours for select to authenticated
  using (barber_id = (select auth.uid()));

drop policy if exists barber_working_hours_insert_own on public.barber_working_hours;
create policy barber_working_hours_insert_own
  on public.barber_working_hours for insert to authenticated
  with check (barber_id = (select auth.uid()));

drop policy if exists barber_working_hours_update_own on public.barber_working_hours;
create policy barber_working_hours_update_own
  on public.barber_working_hours for update to authenticated
  using (barber_id = (select auth.uid()))
  with check (barber_id = (select auth.uid()));

drop policy if exists barber_working_hours_delete_own on public.barber_working_hours;
create policy barber_working_hours_delete_own
  on public.barber_working_hours for delete to authenticated
  using (barber_id = (select auth.uid()));

drop policy if exists barber_services_select_own on public.barber_services;
create policy barber_services_select_own
  on public.barber_services for select to authenticated
  using (barber_id = (select auth.uid()));

drop policy if exists barber_services_insert_own on public.barber_services;
create policy barber_services_insert_own
  on public.barber_services for insert to authenticated
  with check (barber_id = (select auth.uid()));

drop policy if exists barber_services_update_own on public.barber_services;
create policy barber_services_update_own
  on public.barber_services for update to authenticated
  using (barber_id = (select auth.uid()))
  with check (barber_id = (select auth.uid()));

drop policy if exists barber_services_delete_own on public.barber_services;
create policy barber_services_delete_own
  on public.barber_services for delete to authenticated
  using (barber_id = (select auth.uid()));
