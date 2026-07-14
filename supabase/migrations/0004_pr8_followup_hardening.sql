-- PR #8 follow-up hardening: queued raid-start reconciliation and profile validation.

create schema if not exists private;

create table if not exists private.public_name_blocklist (
  word text primary key
);

revoke all on private.public_name_blocklist from public;
revoke all on private.public_name_blocklist from anon;
revoke all on private.public_name_blocklist from authenticated;

insert into private.public_name_blocklist(word) values
  ('ばか'), ('死ね'), ('くそ'), ('カス'), ('fuck'), ('shit'), ('damn'), ('bitch')
on conflict do nothing;

create or replace function private.is_valid_public_name(p_name text)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_name text := normalize(coalesce(p_name, ''), nfkc);
  v_word text;
begin
  if length(btrim(v_name)) < 2 or length(v_name) > 16 then
    return false;
  end if;
  if v_name ~ '[[:cntrl:]]' or v_name ~ '[\u200B\u200C\u200D\uFEFF]' then
    return false;
  end if;
  if lower(v_name) ~ '(https?://|www\.)' or lower(v_name) ~ '(^|[^a-z0-9])([a-z0-9-]+\.)+[a-z]{2,}([^a-z0-9]|$)' then
    return false;
  end if;
  if v_name ~ '[!-/:-@\[-`{-~]{3,}' then
    return false;
  end if;
  for v_word in select word from private.public_name_blocklist loop
    if lower(v_name) like '%' || lower(v_word) || '%' then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.set_public_name(p_public_name text)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := normalize(coalesce(p_public_name, ''), nfkc);
  v_status text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select name_status into v_status from public.profiles where user_id = v_uid;
  if v_status = 'blocked' then
    raise exception 'profile_blocked';
  end if;
  if not private.is_valid_public_name(v_name) then
    raise exception 'invalid_public_name';
  end if;
  insert into public.profiles(user_id, public_name, public_name_normalized, name_status, name_updated_at)
  values (v_uid, v_name, v_name, 'active', now())
  on conflict (user_id) do update
    set public_name = excluded.public_name,
        public_name_normalized = excluded.public_name_normalized,
        name_updated_at = now()
    where public.profiles.name_status <> 'blocked';
end;
$$;

revoke all on function public.set_public_name(text) from public;
grant execute on function public.set_public_name(text) to authenticated;

create or replace function public.start_raid_participation(p_session_id uuid, p_raid_id text, p_started_at timestamptz default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_status text;
  v_started_at timestamptz := coalesce(p_started_at, now());
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_started_at is null then
    v_started_at := now();
  end if;

  if v_started_at > now() + interval '30 seconds' or v_started_at < now() - interval '2 days' then
    raise exception 'invalid_started_at';
  end if;

  if not public.is_within_official_window(p_raid_id, v_started_at) then
    raise exception 'raid_window_closed';
  end if;

  select public_name, name_status into v_name, v_status
  from public.profiles
  where user_id = v_uid;

  if v_status is null or v_name is null or length(btrim(v_name)) = 0 then
    raise exception 'profile_not_ready';
  end if;
  if v_status = 'blocked' then
    raise exception 'profile_blocked';
  end if;
  if v_status <> 'active' then
    raise exception 'profile_not_ready';
  end if;

  if exists (
    select 1 from public.raid_participations
    where raid_id = p_raid_id and user_id = v_uid and session_id <> p_session_id
  ) then
    raise exception 'duplicate_participation';
  end if;

  insert into public.raid_participations
    (session_id, raid_id, user_id, public_name_snapshot, status, started_at, watched_seconds)
  values
    (p_session_id, p_raid_id, v_uid, v_name, 'started', v_started_at, 0)
  on conflict (session_id) do nothing;
end;
$$;

revoke all on function public.start_raid_participation(uuid, text) from public;
revoke all on function public.start_raid_participation(uuid, text) from anon;
revoke all on function public.start_raid_participation(uuid, text) from authenticated;
revoke all on function public.start_raid_participation(uuid, text, timestamptz) from public;
grant execute on function public.start_raid_participation(uuid, text, timestamptz) to authenticated;
