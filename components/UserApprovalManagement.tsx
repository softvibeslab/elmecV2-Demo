import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase, supabaseClient } from '@/lib/supabase';
import { User } from '@/types/supabase';
import { Check, X, Clock, User as UserIcon, Building2 } from 'lucide-react-native';

export const UserApprovalManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [selectedZone, setSelectedZone] = useState<string>('Todas');

  const zones = ['Todas', 'Norte', 'Sur', 'Centro', 'Este', 'Oeste'];

  useEffect(() => {
    loadUsers();
  }, [filter, selectedZone]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('*')
        .eq('status_aprobacion', filter);

      if (selectedZone !== 'Todas') {
        query = query.eq('zona', selectedZone);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, newStatus: 'aprobado' | 'rechazado') => {
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ 
          status_aprobacion: newStatus,
          activo: newStatus === 'aprobado'
        } as any)
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Éxito', `Usuario ${newStatus === 'aprobado' ? 'aprobado' : 'rechazado'} con éxito.`);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating status:', error.message);
      Alert.alert('Error', 'No se pudo actualizar el estado del usuario.');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <UserIcon size={24} color="#335686" />
        </View>
        <View style={styles.details}>
          <Text style={styles.userName}>{item.nombre} {item.apellido_paterno}</Text>
          <Text style={styles.userEmail}>{item.correo_electronico}</Text>
          <View style={styles.companyContainer}>
            <Building2 size={14} color="#6b7280" />
            <Text style={styles.userCompany}>{item.empresa}</Text>
          </View>
        </View>
      </View>
      
      {filter === 'pendiente' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]} 
            onPress={() => handleApproval(item.id, 'aprobado')}
          >
            <Check size={20} color="#ffffff" />
            <Text style={styles.btnText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.rejectBtn]} 
            onPress={() => handleApproval(item.id, 'rechazado')}
          >
            <X size={20} color="#ffffff" />
            <Text style={styles.btnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['pendiente', 'aprobado', 'rechazado'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.activeFilter]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.zoneFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneScrollContent}>
          {zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[
                styles.zoneChip,
                selectedZone === zone && styles.activeZoneChip
              ]}
              onPress={() => setSelectedZone(zone)}
            >
              <MapPin size={12} color={selectedZone === zone ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.zoneText, selectedZone === zone && styles.activeZoneText]}>
                {zone}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#335686" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay usuarios con este estado.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f3f4f6',
  },
  activeFilter: {
    backgroundColor: '#335686',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  zoneFilterContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  zoneScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeZoneChip: {
    backgroundColor: '#335686',
    borderColor: '#335686',
  },
  zoneText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeZoneText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userCompany: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#9ca3af',
    fontSize: 16,
  },
});
