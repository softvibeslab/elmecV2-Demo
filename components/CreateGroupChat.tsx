import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { X, Users, Check, Search, Camera, UserPlus, MapPin, AlertTriangle } from 'lucide-react-native';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/supabase';

interface CreateGroupChatProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (roomId: string) => void;
}

export default function CreateGroupChat({
  visible,
  onClose,
  onGroupCreated,
}: CreateGroupChatProps) {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userZona, setUserZona] = useState<string | null>(null);

  const { createGroupChat } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      loadCurrentUserZona();
      // Reset state
      setStep('select');
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      setSearchQuery('');
    }
  }, [visible]);

  // Primero cargar la zona del usuario actual
  const loadCurrentUserZona = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('zona')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      const userData = data as { zona: string } | null;
      setUserZona(userData?.zona || null);

      // Luego cargar usuarios de la misma zona
      if (userData?.zona) {
        loadUsers(userData.zona);
      } else {
        setLoadingUsers(false);
        Alert.alert(
          'Sin zona asignada',
          'Tu usuario no tiene una zona asignada. Contacta al administrador para poder crear grupos.'
        );
      }
    } catch (error) {
      console.error('Error loading user zona:', error);
      setLoadingUsers(false);
    }
  };

  // REGLA DE NEGOCIO: Solo cargar usuarios de la MISMA zona
  const loadUsers = async (zona: string) => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, nombre, apellido_paterno, apellido_materno, foto, rol, is_online, empresa, zona'
        )
        .eq('activo', true)
        .ilike('zona', zona.trim()) // OBLIGATORIO: misma zona (case insensitive)
        .eq('rol', 'agent') // Solo mostrar agentes
        .neq('id', user?.id)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getFullName = (u: User) => {
    return [u.nombre, u.apellido_paterno, u.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim();
  };

  const filteredUsers = users.filter(u => {
    const fullName = getFullName(u).toLowerCase();
    const search = searchQuery.toLowerCase();
    return (
      fullName.includes(search) || u.empresa?.toLowerCase().includes(search)
    );
  });

  const toggleUserSelection = (selectedUser: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      }
      return [...prev, selectedUser];
    });
  };

  const handleNext = () => {
    if (selectedUsers.length < 2) {
      alert('Selecciona al menos 2 participantes');
      return;
    }
    setStep('details');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Ingresa un nombre para el grupo');
      return;
    }

    if (selectedUsers.length < 2) {
      alert('Selecciona al menos 2 participantes');
      return;
    }

    if (!userZona) {
      Alert.alert('Error', 'No tienes una zona asignada. No puedes crear grupos.');
      return;
    }

    setLoading(true);
    try {
      const participantIds = selectedUsers.map(u => u.id);
      const roomId = await createGroupChat(
        groupName.trim(),
        participantIds,
        groupDescription.trim() || undefined,
        { zona: userZona } // Incluir zona en metadata
      );

      onGroupCreated(roomId);
      onClose();
    } catch (error: any) {
      console.error('Error creating group:', error);
      const errorMessage = error?.message || 'Error desconocido';
      Alert.alert('Error al crear el grupo', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (u: User) => {
    return `${u.nombre?.[0] || ''}${u.apellido_paterno?.[0] || ''}`.toUpperCase();
  };

  const renderUserItem = (u: User) => {
    const isSelected = selectedUsers.some(s => s.id === u.id);
    const fullName = getFullName(u);

    return (
      <TouchableOpacity
        key={u.id}
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(u)}
      >
        <View style={styles.userAvatarContainer}>
          {u.foto ? (
            <Image source={{ uri: u.foto }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>{getUserInitials(u)}</Text>
            </View>
          )}
          {u.is_online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userRole}>{u.empresa || u.rol}</Text>
        </View>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color="#ffffff" />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedUsers = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.selectedUsersScroll}
      contentContainerStyle={styles.selectedUsersContainer}
    >
      {selectedUsers.map(u => (
        <TouchableOpacity
          key={u.id}
          style={styles.selectedUserChip}
          onPress={() => toggleUserSelection(u)}
        >
          <View style={styles.chipAvatar}>
            <Text style={styles.chipAvatarText}>{getUserInitials(u)}</Text>
          </View>
          <Text style={styles.chipName} numberOfLines={1}>
            {u.nombre}
          </Text>
          <X size={14} color="#6b7280" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={step === 'details' ? () => setStep('select') : onClose}
          >
            <X size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {step === 'select' ? 'Nuevo Grupo' : 'Detalles del Grupo'}
          </Text>
          <TouchableOpacity
            style={[
              styles.actionButton,
              step === 'select' &&
              selectedUsers.length < 2 &&
              styles.actionButtonDisabled,
            ]}
            onPress={step === 'select' ? handleNext : handleCreateGroup}
            disabled={
              loading || (step === 'select' && selectedUsers.length < 2)
            }
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {step === 'select' ? 'Siguiente' : 'Crear'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {step === 'select' ? (
          <>
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedCount}>
                  {selectedUsers.length} seleccionado
                  {selectedUsers.length !== 1 ? 's' : ''}
                </Text>
                {renderSelectedUsers()}
              </View>
            )}

            {/* Indicador de zona - REGLA DE NEGOCIO */}
            <View style={styles.zonaIndicator}>
              <MapPin size={16} color="#1e40af" />
              <Text style={styles.zonaIndicatorText}>
                {userZona ? (
                  <>Solo usuarios de zona: <Text style={styles.zonaName}>{userZona}</Text></>
                ) : (
                  <Text style={styles.zonaWarning}>⚠️ Sin zona asignada</Text>
                )}
              </Text>
              <View style={styles.zonaLockBadge}>
                <Text style={styles.zonaLockText}>🔒</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar contactos de tu zona..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* User list */}
            <ScrollView
              style={styles.userList}
              showsVerticalScrollIndicator={false}
            >
              {!userZona ? (
                <View style={styles.emptyContainer}>
                  <AlertTriangle size={48} color="#f59e0b" />
                  <Text style={styles.emptyText}>
                    No tienes zona asignada
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Contacta al administrador para que te asigne una zona
                  </Text>
                </View>
              ) : loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1e40af" />
                  <Text style={styles.loadingText}>Cargando contactos de tu zona...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Users size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>
                    No hay más contactos en tu zona
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Solo puedes agregar personas de la zona {userZona}
                  </Text>
                </View>
              ) : (
                filteredUsers.map(renderUserItem)
              )}
            </ScrollView>
          </>
        ) : (
          <ScrollView
            style={styles.detailsContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Group avatar */}
            <TouchableOpacity style={styles.groupAvatarContainer}>
              <View style={styles.groupAvatar}>
                <Camera size={32} color="#6b7280" />
              </View>
              <Text style={styles.groupAvatarHint}>Agregar foto de grupo</Text>
            </TouchableOpacity>

            {/* Group name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del grupo *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Equipo de Ventas"
                placeholderTextColor="#9ca3af"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
              />
            </View>

            {/* Group description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripcion (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe el proposito del grupo..."
                placeholderTextColor="#9ca3af"
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Participants preview */}
            <View style={styles.participantsPreview}>
              <Text style={styles.participantsTitle}>
                <UserPlus size={16} color="#1e40af" /> Participantes (
                {selectedUsers.length + 1})
              </Text>
              <View style={styles.participantsList}>
                {/* Current user as admin */}
                <View style={styles.participantItem}>
                  <View style={[styles.participantAvatar, styles.adminAvatar]}>
                    <Text style={styles.participantAvatarText}>Tu</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>Tu (Admin)</Text>
                  </View>
                </View>
                {/* Selected users */}
                {selectedUsers.map(u => (
                  <View key={u.id} style={styles.participantItem}>
                    <View style={styles.participantAvatar}>
                      <Text style={styles.participantAvatarText}>
                        {getUserInitials(u)}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {getFullName(u)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
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
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  actionButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  zonaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  zonaIndicatorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#1e40af',
  },
  zonaName: {
    fontFamily: 'Inter-Bold',
    color: '#1e40af',
  },
  zonaWarning: {
    fontFamily: 'Inter-Medium',
    color: '#f59e0b',
  },
  zonaLockBadge: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zonaLockText: {
    fontSize: 12,
  },
  selectedSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedUsersScroll: {
    maxHeight: 60,
  },
  selectedUsersContainer: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  chipName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1e40af',
    maxWidth: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  userList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  userItemSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  userAvatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 2,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  groupAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarHint: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  participantsPreview: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  participantsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
    marginBottom: 12,
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatar: {
    backgroundColor: '#1e40af',
  },
  participantAvatarText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
});
