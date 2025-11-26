import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Request } from '@/types/supabase';
import {
  ArrowLeft,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  Package,
  Calendar,
  User as UserIcon,
} from 'lucide-react-native';

// Phase 5.1: My Orders Screen
interface RequestWithRelations extends Request {
  usuario?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    empresa: string;
  };
  agente?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
  };
}

export default function MyOrders() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<RequestWithRelations[]>([]);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('requests')
        .select(
          `
          *,
          usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno, empresa),
          agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno)
        `
        )
        .order('created_at', { ascending: false });

      // Filter by user role
      if (user.rol === 'customer') {
        query = query.eq('usuario_id', user.id);
      } else if (user.rol === 'agent') {
        query = query.eq('agente_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFullName = (person: any) => {
    if (!person) return 'N/A';
    return `${person.nombre} ${person.apellido_paterno} ${person.apellido_materno || ''}`.trim();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'nuevo':
        return {
          label: 'Nuevo',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: AlertTriangle,
        };
      case 'asignado':
        return {
          label: 'Asignado',
          color: '#3b82f6',
          bgColor: '#dbeafe',
          icon: Clock,
        };
      case 'en_proceso':
        return {
          label: 'En Proceso',
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          icon: Clock,
        };
      case 'pausado':
        return {
          label: 'Pausado',
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: AlertTriangle,
        };
      case 'resuelto':
        return {
          label: 'Resuelto',
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: CheckCircle,
        };
      case 'cerrado':
        return {
          label: 'Cerrado',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: CheckCircle,
        };
      default:
        return {
          label: 'Desconocido',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: AlertTriangle,
        };
    }
  };

  const getTypeLabel = (tipo: number) => {
    switch (tipo) {
      case 1:
        return 'Ventas';
      case 2:
        return 'Soporte';
      case 3:
        return 'Cotizacion';
      case 4:
        return 'Rastreo';
      default:
        return 'General';
    }
  };

  // Calculate summary stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o =>
      ['nuevo', 'asignado', 'en_proceso'].includes(o.estatus)
    ).length,
    completed: orders.filter(o =>
      ['resuelto', 'cerrado'].includes(o.estatus)
    ).length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Pedidos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#202B52" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPending]}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCompleted]}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tienes pedidos</Text>
            <Text style={styles.emptySubtitle}>
              Crea una nueva solicitud para empezar
            </Text>
            <TouchableOpacity
              style={styles.newOrderButton}
              onPress={() => router.push('/(tabs)/requests')}
            >
              <Text style={styles.newOrderButtonText}>Nueva Solicitud</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map(order => {
            const statusInfo = getStatusInfo(order.estatus);
            const StatusIcon = statusInfo.icon;

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push('/(tabs)/requests')}
              >
                <View style={styles.orderHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.bgColor },
                    ]}
                  >
                    <StatusIcon size={14} color={statusInfo.color} />
                    <Text
                      style={[styles.statusText, { color: statusInfo.color }]}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{getTypeLabel(order.tipo)}</Text>
                  </View>
                </View>

                <Text style={styles.orderTitle} numberOfLines={2}>
                  {order.titulo}
                </Text>

                <Text style={styles.orderMessage} numberOfLines={2}>
                  {order.mensaje}
                </Text>

                <View style={styles.orderFooter}>
                  <View style={styles.orderMeta}>
                    <Calendar size={14} color="#9ca3af" />
                    <Text style={styles.orderDate}>
                      {formatDate(order.created_at)}
                    </Text>
                  </View>

                  {user?.rol === 'customer' && order.agente ? (
                    <View style={styles.orderMeta}>
                      <UserIcon size={14} color="#9ca3af" />
                      <Text style={styles.orderAgent}>
                        {getFullName(order.agente)}
                      </Text>
                    </View>
                  ) : !order.agente_id ? (
                    <View style={styles.orderMeta}>
                      <AlertTriangle size={14} color="#f59e0b" />
                      <Text style={styles.noAgentText}>Sin asignar</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardPending: {
    backgroundColor: '#fffbeb',
  },
  statCardCompleted: {
    backgroundColor: '#ecfdf5',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#202B52',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
  },
  orderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  orderMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  orderAgent: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  noAgentText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#f59e0b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  newOrderButton: {
    backgroundColor: '#202B52',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newOrderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
