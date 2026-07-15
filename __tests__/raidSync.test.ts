import { __resetStore } from './mocks/asyncStorage';
import { RaidSyncService } from '../src/services/RaidSyncService';
import { ProfileService } from '../src/services/ProfileService';
import { StorageService } from '../src/services/StorageService';
import { WatchSession } from '../src/types/session';

beforeEach(() => {
  __resetStore();
  ProfileService.resetSyncState();
});

afterEach(() => {
  jest.restoreAllMocks();
});


async function waitUntil(assertion: () => void, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  if (lastError) {
    throw lastError;
  }
}

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

test('transient profile_not_ready forces current profile sync once and keeps queue without marking unsynced', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn((name: string) => {
    if (name === 'set_public_name') {
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: { message: 'profile_not_ready' } });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '夜更かしペンギン', notificationEnabled: true, shortsUsageId: '' });
  await StorageService.saveSessions([
    { ...raidSession, sessionId: 'pending-local', status: 'completed', watchedSeconds: 90 },
  ]);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'pending-local', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'pending-local', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 90, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();
  const queue = await StorageService.getRaidSyncQueue();
  expect(rpc).toHaveBeenCalledTimes(3);
  expect(rpc).toHaveBeenNthCalledWith(1, 'start_raid_participation', expect.any(Object));
  expect(rpc).toHaveBeenNthCalledWith(2, 'set_public_name', { p_public_name: '夜更かしペンギン' });
  expect(rpc).toHaveBeenNthCalledWith(3, 'start_raid_participation', expect.any(Object));
  expect(queue.map((item) => item.type)).toEqual(['start', 'finish']);
  expect(queue[0].profileRepairAttempts).toBe(1);
  expect((await StorageService.getSessions()).find((session) => session.sessionId === 'pending-local')?.serverSyncStatus).toBeUndefined();
});

test('profile_not_ready repair sync allows start retry and finish in the same flush', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const calls: string[] = [];
  const rpc = jest.fn((name: string, args: { p_public_name?: string }) => {
    calls.push(name === 'set_public_name' ? `set:${args.p_public_name}` : name);
    if (name === 'start_raid_participation' && calls.filter((call) => call === 'start_raid_participation').length === 1) {
      return Promise.resolve({ error: { message: 'profile_not_ready' } });
    }
    return Promise.resolve({ error: null });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '新匿名ユーザー', notificationEnabled: true, shortsUsageId: '' });
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'repair-success', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'repair-success', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();

  expect(calls).toEqual(['start_raid_participation', 'set:新匿名ユーザー', 'start_raid_participation', 'finish_raid_participation']);
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
});

test('profile_not_ready repair rejection removes start and finish as unsynced without looping', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const rpc = jest.fn((name: string) => {
    if (name === 'set_public_name') {
      return Promise.resolve({ error: { message: 'invalid_public_name' } });
    }
    return Promise.resolve({ error: { message: 'profile_not_ready' } });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '夜更かしペンギン', notificationEnabled: true, shortsUsageId: '' });
  await StorageService.saveSessions([{ ...raidSession, sessionId: 'repair-rejected', status: 'completed', watchedSeconds: 180 }]);
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'repair-rejected', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'repair-rejected', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  await RaidSyncService.flush();
  await RaidSyncService.flush();

  expect(rpc).toHaveBeenCalledTimes(2);
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
  expect((await StorageService.getSessions())[0].serverSyncStatus).toBe('unsynced');
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
  await waitUntil(() => expect(calls).toEqual(['set_public_name']));
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'with-profile', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'with-profile', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  const flush = RaidSyncService.flush();
  expect(calls).toEqual(['set_public_name']);
  resolveProfile({ error: null });
  await profileSync;
  await flush;

  expect(calls).toEqual(['set_public_name', 'start_raid_participation', 'finish_raid_participation']);
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
});

test('same public name in-flight sync reuses one set_public_name RPC', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
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


test('chained profile-name syncs complete latest name before raid start', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');

  let resolveFirstProfile!: (value: { error: null }) => void;
  const firstProfilePromise = new Promise<{ error: null }>((resolve) => {
    resolveFirstProfile = resolve;
  });
  const calls: string[] = [];
  const rpc = jest.fn((name: string, args: { p_public_name?: string }) => {
    calls.push(name === 'set_public_name' ? `set:${args.p_public_name}` : name);
    if (name === 'set_public_name' && args.p_public_name === '公開名A') {
      return firstProfilePromise;
    }
    return Promise.resolve({ error: null });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '公開名A', notificationEnabled: true, shortsUsageId: '' });
  const firstSync = ProfileService.syncPublicName('公開名A');
  await waitUntil(() => expect(calls).toEqual(['set:公開名A']));
  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '公開名B', notificationEnabled: true, shortsUsageId: '' });
  const secondSync = ProfileService.syncPublicName('公開名B');
  await StorageService.saveRaidSyncQueue([
    { type: 'start', sessionId: 'chained-profile', raidId: raidSession.raidId!, status: 'started', watchedSeconds: 0, startedAt: raidSession.startedAt, queuedAt: 'a' } as never,
    { type: 'finish', sessionId: 'chained-profile', raidId: raidSession.raidId!, status: 'completed', watchedSeconds: 180, queuedAt: 'b' } as never,
  ]);

  const flush = RaidSyncService.flush();
  await waitUntil(() => expect(calls).toEqual(['set:公開名A']));
  resolveFirstProfile({ error: null });
  await flush;
  await expect(firstSync).resolves.toBe('synced');
  await expect(secondSync).resolves.toBe('synced');

  expect(calls).toEqual(['set:公開名A', 'set:公開名B', 'start_raid_participation', 'finish_raid_participation']);
  expect(await StorageService.getProfilePendingSync()).toBe(false);
  expect(await StorageService.getRaidSyncQueue()).toEqual([]);
});

