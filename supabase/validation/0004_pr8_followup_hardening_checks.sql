-- Manual validation for 0001 -> 0004 final schema.
-- Run after applying migrations in order in a disposable Supabase/Postgres database.
-- These checks focus on the review regressions that plain schema diffing can miss.

begin;

-- set_public_name must match the 0001 profiles schema: no updated_at column,
-- public_name_normalized is NOT NULL, and name_updated_at is the update timestamp.
select public.set_public_name('検証ユーザー');
do $$
begin
  if not exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and public_name = normalize('検証ユーザー', nfkc)
      and public_name_normalized = normalize('検証ユーザー', nfkc)
      and name_status = 'active'
      and name_updated_at is not null
  ) then
    raise exception 'set_public_name insert did not populate existing profiles columns';
  end if;
end $$;

select public.set_public_name('検証ユーザー2');
do $$
begin
  if not exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and public_name = normalize('検証ユーザー2', nfkc)
      and public_name_normalized = normalize('検証ユーザー2', nfkc)
      and name_status = 'active'
      and name_updated_at is not null
  ) then
    raise exception 'set_public_name update did not update existing profiles columns';
  end if;
end $$;

-- The stale two-argument start RPC must not remain executable by authenticated.
do $$
begin
  if has_function_privilege('authenticated', 'public.start_raid_participation(uuid, text)', 'execute') then
    raise exception 'authenticated can still execute stale two-argument start_raid_participation';
  end if;
end $$;

-- The three-argument RPC remains the only supported start path.
do $$
begin
  if not has_function_privilege('authenticated', 'public.start_raid_participation(uuid, text, timestamptz)', 'execute') then
    raise exception 'authenticated cannot execute current three-argument start_raid_participation';
  end if;
end $$;

rollback;
