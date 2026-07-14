import { __resetStore } from './mocks/asyncStorage';
import { RaidSyncService } from '../src/services/RaidSyncService';
import { StorageService } from '../src/services/StorageService';
import { WatchSession } from '../src/types/session';

beforeEach(() => {
  __resetStore();
});

const raidSession: WatchSession = {
  sessionId: '00000000-0000-4000-8000-000000000001',
  kind: 'raid',
  raidId: '2026-07-13_22JST',
  dateKey: '2026-07-13',
  videoId: 'void-001-v1',
  startedAt: '2026-07-13T13:01:00.000Z',
  targetSeconds: 180,
  watchedSeconds: 0,
  status: 'active',
};

describe('RaidSyncService queue', () => {
  test('enqueueStart stores syncItemId and session startedAt', async () => {
    await RaidSyncService.enqueueStart(raidSession);
    const queue = await StorageService.getRaidSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].syncItemId).toBeTruthy();
    expect(queue[0].startedAt).toBe(raidSession.startedAt);
  });

  test('enqueueFinish during queued start is preserved and ordered after start', async () => {
    await RaidSyncService.enqueueStart(raidSession);
    await RaidSyncService.enqueueFinish({ ...raidSession, status: 'exited', watchedSeconds: 42 });
    const queue = await StorageService.getRaidSyncQueue();
    expect(queue.map((item) => item.type)).toEqual(['start', 'finish']);
    expect(new Set(queue.map((item) => item.syncItemId)).size).toBe(2);
  });

  test('parallel flush without Supabase config does not drop queue items', async () => {
    await RaidSyncService.enqueueStart(raidSession);
    await RaidSyncService.enqueueFinish({ ...raidSession, status: 'completed', watchedSeconds: 180 });
    await Promise.all([RaidSyncService.flush(), RaidSyncService.flush()]);
    expect(await StorageService.getRaidSyncQueue()).toHaveLength(2);
  });
});
