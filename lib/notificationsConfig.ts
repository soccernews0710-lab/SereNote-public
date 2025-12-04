// lib/notificationsConfig.ts
import * as Notifications from 'expo-notifications';

// NotificationHandler を明示的に定義
const handler: Notifications.NotificationHandler = {
  async handleNotification(
    _notification: Notifications.Notification
  ): Promise<Notifications.NotificationBehavior> {
    return {
      shouldShowAlert: true,    // バナー表示（iOS/Android 共通）
      shouldPlaySound: false,   // 必要なら true
      shouldSetBadge: false,    // バッジは使わない

      // 新しめの expo-notifications で追加されたフィールド
      shouldShowBanner: true,   // iOS のバナー表示を許可
      shouldShowList: true,     // 通知センターの一覧に表示
    };
  },
};

// ハンドラを登録
Notifications.setNotificationHandler(handler);