create table if not exists public.miles_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_name text not null,
  type text not null,
  balance numeric not null default 0,
  account_holder text not null default '',
  expiration_date date,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint miles_programs_type_check check (
    type in (
      'LATAM Pass',
      'Smiles',
      'TudoAzul',
      'Livelo',
      'Esfera',
      'AAdvantage',
      'Iberia Plus',
      'outro'
    )
  ),
  constraint miles_programs_status_check check (status in ('active', 'inactive'))
);

create index if not exists miles_programs_user_id_idx
  on public.miles_programs (user_id);

create index if not exists miles_programs_status_idx
  on public.miles_programs (status);

create index if not exists miles_programs_type_idx
  on public.miles_programs (type);

create or replace function public.set_miles_programs_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_miles_programs_updated_at on public.miles_programs;

create trigger set_miles_programs_updated_at
before update on public.miles_programs
for each row
execute function public.set_miles_programs_updated_at();

alter table public.miles_programs enable row level security;

drop policy if exists "Users can select their own miles programs" on public.miles_programs;
create policy "Users can select their own miles programs"
on public.miles_programs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own miles programs" on public.miles_programs;
create policy "Users can insert their own miles programs"
on public.miles_programs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own miles programs" on public.miles_programs;
create policy "Users can update their own miles programs"
on public.miles_programs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own miles programs" on public.miles_programs;
create policy "Users can delete their own miles programs"
on public.miles_programs
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.miles_programs to authenticated;
