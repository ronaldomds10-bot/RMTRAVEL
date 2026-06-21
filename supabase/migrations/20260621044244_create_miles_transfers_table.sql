create table if not exists public.miles_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_program_id uuid references public.miles_programs (id) on delete set null,
  to_program_id uuid references public.miles_programs (id) on delete set null,
  quantity numeric not null default 0,
  bonus_percentage numeric not null default 0,
  final_quantity numeric not null default 0,
  transfer_date date not null default current_date,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint miles_transfers_quantity_check check (quantity >= 0),
  constraint miles_transfers_bonus_percentage_check check (bonus_percentage >= 0),
  constraint miles_transfers_final_quantity_check check (final_quantity >= 0),
  constraint miles_transfers_status_check check (status in ('pending', 'completed', 'cancelled'))
);

create index if not exists miles_transfers_user_id_idx
  on public.miles_transfers (user_id);

create index if not exists miles_transfers_from_program_id_idx
  on public.miles_transfers (from_program_id);

create index if not exists miles_transfers_to_program_id_idx
  on public.miles_transfers (to_program_id);

create index if not exists miles_transfers_status_idx
  on public.miles_transfers (status);

create index if not exists miles_transfers_transfer_date_idx
  on public.miles_transfers (transfer_date);

create or replace function public.set_miles_transfers_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_miles_transfers_updated_at on public.miles_transfers;

create trigger set_miles_transfers_updated_at
before update on public.miles_transfers
for each row
execute function public.set_miles_transfers_updated_at();

alter table public.miles_transfers enable row level security;

drop policy if exists "Users can select their own miles transfers" on public.miles_transfers;
create policy "Users can select their own miles transfers"
on public.miles_transfers
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own miles transfers" on public.miles_transfers;
create policy "Users can insert their own miles transfers"
on public.miles_transfers
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own miles transfers" on public.miles_transfers;
create policy "Users can update their own miles transfers"
on public.miles_transfers
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own miles transfers" on public.miles_transfers;
create policy "Users can delete their own miles transfers"
on public.miles_transfers
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.miles_transfers to authenticated;
