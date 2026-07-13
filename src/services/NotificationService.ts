
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { RAID_NOTIFICATION_BODY, RAID_NOTIFICATION_TITLE } from '../constants/copy';
import { RAID_NOTIFICATION_SCHEDULE_DAYS } from '../constants/raid';
import { UserSettings } from '../types/settings';
import { jstDateKey, raidStartAt, shiftJstDateKey } from '../utils/jst';
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

  static async requestPermission(): Promise<boolean> {
    const Notifications = loadNotifications();
    if (!Notifications) {
      await StorageService.saveNotificationPermission(false);
      return false;
    }

    const current = await Notifications.getPermissionsAsync();
    const finalStatus = current.granted ? current : await Notifications.requestPermissionsAsync();
    const granted = finalStatus.granted || finalStatus.status === 'granted';
    await StorageService.saveNotificationPermission(granted);
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

  /** 通知タップで公式レイド開始導線へ直行させるためのリスナー。解除関数を返す */
  static addRaidNotificationListener(onRaidNotification: () => void): () => void {
    const Notifications = loadNotifications();
    if (!Notifications) {
      return () => {};
    }
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string } | undefined;
      if (data?.screen === 'raid') {
        onRaidNotification();
      }
    });
    return () => subscription.remove();
  }

  /** アプリが通知タップで起動された場合の初期通知を確認する */
  static async consumeLaunchRaidNotification(): Promise<boolean> {
    const Notifications = loadNotifications();
    if (!Notifications) {
      return false;
    }
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      const data = response?.notification.request.content.data as { screen?: string } | undefined;
      if (data?.screen !== 'raid') {
        return false;
      }
      // 同じ通知タップを次回起動時に再処理しないよう消費する
      await Notifications.clearLastNotificationResponseAsync();
      return true;
    } catch {
      return false;
    }
  }
}
