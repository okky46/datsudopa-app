import AsyncStorage, { __resetStore } from './mocks/asyncStorage';
import { SessionService } from '../src/services/SessionService';
import { ProgressService } from '../src/services/ProgressService';
import { StorageService } from '../src/services/StorageService';
import { WatchSession } from '../src/types/session';

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

describe('stale active session recovery', () => {
  const staleRaid: WatchSession = {
    sessionId: 'stale-raid-1',
    kind: 'raid',
    raidId: '2026-07-13_22JST',
    dateKey: '2026-07-13',
    videoId: 'v',
    startedAt: '2026-07-13T13:00:00.000Z',
    targetSeconds: 180,
    watchedSeconds: 0,
    status: 'active',
  };

  test('stale active raid recovers as exited with 0 seconds and enqueues finish', async () => {
    await StorageService.saveSessions([staleRaid]);

    await SessionService.recoverOnStartup(RAID_CLOSED);

    const [session] = await StorageService.getSessions();
    expect(session.status).toBe('exited');
    expect(session.exitReason).toBe('backgrounded');
    expect(session.watchedSeconds).toBe(0);

    const queue = await StorageService.getRaidSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      type: 'finish',
      sessionId: staleRaid.sessionId,
      raidId: staleRaid.raidId,
      status: 'exited',
      watchedSeconds: 0,
    });
  });

  test('recovered raid finish is ordered after an existing queued start', async () => {
    await StorageService.saveSessions([staleRaid]);
    await StorageService.saveRaidSyncQueue([
      {
        syncItemId: 'start-1',
        type: 'start',
        sessionId: staleRaid.sessionId,
        raidId: staleRaid.raidId!,
        status: 'started',
        watchedSeconds: 0,
        startedAt: staleRaid.startedAt,
        queuedAt: 'queued-start',
      },
    ]);

    await SessionService.recoverOnStartup(RAID_CLOSED);

    const queue = await StorageService.getRaidSyncQueue();
    expect(queue.map((item) => item.type)).toEqual(['start', 'finish']);
    expect(queue[1]).toMatchObject({
      sessionId: staleRaid.sessionId,
      status: 'exited',
      watchedSeconds: 0,
    });
  });

  test('recovery does not duplicate an existing finish and remains idempotent', async () => {
    await StorageService.saveSessions([staleRaid]);
    await StorageService.saveRaidSyncQueue([
      {
        syncItemId: 'finish-1',
        type: 'finish',
        sessionId: staleRaid.sessionId,
        raidId: staleRaid.raidId!,
        status: 'exited',
        watchedSeconds: 0,
        queuedAt: 'queued-finish',
      },
    ]);

    await SessionService.recoverOnStartup(RAID_CLOSED);
    await SessionService.recoverOnStartup(RAID_CLOSED);

    const queue = await StorageService.getRaidSyncQueue();
    expect(queue.filter((item) => item.type === 'finish' && item.sessionId === staleRaid.sessionId)).toHaveLength(1);
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(0);
  });

  test('stale long session does not enqueue raid finish', async () => {
    await StorageService.saveSessions([
      {
        ...staleRaid,
        sessionId: 'stale-long-1',
        kind: 'long',
        raidId: undefined,
        longSource: 'daily',
      },
    ]);

    await SessionService.recoverOnStartup(RAID_CLOSED);

    expect(await StorageService.getRaidSyncQueue()).toHaveLength(0);
  });

  test('active raid before stale deadline does not enqueue finish', async () => {
    await StorageService.saveSessions([staleRaid]);

    await SessionService.recoverOnStartup(new Date('2026-07-13T13:05:00.000Z'));

    expect((await StorageService.getSessions())[0].status).toBe('active');
    expect(await StorageService.getRaidSyncQueue()).toHaveLength(0);
  });

  test('unsynced stale raid is finalized locally without unsendable finish', async () => {
    await StorageService.saveSessions([{ ...staleRaid, serverSyncStatus: 'unsynced' }]);

    await SessionService.recoverOnStartup(RAID_CLOSED);

    const [session] = await StorageService.getSessions();
    expect(session.status).toBe('exited');
    expect(session.serverSyncStatus).toBe('unsynced');
    expect(await StorageService.getRaidSyncQueue()).toHaveLength(0);
  });

  test('completed raid with pending finish is enqueued on later startup', async () => {
    await StorageService.saveSessions([{
      ...staleRaid,
      status: 'exited',
      exitReason: 'backgrounded',
      endedAt: RAID_CLOSED.toISOString(),
      raidFinishSyncStatus: 'pending',
      progressEffectStatus: 'applied',
    }]);

    await SessionService.recoverOnStartup(RAID_CLOSED);

    const queue = await StorageService.getRaidSyncQueue();
    expect(queue.filter((item) => item.type === 'finish' && item.sessionId === staleRaid.sessionId)).toHaveLength(1);
    expect((await StorageService.getSessions())[0].raidFinishSyncStatus).toBe('queued');

    await SessionService.recoverOnStartup(RAID_CLOSED);
    expect((await StorageService.getRaidSyncQueue()).filter((item) => item.type === 'finish' && item.sessionId === staleRaid.sessionId)).toHaveLength(1);
  });

  test('unsynced finalized raid with pending finish is closed without enqueue', async () => {
    await StorageService.saveSessions([{
      ...staleRaid,
      status: 'exited',
      exitReason: 'backgrounded',
      endedAt: RAID_CLOSED.toISOString(),
      serverSyncStatus: 'unsynced',
      raidFinishSyncStatus: 'pending',
      progressEffectStatus: 'applied',
    }]);

    await SessionService.recoverOnStartup(RAID_CLOSED);

    expect(await StorageService.getRaidSyncQueue()).toHaveLength(0);
    expect((await StorageService.getSessions())[0].raidFinishSyncStatus).toBe('queued');
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


  test('first post-upgrade 90 second long is not migrated and applied twice', async () => {
    __resetStore();
    await AsyncStorage.setItem('dopagakiLevel', JSON.stringify(75));
    const session = {
      sessionId: 'long-90-upgrade',
      kind: 'long' as const,
      longSource: 'daily' as const,
      dateKey: '2026-07-13',
      videoId: 'v',
      startedAt: day.toISOString(),
      endedAt: day.toISOString(),
      targetSeconds: 180,
      watchedSeconds: 90,
      status: 'completed' as const,
    };
    await StorageService.saveSessions([session]);

    const result = await ProgressService.applySessionEffects(session);

    expect(result.totalDetoxSeconds).toBe(90);
    expect(result.applied).toBe(0);
    expect(await ProgressService.getLevel()).toBe(75);
    expect((await StorageService.getProgressState())!.longSecondsByDate['2026-07-13']).toBe(90);
  });

  test('first post-upgrade 180 second long is counted once and reduces once', async () => {
    __resetStore();
    await AsyncStorage.setItem('dopagakiLevel', JSON.stringify(75));
    const session = {
      sessionId: 'long-180-upgrade',
      kind: 'long' as const,
      longSource: 'daily' as const,
      dateKey: '2026-07-13',
      videoId: 'v',
      startedAt: day.toISOString(),
      endedAt: day.toISOString(),
      targetSeconds: 180,
      watchedSeconds: 180,
      status: 'completed' as const,
    };
    await StorageService.saveSessions([session]);

    const result = await ProgressService.applySessionEffects(session);

    expect(result.totalDetoxSeconds).toBe(180);
    expect(result.applied).toBe(-1);
    expect(await ProgressService.getLevel()).toBe(74);
    expect((await StorageService.getProgressState())!.longSecondsByDate['2026-07-13']).toBe(180);
  });
});

