-- ShowMap: execute este arquivo em Supabase > SQL Editor > New query.
-- Depois, registre diogenesdidi83@gmail.com em Authentication > Users (ou pelo site).
-- O gatilho abaixo atribui automaticamente o papel de superadmin a esse e-mail.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  active boolean not null default true,
  plan text not null default 'lite' check (plan in ('lite', 'pro', 'ultra')),
  plan_expires_at date not null default (current_date + interval '1 month')::date,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'agent' check (role in ('superadmin', 'company_admin', 'agent')),
  company_id uuid references public.companies(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  state_id text not null,
  city text not null,
  date date not null,
  time time,
  type text not null check (type in ('emenda', 'privado', 'cache', 'portaria')),
  status text not null default 'Disponível' check (status in ('Disponível', 'Proposta', 'Confirmado', 'Reservado')),
  company_id uuid not null references public.companies(id) on delete restrict,
  agent_id uuid references public.profiles(id) on delete set null,
  contractor_name text,
  contractor_email text,
  contractor_phone text,
  contractor_instagram text,
  event_name text,
  created_at timestamptz not null default now()
);

create index if not exists events_company_id_idx on public.events(company_id);
create index if not exists events_date_idx on public.events(date);
create index if not exists profiles_company_id_idx on public.profiles(company_id);

-- Cria o perfil público sempre que uma conta Auth é criada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, company_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    case
      when new.email = 'diogenesdidi83@gmail.com' then 'superadmin'
      when new.raw_user_meta_data ->> 'role' in ('company_admin', 'agent') then new.raw_user_meta_data ->> 'role'
      else 'agent'
    end,
    nullif(new.raw_user_meta_data ->> 'company_id', '')::uuid
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    company_id = excluded.company_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Funções auxiliares para as políticas de acesso.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$ select company_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select coalesce(public.current_user_role() = 'superadmin', false) $$;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;

-- Empresas: Master administra tudo; membros veem apenas a própria empresa.
create policy "companies_select" on public.companies for select to authenticated
  using (public.is_superadmin() or id = public.current_company_id());
create policy "companies_insert" on public.companies for insert to authenticated
  with check (public.is_superadmin());
create policy "companies_update" on public.companies for update to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());
create policy "companies_delete" on public.companies for delete to authenticated
  using (public.is_superadmin());

-- Perfis: Master vê e administra todos; escritório vê os membros da própria empresa.
create policy "profiles_select" on public.profiles for select to authenticated
  using (public.is_superadmin() or id = auth.uid() or company_id = public.current_company_id());
create policy "profiles_manage" on public.profiles for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Eventos: Master acessa todos; os demais ficam isolados por empresa.
create policy "events_select" on public.events for select to authenticated
  using (public.is_superadmin() or company_id = public.current_company_id());
create policy "events_insert" on public.events for insert to authenticated
  with check (
    public.is_superadmin()
    or (public.current_user_role() = 'company_admin' and company_id = public.current_company_id())
    or (public.current_user_role() = 'agent' and company_id = public.current_company_id() and agent_id = auth.uid())
  );
create policy "events_update" on public.events for update to authenticated
  using (
    public.is_superadmin()
    or (public.current_user_role() = 'company_admin' and company_id = public.current_company_id())
    or (public.current_user_role() = 'agent' and company_id = public.current_company_id() and (agent_id is null or agent_id = auth.uid()))
  )
  with check (
    public.is_superadmin()
    or (public.current_user_role() = 'company_admin' and company_id = public.current_company_id())
    or (public.current_user_role() = 'agent' and company_id = public.current_company_id() and agent_id = auth.uid())
  );
create policy "events_delete" on public.events for delete to authenticated
  using (public.is_superadmin() or (public.current_user_role() = 'company_admin' and company_id = public.current_company_id()));
