create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  passenger_name text not null,
  passenger_surname text not null,
  locator text not null,
  airline text not null,
  provider text not null,
  status text not null,
  origin text not null,
  destination text not null,
  departure_date timestamptz not null,
  return_date timestamptz,
  total_amount numeric not null default 0,
  currency text not null default 'BRL',
  baggage jsonb not null default '{}'::jsonb,
  segments jsonb not null default '[]'::jsonb,
  raw_data jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_user_id_idx
  on public.tickets (user_id);

create index if not exists tickets_locator_idx
  on public.tickets (locator);

create index if not exists tickets_passenger_surname_idx
  on public.tickets (passenger_surname);

create unique index if not exists tickets_user_locator_surname_unique_idx
  on public.tickets (user_id, upper(locator), lower(passenger_surname));

create or replace function public.set_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tickets_updated_at on public.tickets;

create trigger set_tickets_updated_at
before update on public.tickets
for each row
execute function public.set_tickets_updated_at();

alter table public.tickets enable row level security;

drop policy if exists "Users can select their own tickets" on public.tickets;
create policy "Users can select their own tickets"
on public.tickets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tickets" on public.tickets;
create policy "Users can insert their own tickets"
on public.tickets
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tickets" on public.tickets;
create policy "Users can update their own tickets"
on public.tickets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tickets" on public.tickets;
create policy "Users can delete their own tickets"
on public.tickets
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.tickets to authenticated;