describe('progress migration edge cases', () => {

  test('pending completed raid is not migrated as applied and recovers once on startup', async () => {
    __resetStore();
    await AsyncStorage.setItem('totalDetoxSeconds', JSON.stringify(10));
    await AsyncStorage.setItem('dopagakiLevel', JSON.stringify(75));
    const session: WatchSession = {
      sessionId: 'pending-raid-upgrade',
      kind: 'raid',
      raidId: '2026-07-13_22JST',
      dateKey: '2026-07-13',
      videoId: 'v',
      startedAt: RAID_OPEN.toISOString(),
      endedAt: RAID_OPEN.toISOString(),
      targetSeconds: 180,
      watchedSeconds: 180,
      status: 'completed',
      progressEffectStatus: 'pending',
    };
    await StorageService.saveSessions([session]);

    await SessionService.recoverOnStartup(RAID_OPEN);

    expect(await ProgressService.getTotalDetoxSeconds()).toBe(190);
    expect(await ProgressService.getLevel()).toBe(72);
    expect((await StorageService.getSessions())[0].progressEffectStatus).toBe('applied');

    await SessionService.recoverOnStartup(RAID_OPEN);
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(190);
    expect(await ProgressService.getLevel()).toBe(72);
  });

  test('pending long is not migrated into longSecondsByDate before recovery apply', async () => {
    __resetStore();
    await AsyncStorage.setItem('dopagakiLevel', JSON.stringify(75));
    const pendingLong: WatchSession = {
      sessionId: 'pending-long-upgrade',
      kind: 'long',
      longSource: 'daily',
      dateKey: '2026-07-13',
      videoId: 'v',
      startedAt: RAID_OPEN.toISOString(),
      endedAt: RAID_OPEN.toISOString(),
      targetSeconds: 180,
      watchedSeconds: 90,
      status: 'completed',
      progressEffectStatus: 'pending',
    };
    await StorageService.saveSessions([pendingLong]);

    await SessionService.recoverOnStartup(RAID_OPEN);

    const state = (await StorageService.getProgressState())!;
    expect(state.longSecondsByDate['2026-07-13']).toBe(90);
    expect(await ProgressService.getTotalDetoxSeconds()).toBe(90);
    expect(await ProgressService.getLevel()).toBe(75);
  });
  test('first finalized session after upgrade is not marked applied by migration', async () => {
    __resetStore();
    const s = await SessionService.startSession({ kind: 'raid', videoId: 'v', targetSeconds: 180 }, RAID_OPEN);
    const summary = await SessionService.finalizeSession(s!.sessionId, { completed: true, watchedSeconds: 180 }, RAID_OPEN);
    expect(summary).not.toBeNull();
    expect(summary!.totalDetoxSeconds).toBe(180);
    expect(summary!.dopagakiDelta).toBe(-3);
  });
});
