create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agency_name text not null default '',
  headline text not null default '',
  description text not null default '',
  whatsapp text not null default '',
  instagram text not null default '',
  logo_url text not null default '',
  cover_image_url text not null default '',
  primary_color text not null default '#1d4ed8',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_settings_user_id_unique_idx
  on public.site_settings (user_id);

create or replace function public.set_site_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;

create trigger set_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.set_site_settings_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Users can select their own site settings" on public.site_settings;
create policy "Users can select their own site settings"
on public.site_settings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own site settings" on public.site_settings;
create policy "Users can insert their own site settings"
on public.site_settings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own site settings" on public.site_settings;
create policy "Users can update their own site settings"
on public.site_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on table public.site_settings to authenticated;
