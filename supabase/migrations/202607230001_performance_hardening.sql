-- Índices seguros para as consultas mais usadas pelo ShowMap.
-- Esta migração não remove dados e pode ser executada mais de uma vez.

create index if not exists events_company_date_status_idx
  on public.events (company_id, date, status);

create index if not exists events_company_agent_date_idx
  on public.events (company_id, agent_id, date)
  where agent_id is not null;

create index if not exists events_company_artist_date_idx
  on public.events (company_id, lower(artist_name), date)
  where artist_name is not null and artist_name <> '';

create index if not exists events_company_state_city_idx
  on public.events (company_id, state_id, lower(city));

create index if not exists profiles_company_role_idx
  on public.profiles (company_id, role);

create index if not exists companies_plan_expiration_idx
  on public.companies (active, plan_expires_at);

alter table public.events
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();
