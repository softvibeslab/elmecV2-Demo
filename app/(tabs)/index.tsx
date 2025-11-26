import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  Users,
  FileText,
  Package,
  Clock,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  MoreHorizontal,
} from 'lucide-react-native';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const quickActions = [
    {
      title: 'Directorio',
      description: 'Buscar personal',
      icon: Users,
      color: '#335686', // Azul medio ELMEC
      route: '/directory',
    },
    {
      title: 'Nueva Solicitud',
      description: 'Crear solicitud',
      icon: FileText,
      color: '#95C3ED', // Azul claro ELMEC
      route: '/requests',
    },
    {
      title: 'Mis Pedidos',
      description: 'Ver pedidos',
      icon: Package,
      color: '#202B52', // Azul principal ELMEC
      route: '/profile/my-orders',
    },
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'solicitud',
      title: 'Solicitud de soporte técnico',
      status: 'en_proceso',
      time: '2 horas',
      agent: 'Carlos Mendoza',
    },
    {
      id: '2',
      type: 'solicitud',
      title: 'Consulta sobre facturación',
      status: 'resuelto',
      time: '1 día',
      agent: 'Ana García',
    },
    {
      id: '3',
      type: 'contacto',
      title: 'Llamada a ventas',
      status: 'completado',
      time: '3 días',
      agent: 'Luis Ramírez',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_proceso':
        return <Clock size={16} color="#f59e0b" />;
      case 'resuelto':
      case 'completado':
        return <CheckCircle size={16} color="#10b981" />;
      default:
        return <AlertCircle size={16} color="#ef4444" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_proceso':
        return 'En proceso';
      case 'resuelto':
        return 'Resuelto';
      case 'completado':
        return 'Completado';
      default:
        return 'Pendiente';
    }
  };

  const handleActivityMenu = () => {
    Alert.alert(
      'Actividad Reciente',
      'Selecciona una opción',
      [
        {
          text: 'Ver todas las solicitudes',
          onPress: () => router.push('/(tabs)/requests'),
        },
        {
          text: 'Ver solicitudes por estatus',
          onPress: () => router.push('/profile/requests-by-status'),
        },
        {
          text: 'Nueva solicitud',
          onPress: () => router.push('/(tabs)/requests'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#202B52', '#335686']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>¡Hola!</Text>
            <Text style={styles.userName}>
              {user?.nombre} {user?.apellido_paterno}
            </Text>
            <Text style={styles.userCompany}>{user?.empresa}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/branding/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.truckContainer}>
          <Image
            source={require('@/assets/images/branding/truck.png')}
            style={styles.truckImage}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={`action-${action.title}-${index}`}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${action.color}15` },
                  ]}
                >
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={handleActivityMenu}
            >
              <Text style={styles.sectionButtonText}>Opciones</Text>
              <MoreHorizontal size={20} color="#202B52" />
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {recentActivity.map(item => (
              <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  {getStatusIcon(item.status)}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityAgent}>Con: {item.agent}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityStatus}>
                      {getStatusText(item.status)}
                    </Text>
                    <Text style={styles.activityTime}>hace {item.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Solicitudes</Text>
              <Text style={styles.statSubLabel}>Este mes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>En proceso</Text>
              <Text style={styles.statSubLabel}>Activas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Contactos</Text>
              <Text style={styles.statSubLabel}>Realizados</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  logoContainer: {
    marginLeft: 16,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  truckContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  truckImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 24,
    marginTop: -16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  sectionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#202B52',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  activityAgent: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
});
