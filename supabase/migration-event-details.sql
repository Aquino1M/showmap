-- Execute uma vez no SQL Editor para habilitar os novos dados de proposta.
alter table public.events add column if not exists contractor_instagram text;
alter table public.events add column if not exists event_name text;
