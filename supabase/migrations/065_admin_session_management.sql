-- Gestion de sesiones activas desde la consola de administracion.
--
-- Supabase nunca cierra una sesion por su cuenta: mientras alguien abra la app,
-- el refresh token la mantiene viva. Estas funciones permiten al platform admin
-- ver cada sesion abierta (dispositivo, IP, ultima actividad) y cerrarlas.
--
-- Cerrar = borrar la fila de auth.sessions. auth.refresh_tokens tiene
-- ON DELETE CASCADE sobre session_id, asi que el token de renovacion muere con
-- ella. El access token ya emitido sigue valido hasta que expira (JWT expiry).
--
-- Todas son SECURITY DEFINER y verifican is_platform_admin del que llama.
-- Nunca cierran la sesion desde la que se esta ejecutando la accion, para que
-- el admin no se expulse a si mismo a mitad de la operacion.

create or replace function public.is_caller_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles me
     where me.id = auth.uid() and me.is_platform_admin
  );
$$;

create or replace function public.current_session_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid;
$$;

create or replace function public.admin_list_active_sessions()
returns table (
  session_id uuid,
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_active_at timestamptz,
  user_agent text,
  ip text,
  is_current boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_caller_platform_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    s.id,
    s.user_id,
    u.email::text,
    p.full_name,
    s.created_at,
    greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC'),
    s.user_agent,
    host(s.ip),
    s.id = public.current_session_id()
  from auth.sessions s
  join auth.users u on u.id = s.user_id
  left join public.profiles p on p.id = s.user_id
  order by greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC') desc;
end;
$$;

create or replace function public.admin_revoke_session(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count integer;
begin
  if not public.is_caller_platform_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  delete from auth.sessions
   where id = p_session_id
     and id is distinct from public.current_session_id();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.admin_revoke_user_sessions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count integer;
begin
  if not public.is_caller_platform_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  delete from auth.sessions
   where user_id = p_user_id
     and id is distinct from public.current_session_id();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.admin_revoke_all_sessions()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count integer;
begin
  if not public.is_caller_platform_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  delete from auth.sessions
   where id is distinct from public.current_session_id();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.is_caller_platform_admin() from public, anon;
revoke all on function public.admin_list_active_sessions() from public, anon;
revoke all on function public.admin_revoke_session(uuid) from public, anon;
revoke all on function public.admin_revoke_user_sessions(uuid) from public, anon;
revoke all on function public.admin_revoke_all_sessions() from public, anon;

grant execute on function public.is_caller_platform_admin() to authenticated;
grant execute on function public.current_session_id() to authenticated;
grant execute on function public.admin_list_active_sessions() to authenticated;
grant execute on function public.admin_revoke_session(uuid) to authenticated;
grant execute on function public.admin_revoke_user_sessions(uuid) to authenticated;
grant execute on function public.admin_revoke_all_sessions() to authenticated;
