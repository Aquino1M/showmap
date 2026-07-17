-- Execute uma vez no SQL Editor do Supabase.
-- Permite que o escritório guarde oportunidades recorrentes sem reservar ou vender uma data.
alter table public.events
  add column if not exists is_recurring boolean not null default false;

alter table public.events
  drop constraint if exists events_status_check;

alter table public.events
  add constraint events_status_check
  check (status in ('Disponível', 'Proposta', 'Confirmado', 'Reservado', 'Agendado', 'Vendido', 'Cadastro'));

create index if not exists events_company_recurring_idx
  on public.events(company_id, is_recurring, date);

-- Mantém Agenda, Propostas e Calendário rápidos mesmo com muitos anos de histórico.
create index if not exists events_company_date_status_idx
  on public.events(company_id, date, status);
