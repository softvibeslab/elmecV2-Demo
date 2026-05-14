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
import { useRouter } from 'expo-router';
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
  openNotification(notification: InAppNotification): void;
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
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

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
  const nestedData = getNotificationData(normalizedData.data);
  const normalizedType = normalizedData.type || type;

  if (normalizedData.notification_event_key) {
    return String(normalizedData.notification_event_key);
  }

  const requestId =
    normalizedData.requestId ||
    normalizedData.request_id ||
    nestedData.requestId ||
    nestedData.request_id;
  const requestStatus =
    normalizedData.newStatus ||
    normalizedData.new_status ||
    nestedData.newStatus ||
    nestedData.new_status;
  const chatRoomId =
    normalizedData.chatRoomId ||
    normalizedData.chat_room_id ||
    normalizedData.roomId ||
    normalizedData.room_id ||
    nestedData.chatRoomId ||
    nestedData.chat_room_id ||
    nestedData.roomId ||
    nestedData.room_id;
  const messageId =
    normalizedData.messageId ||
    normalizedData.message_id ||
    nestedData.messageId ||
    nestedData.message_id;
  const senderId =
    normalizedData.sender_id ||
    normalizedData.senderId ||
    nestedData.sender_id ||
    nestedData.senderId;

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

  if (
    requestId &&
    (normalizedData.action === 'request_created' ||
      nestedData.action === 'request_created')
  ) {
    return `request_created:${requestId}`;
  }

  if (
    chatRoomId &&
    (normalizedData.action === 'chat_created' ||
      nestedData.action === 'chat_created')
  ) {
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

const getNotificationRoute = (type: string, data?: any): string | null => {
  const normalizedData = getNotificationData(data);
  const nestedData = getNotificationData(normalizedData.data);
  const normalizedType = normalizedData.type || type;
  const requestId =
    normalizedData.requestId ||
    normalizedData.request_id ||
    nestedData.requestId ||
    nestedData.request_id;
  const chatRoomId =
    normalizedData.roomId ||
    normalizedData.room_id ||
    normalizedData.chatRoomId ||
    normalizedData.chat_room_id ||
    nestedData.roomId ||
    nestedData.room_id ||
    nestedData.chatRoomId ||
    nestedData.chat_room_id;
  const action = normalizedData.action || nestedData.action;
  const target =
    normalizedData.target ||
    normalizedData.module ||
    nestedData.target ||
    nestedData.module;

  if (
    normalizedType === 'new_message' ||
    normalizedType === 'chat' ||
    action === 'chat_created' ||
    action === 'open_chat' ||
    target === 'chat' ||
    (chatRoomId && !requestId)
  ) {
    return chatRoomId ? `/chat/${chatRoomId}` : '/(tabs)/chat';
  }

  if (
    normalizedType === 'request_update' ||
    normalizedType === 'assignment' ||
    normalizedType === 'request' ||
    action === 'request_created' ||
    action === 'open_request' ||
    target === 'requests' ||
    target === 'request' ||
    requestId
  ) {
    return '/(tabs)/requests';
  }

  return null;
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

const sendExpoPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: any
) => {
  if (!token || !token.startsWith('ExponentPushToken[')) {
    return;
  }

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title,
      body,
      data: getNotificationData(data),
      priority: 'high',
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed: ${response.status}`);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const router = useRouter();
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

  const navigateFromNotification = useCallback(
    (type: string, data?: any) => {
      const route = getNotificationRoute(type, data);

      if (route) {
        router.push(route as any);
      }
    },
    [router]
  );

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

      if (appStateRef.current === 'active') {
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
          const { data: currentUserData } = await supabaseClient
            .from('users')
            .select('metadata')
            .eq('id', user.id)
            .single();

          const { error } = await supabaseClient
            .from('users')
            .update({
              metadata: {
                ...(((currentUserData as any)?.metadata || {}) as Record<
                  string,
                  any
                >),
                push_token: token,
                expo_push_token: token,
                push_token_updated_at: new Date().toISOString(),
              },
            } as any)
            .eq('id', user.id);

          if (error) console.error('Error saving push token to DB:', error);
          else console.log('Push token guardado en DB con éxito');

          await supabaseClient
            .from('push_tokens')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .neq('token', token);

          await supabaseClient.from('push_tokens').insert({
            user_id: user.id,
            token,
            platform: Platform.OS,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
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

          const { data } = response.notification.request.content;
          const type = String(data?.type || 'info');
          navigateFromNotification(type, data);
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
  }, [navigateFromNotification, user?.id]);

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

        try {
          const [{ data: tokenRows }, { data: targetUser }] = await Promise.all(
            [
              supabaseClient
                .from('push_tokens')
                .select('token')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(3),
              supabaseClient
                .from('users')
                .select('metadata')
                .eq('id', userId)
                .single(),
            ]
          );

          const metadata = ((targetUser as any)?.metadata || {}) as Record<
            string,
            any
          >;
          const tokens = Array.from(
            new Set(
              [
                ...(((tokenRows || []) as Array<{ token?: string }>).map(
                  row => row.token
                ) || []),
                metadata.push_token,
                metadata.expo_push_token,
              ].filter(Boolean)
            )
          ) as string[];

          await Promise.allSettled(
            tokens.map(token =>
              sendExpoPushNotification(token, title, body, {
                ...normalizedData,
                notification_event_key: eventKey,
              })
            )
          );
        } catch (pushError) {
          console.error('Error sending Expo push notification:', pushError);
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

  const openNotification = useCallback(
    (nextNotification: InAppNotification) => {
      markNotificationAsRead(nextNotification.id);
      navigateFromNotification(nextNotification.type, nextNotification.data);
    },
    [markNotificationAsRead, navigateFromNotification]
  );

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
        openNotification,
        markAllAsRead,
        clearNotifications,
        registerForPushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
