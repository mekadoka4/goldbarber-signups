alter table public.barber_signups
  add column if not exists auth_user_id uuid;

create unique index if not exists barber_signups_auth_user_unique
  on public.barber_signups (auth_user_id)
  where auth_user_id is not null;