test('profilePendingSync stays true after old profile sync succeeds while latest name is still pending', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');

  let resolveFirstProfile!: (value: { error: null }) => void;
  let resolveSecondProfile!: (value: { error: null }) => void;
  const firstProfilePromise = new Promise<{ error: null }>((resolve) => {
    resolveFirstProfile = resolve;
  });
  const secondProfilePromise = new Promise<{ error: null }>((resolve) => {
    resolveSecondProfile = resolve;
  });
  const rpc = jest.fn((name: string, args: { p_public_name?: string }) => {
    if (name === 'set_public_name' && args.p_public_name === '公開名A') {
      return firstProfilePromise;
    }
    if (name === 'set_public_name' && args.p_public_name === '公開名B') {
      return secondProfilePromise;
    }
    return Promise.resolve({ error: null });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '公開名A', notificationEnabled: true, shortsUsageId: '' });
  const firstSync = ProfileService.syncPublicName('公開名A');
  await waitUntil(() => expect(rpc).toHaveBeenCalledTimes(1));
  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '公開名B', notificationEnabled: true, shortsUsageId: '' });
  const secondSync = ProfileService.syncPublicName('公開名B');

  resolveFirstProfile({ error: null });
  await waitUntil(() => expect(rpc).toHaveBeenCalledTimes(2));
  expect(await StorageService.getProfilePendingSync()).toBe(true);

  resolveSecondProfile({ error: null });
  await expect(firstSync).resolves.toBe('synced');
  await expect(secondSync).resolves.toBe('synced');
  expect(await StorageService.getProfilePendingSync()).toBe(false);
});


test('resetSyncState prevents previous user same-name cache from skipping a new RPC', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn')
    .mockResolvedValueOnce('old-user')
    .mockResolvedValueOnce('new-user');
  const rpc = jest.fn().mockResolvedValue({ error: null });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '同じ名前', notificationEnabled: true, shortsUsageId: '' });
  await expect(ProfileService.syncPublicName('同じ名前')).resolves.toBe('synced');
  expect(rpc).toHaveBeenCalledTimes(1);

  __resetStore();
  ProfileService.resetSyncState();
  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '同じ名前', notificationEnabled: true, shortsUsageId: '' });
  await expect(ProfileService.syncPublicName('同じ名前')).resolves.toBe('synced');

  expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc).toHaveBeenNthCalledWith(1, 'set_public_name', { p_public_name: '同じ名前' });
  expect(rpc).toHaveBeenNthCalledWith(2, 'set_public_name', { p_public_name: '同じ名前' });
});

test('resetSyncState prevents an old in-flight profile RPC from clearing new pending state', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  let resolveOldProfile!: (value: { error: null }) => void;
  const oldProfilePromise = new Promise<{ error: null }>((resolve) => {
    resolveOldProfile = resolve;
  });
  const rpc = jest.fn((name: string, args: { p_public_name?: string }) => {
    if (args.p_public_name === '古い名前') {
      return oldProfilePromise;
    }
    return Promise.resolve({ error: null });
  });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({ rpc } as never);

  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '古い名前', notificationEnabled: true, shortsUsageId: '' });
  const oldSync = ProfileService.syncPublicName('古い名前');
  await waitUntil(() => expect(rpc).toHaveBeenCalledTimes(1));

  __resetStore();
  ProfileService.resetSyncState();
  await StorageService.saveSettings({ onboardingCompleted: true, publicName: '新しい名前', notificationEnabled: true, shortsUsageId: '' });
  await StorageService.saveProfilePendingSync(true);
  resolveOldProfile({ error: null });
  await expect(oldSync).resolves.toBe('retry');

  expect(await StorageService.getProfilePendingSync()).toBe(true);
  await expect(ProfileService.flushPendingSync()).resolves.toBe('synced');
  expect(rpc).toHaveBeenCalledTimes(2);
  expect(rpc).toHaveBeenNthCalledWith(2, 'set_public_name', { p_public_name: '新しい名前' });
});
