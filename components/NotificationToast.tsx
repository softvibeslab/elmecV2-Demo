import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import {
  useNotifications,
  InAppNotification,
} from '@/contexts/NotificationContext';
import {
  CircleCheck as CheckCircle,
  Info,
  TriangleAlert as AlertTriangle,
  Circle as XCircle,
  X,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SYSTEM_HANDLED_NOTIFICATION_TYPES = [
  'new_message',
  'request_update',
  'assignment',
];

interface NotificationToastProps {
  notification: InAppNotification;
  /* eslint-disable no-unused-vars */
  onDismiss: (id: string, options?: { markAsRead?: boolean }) => void;
  /* eslint-enable no-unused-vars */
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const [slideAnim] = useState(new Animated.Value(-width));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (markAsRead = true) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(notification.id, { markAsRead });
    });
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={24} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={24} color="#f59e0b" />;
      case 'error':
        return <XCircle size={24} color="#ef4444" />;
      default:
        return <Info size={24} color="#3b82f6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return '#ecfdf5';
      case 'warning':
        return '#fffbeb';
      case 'error':
        return '#fef2f2';
      default:
        return '#eff6ff';
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity,
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.body}>{notification.body}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDismiss(true)}
          style={styles.closeButton}
        >
          <X size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const NotificationManager: React.FC = () => {
  const { inAppNotifications, markNotificationAsRead } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<
    InAppNotification[]
  >([]);

  useEffect(() => {
    const unreadNotifications = inAppNotifications
      .filter(n => !n.read)
      .filter(
        n =>
          Platform.OS === 'web' ||
          !SYSTEM_HANDLED_NOTIFICATION_TYPES.includes(n.type)
      )
      .slice(0, 3);

    setVisibleNotifications(unreadNotifications);
  }, [inAppNotifications]);

  const handleDismiss = (
    id: string,
    options?: {
      markAsRead?: boolean;
    }
  ) => {
    if (options?.markAsRead) {
      markNotificationAsRead(id);
    }
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.manager}>
      {visibleNotifications.map((notification, index) => (
        <View
          key={notification.id}
          style={[styles.toastWrapper, { top: 60 + index * 90 }]}
        >
          <NotificationToast
            notification={notification}
            onDismiss={handleDismiss}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  manager: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  container: {
    borderRadius: 12,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
