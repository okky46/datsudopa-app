import {
  jstDateKey,
  jstWeekStartKey,
  nextRaidStartAt,
  raidWindowPhase,
  raidWindowSecondsLeft,
  shiftJstDateKey,
  todayRaidId,
} from '../src/utils/jst';

// JST=UTC+9。22:00 JST = 13:00 UTC。
const at = (iso: string) => new Date(iso);

describe('公式レイドの時刻境界（JST固定）', () => {
  test('21:59:59 JST は開始前', () => {
    expect(raidWindowPhase(at('2026-07-13T12:59:59Z'))).toBe('before');
  });
  test('22:00:00 JST ちょうどは開始可能', () => {
    expect(raidWindowPhase(at('2026-07-13T13:00:00Z'))).toBe('open');
  });
  test('22:02:59 JST は開始可能', () => {
    expect(raidWindowPhase(at('2026-07-13T13:02:59Z'))).toBe('open');
  });
  test('22:03:00 JST は終了（closed）', () => {
    expect(raidWindowPhase(at('2026-07-13T13:03:00Z'))).toBe('closed');
  });

  test('残り秒数は 22:01 JST で 120 秒', () => {
    expect(raidWindowSecondsLeft(at('2026-07-13T13:01:00Z'))).toBe(120);
  });
});

describe('JST日付キーとレイドID', () => {
  test('深夜0:30 JST（=前日15:30 UTC）は翌日の日付キー・開始前', () => {
    expect(jstDateKey(at('2026-07-13T15:30:00Z'))).toBe('2026-07-14');
    expect(raidWindowPhase(at('2026-07-13T15:30:00Z'))).toBe('before');
  });
  test('raid_id は YYYY-MM-DD_22JST', () => {
    expect(todayRaidId(at('2026-07-13T13:01:00Z'))).toBe('2026-07-13_22JST');
  });
  test('shiftJstDateKey で日跨ぎ', () => {
    expect(shiftJstDateKey('2026-07-31', 1)).toBe('2026-08-01');
    expect(shiftJstDateKey('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('次回レイドと週開始', () => {
  test('23:00 JST 時点の次回レイドは翌日22:00 JST', () => {
    expect(nextRaidStartAt(at('2026-07-13T14:00:00Z')).toISOString()).toBe('2026-07-14T13:00:00.000Z');
  });
  test('月曜はじまりの週開始（2026-07-13は月曜）', () => {
    expect(jstWeekStartKey(at('2026-07-13T13:00:00Z'))).toBe('2026-07-13');
    expect(jstWeekStartKey(at('2026-07-16T13:00:00Z'))).toBe('2026-07-13');
  });
});
