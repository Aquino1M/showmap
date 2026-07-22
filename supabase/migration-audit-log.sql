create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  action text not null,
  details text,
  company_id uuid references public.companies(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_event_id_idx on public.audit_log(event_id);
create index if not exists audit_log_company_id_idx on public.audit_log(company_id);
alter table public.audit_log enable row level security;
create policy "audit_select" on public.audit_log for select to authenticated
  using (public.is_superadmin() or company_id = public.current_company_id());
create policy "audit_insert" on public.audit_log for insert to authenticated
  with check (public.is_superadmin() or company_id = public.current_company_id());
