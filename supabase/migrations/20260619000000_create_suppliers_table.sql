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
