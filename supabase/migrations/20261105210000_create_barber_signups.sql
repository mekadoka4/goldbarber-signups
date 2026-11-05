create table if not exists public.barber_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  whatsapp text not null,
  photo_path text not null
);

create unique index if not exists barber_signups_email_unique
  on public.barber_signups (lower(email));

create unique index if not exists barber_signups_phone_unique
  on public.barber_signups (phone);

create unique index if not exists barber_signups_whatsapp_unique
  on public.barber_signups (whatsapp);

alter table public.barber_signups enable row level security;
revoke all on table public.barber_signups from anon, authenticated;
grant all on table public.barber_signups to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'barber-profile-photos',
  'barber-profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
