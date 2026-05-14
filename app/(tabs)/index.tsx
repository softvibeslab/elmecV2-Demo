import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Users,
  FileText,
  Calculator,
  Clock,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  MoreHorizontal,
  Lightbulb,
  X,
} from 'lucide-react-native';
import { AppTourGuide } from '@/components/AppTourGuide';

const getTourCompletedKey = (userId?: string) =>
  `appTourCompleted:${userId || 'guest'}`;

const getTourForceShowKey = (userId?: string) =>
  `appTourForceShow:${userId || 'guest'}`;

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Tour guide state
  const [showTour, setShowTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const roleLabel =
    user?.rol === 'agent'
      ? 'Agente'
      : user?.rol === 'customer'
        ? 'Cliente'
        : 'Administrador';

  // Check if tour was completed
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const checkTourStatus = async () => {
      const completed = await AsyncStorage.getItem(
        getTourCompletedKey(user?.id)
      );
      if (!completed) {
        // Show tour after 2 seconds
        timer = setTimeout(() => {
          setShowTour(true);
        }, 2000);
      } else {
        setTourCompleted(true);
      }
    };
    checkTourStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      const checkForcedTour = async () => {
        const forceShow = await AsyncStorage.getItem(
          getTourForceShowKey(user?.id)
        );

        if (forceShow === 'true') {
          await AsyncStorage.removeItem(getTourForceShowKey(user?.id));
          setShowTour(true);
        }
      };

      checkForcedTour();
    }, [user?.id])
  );

  const handleTourComplete = async () => {
    try {
      await AsyncStorage.setItem(getTourCompletedKey(user?.id), 'true');
      setTourCompleted(true);
      setShowTour(false);
    } catch (error) {
      console.error('Error saving tour status:', error);
    }
  };

  const handleShowTour = () => {
    setShowTour(true);
  };

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
      title: 'Calculadora',
      description: 'Herramientas',
      icon: Calculator,
      color: '#202B52', // Azul principal ELMEC
      route: '/calculator',
    },
  ];

  // Estado para actividad reciente real
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Cargar actividad reciente desde Supabase
  const loadRecentActivity = useCallback(async () => {
    try {
      if (!user) return;

      let query = supabase
        .from('requests')
        .select(
          `
          id,
          titulo,
          estatus,
          tipo,
          updated_at,
          created_at,
          agente:users!requests_agente_id_fkey(nombre, apellido_paterno),
          usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno)
        `
        )
        .order('updated_at', { ascending: false })
        .limit(3);

      // Filtrar según rol
      if (user.rol === 'customer') {
        query = query.eq('usuario_id', user.id);
      } else {
        query = query.eq('agente_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecentRequests(data || []);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadRecentActivity();
    }, [loadRecentActivity])
  );

  // Helper para tiempo relativo
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} días`;
  };

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
            <Text style={styles.userCompany}>
              {roleLabel}
              {user?.empresa ? ` · ${user.empresa}` : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!tourCompleted && (
              <TouchableOpacity
                style={styles.tourButton}
                onPress={handleShowTour}
              >
                <Lightbulb size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/branding/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
        <Image
          source={require('@/assets/images/branding/truck.png')}
          style={styles.headerTruck}
          resizeMode="contain"
        />
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
            {loadingActivity ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280' }}>Cargando...</Text>
              </View>
            ) : recentRequests.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  No hay actividad reciente
                </Text>
              </View>
            ) : (
              recentRequests.map(item => {
                const contacto =
                  user?.rol === 'customer'
                    ? item.agente
                      ? `${item.agente.nombre} ${item.agente.apellido_paterno}`
                      : 'Sin asignar'
                    : item.usuario
                      ? `${item.usuario.nombre} ${item.usuario.apellido_paterno}`
                      : 'Desconocido';
                return (
                  <View key={item.id} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      {getStatusIcon(item.estatus)}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{item.titulo}</Text>
                      <Text style={styles.activityAgent}>
                        {user?.rol === 'customer' ? 'Agente: ' : 'Cliente: '}
                        {contacto}
                      </Text>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityStatus}>
                          {getStatusText(item.estatus)}
                        </Text>
                        <Text style={styles.activityTime}>
                          hace {getRelativeTime(item.updated_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
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

        {/* Tour Button */}
        {!tourCompleted && (
          <TouchableOpacity
            style={styles.floatingTourButton}
            onPress={handleShowTour}
          >
            <Lightbulb size={24} color="#ffffff" />
            <Text style={styles.floatingTourText}>Ver Guía</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* App Tour Guide */}
      <AppTourGuide
        visible={showTour}
        onClose={handleTourComplete}
        onComplete={handleTourComplete}
      />
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  headerTruck: {
    width: '100%',
    height: 120,
    marginTop: 18,
  },
  content: {
    flex: 1,
    padding: 24,
    marginTop: 0,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tourButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingTourButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#202B52',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingTourText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
