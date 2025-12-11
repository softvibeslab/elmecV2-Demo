import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Search,
  UserPlus,
  Check,
  Users,
  MapPin,
  Building2,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  rol: string;
  zona?: string;
  categoria?: string;
  empresa?: string;
}

interface AddZoneMembersProps {
  visible: boolean;
  onClose: () => void;
  chatRoomId: string;
  currentParticipants: string[];
  zona?: string;
  requestTitle?: string;
  onMembersAdded: (newRoomId?: string) => void;
}

export default function AddZoneMembers({
  visible,
  onClose,
  chatRoomId,
  currentParticipants,
  zona,
  requestTitle,
  onMembersAdded,
}: AddZoneMembersProps) {
  const { user } = useAuth();
  const { createGroupChat, sendMessage } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoneUsers, setZoneUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [showAllUsers, setShowAllUsers] = useState(false);

  // Cargar usuarios (de la zona o todos)
  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible, zona, showAllUsers]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('id, nombre, apellido_paterno, apellido_materno, rol, zona, categoria, empresa')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      // Si hay zona y no se quiere mostrar todos, filtrar por zona
      if (zona && !showAllUsers) {
        query = query.eq('zona', zona);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      // Filtrar usuarios que ya están en el chat
      const availableUsers = (data || []).filter(
        (u: User) => !currentParticipants.includes(u.id) && u.id !== user?.id
      );

      setZoneUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getFullName = (user: User) => {
    return `${user.nombre} ${user.apellido_paterno}${user.apellido_materno ? ' ' + user.apellido_materno : ''}`;
  };

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'agent': return 'Agente';
      case 'customer': return 'Cliente';
      default: return rol;
    }
  };

  const filteredUsers = zoneUsers.filter(u => {
    if (!searchQuery) return true;
    const fullName = getFullName(u).toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      u.empresa?.toLowerCase().includes(query) ||
      u.categoria?.toLowerCase().includes(query)
    );
  });

  const confirmAndAddMembers = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Selecciona usuarios', 'Debes seleccionar al menos un usuario para agregar');
      return;
    }

    const selectedUserData = zoneUsers.filter(u => selectedUsers.includes(u.id));
    const selectedNames = selectedUserData.map(u => getFullName(u)).join('\n• ');

    Alert.alert(
      '¿Crear grupo?',
      `Se agregará${selectedUsers.length > 1 ? 'n' : ''} ${selectedUsers.length} persona${selectedUsers.length > 1 ? 's' : ''} al chat:\n\n• ${selectedNames}\n\nEl chat se convertirá en un grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Crear grupo', style: 'default', onPress: handleAddMembers },
      ]
    );
  };

  const handleAddMembers = async () => {
    setSaving(true);
    try {
      // Obtener nombres de los usuarios seleccionados
      const selectedUserData = zoneUsers.filter(u => selectedUsers.includes(u.id));
      const selectedNames = selectedUserData.map(u => getFullName(u));

      // Obtener datos actuales del chat
      const { data: currentRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', chatRoomId)
        .single();

      if (roomError || !currentRoom) {
        console.error('Error fetching room:', roomError);
        throw new Error('No se pudo obtener información del chat');
      }

      // Verificar si ya es un grupo o si es un chat 1:1
      const isAlreadyGroup = currentRoom.is_group === true;

      // Crear el nombre del grupo basado en la solicitud o genérico
      const groupName = requestTitle
        ? `📋 ${requestTitle.substring(0, 30)}${requestTitle.length > 30 ? '...' : ''}`
        : zona
          ? `Grupo - ${zona}`
          : `Grupo - ${new Date().toLocaleDateString('es-MX')}`;

      // Obtener participantes actuales (asegurar que sea array)
      const existingParticipants = Array.isArray(currentRoom.participants)
        ? currentRoom.participants
        : currentParticipants;

      // Filtrar usuarios que ya están en el chat
      const newUsersToAdd = selectedUsers.filter(id => !existingParticipants.includes(id));

      if (newUsersToAdd.length === 0) {
        Alert.alert('Info', 'Los usuarios seleccionados ya están en el chat');
        setSaving(false);
        return;
      }

      // Nuevos participantes = actuales + seleccionados
      const allParticipants = [...existingParticipants, ...newUsersToAdd];

      // Preparar admin_ids
      const adminIds = Array.isArray(currentRoom.admin_ids) && currentRoom.admin_ids.length > 0
        ? currentRoom.admin_ids
        : [user?.id].filter(Boolean);

      // Actualizar el chat existente para convertirlo en grupo (o actualizar grupo existente)
      const updateData: Record<string, unknown> = {
        is_group: true,
        participants: allParticipants,
        updated_at: new Date().toISOString(),
      };

      // Solo agregar nombre si no es ya un grupo (no sobrescribir nombre existente)
      if (!isAlreadyGroup) {
        updateData.name = groupName;
        updateData.admin_ids = adminIds;
        updateData.metadata = {
          ...currentRoom.metadata,
          zona: zona || currentRoom.metadata?.zona,
          converted_to_group: true,
          converted_at: new Date().toISOString(),
          original_participants: existingParticipants,
        };
      } else {
        // Para grupos existentes, solo actualizar metadata parcialmente
        updateData.metadata = {
          ...currentRoom.metadata,
          participant_count: allParticipants.length,
          last_member_added: new Date().toISOString(),
        };
      }

      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update(updateData)
        .eq('id', chatRoomId);

      if (updateError) {
        console.error('Error updating chat room:', updateError);
        throw new Error(`Error al actualizar chat: ${updateError.message}`);
      }

      // Intentar agregar registros a chat_room_members (puede no existir la tabla)
      try {
        const memberInserts = newUsersToAdd.map(userId => ({
          chat_room_id: chatRoomId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString(),
        }));

        const { error: membersError } = await supabase
          .from('chat_room_members')
          .insert(memberInserts);

        if (membersError) {
          // Log pero no fallar - la tabla puede no existir
          console.warn('Warning: Could not insert into chat_room_members:', membersError.message);
        }
      } catch (membersErr) {
        console.warn('chat_room_members table may not exist:', membersErr);
      }

      // Enviar mensaje de sistema notificando los nuevos miembros
      const addedNamesText = selectedNames.join(', ');
      const systemMessage = isAlreadyGroup
        ? `👥 ${user?.nombre} agregó a ${addedNamesText}`
        : `👥 ${user?.nombre} creó el grupo y agregó a ${addedNamesText}`;

      try {
        await sendMessage(chatRoomId, systemMessage, 'system');
      } catch (msgError) {
        console.warn('Could not send system message:', msgError);
      }

      Alert.alert(
        isAlreadyGroup ? 'Miembros agregados' : 'Grupo creado',
        `Se agregaron ${newUsersToAdd.length} miembro(s) al chat.`,
        [{ text: 'OK' }]
      );

      // Limpiar selección
      setSelectedUsers([]);

      onMembersAdded(chatRoomId);
      onClose();
    } catch (error) {
      console.error('Error adding members:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudieron agregar los miembros: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <UserPlus size={24} color="#1e40af" />
            <View>
              <Text style={styles.title}>Agregar Miembros</Text>
              {!loading && (
                <Text style={styles.headerSubtitle}>
                  {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} disponible{filteredUsers.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Info de zona y toggle */}
        <View style={styles.zoneInfo}>
          <View style={styles.zoneInfoLeft}>
            <MapPin size={16} color="#6b7280" />
            <Text style={styles.zoneText}>
              {zona && !showAllUsers
                ? <>Usuarios de zona: <Text style={styles.zoneName}>{zona}</Text></>
                : 'Todos los usuarios del directorio'
              }
            </Text>
          </View>
          {zona && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowAllUsers(!showAllUsers)}
            >
              <Text style={styles.toggleButtonText}>
                {showAllUsers ? 'Solo zona' : 'Ver todos'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, empresa..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Usuarios seleccionados */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedTitle}>
              {selectedUsers.length} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedUsers.map(userId => {
                const selectedUser = zoneUsers.find(u => u.id === userId);
                if (!selectedUser) return null;
                return (
                  <TouchableOpacity
                    key={userId}
                    style={styles.selectedChip}
                    onPress={() => toggleUserSelection(userId)}
                  >
                    <Text style={styles.selectedChipText}>
                      {selectedUser.nombre}
                    </Text>
                    <X size={14} color="#1e40af" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Lista de usuarios */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>
              {showAllUsers ? 'Cargando directorio...' : 'Cargando usuarios de la zona...'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.userList}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No hay usuarios disponibles</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'No se encontraron usuarios con ese criterio'
                    : showAllUsers
                      ? 'Todos los usuarios ya están en el chat'
                      : zona
                        ? 'No hay más usuarios en esta zona para agregar'
                        : 'No hay usuarios disponibles para agregar'}
                </Text>
                {!showAllUsers && zona && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setShowAllUsers(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Ver todos los usuarios</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredUsers.map(zoneUser => {
                const isSelected = selectedUsers.includes(zoneUser.id);
                return (
                  <TouchableOpacity
                    key={zoneUser.id}
                    style={[styles.userItem, isSelected && styles.userItemSelected]}
                    onPress={() => toggleUserSelection(zoneUser.id)}
                  >
                    <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                      <Text style={styles.avatarText}>
                        {zoneUser.nombre[0]}{zoneUser.apellido_paterno[0]}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{getFullName(zoneUser)}</Text>
                      <View style={styles.userMeta}>
                        <Text style={styles.userRole}>{getRoleLabel(zoneUser.rol)}</Text>
                        {zoneUser.empresa && (
                          <>
                            <Text style={styles.metaSeparator}>•</Text>
                            <Building2 size={12} color="#9ca3af" />
                            <Text style={styles.userCompany}>{zoneUser.empresa}</Text>
                          </>
                        )}
                      </View>
                      <View style={styles.userMetaSecond}>
                        {zoneUser.categoria && (
                          <Text style={styles.userCategory}>{zoneUser.categoria}</Text>
                        )}
                        {showAllUsers && zoneUser.zona && (
                          <View style={styles.userZonaBadge}>
                            <MapPin size={10} color="#6b7280" />
                            <Text style={styles.userZonaText}>{zoneUser.zona}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={16} color="#ffffff" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Botón de agregar */}
        {selectedUsers.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addButton, saving && styles.addButtonDisabled]}
              onPress={confirmAndAddMembers}
              disabled={saving}
            >
              {saving ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.addButtonText}>Creando grupo...</Text>
                </>
              ) : (
                <>
                  <Users size={20} color="#ffffff" />
                  <Text style={styles.addButtonText}>
                    Agregar {selectedUsers.length} y crear grupo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  zoneInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  zoneText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  zoneName: {
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
  },
  toggleButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    margin: 20,
    marginBottom: 0,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  selectedSection: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedTitle: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  userList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyStateButton: {
    marginTop: 16,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  userItemSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: '#1e40af',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  userCompany: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  userMetaSecond: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  userCategory: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  userZonaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  userZonaText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
