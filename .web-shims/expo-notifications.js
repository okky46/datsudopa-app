// web preview shim: no-op notifications
module.exports = {
  setNotificationHandler: () => {},
  getPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
  requestPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
  cancelAllScheduledNotificationsAsync: async () => {},
  setNotificationChannelAsync: async () => {},
  scheduleNotificationAsync: async () => 'web-noop',
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
};
