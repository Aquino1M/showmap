create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
alter table public.notifications enable row level security;
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_insert" on public.notifications for insert to authenticated
  with check (
    public.is_superadmin()
    or (
      public.current_user_role() = 'company_admin'
      and company_id = public.current_company_id()
      and exists (
        select 1 from public.profiles
        where id = user_id and company_id = public.current_company_id()
      )
    )
  );
create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
