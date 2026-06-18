create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  document text,
  email text,
  phone text,
  city text,
  state text,
  country text,
  customer_type text,
  status text,
  preferred_channel text,
  tags jsonb not null default '[]'::jsonb,
  travel_profile jsonb not null default '{}'::jsonb,
  financial jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx
  on public.customers (user_id);

create index if not exists customers_email_idx
  on public.customers (email);

create index if not exists customers_phone_idx
  on public.customers (phone);

create index if not exists customers_status_idx
  on public.customers (status);

create or replace function public.set_customers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customers_updated_at on public.customers;

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_customers_updated_at();

alter table public.customers enable row level security;

drop policy if exists "Users can select their own customers" on public.customers;
create policy "Users can select their own customers"
on public.customers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own customers" on public.customers;
create policy "Users can insert their own customers"
on public.customers
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own customers" on public.customers;
create policy "Users can update their own customers"
on public.customers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own customers" on public.customers;
create policy "Users can delete their own customers"
on public.customers
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.customers to authenticated;
