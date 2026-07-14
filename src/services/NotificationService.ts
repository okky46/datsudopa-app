
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { RAID_NOTIFICATION_BODY, RAID_NOTIFICATION_TITLE } from '../constants/copy';
import { RAID_NOTIFICATION_SCHEDULE_DAYS } from '../constants/raid';
import { UserSettings } from '../types/settings';
import { jstDateKey, raidStartAt, shiftJstDateKey } from '../utils/jst';
import { AnalyticsService } from './AnalyticsService';
import { StorageService } from './StorageService';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;

function loadNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient && Platform.OS === 'android') {
    notificationsModule = null;
    return notificationsModule;
  }

  if (Platform.OS === 'web') {
    // expo-notifications はロードできてしまうが、web ではスケジュール系メソッドが未実装で例外を投げる。
    notificationsModule = null;
    return notificationsModule;
  }

  try {
    const notifications = require('expo-notifications') as NotificationsModule;
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationsModule = notifications;
    return notificationsModule;
  } catch {
    notificationsModule = null;
    return notificationsModule;
  }
}

export class NotificationService {
  static isAvailable(): boolean {
    return loadNotifications() !== null;
  }

  /** スケジュール済み通知をすべてキャンセルする（データ削除時に通知が届き続けないように） */
  static async cancelAll(): Promise<void> {
    const Notifications = loadNotifications();
    if (!Notifications) {
      return;
    }
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // 失敗しても削除処理は続行する
    }
  }

  static async requestPermission(): Promise<boolean> {
    const Notifications = loadNotifications();
    if (!Notifications) {
      await StorageService.saveNotificationPermission(false);
      return false;
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      await StorageService.saveNotificationPermission(true);
      return true;
    }
    // 実際にOSダイアログを出すのはここだけ。requested/granted/denied を1回ずつ記録する。
    void AnalyticsService.track('notification_permission_requested');
    const finalStatus = await Notifications.requestPermissionsAsync();
    const granted = finalStatus.granted || finalStatus.status === 'granted';
    await StorageService.saveNotificationPermission(granted);
    void AnalyticsService.track(granted ? 'notification_permission_granted' : 'notification_permission_denied');
    return granted;
  }

  /** 毎日22:00 JSTの通知を、今日から7日ぶん先までスケジュールし直す */
  static async scheduleDailyRaid(settings: UserSettings): Promise<void> {
    const Notifications = loadNotifications();
    if (!Notifications) {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.notificationEnabled) {
      return;
    }

    const granted = await NotificationService.requestPermission();
    if (!granted) {
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-raid', {
        name: '毎日22時の公式レイド',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 180, 120, 180],
        lightColor: '#C9A96A',
      });
    }

    const now = new Date();
    const todayKey = jstDateKey(now);
    for (let offset = 0; offset < RAID_NOTIFICATION_SCHEDULE_DAYS; offset += 1) {
      const dateKey = shiftJstDateKey(todayKey, offset);
      const triggerDate = raidStartAt(dateKey);
      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: RAID_NOTIFICATION_TITLE,
          body: RAID_NOTIFICATION_BODY,
          sound: false,
          data: { screen: 'raid', dateKey },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          channelId: 'daily-raid',
          date: triggerDate,
        },
      });
    }
  }

  /**
   * 通知タップのリスナー。レイド通知なら request identifier を渡す。
   * 実際の遷移可否・二重処理防止は呼び出し側（useRaidNotificationRouter）で一元管理する。
   */
  static addRaidNotificationListener(onRaidNotification: (identifier: string) => void): () => void {
    const Notifications = loadNotifications();
    if (!Notifications) {
      return () => {};
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string } | undefined;
      if (data?.screen === 'raid') {
        onRaidNotification(response.notification.request.identifier);
      }
    });
    return () => subscription.remove();
  }

  /**
   * コールドスタート時に、通知タップで起動されたかを確認して identifier を返す。
   * clear はしない（同一 identifier の二重処理は呼び出し側が dedup する）。
   */
  static async consumeLaunchRaidNotification(): Promise<string | null> {
    const Notifications = loadNotifications();
    if (!Notifications) {
      return null;
    }
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      const data = response?.notification.request.content.data as { screen?: string } | undefined;
      if (data?.screen !== 'raid') {
        return null;
      }
      return response?.notification.request.identifier ?? 'launch';
    } catch {
      return null;
    }
  }
}
