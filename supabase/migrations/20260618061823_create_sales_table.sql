create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid,
  ticket_id uuid,
  customer_name text not null,
  ticket_locator text,
  origin text,
  destination text,
  cost_amount numeric not null default 0,
  sale_amount numeric not null default 0,
  profit_amount numeric generated always as (sale_amount - cost_amount) stored,
  payment_method text,
  status text not null default 'orcamento',
  notes text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_status_check check (
    status in (
      'orcamento',
      'aguardando_pagamento',
      'pago',
      'emitido',
      'cancelado'
    )
  )
);

create index if not exists sales_user_id_idx
  on public.sales (user_id);

create index if not exists sales_customer_id_idx
  on public.sales (customer_id);

create index if not exists sales_ticket_id_idx
  on public.sales (ticket_id);

create index if not exists sales_status_idx
  on public.sales (status);

create index if not exists sales_created_at_idx
  on public.sales (created_at);

create or replace function public.set_sales_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sales_updated_at on public.sales;

create trigger set_sales_updated_at
before update on public.sales
for each row
execute function public.set_sales_updated_at();

alter table public.sales enable row level security;

drop policy if exists "Users can select their own sales" on public.sales;
create policy "Users can select their own sales"
on public.sales
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own sales" on public.sales;
create policy "Users can insert their own sales"
on public.sales
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own sales" on public.sales;
create policy "Users can update their own sales"
on public.sales
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own sales" on public.sales;
create policy "Users can delete their own sales"
on public.sales
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.sales to authenticated;
