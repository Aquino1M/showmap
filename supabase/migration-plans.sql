-- Execute uma vez no Supabase SQL Editor para ativar os planos.
alter table public.companies add column if not exists plan text not null default 'lite';
alter table public.companies add column if not exists plan_expires_at date;

alter table public.companies drop constraint if exists companies_plan_check;
alter table public.companies add constraint companies_plan_check check (plan in ('lite', 'pro', 'ultra'));

update public.companies
set plan = coalesce(plan, 'lite'),
    plan_expires_at = coalesce(plan_expires_at, (current_date + interval '1 month')::date);

alter table public.companies alter column plan set not null;
alter table public.companies alter column plan_expires_at set not null;
