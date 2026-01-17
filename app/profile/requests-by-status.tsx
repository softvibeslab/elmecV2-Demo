import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  FileText,
} from 'lucide-react-native';

interface RequestWithRelations extends Request {
  usuario?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
  };
  agente?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
  };
}

interface StatusGroup {
  status: string;
  label: string;
  color: string;
  icon: any;
  count: number;
  requests: RequestWithRelations[];
}

export default function RequestsByStatus() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('requests')
        .select(
          `
          *,
          usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno),
          agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno)
        `
        )
        .order('created_at', { ascending: false });

      // Filtrar según el rol del usuario
      if (user.rol === 'customer') {
        query = query.eq('usuario_id', user.id);
      } else if (user.rol === 'agent') {
        query = query.eq('agente_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading requests:', error);
        return;
      }

      // Agrupar por estatus
      const groups: StatusGroup[] = [
        {
          status: 'nuevo',
          label: 'Nuevos',
          color: '#f59e0b',
          icon: AlertTriangle,
          count: 0,
          requests: [],
        },
        {
          status: 'asignado',
          label: 'Asignados',
          color: '#3b82f6',
          icon: Clock,
          count: 0,
          requests: [],
        },
        {
          status: 'en_proceso',
          label: 'En Proceso',
          color: '#8b5cf6',
          icon: Clock,
          count: 0,
          requests: [],
        },
        {
          status: 'pausado',
          label: 'Pausados',
          color: '#ef4444',
          icon: AlertTriangle,
          count: 0,
          requests: [],
        },
        {
          status: 'resuelto',
          label: 'Resueltos',
          color: '#10b981',
          icon: CheckCircle,
          count: 0,
          requests: [],
        },
        {
          status: 'cerrado',
          label: 'Cerrados',
          color: '#6b7280',
          icon: CheckCircle,
          count: 0,
          requests: [],
        },
      ];

      // Contar y agrupar solicitudes
      (data || []).forEach((request: RequestWithRelations) => {
        const group = groups.find(g => g.status === request.estatus);
        if (group) {
          group.count++;
          group.requests.push(request);
        }
      });

      setStatusGroups(groups);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getFullName = (person: any) => {
    if (!person) return 'N/A';
    return [person.nombre, person.apellido_paterno, person.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim() || 'N/A';
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
          <Text style={styles.headerTitle}>Solicitudes por Estatus</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#202B52" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
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
        <Text style={styles.headerTitle}>Solicitudes por Estatus</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {statusGroups.map(group => (
          <View key={group.status} style={styles.statusGroup}>
            <TouchableOpacity
              style={styles.statusHeader}
              onPress={() =>
                setExpandedStatus(
                  expandedStatus === group.status ? null : group.status
                )
              }
            >
              <View style={styles.statusHeaderLeft}>
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: `${group.color}20` },
                  ]}
                >
                  <group.icon size={20} color={group.color} />
                </View>
                <View>
                  <Text style={styles.statusLabel}>{group.label}</Text>
                  <Text style={styles.statusCount}>
                    {group.count} solicitud{group.count !== 1 ? 'es' : ''}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: group.color }]}
              >
                <Text style={styles.statusBadgeText}>{group.count}</Text>
              </View>
            </TouchableOpacity>

            {expandedStatus === group.status && (
              <View style={styles.requestsList}>
                {group.requests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <FileText size={32} color="#d1d5db" />
                    <Text style={styles.emptyText}>
                      No hay solicitudes con este estatus
                    </Text>
                  </View>
                ) : (
                  group.requests.map(request => (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestTitle} numberOfLines={1}>
                          {request.titulo}
                        </Text>
                        <Text style={styles.requestDate}>
                          {formatDate(request.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.requestMessage} numberOfLines={2}>
                        {request.mensaje}
                      </Text>
                      <View style={styles.requestFooter}>
                        {user?.rol !== 'customer' && request.usuario && (
                          <Text style={styles.requestInfo}>
                            Cliente: {getFullName(request.usuario)}
                          </Text>
                        )}
                        {user?.rol === 'customer' && request.agente && (
                          <Text style={styles.requestInfo}>
                            Agente: {getFullName(request.agente)}
                          </Text>
                        )}
                        {!request.agente_id && (
                          <Text style={styles.noAgentText}>Sin agente</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))}

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
  content: {
    flex: 1,
    padding: 16,
  },
  statusGroup: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  requestsList: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  requestCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  requestTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  requestDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  requestMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  requestFooter: {
    gap: 4,
  },
  requestInfo: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  noAgentText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#f59e0b',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});
