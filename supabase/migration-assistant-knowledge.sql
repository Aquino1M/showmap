-- Execute uma vez no SQL Editor do Supabase.
-- Armazena somente respostas reutilizáveis do Assistente Comercial por escritório.
create table if not exists public.assistant_knowledge (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  normalized_question text not null,
  question text not null,
  answer text not null,
  reusable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, normalized_question)
);

create index if not exists assistant_knowledge_company_updated_idx
  on public.assistant_knowledge(company_id, updated_at desc);

alter table public.assistant_knowledge enable row level security;

-- Não há políticas diretas: a Edge Function valida a sessão e acessa somente
-- as respostas do escritório autenticado usando a service role.
