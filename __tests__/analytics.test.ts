import { __resetStore } from './mocks/asyncStorage';
import { AnalyticsService } from '../src/services/AnalyticsService';
import { StorageService } from '../src/services/StorageService';

beforeEach(() => {
  __resetStore();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('分析イベントキューの信頼性', () => {
  test('同時に複数 track しても欠落しない', async () => {
    await Promise.all([
      AnalyticsService.track('raid_started'),
      AnalyticsService.track('raid_completed'),
      AnalyticsService.track('long_started'),
      AnalyticsService.track('long_completed'),
      AnalyticsService.track('share_sheet_opened'),
    ]);
    const queue = await StorageService.getAnalyticsQueue();
    expect(queue).toHaveLength(5);
  });

  test('各イベントに一意な event_id が付く', async () => {
    await AnalyticsService.track('raid_started');
    await AnalyticsService.track('raid_started');
    const queue = await StorageService.getAnalyticsQueue();
    const ids = queue.map((item) => item.eventId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  test('Supabase未設定時は flush してもキューは保持される', async () => {
    await AnalyticsService.track('raid_started');
    await AnalyticsService.flush(true);
    const queue = await StorageService.getAnalyticsQueue();
    expect(queue).toHaveLength(1);
  });
});

test('legacy events without eventId are backfilled and later batches remain after first batch succeeds', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  const upsert = jest.fn()
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: { message: 'stop after first batch' } });
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({
    from: () => ({ upsert }),
  } as never);
  await StorageService.saveAnalyticsQueue(Array.from({ length: 55 }, (_, index) => ({
    event: 'raid_started',
    occurredAt: `2026-07-13T13:${String(index).padStart(2, '0')}:00.000Z`,
  })) as never);

  await AnalyticsService.flush(true);
  const queue = await StorageService.getAnalyticsQueue();
  expect(queue).toHaveLength(5);
  expect(queue.every((item) => item.eventId)).toBe(true);
});

test('legacy event IDs are persisted before flush, so retry keeps the same IDs', async () => {
  const { SupabaseService } = await import('../src/services/SupabaseService');
  jest.spyOn(SupabaseService, 'isConfigured').mockReturnValue(true);
  jest.spyOn(SupabaseService, 'ensureSignedIn').mockResolvedValue('user-1');
  jest.spyOn(SupabaseService, 'getClient').mockReturnValue({
    from: () => ({ upsert: jest.fn().mockResolvedValue({ error: { message: 'temporary' } }) }),
  } as never);
  await StorageService.saveAnalyticsQueue([
    { event: 'raid_started', occurredAt: '2026-07-13T13:00:00.000Z' },
    { event: 'raid_completed', occurredAt: '2026-07-13T13:03:00.000Z' },
  ] as never);

  await AnalyticsService.flush(true);
  const firstIds = (await StorageService.getAnalyticsQueue()).map((item) => item.eventId);
  await AnalyticsService.flush(true);
  expect((await StorageService.getAnalyticsQueue()).map((item) => item.eventId)).toEqual(firstIds);
});
