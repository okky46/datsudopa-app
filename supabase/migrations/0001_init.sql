-- 脱ドパ MVP: 初期スキーマ
-- 適用方法: Supabase Dashboard の SQL Editor に貼り付けて実行するか、
--   supabase db push（Supabase CLI）で適用する。
-- 前提: Authentication > Sign In / Up で Anonymous sign-ins を有効にすること。

-- =========================================================
-- profiles: 公開ユーザーネーム
-- =========================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  public_name text not null,
  public_name_normalized text not null,
  -- 問題のある名前は Dashboard から 'blocked' にすると同行者表示から消える
  name_status text not null default 'active' check (name_status in ('active', 'blocked')),
  created_at timestamptz not null default now(),
  name_updated_at timestamptz not null default now(),

  -- サーバー側の一次バリデーション（クライアントの検査と同等の骨子）
  constraint public_name_length check (char_length(public_name) between 2 and 16),
  constraint public_name_no_newline check (public_name !~ '[\n\r]'),
  constraint public_name_no_url check (public_name !~* '(https?://|www\.)')
);

alter table public.profiles enable row level security;

-- 自分のプロフィールだけ作成・更新・参照できる。他人のプロフィールは直接読めない
-- （同行者名は下の security definer 関数経由でのみ返す）。
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- raid_participations: 公式レイド参加記録
-- =========================================================
create table if not exists public.raid_participations (
  session_id uuid primary key,
  raid_id text not null, -- 例: 2026-07-13_22JST
  user_id uuid not null references auth.users (id) on delete cascade,
  public_name_snapshot text not null,
  status text not null check (status in ('started', 'completed', 'exited')),
  started_at timestamptz not null,
  finished_at timestamptz,
  watched_seconds integer not null default 0 check (watched_seconds between 0 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 1ユーザーは1レイドに1回だけ（二重送信は upsert で吸収）
  constraint raid_participations_raid_user unique (raid_id, user_id)
);

create index if not exists raid_participations_raid_idx on public.raid_participations (raid_id, started_at);

alter table public.raid_participations enable row level security;

-- 自分の参加記録だけ作成・更新・参照できる。
-- 他人の参加記録一覧はクライアントから直接取得できない。
drop policy if exists raid_participations_select_own on public.raid_participations;
create policy raid_participations_select_own on public.raid_participations
  for select using (auth.uid() = user_id);

drop policy if exists raid_participations_insert_own on public.raid_participations;
create policy raid_participations_insert_own on public.raid_participations
  for insert with check (auth.uid() = user_id);

drop policy if exists raid_participations_update_own on public.raid_participations;
create policy raid_participations_update_own on public.raid_participations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 公式時間内（22:00:00〜22:02:59 JST）に開始した記録だけを公式参加として扱うための検証。
-- raid_id の日付部分から開始ウィンドウを導出する。
create or replace function public.is_within_official_window(p_raid_id text, p_started_at timestamptz)
returns boolean
language sql
immutable
as $$
  select p_started_at >= ((split_part(p_raid_id, '_', 1) || ' 22:00:00+09')::timestamptz)
     and p_started_at <  ((split_part(p_raid_id, '_', 1) || ' 22:03:00+09')::timestamptz);
$$;

-- =========================================================
-- get_raid_companions: レイド後の同行者名（最大3件）
-- =========================================================
-- security definer で RLS を越えるが、返すのは「同じレイドに公式時間内に開始した
-- 自分以外の参加者の名前スナップショット最大3件」だけ。全参加者一覧は返さない。
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
  order by rp.started_at asc
  limit 3;
$$;

revoke all on function public.get_raid_companions(text) from public;
grant execute on function public.get_raid_companions(text) to authenticated;

-- =========================================================
-- analytics_events: 分析イベント（端末キューからのバッチ送信）
-- =========================================================
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_idx on public.analytics_events (event, occurred_at);

alter table public.analytics_events enable row level security;

-- クライアントは自分のイベントを insert できるだけ。読み取りは Dashboard（service role）のみ
drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own on public.analytics_events
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- 集計用 SQL View（Supabase Dashboard から参照する。専用管理画面は作らない）
-- =========================================================

-- 日別のレイド開始・完走・離脱数と完走率
create or replace view public.raid_daily_stats as
select
  raid_id,
  count(*) filter (where status in ('started', 'completed', 'exited')) as started_count,
  count(*) filter (where status = 'completed') as completed_count,
  count(*) filter (where status = 'exited') as exited_count,
  round(avg(watched_seconds)) as avg_watched_seconds
from public.raid_participations
group by raid_id
order by raid_id desc;

-- 日別イベント集計（オンボーディング完了率・到達率などの分子分母）
create or replace view public.analytics_daily_events as
select
  date_trunc('day', occurred_at at time zone 'Asia/Tokyo')::date as jst_date,
  event,
  count(*) as event_count,
  count(distinct user_id) as unique_users
from public.analytics_events
group by 1, 2
order by 1 desc, 2;
