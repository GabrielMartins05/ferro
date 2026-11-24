-- Fitness: banco do Supabase
-- Cole tudo no SQL Editor do seu projeto (supabase.com > SQL Editor > New query) e clique em Run.
-- Pode rodar de novo sem problema: ele recria as funções e as regras.

-- ---------- tabelas ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- funções de apoio ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not blocked);
$$;

create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select blocked from profiles where id = auth.uid()), false);
$$;

-- cria o perfil quando alguém se cadastra
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- acesso pela API (as regras RLS abaixo decidem o que cada um vê) ----------
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.user_data to authenticated;
grant select on public.app_config to anon, authenticated;
grant insert, update, delete on public.app_config to authenticated;

-- ---------- segurança (RLS) ----------
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.app_config enable row level security;

drop policy if exists "perfil: ver o próprio ou admin" on public.profiles;
create policy "perfil: ver o próprio ou admin" on public.profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "perfil: editar o próprio" on public.profiles;
create policy "perfil: editar o próprio" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- o usuário só pode mudar o próprio nome e o último acesso; papel e bloqueio só pelo admin
revoke update on public.profiles from authenticated, anon;
grant update (name, last_seen) on public.profiles to authenticated;

drop policy if exists "dados: dono" on public.user_data;
create policy "dados: dono" on public.user_data
  for all using (user_id = auth.uid() and not is_blocked())
  with check (user_id = auth.uid() and not is_blocked());

drop policy if exists "dados: admin lê" on public.user_data;
create policy "dados: admin lê" on public.user_data
  for select using (is_admin());

drop policy if exists "config: todos leem" on public.app_config;
create policy "config: todos leem" on public.app_config
  for select using (true);

drop policy if exists "config: admin edita" on public.app_config;
create policy "config: admin edita" on public.app_config
  for all using (is_admin()) with check (is_admin());

-- ---------- conta ----------
-- excluir a própria conta (exigência da App Store e do Google Play)
create or replace function public.delete_me() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_me() from anon;
grant execute on function public.delete_me() to authenticated;

-- ---------- admin ----------
create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not is_admin() then raise exception 'sem permissão'; end if;
  select json_build_object(
    'users', (select count(*) from profiles),
    'new7', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'active7', (select count(*) from profiles where last_seen > now() - interval '7 days'),
    'blocked', (select count(*) from profiles where blocked),
    'workouts', (select coalesce(sum(jsonb_array_length(coalesce(data -> 'workouts', '[]'::jsonb))), 0) from user_data),
    'focusMin', (select coalesce(sum((f ->> 'min')::numeric), 0) from user_data, jsonb_array_elements(coalesce(data -> 'focus', '[]'::jsonb)) f),
    'meals', (select coalesce(sum(jsonb_array_length(coalesce(data -> 'meals', '[]'::jsonb))), 0) from user_data),
    'signups', (select coalesce(json_agg(json_build_object('day', d, 'n', n) order by d), '[]'::json) from (
        select date_trunc('day', created_at)::date d, count(*) n from profiles
        where created_at > now() - interval '30 days' group by 1) s)
  ) into r;
  return r;
end $$;

create or replace function public.admin_users() returns table (
  id uuid, email text, name text, role text, blocked boolean, created_at timestamptz, last_seen timestamptz,
  workouts int, focus_min numeric, meals int, forca_pts int, cardio_pts int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'sem permissão'; end if;
  return query
  select p.id, p.email, p.name, p.role, p.blocked, p.created_at, p.last_seen,
    coalesce(jsonb_array_length(d.data -> 'workouts'), 0),
    coalesce((select sum((f ->> 'min')::numeric) from jsonb_array_elements(coalesce(d.data -> 'focus', '[]'::jsonb)) f), 0),
    coalesce(jsonb_array_length(d.data -> 'meals'), 0),
    coalesce((d.data -> 'forca' ->> 'pts')::int, 0),
    coalesce((d.data -> 'cardio' ->> 'pts')::int, 0)
  from profiles p left join user_data d on d.user_id = p.id
  order by p.created_at desc;
end $$;

create or replace function public.admin_set_user(target uuid, new_role text, new_blocked boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'sem permissão'; end if;
  if target = auth.uid() and (new_role <> 'admin' or new_blocked) then raise exception 'você não pode tirar o próprio acesso de admin'; end if;
  update profiles set role = new_role, blocked = new_blocked where id = target;
end $$;

create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then raise exception 'sem permissão'; end if;
  if target = auth.uid() then raise exception 'use Excluir conta no app para apagar a sua'; end if;
  delete from auth.users where id = target;
end $$;

revoke all on function public.admin_stats(), public.admin_users(), public.admin_set_user(uuid, text, boolean), public.admin_delete_user(uuid) from anon;
grant execute on function public.admin_stats(), public.admin_users(), public.admin_set_user(uuid, text, boolean), public.admin_delete_user(uuid) to authenticated;

-- ---------- configuração inicial ----------
insert into public.app_config (key, value) values ('aviso', '""'::jsonb) on conflict (key) do nothing;

-- ---------- tornar você admin ----------
-- Depois de criar sua conta pelo app, rode a linha abaixo trocando o e-mail:
-- update public.profiles set role = 'admin' where email = 'seu@email.com';
