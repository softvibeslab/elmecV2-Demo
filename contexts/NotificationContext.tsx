import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  data?: any;
  read: boolean;
}

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  inAppNotifications: InAppNotification[];
  unreadCount: number;
  sendDemoNotification: (
    title: string,
    body: string,
    type?: InAppNotification['type'],
    data?: any
  ) => Promise<void>;
  sendLocalNotification: (
    title: string,
    body: string,
    data?: any
  ) => Promise<void>;
  sendNotificationToUser: (
    userId: string,
    title: string,
    body: string,
    type?: InAppNotification['type'],
    data?: any
  ) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  registerForPushNotifications: () => Promise<string | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

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

  const unreadCount = inAppNotifications.filter(n => !n.read).length;

  // Cargar notificaciones existentes de la base de datos
  const loadNotificationsFromDB = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      if (data) {
        const dbNotifications: InAppNotification[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type || 'info',
          timestamp: n.created_at,
          data: n.data,
          read: n.read || false,
        }));
        setInAppNotifications(dbNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user?.id]);

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    // Cargar notificaciones existentes
    loadNotificationsFromDB();

    // Suscribirse a nuevas notificaciones en tiempo real
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
        (payload: any) => {
          console.log('Nueva notificación recibida:', payload);
          const newNotif = payload.new;
          const notification: InAppNotification = {
            id: newNotif.id,
            title: newNotif.title,
            body: newNotif.body,
            type: newNotif.type || 'info',
            timestamp: newNotif.created_at,
            data: newNotif.data,
            read: false,
          };

          setInAppNotifications(prev => [notification, ...prev]);

          // También enviar notificación del sistema
          if (Platform.OS === 'web') {
            sendWebNotification(newNotif.title, newNotif.body);
          } else {
            Notifications.scheduleNotificationAsync({
              content: {
                title: newNotif.title,
                body: newNotif.body,
                data: newNotif.data,
                sound: true,
              },
              trigger: null,
            }).catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [user?.id, loadNotificationsFromDB]);

  useEffect(() => {
    // Solo configurar notificaciones en móviles
    if (Platform.OS !== 'web') {
      const setupNotifications = async () => {
        const token = await registerForPushNotifications();
        setExpoPushToken(token);
      };

      setupNotifications();

      // Escuchar notificaciones entrantes
      notificationListener.current =
        Notifications.addNotificationReceivedListener(notification => {
          console.log('Notificación recibida en primer plano:', notification);
          setNotification(notification);

          // Opcional: Mostrar un toast o alerta personalizada
        });

      // Escuchar respuestas (clics)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(response => {
          console.log('El usuario interactuó con la notificación:', response);

          // Aquí se puede manejar la navegación profunda (deep linking)
          const data = response.notification.request.content.data;
          if (data?.roomId) {
            // Ejemplo: router.push(`/chat/${data.roomId}`);
          }
        });
    } else {
      // Solicitar permisos en web
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
  }, [user?.id]); // Re-ejecutar cuando el usuario cambia para asegurar que el token se guarde

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

      // Try to get push token
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId:
            process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
            '656caaad-2849-4ea2-8374-1632acab1368',
        })
      ).data;
      console.log('Expo push token:', token);

      // Guardar token en Supabase si el usuario está autenticado
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

  const sendDemoNotification = useCallback(
    async (
      title: string,
      body: string,
      type: InAppNotification['type'] = 'info',
      data?: any
    ) => {
      const newNotification: InAppNotification = {
        id: Date.now().toString(),
        title,
        body,
        type,
        timestamp: new Date().toISOString(),
        data,
        read: false,
      };

      setInAppNotifications(prev => [newNotification, ...prev]);

      // Also send web notification if on web platform
      if (Platform.OS === 'web') {
        sendWebNotification(title, body);
      } else {
        // Send native notification on mobile
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data,
              sound: true,
            },
            trigger: null, // Send immediately
          });
        } catch (error) {
          console.log('Error sending native notification:', error);
        }
      }
    },
    []
  );

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    // For demo purposes, always create an in-app notification
    await sendDemoNotification(title, body, 'info', data);
  };

  // Enviar notificación a otro usuario (se guarda en la base de datos)
  const sendNotificationToUser = useCallback(
    async (
      userId: string,
      title: string,
      body: string,
      type: InAppNotification['type'] = 'info',
      data?: any
    ) => {
      try {
        const { error } = await supabaseClient.from('notifications').insert({
          user_id: userId,
          title,
          body,
          type,
          priority:
            type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low',
          data: data || {},
          read: false,
        } as any);

        if (error) {
          console.error('Error sending notification to user:', error);
        } else {
          console.log(`Notificación enviada a usuario ${userId}:`, title);
        }
      } catch (error) {
        console.error('Error sending notification to user:', error);
      }
    },
    []
  );

  const markNotificationAsRead = useCallback(async (id: string) => {
    // Actualizar estado local
    setInAppNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Actualizar en la base de datos
    try {
      await supabaseClient
        .from('notifications')
        .update({ read: true } as any)
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read in DB:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    setInAppNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Actualizar todas en la base de datos
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

  const clearNotifications = () => {
    setInAppNotifications([]);
  };

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
