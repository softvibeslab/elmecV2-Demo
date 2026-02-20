import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  MessageCircle,
  Clock,
  Users,
  Plus,
  UsersRound,
  Wifi,
  WifiOff,
  Building2,
} from 'lucide-react-native';
import { ChatRoom } from '@/types/supabase';
import CreateGroupChat from '@/components/CreateGroupChat';
import InternalChats from '@/components/InternalChats';

// Tipo extendido para ChatRoom con información de request
interface ChatRoomWithRequest extends ChatRoom {
  requests?: {
    titulo: string;
    estatus: string;
  };
}

export default function ChatList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInternalChats, setShowInternalChats] = useState(false);
  const {
    chatRooms,
    messages,
    loading,
    error,
    getRoomUnreadCount,
    isUserOnline,
    connectionStatus,
    onlineUsers,
  } = useChat();
  const { user } = useAuth();
  const router = useRouter();

  // Solo agentes y admins pueden ver chats internos
  const canSeeInternalChats = user?.rol === 'agent' || user?.rol === 'admin';

  // Separar chats grupales de 1:1
  const groupChats = chatRooms.filter(room => room.is_group);
  const directChats = chatRooms.filter(room => !room.is_group);

  const handleGroupCreated = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  const handleInternalChatSelected = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  // Log online users for debugging (can be removed in production)
  useEffect(() => {
    console.log(
      'Chat list - Online users updated:',
      onlineUsers?.length || 0,
      onlineUsers
    );
  }, [onlineUsers]);

  const getOtherParticipantName = (room: any) => {
    if (!room.metadata?.participant_names || !user) return 'Chat';

    const currentUserName = [user.nombre, user.apellido_paterno]
      .filter(Boolean)
      .join(' ');
    return (
      room.metadata.participant_names.find(
        (name: string) => name !== currentUserName
      ) || 'Chat'
    );
  };

  const getOtherParticipantId = (room: any): string | null => {
    if (!room.participants || !user) return null;

    return room.participants.find((id: string) => id !== user.id) || null;
  };

  const getOtherParticipantInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Deduplicate rooms by ID before filtering (defensive against duplicate text bug)
  const uniqueRooms = useMemo(() => {
    const seen = new Set<string>();
    return chatRooms.filter(room => {
      if (seen.has(room.id)) return false;
      seen.add(room.id);
      return true;
    });
  }, [chatRooms]);

  const filteredRooms = uniqueRooms.filter(room => {
    if (room.is_group) {
      return room.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const otherParticipant = getOtherParticipantName(room);
    return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Obtener nombre para mostrar en la lista
  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.is_group) {
      return room.name || 'Grupo';
    }
    return getOtherParticipantName(room);
  };

  // Obtener iniciales para el avatar
  const getRoomInitials = (room: ChatRoom) => {
    if (room.is_group) {
      return room.name?.substring(0, 2).toUpperCase() || 'GR';
    }
    return getOtherParticipantInitials(getOtherParticipantName(room));
  };

  // Obtener participantes del grupo
  const getGroupParticipantCount = (room: ChatRoom) => {
    return room.participants?.length || 0;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Ahora' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getLastMessagePreview = (room: any) => {
    if (room.last_message) {
      const lastMsg = room.last_message;
      switch (lastMsg.type) {
        case 'image':
          return '📷 Imagen';
        case 'audio':
          return '🎵 Audio';
        case 'file':
          return '📎 Archivo';
        case 'system':
          return '🔔 Mensaje del sistema';
        default:
          return lastMsg.message.length > 40
            ? lastMsg.message.substring(0, 40) + '...'
            : lastMsg.message;
      }
    }

    const roomMessages = messages[room.id] || [];
    const lastMessage = roomMessages[roomMessages.length - 1];

    if (!lastMessage) return 'No hay mensajes';

    switch (lastMessage.type) {
      case 'image':
        return '📷 Imagen';
      case 'audio':
        return '🎵 Audio';
      case 'file':
        return '📎 Archivo';
      case 'system':
        return '🔔 Mensaje del sistema';
      default:
        return lastMessage.message.length > 40
          ? lastMessage.message.substring(0, 40) + '...'
          : lastMessage.message;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, you would reload chat rooms here
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Cargando...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Error al cargar</Text>
        </View>
        <View style={styles.errorContainer}>
          <MessageCircle size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal para crear grupo */}
      <CreateGroupChat
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Modal para chats internos (solo agentes/admin) */}
      {canSeeInternalChats && (
        <InternalChats
          visible={showInternalChats}
          onClose={() => setShowInternalChats(false)}
          onChatSelected={handleInternalChatSelected}
        />
      )}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Chats</Text>
              {/* Indicador de conexion */}
              <View
                style={[
                  styles.connectionIndicator,
                  connectionStatus === 'connected' &&
                  styles.connectionConnected,
                  connectionStatus === 'connecting' &&
                  styles.connectionConnecting,
                  connectionStatus === 'disconnected' &&
                  styles.connectionDisconnected,
                ]}
              >
                {connectionStatus === 'connected' ? (
                  <Wifi size={12} color="#10b981" />
                ) : connectionStatus === 'connecting' ? (
                  <ActivityIndicator size="small" color="#f59e0b" />
                ) : (
                  <WifiOff size={12} color="#ef4444" />
                )}
              </View>
            </View>
            <Text style={styles.subtitle}>
              {chatRooms.length} conversacion
              {chatRooms.length !== 1 ? 'es' : ''}
              {groupChats.length > 0 &&
                ` (${groupChats.length} grupo${groupChats.length !== 1 ? 's' : ''})`}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Boton chats internos (solo agentes/admin) */}
            {canSeeInternalChats && (
              <TouchableOpacity
                style={styles.internalChatsButton}
                onPress={() => setShowInternalChats(true)}
              >
                <Building2 size={20} color="#1e40af" />
              </TouchableOpacity>
            )}
            {/* Boton crear grupo */}
            <TouchableOpacity
              style={styles.createGroupButton}
              onPress={() => setShowCreateGroup(true)}
            >
              <UsersRound size={20} color="#1e40af" />
            </TouchableOpacity>
            {/* Boton nuevo chat */}
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => router.push('/directory')}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRooms.map(room => {
          const displayName = getRoomDisplayName(room);
          const initials = getRoomInitials(room);
          const lastMessagePreview = getLastMessagePreview(room);
          const unreadCount = getRoomUnreadCount(room.id);
          const lastMessageTime =
            room.last_message?.created_at || room.updated_at;
          const isGroup = room.is_group;

          return (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.chatItem,
                unreadCount > 0 && styles.chatItemUnread,
              ]}
              onPress={() => router.push(`/chat/${room.id}`)}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, isGroup && styles.groupAvatar]}>
                  {isGroup ? (
                    <UsersRound size={24} color="#ffffff" />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                </View>
                {!isGroup &&
                  (() => {
                    const otherUserId = getOtherParticipantId(room);
                    // Use onlineUsers directly to ensure reactivity when array changes
                    const online = otherUserId
                      ? onlineUsers.includes(otherUserId)
                      : false;
                    return (
                      <View
                        style={[
                          styles.onlineIndicator,
                          {
                            backgroundColor: online ? '#10b981' : '#6b7280',
                          },
                        ]}
                      />
                    );
                  })()}
                {isGroup && (
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>
                      {getGroupParticipantCount(room)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <View style={styles.nameContainer}>
                    <Text
                      style={[
                        styles.participantName,
                        unreadCount > 0 && styles.participantNameUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                    {isGroup && (
                      <View style={styles.groupTag}>
                        <Text style={styles.groupTagText}>Grupo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.timestamp}>
                    {formatTime(lastMessageTime)}
                  </Text>
                </View>

                <View style={styles.messagePreview}>
                  <Text
                    style={[
                      styles.lastMessage,
                      unreadCount > 0 && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {lastMessagePreview}
                  </Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Request info if linked */}
                {room.request_id && (room as ChatRoomWithRequest).requests && (
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle} numberOfLines={1}>
                      📋 {(room as ChatRoomWithRequest).requests!.titulo}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredRooms.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {chatRooms.length === 0
                ? 'No hay conversaciones'
                : 'No se encontraron chats'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No se encontraron conversaciones con ese nombre'
                : 'Inicia una conversación desde el directorio'}
            </Text>
            <TouchableOpacity
              style={styles.startChatButton}
              onPress={() => router.push('/directory')}
            >
              <Users size={20} color="#ffffff" />
              <Text style={styles.startChatButtonText}>Ver Directorio</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 24,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  connectionIndicator: {
    padding: 4,
    borderRadius: 12,
  },
  connectionConnected: {
    backgroundColor: '#d1fae5',
  },
  connectionConnecting: {
    backgroundColor: '#fef3c7',
  },
  connectionDisconnected: {
    backgroundColor: '#fee2e2',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  internalChatsButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  createGroupButton: {
    width: 40,
    height: 40,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  newChatButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1e40af',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chatItem: {
    flexDirection: 'row',
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
  chatItemUnread: {
    backgroundColor: '#fefce8',
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  groupAvatar: {
    backgroundColor: '#7c3aed',
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e40af',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  groupBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupTagText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#7c3aed',
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flexShrink: 1,
  },
  participantNameUnread: {
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    flex: 1,
  },
  unreadMessage: {
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  unreadBadge: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  requestInfo: {
    marginTop: 4,
  },
  requestTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startChatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
