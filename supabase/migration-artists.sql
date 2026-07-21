-- ShowMap: Tabela de Artistas
-- Execute no Supabase > SQL Editor > New query

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists artists_name_idx on public.artists(name);

alter table public.artists enable row level security;

-- Todos autenticados podem ver os artistas
create policy "artists_select" on public.artists for select to authenticated
  using (true);

-- Apenas superadmin pode inserir, editar e deletar artistas
create policy "artists_insert" on public.artists for insert to authenticated
  with check (public.is_superadmin());

create policy "artists_update" on public.artists for update to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "artists_delete" on public.artists for delete to authenticated
  using (public.is_superadmin());

-- Migrar artistas existentes dos eventos para a tabela (evita duplicados)
insert into public.artists (name)
select distinct artist_name from public.events
where artist_name is not null and trim(artist_name) != ''
on conflict (name) do nothing;


-- ============================================================
-- Corrigir política de INSERT em events para permitir agentes
-- criarem oportunidades importadas (status Cadastro, agent_id null)
-- ============================================================

drop policy if exists "events_insert" on public.events;

create policy "events_insert" on public.events for insert to authenticated
  with check (
    public.is_superadmin()
    or (
      public.current_user_role() = 'company_admin'
      and company_id = public.current_company_id()
    )
    or (
      public.current_user_role() = 'agent'
      and company_id = public.current_company_id()
      and (
        (status = 'Proposta' and agent_id = auth.uid())
        or
        (status = 'Cadastro' and agent_id is null)
      )
    )
  );
