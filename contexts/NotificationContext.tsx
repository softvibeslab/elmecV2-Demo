import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { supabase, supabaseClient } from '@/lib/supabase';
import { useAuth } from './AuthContext';

// Configure notification behavior for mobile
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // Campos adicionales requeridos por los tipos recientes de Expo Notifications
      shouldShowBanner: true,
      shouldShowList: true,
    }) as any,
});

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationKind;
  timestamp: string;
  data?: any;
  read: boolean;
}

export type NotificationKind =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'new_message'
  | 'request_update'
  | 'assignment';

/* eslint-disable no-unused-vars */
interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  inAppNotifications: InAppNotification[];
  unreadCount: number;
  sendDemoNotification(
    title: string,
    body: string,
    type?: NotificationKind,
    data?: any
  ): Promise<void>;
  sendLocalNotification(title: string, body: string, data?: any): Promise<void>;
  sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    type?: NotificationKind,
    data?: any
  ): Promise<void>;
  markNotificationAsRead(id: string): void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  registerForPushNotifications: () => Promise<string | null>;
}
/* eslint-enable no-unused-vars */

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NOTIFICATION_DEDUPE_WINDOW_MS = 15000;
const MAX_IN_APP_NOTIFICATIONS = 50;

const getNotificationData = (data?: any): Record<string, any> => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data;
  }

  return {};
};

const getNotificationEventKey = ({
  title,
  body,
  type,
  data,
  userId,
}: {
  title: string;
  body: string;
  type: string;
  data?: any;
  userId?: string;
}) => {
  const normalizedData = getNotificationData(data);
  const normalizedType = normalizedData.type || type;

  if (normalizedData.notification_event_key) {
    return String(normalizedData.notification_event_key);
  }

  const requestId =
    normalizedData.requestId ||
    normalizedData.request_id ||
    normalizedData.data?.requestId ||
    normalizedData.data?.request_id;
  const requestStatus = normalizedData.newStatus || normalizedData.new_status;
  const chatRoomId =
    normalizedData.chatRoomId ||
    normalizedData.chat_room_id ||
    normalizedData.roomId ||
    normalizedData.room_id;
  const messageId = normalizedData.messageId || normalizedData.message_id;
  const senderId = normalizedData.sender_id || normalizedData.senderId;

  if (normalizedType === 'new_message') {
    if (messageId) {
      return `new_message:${messageId}`;
    }

    if (chatRoomId && senderId) {
      return `new_message:${chatRoomId}:${senderId}:${body}`;
    }
  }

  if (normalizedType === 'request_update' && requestId) {
    return `request_update:${requestId}:${requestStatus || body}`;
  }

  if (normalizedType === 'assignment' && requestId) {
    return `assignment:${userId || 'unknown'}:${requestId}`;
  }

  if (requestId && normalizedData.action === 'request_created') {
    return `request_created:${requestId}`;
  }

  if (chatRoomId && normalizedData.action === 'chat_created') {
    return `chat_created:${chatRoomId}`;
  }

  if (chatRoomId && title) {
    return `${type}:${chatRoomId}:${title}`;
  }

  if (requestId && title) {
    return `${type}:${requestId}:${title}`;
  }

  return `${type}:${title}:${body}`;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider'
    );
  }
  return context;
};

