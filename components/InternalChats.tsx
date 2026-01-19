import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Building2,
  DollarSign,
  Headphones,
  FileText,
  X,
  Plus,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { supabase, supabaseClient } from '@/lib/supabase';

// Áreas predefinidas para chats internos
const INTERNAL_AREAS = [
  {
    id: 'ventas',
    name: 'VENTAS',
    icon: DollarSign,
    color: '#10b981',
    description: 'Chat del equipo de ventas',
  },
  {
    id: 'cotizacion',
    name: 'COTIZACIÓN',
    icon: FileText,
    color: '#f59e0b',
    description: 'Chat del equipo de cotizaciones',
  },
  {
    id: 'soporte',
    name: 'SOPORTE',
    icon: Headphones,
    color: '#3b82f6',
    description: 'Chat del equipo de soporte técnico',
  },
];

interface InternalChatsProps {
  visible: boolean;
  onClose: () => void;
  onChatSelected: (roomId: string) => void;
}

interface AreaChatRoom {
  id: string;
  name: string;
  area: string;
  participantCount: number;
  lastActivity?: string;
}

export default function InternalChats({
  visible,
  onClose,
  onChatSelected,
}: InternalChatsProps) {
  const { user } = useAuth();
  const { createGroupChat, chatRooms } = useChat();
  const [loading, setLoading] = useState(false);
  const [areaChats, setAreaChats] = useState<
    Record<string, AreaChatRoom | null>
  >({});
  const [joiningArea, setJoiningArea] = useState<string | null>(null);

  // Cargar chats internos existentes
  useEffect(() => {
    if (visible && user) {
      loadInternalChats();
    }
  }, [visible, user]);

  const loadInternalChats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar grupos internos por área
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_group', true)
        .in('metadata->>area', ['ventas', 'cotizacion', 'soporte']);

      if (error) {
        console.error('Error loading internal chats:', error);
        return;
      }

      // Organizar por área
      const chatsByArea: Record<string, AreaChatRoom | null> = {};
      INTERNAL_AREAS.forEach(area => {
        const areaChat = data?.find(
          (room: any) => room.metadata?.area === area.id
        );
        if (areaChat) {
          chatsByArea[area.id] = {
            id: areaChat.id,
            name: areaChat.name,
            area: area.id,
            participantCount: areaChat.participants?.length || 0,
            lastActivity: areaChat.updated_at,
          };
        } else {
          chatsByArea[area.id] = null;
        }
      });

      setAreaChats(chatsByArea);
    } catch (error) {
      console.error('Error loading internal chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrCreateAreaChat = async (areaId: string) => {
    if (!user) return;

    const area = INTERNAL_AREAS.find(a => a.id === areaId);
    if (!area) return;

    setJoiningArea(areaId);

    try {
      // Verificar si ya existe el chat del área
      const existingChat = areaChats[areaId];

      if (existingChat) {
        // Verificar si el usuario ya es participante
        const { data: roomData } = await supabase
          .from('chat_rooms')
          .select('participants')
          .eq('id', existingChat.id)
          .single();

        if (roomData?.participants?.includes(user.id)) {
          // Ya es miembro, abrir el chat
          onChatSelected(existingChat.id);
          onClose();
        } else {
          // Agregar al usuario al grupo existente
          const updatedParticipants = [
            ...(roomData?.participants || []),
            user.id,
          ];
          const { error: updateError } = await supabaseClient
            .from('chat_rooms')
            .update({
              participants: updatedParticipants,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', existingChat.id);

          if (updateError) {
            console.error('Error joining area chat:', updateError);
            Alert.alert('Error', 'No se pudo unir al chat del área');
          } else {
            onChatSelected(existingChat.id);
            onClose();
          }
        }
      } else {
        // Crear nuevo chat de área
        const roomId = await createGroupChat(
          area.name,
          [user.id], // Solo el creador inicialmente
          area.description, // Descripción del área
          { area: areaId, isInternal: true }
        );

        if (roomId) {
          // Actualizar el registro local
          setAreaChats(prev => ({
            ...prev,
            [areaId]: {
              id: roomId,
              name: area.name,
              area: areaId,
              participantCount: 1,
            },
          }));

          onChatSelected(roomId);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error handling area chat:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar el chat del área');
    } finally {
      setJoiningArea(null);
    }
  };

  const isUserInAreaChat = (areaId: string): boolean => {
    const areaChat = areaChats[areaId];
    if (!areaChat || !user) return false;

    // Buscar en los chatRooms locales si el usuario está en el chat
    const localRoom = chatRooms.find(room => room.id === areaChat.id);
    return localRoom?.participants?.includes(user.id) || false;
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
            <Building2 size={24} color="#1e40af" />
            <Text style={styles.title}>Chats Internos</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>
          Selecciona un área para unirte a la conversación del equipo
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>Cargando chats internos...</Text>
          </View>
        ) : (
          <ScrollView style={styles.areaList}>
            {INTERNAL_AREAS.map(area => {
              const Icon = area.icon;
              const areaChat = areaChats[area.id];
              const isJoining = joiningArea === area.id;
              const isInChat = isUserInAreaChat(area.id);

              return (
                <TouchableOpacity
                  key={area.id}
                  style={[styles.areaCard, isInChat && styles.areaCardJoined]}
                  onPress={() => handleJoinOrCreateAreaChat(area.id)}
                  disabled={isJoining}
                >
                  <View
                    style={[
                      styles.areaIconContainer,
                      { backgroundColor: `${area.color}20` },
                    ]}
                  >
                    <Icon size={28} color={area.color} />
                  </View>

                  <View style={styles.areaInfo}>
                    <Text style={styles.areaName}>{area.name}</Text>
                    <Text style={styles.areaDescription}>
                      {area.description}
                    </Text>
                    {areaChat && (
                      <View style={styles.participantInfo}>
                        <Users size={12} color="#6b7280" />
                        <Text style={styles.participantCount}>
                          {areaChat.participantCount} miembro
                          {areaChat.participantCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.areaAction}>
                    {isJoining ? (
                      <ActivityIndicator size="small" color="#1e40af" />
                    ) : isInChat ? (
                      <View style={styles.joinedBadge}>
                        <Text style={styles.joinedText}>Unido</Text>
                      </View>
                    ) : areaChat ? (
                      <View style={styles.joinButton}>
                        <Plus size={16} color="#1e40af" />
                        <Text style={styles.joinText}>Unirse</Text>
                      </View>
                    ) : (
                      <View style={styles.createButton}>
                        <Plus size={16} color="#ffffff" />
                        <Text style={styles.createText}>Crear</Text>
                      </View>
                    )}
                    <ChevronRight size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  areaList: {
    flex: 1,
    padding: 20,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  areaCardJoined: {
    borderColor: '#1e40af',
    backgroundColor: '#eff6ff',
  },
  areaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaInfo: {
    flex: 1,
    marginLeft: 16,
  },
  areaName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  areaDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  areaAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  joinText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  joinedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinedText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#16a34a',
  },
});
