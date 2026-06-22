create extension if not exists pgcrypto with schema extensions;

alter table public.tickets
add column if not exists public_token text;

update public.tickets
set public_token = encode(extensions.gen_random_bytes(32), 'hex')
where public_token is null;

alter table public.tickets
alter column public_token set default encode(extensions.gen_random_bytes(32), 'hex');

alter table public.tickets
alter column public_token set not null;

create unique index if not exists tickets_public_token_unique_idx
  on public.tickets (public_token);

create or replace function public.get_public_ticket_by_token(lookup_public_token text)
returns table (
  id uuid,
  public_token text,
  passenger_name text,
  passenger_surname text,
  locator text,
  airline text,
  provider text,
  status text,
  origin text,
  destination text,
  departure_date timestamptz,
  return_date timestamptz,
  total_amount numeric,
  currency text,
  baggage jsonb,
  segments jsonb,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    tickets.id,
    tickets.public_token,
    tickets.passenger_name,
    tickets.passenger_surname,
    tickets.locator,
    tickets.airline,
    tickets.provider,
    tickets.status,
    tickets.origin,
    tickets.destination,
    tickets.departure_date,
    tickets.return_date,
    tickets.total_amount,
    tickets.currency,
    tickets.baggage,
    tickets.segments,
    tickets.notes,
    tickets.created_at,
    tickets.updated_at
  from public.tickets
  where tickets.public_token = lookup_public_token
  limit 1;
$$;

revoke all on function public.get_public_ticket_by_token(text) from public;
grant execute on function public.get_public_ticket_by_token(text) to anon, authenticated;
