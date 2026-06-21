create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  document text,
  email text,
  phone text,
  whatsapp text,
  notes text,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_user_id_idx
  on public.suppliers (user_id);

create index if not exists suppliers_status_idx
  on public.suppliers (status);

create index if not exists suppliers_type_idx
  on public.suppliers (type);

create index if not exists suppliers_document_idx
  on public.suppliers (document);

create or replace function public.set_suppliers_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_suppliers_updated_at on public.suppliers;

create trigger set_suppliers_updated_at
before update on public.suppliers
for each row
execute function public.set_suppliers_updated_at();

alter table public.suppliers enable row level security;

drop policy if exists "Users can select their own suppliers" on public.suppliers;
create policy "Users can select their own suppliers"
on public.suppliers
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own suppliers" on public.suppliers;
create policy "Users can insert their own suppliers"
on public.suppliers
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own suppliers" on public.suppliers;
create policy "Users can update their own suppliers"
on public.suppliers
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own suppliers" on public.suppliers;
create policy "Users can delete their own suppliers"
on public.suppliers
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.suppliers to authenticated;

create table if not exists public.miles_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id uuid references public.miles_programs (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  quantity numeric not null default 0,
  unit_cost numeric not null default 0,
  total_cost numeric not null default 0,
  purchase_date date not null default current_date,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint miles_purchases_quantity_check check (quantity >= 0),
  constraint miles_purchases_unit_cost_check check (unit_cost >= 0),
  constraint miles_purchases_total_cost_check check (total_cost >= 0),
  constraint miles_purchases_status_check check (status in ('pending', 'completed', 'cancelled'))
);

create index if not exists miles_purchases_user_id_idx
  on public.miles_purchases (user_id);

create index if not exists miles_purchases_program_id_idx
  on public.miles_purchases (program_id);

create index if not exists miles_purchases_supplier_id_idx
  on public.miles_purchases (supplier_id);

create index if not exists miles_purchases_status_idx
  on public.miles_purchases (status);

create index if not exists miles_purchases_purchase_date_idx
  on public.miles_purchases (purchase_date);

create or replace function public.set_miles_purchases_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_miles_purchases_updated_at on public.miles_purchases;

create trigger set_miles_purchases_updated_at
before update on public.miles_purchases
for each row
execute function public.set_miles_purchases_updated_at();

alter table public.miles_purchases enable row level security;

drop policy if exists "Users can select their own miles purchases" on public.miles_purchases;
create policy "Users can select their own miles purchases"
on public.miles_purchases
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own miles purchases" on public.miles_purchases;
create policy "Users can insert their own miles purchases"
on public.miles_purchases
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own miles purchases" on public.miles_purchases;
create policy "Users can update their own miles purchases"
on public.miles_purchases
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own miles purchases" on public.miles_purchases;
create policy "Users can delete their own miles purchases"
on public.miles_purchases
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.miles_purchases to authenticated;
