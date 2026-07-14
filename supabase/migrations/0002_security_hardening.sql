-- 脱ドパ MVP: 公開前セキュリティハードニング（0001 適用済み環境へ追加適用する）
-- 適用方法: Supabase Dashboard の SQL Editor に貼り付けて実行するか supabase db push。
--
-- このマイグレーションで行うこと:
--   1. profiles の直接更新を封じ、公開名専用RPC set_public_name を導入（name_status は本人変更不可）
--   2. raid_participations の直接 insert/update を封じ、start/finish 専用RPCへ移行（サーバー側で値を決定）
--   3. get_raid_companions に「呼び出し本人が公式参加していること」の確認と安定ハッシュ順を追加
--   4. 集計Viewを private スキーマへ移し、anon/authenticated から参照不可にする

-- =========================================================
-- 1. profiles: 直接更新を廃止し、公開名専用RPCへ
-- =========================================================

-- 直接 insert/update ポリシーを撤去（RLS有効なので、ポリシーが無ければ既定で拒否される）。
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

-- 直接DMLの権限も明示的に剥奪（RPC経由のみに限定）。select は自分の行のみ引き続き可。
revoke insert, update, delete on public.profiles from anon, authenticated;

-- 公開名の設定・更新専用RPC。
--   - user_id は auth.uid() で固定（他人のプロフィールは触れない）
--   - name_status はこのRPCでは一切変更しない（管理者が Dashboard で設定するのみ）
--   - blocked のユーザーは公開名を変更できない（blocked 状態の回避を防ぐ）
--   - 初回はinsert、以降は公開名のみupdate（冪等）
create or replace function public.set_public_name(p_public_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_normalized text;
  v_existing_status text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- サーバー側の正規化・一次検査（クライアント検査と同等の骨子）
  v_normalized := btrim(regexp_replace(normalize(p_public_name, NFKC), E'[\u200B\u200C\u200D\u2060\uFEFF]', '', 'g'));

  if char_length(v_normalized) < 2 or char_length(v_normalized) > 16 then
    raise exception 'invalid name length';
  end if;
  if v_normalized ~ '[\n\r]' then
    raise exception 'invalid name (newline)';
  end if;
  if v_normalized ~* '(https?://|www\.)' then
    raise exception 'invalid name (url)';
  end if;

  select name_status into v_existing_status from public.profiles where user_id = v_uid;
  if v_existing_status = 'blocked' then
    raise exception 'name is blocked';
  end if;

  insert into public.profiles (user_id, public_name, public_name_normalized, name_updated_at)
  values (v_uid, v_normalized, lower(v_normalized), now())
  on conflict (user_id) do update
    set public_name = excluded.public_name,
        public_name_normalized = excluded.public_name_normalized,
        name_updated_at = now();
  -- name_status は on conflict の set に含めない = 本人からは変更できない
end;
$$;

revoke all on function public.set_public_name(text) from public;
grant execute on function public.set_public_name(text) to authenticated;

-- =========================================================
-- 2. raid_participations: 直接 insert/update を廃止し、start/finish 専用RPCへ
-- =========================================================

drop policy if exists raid_participations_insert_own on public.raid_participations;
drop policy if exists raid_participations_update_own on public.raid_participations;

revoke insert, update, delete on public.raid_participations from anon, authenticated;

-- 公式レイド開始RPC。サーバー側で user_id / public_name_snapshot / started_at / status / watched_seconds を決定。
--   - 公式時間内（サーバー時刻）でなければ拒否（端末時計の偽装を防ぐ）
--   - 同一セッションの再送は冪等（ON CONFLICT DO NOTHING）
--   - 同一ユーザー・同一レイドの二重登録は (raid_id, user_id) 一意制約で弾かれる
create or replace function public.start_raid_participation(p_session_id uuid, p_raid_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_within_official_window(p_raid_id, now()) then
    raise exception 'raid window closed';
  end if;

  v_name := coalesce((select public_name from public.profiles where user_id = v_uid), '名無しさん');

  insert into public.raid_participations
    (session_id, raid_id, user_id, public_name_snapshot, status, started_at, watched_seconds)
  values
    (p_session_id, p_raid_id, v_uid, v_name, 'started', now(), 0)
  on conflict (session_id) do nothing;
end;
$$;

revoke all on function public.start_raid_participation(uuid, text) from public;
grant execute on function public.start_raid_participation(uuid, text) to authenticated;

-- 公式レイド終了RPC。本人の started セッションだけを completed/exited へ更新。
--   - watched_seconds は 0〜180 にクランプ
--   - finished_at はサーバー時刻
--   - 既に確定済み・存在しない・他人のセッションは 0 行更新（＝冪等に成功扱い）
create or replace function public.finish_raid_participation(
  p_session_id uuid,
  p_status text,
  p_watched_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_status not in ('completed', 'exited') then
    raise exception 'invalid status';
  end if;

  update public.raid_participations
  set status = p_status,
      watched_seconds = least(greatest(coalesce(p_watched_seconds, 0), 0), 180),
      finished_at = now(),
      updated_at = now()
  where session_id = p_session_id
    and user_id = v_uid
    and status = 'started';
end;
$$;

revoke all on function public.finish_raid_participation(uuid, text, integer) from public;
grant execute on function public.finish_raid_participation(uuid, text, integer) to authenticated;

-- =========================================================
-- 3. get_raid_companions: 参加者確認 + 安定ハッシュ順
-- =========================================================
-- 呼び出し本人が対象レイドへ公式参加している場合のみ、自分以外の公開名を最大3件返す。
-- 並び順は (raid_id, 呼び出し者, 相手) のハッシュで安定化し、全員に同じ3人が偏らないようにする。
create or replace function public.get_raid_companions(p_raid_id text)
returns table (public_name_snapshot text)
language sql
security definer
set search_path = public
stable
as $$
  select rp.public_name_snapshot
  from public.raid_participations rp
  left join public.profiles pr on pr.user_id = rp.user_id
  where rp.raid_id = p_raid_id
    and rp.user_id <> auth.uid()
    and public.is_within_official_window(rp.raid_id, rp.started_at)
    and coalesce(pr.name_status, 'active') = 'active'
    and exists (
      select 1
      from public.raid_participations me
      where me.raid_id = p_raid_id
        and me.user_id = auth.uid()
        and public.is_within_official_window(me.raid_id, me.started_at)
    )
  order by md5(p_raid_id || auth.uid()::text || rp.user_id::text)
  limit 3;
$$;

revoke all on function public.get_raid_companions(text) from public;
grant execute on function public.get_raid_companions(text) to authenticated;

-- =========================================================
-- 4. 集計Viewを private スキーマへ隔離（anon/authenticated から参照不可）
-- =========================================================
create schema if not exists private;
revoke all on schema private from anon, authenticated;

drop view if exists public.raid_daily_stats;
drop view if exists public.analytics_daily_events;

create or replace view private.raid_daily_stats as
select
  raid_id,
  count(*) filter (where status in ('started', 'completed', 'exited')) as started_count,
  count(*) filter (where status = 'completed') as completed_count,
  count(*) filter (where status = 'exited') as exited_count,
  round(avg(watched_seconds)) as avg_watched_seconds
from public.raid_participations
group by raid_id
order by raid_id desc;

create or replace view private.analytics_daily_events as
select
  date_trunc('day', occurred_at at time zone 'Asia/Tokyo')::date as jst_date,
  event,
  count(*) as event_count,
  count(distinct user_id) as unique_users
from public.analytics_events
group by 1, 2
order by 1 desc, 2;

-- private スキーマのViewは service role（Dashboard）からのみ参照する。
revoke all on private.raid_daily_stats from anon, authenticated;
revoke all on private.analytics_daily_events from anon, authenticated;
