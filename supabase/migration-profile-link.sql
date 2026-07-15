-- Execute no Supabase SQL Editor uma vez para corrigir o gatilho de perfis.
-- Novos escritórios e agentes passarão a nascer vinculados à empresa correta.
alter table public.profiles add column if not exists email text;
create unique index if not exists profiles_email_key on public.profiles (email) where email is not null;

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
      else 'agent'
    end,
    null
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    company_id = excluded.company_id;
  return new;
end;
$$;

-- Atualiza apenas nome e e-mail das contas existentes. Papéis e vínculos são
-- definidos pela função segura, e não por metadados enviados pelo navegador.
update public.profiles p
set name = coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), p.name),
    email = u.email
from auth.users u
where p.id = u.id;
