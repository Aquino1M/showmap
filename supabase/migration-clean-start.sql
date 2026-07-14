-- Execute somente para limpar dados de teste e preparar o ambiente atual.
-- Preserva exclusivamente o Master: diogenesdidi83@gmail.com.

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

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

delete from public.events;
delete from public.companies;
delete from auth.users where email <> 'diogenesdidi83@gmail.com';

update public.profiles
set name = coalesce(nullif(name, ''), 'Admin Master'),
    email = 'diogenesdidi83@gmail.com',
    role = 'superadmin',
    company_id = null
where id = (select id from auth.users where email = 'diogenesdidi83@gmail.com');

do $$ begin
  alter publication supabase_realtime add table public.companies;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.events;
exception when duplicate_object then null;
end $$;

select count(*) as events from public.events;
select email, role from public.profiles order by created_at;
