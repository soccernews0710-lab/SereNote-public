// hooks/useMedicationNotifications.ts
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ReminderTimes } from '../src/types/timeline';

function parseTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hour: h, minute: m };
}

export const useMedicationNotifications = (reminders: ReminderTimes) => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
  }, []);

  // リマインダー時刻が変更されたら通知を再登録
  useEffect(() => {
    if (!permissionGranted) return;

    (async () => {
      try {
        // 既存スケジュールは全部削除
        await Notifications.cancelAllScheduledNotificationsAsync();

        const morningTime = parseTime(reminders.morning);
        const nightTime = parseTime(reminders.night);

        // --- 朝の通知 ---
        if (morningTime) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '朝のお薬の時間です 💊',
              body: '今日の朝のお薬を飲みましたか？',
              sound: false,
            },
            trigger: {
              hour: morningTime.hour,
              minute: morningTime.minute,
              repeats: true,
            } as Notifications.NotificationTriggerInput, // ← 型エラー回避
          });
        }

        // --- 夜の通知 ---
        if (nightTime) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '夜のお薬の時間です 🌙',
              body: '今日の夜のお薬を忘れていませんか？',
              sound: false,
            },
            trigger: {
              hour: nightTime.hour,
              minute: nightTime.minute,
              repeats: true,
            } as Notifications.NotificationTriggerInput, // ← 型エラー回避
          });
        }
      } catch (e) {
        console.warn('Failed to schedule medication notifications', e);
      }
    })();
  }, [permissionGranted, reminders.morning, reminders.night]);
};