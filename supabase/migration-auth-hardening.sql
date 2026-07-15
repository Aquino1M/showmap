-- Execute uma vez no SQL Editor para impedir que metadados de cadastro
-- concedam papel de escritório, agente ou vínculo com empresas.
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
    case when new.email = 'diogenesdidi83@gmail.com' then 'superadmin' else 'agent' end,
    null
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;
  return new;
end;
$$;
