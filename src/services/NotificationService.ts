
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { notificationBodies } from '../constants/copy';
import { UserSettings } from '../types/settings';
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

function parseTime(time: string): { hour: number; minute: number } {
  const [hourText, minuteText] = time.split(':');
  return {
    hour: Number(hourText) || 0,
    minute: Number(minuteText) || 0,
  };
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

    const { hour, minute } = parseTime(settings.raidTime);
    const bodies = notificationBodies[settings.notificationTone];
    const body = bodies[Math.floor(Math.random() * bodies.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '脱ドパレイド開始',
        body,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: 'daily-raid',
        hour,
        minute,
      },
    });
  }
}
