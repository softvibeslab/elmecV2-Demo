/**
 * Push Notification Service using Expo Notifications + Firebase Cloud Messaging
 *
 * Handles:
 * - Push notification registration
 * - FCM token management
 * - Notification scheduling and display
 * - Deep linking from notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ref, set, get } from 'firebase/database';
import { getFirebaseDatabase } from '@/config/firebase';

// Types
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    type: 'group_message' | 'mention' | 'request_update' | 'chat_message' | 'system';
    groupId?: string;
    messageId?: string;
    requestId?: string;
    chatRoomId?: string;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  groupMessages: boolean;
  mentions: boolean;
  requestUpdates: boolean;
  chatMessages: boolean;
  systemNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  private db = getFirebaseDatabase();
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize push notifications and get token
   */
  async initialize(userId: string): Promise<string | null> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('[PushNotifications] Must use physical device for Push Notifications');
        return null;
      }

      // Get permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[PushNotifications] Permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      });
      this.expoPushToken = tokenData.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Save token to Firebase
      await this.saveUserToken(userId, this.expoPushToken);

      console.log('[PushNotifications] Initialized with token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('[PushNotifications] Initialization error:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('group-messages', {
      name: 'Mensajes de Grupo',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1e40af',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('mentions', {
      name: 'Menciones',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#f59e0b',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('requests', {
      name: 'Actualizaciones de Solicitudes',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#10b981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Mensajes de Chat',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      sound: 'default',
    });
  }

  /**
   * Save user's push token to Firebase
   */
  private async saveUserToken(userId: string, token: string): Promise<void> {
    const tokenRef = ref(this.db, `pushTokens/${userId}`);
    await set(tokenRef, {
      token,
      platform: Platform.OS,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get push token for a specific user
   */
  async getUserToken(userId: string): Promise<string | null> {
    const tokenRef = ref(this.db, `pushTokens/${userId}`);
    const snapshot = await get(tokenRef);
    return snapshot.exists() ? snapshot.val().token : null;
  }

  /**
   * Get push tokens for multiple users
   */
  async getUserTokens(userIds: string[]): Promise<{ userId: string; token: string }[]> {
    const tokens: { userId: string; token: string }[] = [];

    for (const userId of userIds) {
      const token = await this.getUserToken(userId);
      if (token) {
        tokens.push({ userId, token });
      }
    }

    return tokens;
  }

  /**
   * Send push notification to a specific user
   * Note: In production, this should be done via a server-side function
   */
  async sendToUser(userId: string, notification: PushNotificationPayload): Promise<boolean> {
    try {
      const token = await this.getUserToken(userId);
      if (!token) {
        console.log('[PushNotifications] No token found for user:', userId);
        return false;
      }

      // Check user preferences
      const prefs = await this.getUserPreferences(userId);
      if (!this.shouldSendNotification(notification, prefs)) {
        console.log('[PushNotifications] Notification blocked by user preferences');
        return false;
      }

      // Send via Expo Push API
      await this.sendExpoPushNotification(token, notification);
      return true;
    } catch (error) {
      console.error('[PushNotifications] Error sending to user:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], notification: PushNotificationPayload): Promise<void> {
    const tokens = await this.getUserTokens(userIds);

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
    }));

    if (messages.length > 0) {
      await this.sendExpoPushNotifications(messages);
    }
  }

  /**
   * Send push notification to all group participants except sender
   */
  async sendToGroup(
    groupId: string,
    participantIds: string[],
    senderId: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    const recipientIds = participantIds.filter(id => id !== senderId);
    await this.sendToUsers(recipientIds, notification);
  }

  /**
   * Send mention notification
   */
  async sendMentionNotification(
    mentionedUserId: string,
    senderName: string,
    groupName: string,
    messagePreview: string,
    groupId: string,
    messageId: string
  ): Promise<void> {
    await this.sendToUser(mentionedUserId, {
      title: `${senderName} te mencionó en ${groupName}`,
      body: messagePreview,
      data: {
        type: 'mention',
        groupId,
        messageId,
      },
    });
  }

  /**
   * Send via Expo Push API
   */
  private async sendExpoPushNotification(
    token: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        channelId: this.getChannelForType(notification.data?.type),
      }),
    });
  }

  /**
   * Send multiple notifications via Expo Push API
   */
  private async sendExpoPushNotifications(messages: any[]): Promise<void> {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  }

  /**
   * Get Android channel ID for notification type
   */
  private getChannelForType(type?: string): string {
    switch (type) {
      case 'group_message':
        return 'group-messages';
      case 'mention':
        return 'mentions';
      case 'request_update':
        return 'requests';
      case 'chat_message':
        return 'chat';
      default:
        return 'default';
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const prefsRef = ref(this.db, `notificationPreferences/${userId}`);
    const snapshot = await get(prefsRef);

    if (snapshot.exists()) {
      return snapshot.val() as NotificationPreferences;
    }

    // Default preferences
    return {
      groupMessages: true,
      mentions: true,
      requestUpdates: true,
      chatMessages: true,
      systemNotifications: true,
      quietHoursEnabled: false,
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const prefsRef = ref(this.db, `notificationPreferences/${userId}`);
    const current = await this.getUserPreferences(userId);
    await set(prefsRef, { ...current, ...preferences });
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(
    notification: PushNotificationPayload,
    prefs: NotificationPreferences
  ): boolean {
    // Check quiet hours
    if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime >= prefs.quietHoursStart || currentTime <= prefs.quietHoursEnd) {
        return false;
      }
    }

    // Check type-specific preferences
    switch (notification.data?.type) {
      case 'group_message':
        return prefs.groupMessages;
      case 'mention':
        return prefs.mentions;
      case 'request_update':
        return prefs.requestUpdates;
      case 'chat_message':
        return prefs.chatMessages;
      case 'system':
        return prefs.systemNotifications;
      default:
        return true;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    notification: PushNotificationPayload,
    triggerSeconds: number
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
      trigger: { seconds: triggerSeconds },
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Remove listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
