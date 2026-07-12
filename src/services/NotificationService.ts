
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { RAID_NOTIFICATION_BODY } from '../constants/copy';
import { RAID_NOTIFICATION_SCHEDULE_DAYS } from '../constants/raid';
import { UserSettings } from '../types/settings';
import { parseTimeToToday } from '../utils/date';
import { RaidScheduleService } from './RaidScheduleService';
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
        name: '脱ドパレイド',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 180, 120, 180],
        lightColor: '#8FAF8A',
      });
    }

    const now = new Date();
    for (let offset = 0; offset < RAID_NOTIFICATION_SCHEDULE_DAYS; offset += 1) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + offset);
      const resolved = RaidScheduleService.resolveRaidTimeForDate(settings, targetDate);
      const triggerDate = parseTimeToToday(resolved.raidTime, targetDate);
      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '今日のレイド開始',
          body: RAID_NOTIFICATION_BODY,
          sound: false,
          data: { raidTime: resolved.raidTime, dateKey: resolved.dateKey },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          channelId: 'daily-raid',
          date: triggerDate,
        },
      });
    }
  }
}
