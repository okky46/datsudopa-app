import { __resetStore } from './mocks/asyncStorage';
import { ProgressService } from '../src/services/ProgressService';
import { StorageService } from '../src/services/StorageService';

// 22:30 JST（窓外）= 13:30 UTC
const REGISTER_AFTER_WINDOW = new Date('2026-07-13T13:30:00Z');
// 翌日22:30 JST
const NEXT_DAY_AFTER_WINDOW = new Date('2026-07-14T13:30:00Z');

beforeEach(() => {
  __resetStore();
});

describe('初回利用日の未参加ペナルティ', () => {
  test('22:30に初回登録しても当日は未参加+1されない', async () => {
    const initial = await ProgressService.initializeOnComplete('h1to2', REGISTER_AFTER_WINDOW);
    // 当日中に未参加処理を走らせても、当日は firstEligible(=翌日) 未満なので対象外
    await ProgressService.processMissedDays([], REGISTER_AFTER_WINDOW);
    expect(await ProgressService.getLevel()).toBe(initial);
  });

  test('翌日は通常どおり未参加+1される', async () => {
    const initial = await ProgressService.initializeOnComplete('h1to2', REGISTER_AFTER_WINDOW);
    // 翌日の窓が閉じた後、レイド参加記録なしで未参加処理 → +1
    await ProgressService.processMissedDays([], NEXT_DAY_AFTER_WINDOW);
    expect(await ProgressService.getLevel()).toBe(initial + 1);
  });

  test('未参加処理は日付単位で二重実行されない', async () => {
    const initial = await ProgressService.initializeOnComplete('h1to2', REGISTER_AFTER_WINDOW);
    await ProgressService.processMissedDays([], NEXT_DAY_AFTER_WINDOW);
    await ProgressService.processMissedDays([], NEXT_DAY_AFTER_WINDOW);
    expect(await ProgressService.getLevel()).toBe(initial + 1);
  });
});

describe('ドパガキ度の初期値', () => {
  test('自己申告に応じた初期値', async () => {
    __resetStore();
    expect(await ProgressService.initializeOnComplete('under30', REGISTER_AFTER_WINDOW)).toBe(35);
    __resetStore();
    expect(await ProgressService.initializeOnComplete('m30to60', REGISTER_AFTER_WINDOW)).toBe(55);
    __resetStore();
    expect(await ProgressService.initializeOnComplete('h1to2', REGISTER_AFTER_WINDOW)).toBe(75);
    __resetStore();
    expect(await ProgressService.initializeOnComplete('over2', REGISTER_AFTER_WINDOW)).toBe(90);
  });
});

describe('進捗状態の移行', () => {
  test('progressStateV1 が保存される', async () => {
    await ProgressService.initializeOnComplete('h1to2', REGISTER_AFTER_WINDOW);
    const state = await StorageService.getProgressState();
    expect(state).not.toBeNull();
    expect(state!.firstEligibleRaidDateKey).toBe('2026-07-14'); // 22:30登録なので翌日
  });
});
