-- 脱ドパ MVP: 分析イベントの重複防止（0001/0002 適用済み環境へ追加適用する）
-- クライアントの再送（タイムアウト後など）で同じイベントが二重保存されないよう、
-- event_id を一意にして upsert（重複無視）で受ける。

-- 既存行は default で埋まる。以降クライアントは明示的に event_id を送る。
alter table public.analytics_events
  add column if not exists event_id uuid not null default gen_random_uuid();

-- ON CONFLICT (event_id) DO NOTHING で重複無視するための一意インデックス。
create unique index if not exists analytics_events_event_id_key
  on public.analytics_events (event_id);
