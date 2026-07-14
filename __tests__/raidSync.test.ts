import { __resetStore } from './mocks/asyncStorage';
import { RaidSyncService } from '../src/services/RaidSyncService';
import { StorageService } from '../src/services/StorageService';
import { WatchSession } from '../src/types/session';

beforeEach(() => {
  __resetStore();
});

afterEach(() => {
  jest.restoreAllMocks();
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

test('legacy items without syncItemId are backfilled before flush and only sent item is removed', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn()
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: { message: 'temporary failure' } });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'legacy-1', raidId: '2026-07-13_22JST', status: 'started', watchedSeconds: 0, startedAt: '2026-07-13T13:00:30.000Z', queuedAt: 'a' } as never,
    { type: 'start', sessionId: 'legacy-2', raidId: '2026-07-13_22JST', status: 'started', watchedSeconds: 0, startedAt: '2026-07-13T13:01:30.000Z', queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();
  const queue = await StorageService.getRaidSyncQueue();
  expect(queue).toHaveLength(1);
  expect(queue[0].sessionId).toBe('legacy-2');
  expect(queue[0].syncItemId).toBeTruthy();
});

test('outside-window start discard removes matching finish and marks local session unsynced', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({
    rpc: jest.fn().mockResolvedValue({ error: { message: 'raid_window_closed' } }),
  } as never);

  await StorageService.saveSessions([{ ...raidSession, status: 'completed', watchedSeconds: 180 }]);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: raidSession.sessionId, raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: raidSession.sessionId, raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
  expect((await StorageService.getSessions())[0].serverSyncStatus).toBe('unsynced');
});

test('canonical raid_id rejection discards start and matching finish without repeat RPCs', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn().mockResolvedValue({ error: { message: 'invalid_raid_id' } });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSessions([{ ...raidSession, raidId: '2026-07-13_anything', status: 'completed', watchedSeconds: 180 }]);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: raidSession.sessionId, raidId: '2026-07-13_anything', status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: raidSession.sessionId, raidId: '2026-07-13_anything', status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();
  await RaidSyncService.flush();
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
  expect((await StorageService.getSessions())[0].serverSyncStatus).toBe('unsynced');
});

test('transient profile_not_ready keeps start and finish queued without marking unsynced', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn().mockResolvedValue({ error: { message: 'profile_not_ready' } });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSessions([
    { ...raidSession, sessionId: 'pending-local', status: 'completed', watchedSeconds: 90 },
  ]);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'pending-local', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'pending-local', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 90, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();
  const queue = await StorageService.getRaidSyncQueue();
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(queue.map((item) => item.type)).toEqual(['start', 'finish']);
  expect((await StorageService.getSessions()).find((session) => session.sessionId === 'pending-local')?.serverSyncStatus).toBeUndefined();
});

test('temporary profile sync failure keeps queue for retry without start RPC', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn().mockResolvedValue({ error: { message: 'temporary' } });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);
  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '夜更かしペンギン', notificationEnabled: true, shortsUsageId: '' });
  await StorageService.saveProfilePendingSync(true);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'pending-profile', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
  ]);

  await RaidSyncService.flush();
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith('set_public_name', { p_public_name: '夜更かしペンギン' });
  expect(await StorageService.getRaidSyncQueue()).toHaveLength(1);
});


test('in-flight profile sync is awaited before raid start and then sends start before finish', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  const { ProfileService } = await import('../src/services/ProfileService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  let resolveProfile!: (value: { error: null }) => void;
  const profilePromise = new Promise<{ error: null }>((resolve) => {
    resolveProfile = resolve;
  });
  const calls: string[] = [];
  const rpc = jest.fn((name: string) => {
    calls.push(name);
    if (name === 'set_public_name') {
      return profilePromise;
    }
    return Promise.resolve({ error: null });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '夜更かしペンギン', notificationEnabled: true, shortsUsageId: '' });
  const profileSync = ProfileService.syncPublicName('夜更かしペンギン');
  await Promise.resolve();
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'with-profile', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'with-profile', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  const flush = RaidSyncService.flush();
  await Promise.resolve();
  expect(calls).toEqual(['set_public_name']);
  resolveProfile({ error: null });
  await profileSync;
  await flush;

  expect(calls).toEqual(['set_public_name', 'start_raid_participation', 'finish_raid_participation']);
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
});

test('same public name in-flight sync reuses one set_public_name RPC', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  const { ProfileService } = await import('../src/services/ProfileService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn().mockResolvedValue({ error: null });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await expect(Promise.all([
    ProfileService.syncPublicName('夜更かしペンギン'),
    ProfileService.syncPublicName('夜更かしペンギン'),
  ])).resolves.toEqual(['synced', 'synced']);

  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith('set_public_name', { p_public_name: '夜更かしペンギン' });
  expect(await StorageService.getProfilePendingSync()).toBe(false);
});

test('deterministic profile rejection discards queued start and finish without start RPC', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn();
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);
  await StorageService.saveSettings({ onboardingCompleted: true, publicName: 'カス太郎', notificationEnabled: true, shortsUsageId: '' });
  await StorageService.saveProfilePendingSync(true);
  await StorageService.saveSessions([{ ...raidSession, sessionId: 'invalid-profile', status: 'completed', watchedSeconds: 180 }]);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'invalid-profile', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'invalid-profile', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();

  expect(rpc).not.toHaveBeenCalled();
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
  expect((await StorageService.getSessions())[0].serverSyncStatus).toBe('unsynced');
});
