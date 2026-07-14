import { __resetStore } from './mocks/asyncStorage';
import { SessionService } from '../src/services/SessionService';
import { ProgressService } from '../src/services/ProgressService';
import { StorageService } from '../src/services/StorageService';

// 22:01 JST（開始可能な時刻）
const RAID_OPEN = new Date('2026-07-13T13:01:00Z');
const RAID_CLOSED = new Date('2026-07-13T13:30:00Z');

beforeEach(async () => {
  __resetStore();
  // オンボーディング済み相当でドパガキ度を初期化（22:01は窓内なので当日eligible）
  await ProgressService.initializeOnComplete('h1to2', RAID_OPEN);
});

describe('レイド二重起動防止', () => {
  test('active セッションが存在すると新規開始を拒否', async () => {
    const first = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    expect(first).not.toBeNull();
    const second = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    expect(second).toBeNull();
  });

  test('高速連打（並列開始）でもレイドセッションは1つだけ', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN),
      ),
    );
    const created = results.filter((r) => r !== null);
    expect(created).toHaveLength(1);
    const sessions = await StorageService.getSessions();
    expect(sessions.filter((s) => s.kind === 'raid')).toHaveLength(1);
  });

  test('公式時間外はレイド開始を拒否', async () => {
    const result = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_CLOSED);
    expect(result).toBeNull();
  });

  test('確定済みレイドがある日は再開始できない', async () => {
    const s = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    await SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN);
    const again = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    expect(again).toBeNull();
  });
});

describe('finalize の冪等性と原子性', () => {
  test('完走で累計+180・ドパガキ度-3、二重finalizeは反映されない', async () => {
    const s = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    const before = await ProgressService.getLevel();
    const summary1 = await SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN);
    expect(summary1).not.toBeNull();
    expect(summary1!.totalDetoxSeconds).toBe(180);
    expect(summary1!.dopagakiDelta).toBe(-3);
    expect(await ProgressService.getLevel()).toBe(before - 3);

    // 二重finalize
    const summary2 = await SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN);
    expect(summary2).toBeNull();
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(180);
    expect(await ProgressService.getLevel()).toBe(before - 3);
  });

  test('並列 finalize でも1回だけ反映', async () => {
    const s = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    const before = await ProgressService.getLevel();
    await Promise.all([
      SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN),
      SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN),
      SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN),
    ]);
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(180);
    expect(await ProgressService.getLevel()).toBe(before - 3);
  });

  test('finalize途中失敗（効果未反映）からの復旧は1回だけ反映', async () => {
    const s = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    // 効果反映前の中断を模倣: セッションだけ手動で completed にする（applySessionEffectsは呼ばない）
    const sessions = await StorageService.getSessions();
    const idx = sessions.findIndex((x) => x.sessionId === s!.sessionId);
    sessions[idx] = { ...sessions[idx], status: 'completed', watchedSeconds: 180, endedAt: RAID_OPEN.toISOString() };
    await StorageService.saveSessions(sessions);

    // この時点で累計は未反映
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(0);

    // 復旧
    await SessionService.recoverOnStartup(RAID_OPEN);
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(180);

    // 2回目の復旧では二重反映しない
    await SessionService.recoverOnStartup(RAID_OPEN);
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(180);
  });
});

describe('通常ロングの日次累計ドパガキ度step', () => {
  const day = new Date('2026-07-13T05:00:00Z'); // 14:00 JST

  test('2分+2分=合計4分で -1', async () => {
    const before = await ProgressService.getLevel();
    const a = await SessionService.startSession({ kind: 'long', videoId: 'v', targetSeconds: 120 }, day);
    await SessionService.finalizeSession(a!.sessionId, { completed: true, watchedSeconds: 120 }, day);
    // 1本目（2分=120秒）ではまだstepに満たない
    expect(await ProgressService.getLevel()).toBe(before);

    const b = await SessionService.startSession({ kind: 'long', videoId: 'v', targetSeconds: 120 }, day);
    await SessionService.finalizeSession(b!.sessionId, { completed: true, watchedSeconds: 120 }, day);
    // 合計240秒 → floor(240/180)=1 step → -1
    expect(await ProgressService.getLevel()).toBe(before - 1);
  });

  test('1分30秒+1分30秒=合計3分で -1', async () => {
    const before = await ProgressService.getLevel();
    const a = await SessionService.startSession({ kind: 'long', videoId: 'v', targetSeconds: 90 }, day);
    await SessionService.finalizeSession(a!.sessionId, { completed: true, watchedSeconds: 90 }, day);
    const b = await SessionService.startSession({ kind: 'long', videoId: 'v', targetSeconds: 90 }, day);
    await SessionService.finalizeSession(b!.sessionId, { completed: true, watchedSeconds: 90 }, day);
    expect(await ProgressService.getLevel()).toBe(before - 1);
  });

  test('1日の減少は最大 -3', async () => {
    const before = await ProgressService.getLevel();
    // 20分（1200秒）を1本 → floor(1200/180)=6 だが上限3
    const a = await SessionService.startSession({ kind: 'long', videoId: 'v', targetSeconds: 1200 }, day);
    await SessionService.finalizeSession(a!.sessionId, { completed: true, watchedSeconds: 1200 }, day);
    expect(await ProgressService.getLevel()).toBe(before - 3);
  });
});

describe('progress migration edge cases', () => {
  test('first finalized session after upgrade is not marked applied by migration', async () => {
    __resetStore();
    const s = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    const summary = await SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN);
    expect(summary).not.toBeNull();
    expect(summary!.totalDetoxSeconds).toBe(180);
    expect(summary!.dopagakiDelta).toBe(-3);
  });
});
