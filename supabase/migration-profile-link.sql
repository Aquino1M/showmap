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

-- Repara contas existentes que possuem o vínculo nos metadados do Auth.
update public.profiles p
set name = coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), p.name),
    email = u.email,
    role = case
      when u.email = 'diogenesdidi83@gmail.com' then 'superadmin'
      when u.raw_user_meta_data ->> 'role' in ('company_admin', 'agent') then u.raw_user_meta_data ->> 'role'
      else p.role
    end,
    company_id = coalesce(nullif(u.raw_user_meta_data ->> 'company_id', '')::uuid, p.company_id)
from auth.users u
where p.id = u.id;
