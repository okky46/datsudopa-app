
// 通知タップからの遷移を一元管理するフック。
// コールドスタート（getLastNotificationResponseAsync）とフォアグラウンドのレスポンスリスナーの
// 両方から呼ばれても、同じ通知 identifier は1回だけ処理する。
//
// 遷移前に次をすべて確認する:
//   - フォント読み込み完了
//   - Root Navigation State 準備完了
//   - オンボーディング完了（未完了ならオンボーディングへ）
//   - 同じ通知IDを未処理
//   - すでにレイド画面を開いていない
//   - 遷移処理中でない
//
// 22:03以降（窓外）は、レイド画面へ一度入れてから戻すのではなく、ホームへ直接遷移する
// （ホームに追い脱ドパ導線がある）。

import { useCallback, useEffect, useRef } from 'react';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { AnalyticsService } from '../services/AnalyticsService';
import { NotificationService } from '../services/NotificationService';
import { RaidService } from '../services/RaidService';
import { StorageService } from '../services/StorageService';

const RAID_ROUTE = '/raid/active';

export function useRaidNotificationRouter(ready: boolean): void {
  const navState = useRootNavigationState();
  const pathname = usePathname();
  const navReady = ready && Boolean(navState?.key);

  const processedRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<string | null>(null);
  const navigatingRef = useRef(false);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  // navReady を常に最新でrefに持つ。enqueue が古いクロージャの navReady を掴んで
  // 「準備完了なのに pending へ退避したまま処理されない」競合を防ぐ。
  const navReadyRef = useRef(navReady);
  navReadyRef.current = navReady;

  const process = useCallback(async (identifier: string) => {
    if (processedRef.current.has(identifier) || navigatingRef.current) {
      return;
    }
    if (pathnameRef.current === RAID_ROUTE) {
      // すでにレイド画面。二重遷移しない
      processedRef.current.add(identifier);
      return;
    }
    navigatingRef.current = true;
    processedRef.current.add(identifier);
    try {
      void AnalyticsService.track('raid_notification_opened');
      const settings = await StorageService.getSettings();
      if (!settings.onboardingCompleted) {
        // オンボーディング未完了ならレイドへ入れず、オンボーディングを優先
        router.replace('/onboarding');
        return;
      }

      const sessions = await StorageService.getSessions();
      if (RaidService.canStartOfficialRaid(sessions)) {
        router.push({ pathname: RAID_ROUTE, params: { mode: 'raid' } });
      } else {
        // 窓外・当日参加済みなど。ホームへ（追い脱ドパ導線を見せる）
        router.replace('/(tabs)');
      }
    } finally {
      navigatingRef.current = false;
    }
  }, []);

  // navReady は ref 経由で常に最新を参照するため、enqueue は process のみに依存する安定関数。
  const enqueue = useCallback(
    (identifier: string) => {
      if (processedRef.current.has(identifier)) {
        return;
      }
      if (!navReadyRef.current) {
        // ナビ未準備。準備できてから処理する
        pendingRef.current = identifier;
        return;
      }
      void process(identifier);
    },
    [process],
  );

  // フォアグラウンドのレスポンスリスナー
  useEffect(() => {
    const unsubscribe = NotificationService.addRaidNotificationListener(enqueue);
    return unsubscribe;
  }, [enqueue]);

  // コールドスタート通知の確認（1回だけ）
  const coldChecked = useRef(false);
  useEffect(() => {
    if (coldChecked.current) {
      return;
    }
    coldChecked.current = true;
    void NotificationService.consumeLaunchRaidNotification().then((identifier) => {
      if (identifier) {
        enqueue(identifier);
      }
    });
  }, [enqueue]);

  // ナビ準備完了後に保留中の通知を処理
  useEffect(() => {
    if (navReady && pendingRef.current) {
      const identifier = pendingRef.current;
      pendingRef.current = null;
      void process(identifier);
    }
  }, [navReady, process]);
}
