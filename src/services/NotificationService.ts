
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationBodies } from '../constants/copy';
import { UserSettings } from '../types/settings';
import { StorageService } from './StorageService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function parseTime(time: string): { hour: number; minute: number } {
  const [hourText, minuteText] = time.split(':');
  return {
    hour: Number(hourText) || 0,
    minute: Number(minuteText) || 0,
  };
}

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    const finalStatus = current.granted ? current : await Notifications.requestPermissionsAsync();
    const granted = finalStatus.granted || finalStatus.status === 'granted';
    await StorageService.saveNotificationPermission(granted);
    return granted;
  }

  static async scheduleDailyRaid(settings: UserSettings): Promise<void> {
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
        lightColor: '#7BA7D7',
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