const sendWebNotification = (title: string, body: string) => {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    const isDocumentVisible =
      typeof document !== 'undefined' && document.visibilityState === 'visible';
    const hasDocumentFocus =
      typeof document !== 'undefined' &&
      typeof document.hasFocus === 'function' &&
      document.hasFocus();

    if (isDocumentVisible && hasDocumentFocus) {
      return;
    }

    new Notification(title, {
      body,
      icon: '/assets/images/icon.png',
      badge: '/assets/images/icon.png',
    });
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [inAppNotifications, setInAppNotifications] = useState<
    InAppNotification[]
  >([]);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const realtimeSubscription = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const recentNotificationKeys = useRef<Map<string, number>>(new Map());
  const recentOutboundNotificationKeys = useRef<Map<string, number>>(new Map());

  const unreadCount = inAppNotifications.filter(n => !n.read).length;

  const pruneExpiredNotificationKeys = useCallback(
    (store: Map<string, number>) => {
      const now = Date.now();

      store.forEach((timestamp, key) => {
        if (now - timestamp > NOTIFICATION_DEDUPE_WINDOW_MS) {
          store.delete(key);
        }
      });
    },
    []
  );

  const appendNotification = useCallback(
    async (
      nextNotification: InAppNotification,
      options?: { triggerSystemNotification?: boolean }
    ) => {
      const normalizedData = getNotificationData(nextNotification.data);
      const eventKey = getNotificationEventKey({
        title: nextNotification.title,
        body: nextNotification.body,
        type: nextNotification.type,
        data: normalizedData,
        userId: user?.id,
      });
      const createdAtMs = Date.parse(nextNotification.timestamp);
      const notificationTimestamp = Number.isNaN(createdAtMs)
        ? Date.now()
        : createdAtMs;

      pruneExpiredNotificationKeys(recentNotificationKeys.current);

      if (
        nextNotification.id &&
        processedNotificationIds.current.has(nextNotification.id)
      ) {
        return false;
      }

      const lastEventTimestamp = recentNotificationKeys.current.get(eventKey);
      if (
        lastEventTimestamp &&
        notificationTimestamp - lastEventTimestamp <
          NOTIFICATION_DEDUPE_WINDOW_MS
      ) {
        return false;
      }

      if (nextNotification.id) {
        processedNotificationIds.current.add(nextNotification.id);
      }
      recentNotificationKeys.current.set(eventKey, notificationTimestamp);

      const notificationWithKey: InAppNotification = {
        ...nextNotification,
        data: {
          ...normalizedData,
          notification_event_key: eventKey,
        },
      };

      setInAppNotifications(prev => {
        const nextItems = prev.filter(existing => {
          if (existing.id === notificationWithKey.id) {
            return false;
          }

          return (
            getNotificationEventKey({
              title: existing.title,
              body: existing.body,
              type: existing.type,
              data: existing.data,
              userId: user?.id,
            }) !== eventKey
          );
        });

        return [notificationWithKey, ...nextItems].slice(
          0,
          MAX_IN_APP_NOTIFICATIONS
        );
      });

      if (!options?.triggerSystemNotification) {
        return true;
      }

      if (Platform.OS === 'web') {
        sendWebNotification(
          notificationWithKey.title,
          notificationWithKey.body
        );
        return true;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationWithKey.title,
          body: notificationWithKey.body,
          data: {
            ...notificationWithKey.data,
            app_state: appStateRef.current,
          },
          sound: true,
        },
        trigger: null,
      }).catch(console.error);

      return true;
    },
    [pruneExpiredNotificationKeys, user?.id]
  );

  const requestWebNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  };

  const registerForPushNotifications = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // For web, just request browser notification permission
      await requestWebNotificationPermission();
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId:
            process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
            '656caaad-2849-4ea2-8374-1632acab1368',
        })
      ).data;
      console.log('Expo push token:', token);

      if (user?.id) {
        try {
          const { error } = await supabaseClient
            .from('users')
            .update({ metadata: { push_token: token } } as any)
            .eq('id', user.id);

          if (error) console.error('Error saving push token to DB:', error);
          else console.log('Push token guardado en DB con éxito');
        } catch (dbError) {
          console.error('Exception saving push token:', dbError);
        }
      }

      return token;
    } catch (error) {
      console.log(
        'Push token not available:',
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  };

  const loadNotificationsFromDB = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_IN_APP_NOTIFICATIONS);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (data) {
        processedNotificationIds.current.clear();
        recentNotificationKeys.current.clear();

        const seenIds = new Set<string>();
        const seenEventKeys = new Set<string>();
        const dbNotifications: InAppNotification[] = [];

        data.forEach((n: any) => {
          const dbNotification: InAppNotification = {
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type || 'info',
            timestamp: n.created_at,
            data: n.data,
            read: n.read || false,
          };
          const eventKey = getNotificationEventKey({
            title: dbNotification.title,
            body: dbNotification.body,
            type: dbNotification.type,
            data: dbNotification.data,
            userId: user.id,
          });
          const createdAtMs = Date.parse(dbNotification.timestamp);

          if (seenIds.has(dbNotification.id) || seenEventKeys.has(eventKey)) {
            return;
          }

          seenIds.add(dbNotification.id);
          seenEventKeys.add(eventKey);
          processedNotificationIds.current.add(dbNotification.id);
          recentNotificationKeys.current.set(
            eventKey,
            Number.isNaN(createdAtMs) ? Date.now() : createdAtMs
          );

          dbNotifications.push({
            ...dbNotification,
            data: {
              ...getNotificationData(dbNotification.data),
              notification_event_key: eventKey,
            },
          });
        });

        setInAppNotifications(dbNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        appStateRef.current = nextAppState;
      }
    );

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (user?.id) return;

    processedNotificationIds.current.clear();
    recentNotificationKeys.current.clear();
    recentOutboundNotificationKeys.current.clear();
    setInAppNotifications([]);
    setNotification(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    if (realtimeSubscription.current) {
      supabase.removeChannel(realtimeSubscription.current);
      realtimeSubscription.current = null;
    }

    loadNotificationsFromDB();

    realtimeSubscription.current = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          console.log('Nueva notificación recibida:', payload);
          const newNotif = payload.new;

          await appendNotification(
            {
              id: newNotif.id,
              title: newNotif.title,
              body: newNotif.body,
              type: newNotif.type || 'info',
              timestamp: newNotif.created_at,
              data: newNotif.data,
              read: newNotif.read || false,
            },
            { triggerSystemNotification: true }
          );
        }
      )
      .subscribe();

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
        realtimeSubscription.current = null;
      }
    };
  }, [appendNotification, user?.id, loadNotificationsFromDB]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const setupNotifications = async () => {
        const token = await registerForPushNotifications();
        setExpoPushToken(token);
      };

      setupNotifications();

      notificationListener.current =
        Notifications.addNotificationReceivedListener(nextNotification => {
          console.log(
            'Notificación recibida en primer plano:',
            nextNotification
          );
          setNotification(nextNotification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(response => {
          console.log('El usuario interactuó con la notificación:', response);

          const data = response.notification.request.content.data;
          if (data?.roomId) {
            // Ejemplo: router.push(`/chat/${data.roomId}`);
          }
        });
    } else {
      requestWebNotificationPermission();
    }

    return () => {
      if (Platform.OS !== 'web') {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(
            responseListener.current
          );
        }
      }
    };
  }, [user?.id]);

  const sendDemoNotification = useCallback(
    async (
      title: string,
      body: string,
      type: NotificationKind = 'info',
      data?: any
    ) => {
      const normalizedData = getNotificationData(data);
      const eventKey = getNotificationEventKey({
        title,
        body,
        type,
        data: normalizedData,
        userId: user?.id,
      });

      await appendNotification({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        body,
        type,
        timestamp: new Date().toISOString(),
        data: {
          ...normalizedData,
          notification_event_key: eventKey,
        },
        read: false,
      });
    },
    [appendNotification, user?.id]
  );

  const sendLocalNotification = useCallback(
    async (title: string, body: string, data?: any) => {
      await sendDemoNotification(title, body, 'info', data);
    },
    [sendDemoNotification]
  );

  const sendNotificationToUser = useCallback(
    async (
      userId: string,
      title: string,
      body: string,
      type: NotificationKind = 'info',
      data?: any
    ) => {
      const normalizedData = getNotificationData(data);
      const eventKey = getNotificationEventKey({
        title,
        body,
        type,
        data: normalizedData,
        userId,
      });
      const outboundEventKey = `${userId}:${eventKey}`;

      pruneExpiredNotificationKeys(recentOutboundNotificationKeys.current);

      const lastSentAt =
        recentOutboundNotificationKeys.current.get(outboundEventKey);
      if (
        lastSentAt &&
        Date.now() - lastSentAt < NOTIFICATION_DEDUPE_WINDOW_MS
      ) {
        console.log(
          `Notificación duplicada evitada para usuario ${userId}:`,
          eventKey
        );
        return;
      }

      recentOutboundNotificationKeys.current.set(outboundEventKey, Date.now());

      try {
        const { error } = await supabaseClient.from('notifications').insert({
          user_id: userId,
          title,
          body,
          type,
          priority:
            type === 'error' || type === 'assignment' || type === 'new_message'
              ? 'high'
              : type === 'warning' || type === 'request_update'
                ? 'medium'
                : 'low',
          data: {
            ...normalizedData,
            notification_event_key: eventKey,
          },
          read: false,
        } as any);

        if (error) {
          recentOutboundNotificationKeys.current.delete(outboundEventKey);
          console.error('Error sending notification to user:', error);
        } else {
          console.log(`Notificación enviada a usuario ${userId}:`, title);
        }
      } catch (error) {
        recentOutboundNotificationKeys.current.delete(outboundEventKey);
        console.error('Error sending notification to user:', error);
      }
    },
    [pruneExpiredNotificationKeys]
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setInAppNotifications(prev =>
      prev.map(existing =>
        existing.id === id ? { ...existing, read: true } : existing
      )
    );

    void (async () => {
      try {
        const { error } = await supabaseClient
          .from('notifications')
          .update({ read: true } as any)
          .eq('id', id);

        if (error) {
          console.error('Error marking notification as read in DB:', error);
        }
      } catch (error) {
        console.error('Error marking notification as read in DB:', error);
      }
    })();
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    setInAppNotifications(prev =>
      prev.map(existing => ({ ...existing, read: true }))
    );

    try {
      await supabaseClient
        .from('notifications')
        .update({ read: true } as any)
        .eq('user_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  const clearNotifications = useCallback(() => {
    processedNotificationIds.current.clear();
    recentNotificationKeys.current.clear();
    setInAppNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        inAppNotifications,
        unreadCount,
        sendDemoNotification,
        sendLocalNotification,
        sendNotificationToUser,
        markNotificationAsRead,
        markAllAsRead,
        clearNotifications,
        registerForPushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
