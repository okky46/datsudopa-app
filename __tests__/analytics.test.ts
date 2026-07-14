import { __resetStore } from './mocks/asyncStorage';
import { AnalyticsService } from '../src/services/AnalyticsService';
import { StorageService } from '../src/services/StorageService';

beforeEach(() => {
  __resetStore();
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
