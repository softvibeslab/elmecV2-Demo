import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase, supabaseClient } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { ChatRoom, Message, User, ChatRoomMember } from '@/types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Constantes para reintentos y reconexión
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

export interface ChatMessage extends Message {
  user?: User;
  isDelivered?: boolean;
  isRead?: boolean;
  localId?: string; // Para optimistic updates
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  retryCount?: number;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

// Cola de mensajes pendientes para garantía de entrega
interface PendingMessage {
  id: string;
  roomId: string;
  message: string;
  type: Message['type'];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  audioDuration?: number;
  replyTo?: string;
  retryCount: number;
  createdAt: number;
}

interface ChatContextType {
  chatRooms: ChatRoom[];
  messages: { [roomId: string]: ChatMessage[] };
  typingUsers: { [roomId: string]: TypingUser[] };
  onlineUsers: string[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  // Mensajes
  sendMessage: (
    roomId: string,
    message: string,
    messageType?: Message['type'],
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    audioDuration?: number,
    replyTo?: string
  ) => Promise<void>;
  sendTypingIndicator: (roomId: string, isTyping: boolean) => void;
  markMessagesAsRead: (roomId: string) => Promise<void>;
  loadMoreMessages: (roomId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newMessage: string) => Promise<void>;
  retryFailedMessage: (localId: string) => Promise<void>;
  // Chat rooms (1:1)
  createChatRoom: (
    participantId: string,
    participantName: string,
    requestId?: string,
    metadata?: Record<string, any>
  ) => Promise<string>;
  getChatRoom: (roomId: string) => ChatRoom | undefined;
  // Chat grupal
  createGroupChat: (
    name: string,
    participantIds: string[],
    description?: string,
    metadata?: { area?: string; isInternal?: boolean; zona?: string }
  ) => Promise<string>;
  addGroupParticipants: (
    roomId: string,
    participantIds: string[]
  ) => Promise<void>;
  removeGroupParticipant: (
    roomId: string,
    participantId: string
  ) => Promise<void>;
  leaveGroup: (roomId: string) => Promise<void>;
  updateGroupInfo: (
    roomId: string,
    updates: { name?: string; description?: string; avatarUrl?: string }
  ) => Promise<void>;
  promoteToAdmin: (roomId: string, userId: string) => Promise<void>;
  getGroupMembers: (roomId: string) => Promise<ChatRoomMember[]>;
  isGroupAdmin: (roomId: string) => boolean;
  // Utilidades
  getUnreadCount: () => number;
  getRoomUnreadCount: (roomId: string) => number;
  isUserOnline: (userId: string) => boolean;
  getMessageDeliveryStatus: (
    messageId: string
  ) => 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  // Estado
  loading: boolean;
  error: string | null;
  pendingMessagesCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: ChatMessage[] }>(
    {}
  );
  const [typingUsers, setTypingUsers] = useState<{
    [roomId: string]: TypingUser[];
  }>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannels, setRealtimeChannels] = useState<{
    [roomId: string]: RealtimeChannel;
  }>({});
  const [presenceChannel, setPresenceChannel] =
    useState<RealtimeChannel | null>(null);

  // Nuevos estados para garantía de entrega
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('disconnected');
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const messageQueue = useRef<PendingMessage[]>([]);
  const isProcessingQueue = useRef(false);

  const { user, session } = useAuth();
  const { sendDemoNotification } = useNotifications();

  // Generar ID único para mensajes del cliente (para deduplicación)
  const generateClientMessageId = useCallback(() => {
    return `${user?.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, [user?.id]);

  // Reconexión con exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY_MS
    );

    console.log(
      `🔄 Reconectando en ${delay}ms (intento ${reconnectAttempts.current + 1})`
    );

    reconnectTimer.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      setConnectionStatus('connecting');
      loadChatRooms();
    }, delay);
  }, []);

  // Procesar cola de mensajes pendientes
  const processMessageQueue = useCallback(async () => {
    if (
      isProcessingQueue.current ||
      messageQueue.current.length === 0 ||
      connectionStatus !== 'connected'
    ) {
      return;
    }

    isProcessingQueue.current = true;

    while (messageQueue.current.length > 0) {
      const pendingMsg = messageQueue.current[0];

      if (pendingMsg.retryCount >= MAX_RETRY_ATTEMPTS) {
        // Marcar como fallido
        setMessages(prev => ({
          ...prev,
          [pendingMsg.roomId]:
            prev[pendingMsg.roomId]?.map(msg =>
              msg.localId === pendingMsg.id
                ? { ...msg, deliveryStatus: 'failed' as const }
                : msg
            ) || [],
        }));
        messageQueue.current.shift();
        continue;
      }

      try {
        const { data, error } = await supabaseClient
          .from('messages')
          .insert({
            chat_room_id: pendingMsg.roomId,
            sender_id: user?.id,
            sender_name: `${user?.nombre} ${user?.apellido_paterno}`,
            message: pendingMsg.message,
            type: pendingMsg.type,
            file_url: pendingMsg.fileUrl,
            file_name: pendingMsg.fileName,
            file_size: pendingMsg.fileSize,
            audio_duration: pendingMsg.audioDuration,
            reply_to: pendingMsg.replyTo,
            client_message_id: pendingMsg.id,
            status: 'sent',
            is_deleted: false,
          })
          .select()
          .single();

        if (error) throw error;

        // Actualizar mensaje local con ID real
        setMessages(prev => ({
          ...prev,
          [pendingMsg.roomId]:
            prev[pendingMsg.roomId]?.map(msg =>
              msg.localId === pendingMsg.id
                ? {
                    ...msg,
                    ...data,
                    deliveryStatus: 'sent' as const,
                    id: data.id,
                  }
                : msg
            ) || [],
        }));

        messageQueue.current.shift();
      } catch (err) {
        console.error('Error enviando mensaje:', err);
        pendingMsg.retryCount += 1;
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_DELAY_MS * pendingMsg.retryCount)
        );
      }
    }

    isProcessingQueue.current = false;
    setPendingMessages([...messageQueue.current]);
  }, [connectionStatus, user]);

  // Efecto para procesar cola cuando cambia el estado de conexión
  useEffect(() => {
    if (connectionStatus === 'connected') {
      processMessageQueue();
    }
  }, [connectionStatus, processMessageQueue]);

  useEffect(() => {
    if (session?.user) {
      loadChatRooms();
      setupChatRoomsSubscription();
      setupPresence();
      updateLastSeen(); // Initial update
    }

    return () => {
      // Cleanup realtime subscriptions
      Object.values(realtimeChannels).forEach(channel => {
        supabase.removeChannel(channel);
      });

      // Cleanup presence
      if (presenceChannel) {
        presenceChannel.untrack();
        supabase.removeChannel(presenceChannel);
      }

      // Update last_seen when unmounting
      if (user) {
        updateLastSeen();
      }
    };
  }, [session]);

  // Update last_seen periodically while app is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateLastSeen();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user]);

  // Handle app state changes (background/foreground) for presence reconnection
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      console.log('App state changed:', previousState, '->', nextAppState);

      // App came to foreground from background
      if (
        (previousState === 'background' || previousState === 'inactive') &&
        nextAppState === 'active'
      ) {
        console.log('App returned to foreground - reconnecting presence');
        // Re-establish presence tracking
        setupPresence();
        updateLastSeen();
      }

      // App went to background
      if (
        previousState === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        console.log('App went to background');
        updateLastSeen();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [user, setupPresence, updateLastSeen]);

  const loadChatRooms = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          requests!chat_rooms_request_id_fkey(titulo, estatus, metadata)
        `
        )
        .contains('participants', [session.user.id])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading chat rooms:', error);
        setError(`Error al cargar los chats: ${error.message}`);
        setLoading(false);
        return;
      }

      setChatRooms(data || []);

      // Load messages for each room (limit to prevent infinite loading)
      const roomPromises = (data || []).slice(0, 10).map(async (room: any) => {
        try {
          await loadRoomMessages(room.id);
          // Only setup realtime if we have a valid, non-expired session
          if (session?.access_token && session?.expires_at) {
            const expiresAt = new Date(session.expires_at * 1000);
            const now = new Date();
            if (expiresAt > now) {
              setupRealtimeSubscription(room.id);
            } else {
              console.warn(
                'Session expired, skipping realtime setup for room:',
                room.id
              );
            }
          }
        } catch (roomError) {
          console.error(`Error loading room ${room.id}:`, roomError);
        }
      });

      await Promise.allSettled(roomPromises);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setError(
        `Error al cargar los chats: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRoomMessages = async (roomId: string, limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          user:users(nombre, apellido_paterno, apellido_materno, foto)
        `
        )
        .eq('chat_room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(prev => ({
        ...prev,
        [roomId]: data || [],
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = (roomId: string) => {
    if (realtimeChannels[roomId]) return; // Already subscribed

    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        async payload => {
          const newMessage = payload.new as Message;

          // Get user info for the message
          const { data: userData } = await supabase
            .from('users')
            .select('nombre, apellido_paterno, apellido_materno, foto')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithUser: ChatMessage = {
            ...newMessage,
            user: userData || undefined,
            isDelivered: true,
            isRead: false,
          };

          setMessages(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), messageWithUser],
          }));

          // Send notification if message is from another user
          if (newMessage.sender_id !== user?.id) {
            await sendDemoNotification(
              `💬 ${newMessage.sender_name}`,
              getMessagePreview(newMessage),
              'info',
              { roomId, messageId: newMessage.id }
            );
          }

          // Update chat room's updated_at
          setChatRooms(prev =>
            prev.map(room =>
              room.id === roomId
                ? {
                    ...room,
                    updated_at: newMessage.created_at,
                    last_message: newMessage,
                  }
                : room
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        payload => {
          const updatedMessage = payload.new as Message;

          setMessages(prev => ({
            ...prev,
            [roomId]:
              prev[roomId]?.map(msg =>
                msg.id === updatedMessage.id
                  ? { ...msg, ...updatedMessage }
                  : msg
              ) || [],
          }));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        // Handle presence updates for typing indicators
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
      })
      .subscribe();

    setRealtimeChannels(prev => ({ ...prev, [roomId]: channel }));
  };

  const setupChatRoomsSubscription = () => {
    if (!session?.user) return;

    // Subscribe to chat_rooms table for new rooms
    const chatRoomsChannel = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms',
        },
        async payload => {
          const newRoom = payload.new as ChatRoom;

          // Only add if current user is a participant
          if (newRoom.participants?.includes(session.user.id)) {
            // Load room details with relations
            const { data: roomData } = await supabase
              .from('chat_rooms')
              .select(
                `
                *,
                requests!chat_rooms_request_id_fkey(titulo, estatus)
              `
              )
              .eq('id', newRoom.id)
              .single();

            if (roomData) {
              setChatRooms(prev => [roomData, ...prev]);
              await loadRoomMessages(newRoom.id);
              setupRealtimeSubscription(newRoom.id);

              // Notify user about new chat
              await sendDemoNotification(
                'Nuevo chat',
                'Se ha creado una nueva conversación',
                'info',
                { roomId: newRoom.id }
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
        },
        payload => {
          const updatedRoom = payload.new as ChatRoom;

          // Update room in state
          setChatRooms(prev =>
            prev.map(room =>
              room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
            )
          );
        }
      )
      .subscribe();

    setRealtimeChannels(prev => ({
      ...prev,
      chat_rooms_global: chatRoomsChannel,
    }));
  };

  const getMessagePreview = (message: Message): string => {
    switch (message.type) {
      case 'image':
        return '📷 Imagen';
      case 'audio':
        return '🎵 Audio';
      case 'file':
        return `📎 ${message.file_name || 'Archivo'}`;
      case 'system':
        return '🔔 Mensaje del sistema';
      default:
        return message.message.length > 50
          ? message.message.substring(0, 50) + '...'
          : message.message;
    }
  };

  const sendMessage = async (
    roomId: string,
    message: string,
    messageType: Message['type'] = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    audioDuration?: number,
    replyTo?: string
  ) => {
    if (!user || !session) {
      console.error('Cannot send message: user not authenticated');
      throw new Error('Usuario no autenticado');
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      console.error('Cannot send empty message');
      throw new Error('El mensaje no puede estar vacío');
    }

    // Validate room exists
    const room = chatRooms.find(r => r.id === roomId);
    if (!room) {
      console.error('Chat room not found:', roomId);
      throw new Error('Sala de chat no encontrada');
    }

    console.log('Sending message:', {
      roomId,
      messageType,
      length: message.length,
      hasFile: !!fileUrl,
    });

    // Optimistic update - add message immediately to UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      chat_room_id: roomId,
      sender_id: user.id,
      sender_name: `${user.nombre} ${user.apellido_paterno}`,
      message,
      type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      audio_duration: audioDuration,
      reply_to: replyTo,
      is_deleted: false,
      created_at: new Date().toISOString(),
      localId: tempId,
      isDelivered: false,
      isRead: false,
      user: user,
    };

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), optimisticMessage],
    }));

    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          chat_room_id: roomId,
          sender_id: user.id,
          sender_name: `${user.nombre} ${user.apellido_paterno}`,
          message: message.trim(),
          type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          audio_duration: audioDuration,
          reply_to: replyTo,
          is_deleted: false,
        })
        .select(
          `
          *,
          user:users(nombre, apellido_paterno, apellido_materno, foto)
        `
        )
        .single();

      if (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        // Remove optimistic message on error
        setMessages(prev => ({
          ...prev,
          [roomId]: prev[roomId]?.filter(msg => msg.localId !== tempId) || [],
        }));
        throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from message insert');
        setMessages(prev => ({
          ...prev,
          [roomId]: prev[roomId]?.filter(msg => msg.localId !== tempId) || [],
        }));
        throw new Error('No se recibió confirmación del mensaje enviado');
      }

      console.log('Message sent successfully:', data.id);

      // Transición automática a 'en_proceso' cuando inicia una conversación real en chat
      if (room.request_id && messageType !== 'system') {
        // Tipado seguro para el estatus
        const requestInfo = (room as any).requests;
        const currentStatus = requestInfo?.estatus;

        if (currentStatus === 'nuevo' || currentStatus === 'asignado') {
          const previousStatus = currentStatus;
          console.log(
            `🚀 Transición automática: ${previousStatus} -> en_proceso para request ${room.request_id}`
          );

          try {
            const now = new Date().toISOString();
            const { error: updateError } = await supabaseClient
              .from('requests')
              .update({
                estatus: 'en_proceso',
                updated_at: now,
                metadata: {
                  ...(requestInfo?.metadata || {}),
                  status_history: [
                    ...(requestInfo?.metadata?.status_history || []),
                    {
                      from: previousStatus,
                      to: 'en_proceso',
                      timestamp: now,
                      reason: 'Iniciada conversación en chat',
                    },
                  ],
                },
              } as any)
              .eq('id', room.request_id);

            if (updateError) {
              console.error(
                'Error actualizando estatus automáticamente:',
                updateError
              );
            } else {
              // Actualizar el estado local de la sala de chat
              setChatRooms(prev =>
                prev.map(r =>
                  r.id === roomId
                    ? {
                        ...r,
                        requests: {
                          ...(r as any).requests,
                          estatus: 'en_proceso',
                        },
                      }
                    : r
                )
              );
            }
          } catch (updateErr) {
            console.error(
              'Excepción al actualizar estatus automáticamente:',
              updateErr
            );
          }
        }
      }

      // Replace optimistic message with real message
      if (data) {
        setMessages(prev => ({
          ...prev,
          [roomId]:
            prev[roomId]?.map(msg =>
              msg.localId === tempId
                ? {
                    ...(data as any),
                    user: (data as any).user,
                    isDelivered: true,
                    isRead: false,
                  }
                : msg
            ) || [],
        }));
      }

      // Update chat room's last message and timestamp
      try {
        const { error: updateError } = await supabaseClient
          .from('chat_rooms')
          .update({
            last_message: {
              id: data.id,
              message: data.message,
              sender_id: data.sender_id,
              sender_name: data.sender_name,
              created_at: data.created_at,
              type: data.type,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', roomId);

        if (updateError) {
          console.error('Error updating chat room:', updateError);
          // Don't fail if room update fails
        }
      } catch (updateError) {
        console.error('Error updating chat room:', updateError);
        // Don't fail if room update fails
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => ({
        ...prev,
        [roomId]: prev[roomId]?.filter(msg => msg.localId !== tempId) || [],
      }));
      throw error;
    }
  };

  const sendTypingIndicator = useCallback(
    (roomId: string, isTyping: boolean) => {
      if (!user || !realtimeChannels[roomId]) return;

      const channel = realtimeChannels[roomId];

      if (isTyping) {
        channel.track({
          user_id: user.id,
          user_name: `${user.nombre} ${user.apellido_paterno}`,
          typing: true,
          timestamp: Date.now(),
        });
      } else {
        channel.untrack();
      }
    },
    [user, realtimeChannels]
  );

  const createChatRoom = async (
    participantId: string,
    participantName: string,
    requestId?: string,
    metadata?: Record<string, any>
  ): Promise<string> => {
    if (!user || !session) throw new Error('User not authenticated');

    try {
      console.log('Creating/finding chat room:', {
        currentUserId: user.id,
        participantId,
        requestId,
      });

      // Validate participant exists
      const { data: participantDataRaw, error: participantError } =
        await supabase
        .from('users')
        .select('id, nombre, apellido_paterno, apellido_materno, activo')
        .eq('id', participantId)
        .single();
      const participantData = participantDataRaw as
        | Pick<
            User,
            'id' | 'nombre' | 'apellido_paterno' | 'apellido_materno' | 'activo'
          >
        | null;

      if (participantError || !participantData) {
        console.error('Participant not found:', participantError);
        throw new Error(
          'El usuario destinatario no existe o no está disponible'
        );
      }

      if (!participantData.activo) {
        throw new Error('El usuario destinatario no está activo');
      }

      // Check if chat room already exists between these participants
      // Use proper array comparison for PostgreSQL
      const { data: existingRoomsRaw, error: searchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true);
      const existingRooms = (existingRoomsRaw || []) as ChatRoom[];

      if (searchError) {
        console.error('Error searching for existing rooms:', searchError);
      }

      // Filter rooms that contain both participants
      const existingRoom = existingRooms.find(room => {
        const participants = room.participants || [];
        return (
          participants.includes(user.id) &&
          participants.includes(participantId) &&
          participants.length === 2 &&
          (requestId ? room.request_id === requestId : !room.request_id)
        );
      });

      if (existingRoom) {
        console.log('Found existing chat room:', existingRoom.id);
        // Load messages for existing room if not already loaded
        if (!messages[existingRoom.id]) {
          await loadRoomMessages(existingRoom.id);
        }
        setupRealtimeSubscription(existingRoom.id);
        return existingRoom.id;
      }

      console.log('No existing room found, creating new one');

      // Validate request exists if provided
      if (requestId) {
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select('id, titulo, estatus')
          .eq('id', requestId)
          .single();

        if (requestError || !requestData) {
          console.error('Request not found:', requestError);
          throw new Error('La solicitud asociada no existe');
        }
      }

      // Build participant names properly (filter out null/undefined values)
      const currentUserName =
        [user.nombre, user.apellido_paterno, user.apellido_materno]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        user.email ||
        'Usuario';
      const otherUserName =
        participantName ||
        [
          participantData.nombre,
          participantData.apellido_paterno,
          participantData.apellido_materno,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        'Usuario';

      // Create new chat room
      const { data, error } = await supabaseClient
        .from('chat_rooms')
        .insert({
          tipo: requestId ? 'support' : 'general',
          participants: [user.id, participantId],
          request_id: requestId || null,
          is_active: true,
          metadata: {
            participant_names: [currentUserName, otherUserName],
            participant_ids: [user.id, participantId],
            created_by: user.id,
            created_at: new Date().toISOString(),
            ...(metadata || {}),
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat room:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`No se pudo crear el chat: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from chat room creation');
        throw new Error('No se recibió confirmación de la creación del chat');
      }

      console.log('Chat room created successfully:', data.id);

      setChatRooms(prev => [data, ...prev]);
      setMessages(prev => ({ ...prev, [data.id]: [] }));
      setupRealtimeSubscription(data.id);

      // Send welcome message
      try {
        await sendMessage(
          data.id,
          `¡Hola ${otherUserName}! 👋 ¿En qué puedo ayudarte?`,
          'system'
        );
      } catch (msgError) {
        console.error('Error sending welcome message:', msgError);
        // Don't fail if welcome message fails
      }

      return data.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(errorMessage);
    }
  };

  const markMessagesAsRead = async (roomId: string) => {
    if (!session?.user) return;

    try {
      // Update read_by field for unread messages
      const unreadMessages =
        messages[roomId]?.filter(
          msg => msg.sender_id !== user?.id && !msg.isRead
        ) || [];

      if (unreadMessages.length === 0) return;

      const messageIds = unreadMessages.map(msg => msg.id);

      // In a real implementation, you would update the read_by JSONB field
      // For now, we'll update local state
      setMessages(prev => ({
        ...prev,
        [roomId]:
          prev[roomId]?.map(msg =>
            messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          ) || [],
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadMoreMessages = async (roomId: string) => {
    try {
      const currentMessages = messages[roomId] || [];
      const oldestMessage = currentMessages[0];

      if (!oldestMessage) return;

      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          user:users(nombre, apellido_paterno, apellido_materno, foto)
        `
        )
        .eq('chat_room_id', roomId)
        .eq('is_deleted', false)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error loading more messages:', error);
        return;
      }

      if (data && data.length > 0) {
        setMessages(prev => ({
          ...prev,
          [roomId]: [...data, ...currentMessages],
        }));
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabaseClient
        .from('messages')
        .update({
          is_deleted: true,
          message: 'Este mensaje fue eliminado',
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        return;
      }

      // Update local state
      Object.keys(messages).forEach(roomId => {
        setMessages(prev => ({
          ...prev,
          [roomId]:
            prev[roomId]?.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    is_deleted: true,
                    message: 'Este mensaje fue eliminado',
                  }
                : msg
            ) || [],
        }));
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const editMessage = async (messageId: string, newMessage: string) => {
    try {
      const { error } = await supabaseClient
        .from('messages')
        .update({
          message: newMessage,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error editing message:', error);
        return;
      }

      // Update local state
      Object.keys(messages).forEach(roomId => {
        setMessages(prev => ({
          ...prev,
          [roomId]:
            prev[roomId]?.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    message: newMessage,
                    edited_at: new Date().toISOString(),
                  }
                : msg
            ) || [],
        }));
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const getChatRoom = (roomId: string): ChatRoom | undefined => {
    return chatRooms.find(room => room.id === roomId);
  };

  const getUnreadCount = (): number => {
    if (!user) return 0;

    return Object.entries(messages).reduce((total, [roomId, roomMessages]) => {
      // Verificar que el usuario es participante de esta sala
      const room = chatRooms.find(r => r.id === roomId);
      if (!room || !room.participants?.includes(user.id)) {
        // El usuario no es participante de este chat, no contar mensajes
        return total;
      }

      // Contar mensajes no leídos de otros usuarios
      const unreadCount = roomMessages.filter(
        msg => msg.sender_id !== user.id && !msg.isRead
      ).length;

      return total + unreadCount;
    }, 0);
  };

  const getRoomUnreadCount = (roomId: string): number => {
    const roomMessages = messages[roomId] || [];
    return roomMessages.filter(msg => msg.sender_id !== user?.id && !msg.isRead)
      .length;
  };

  const updateLastSeen = useCallback(async () => {
    if (!user) return;

    try {
      await supabaseClient
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last_seen:', error);
    }
  }, [user]);

  const setupPresence = useCallback(() => {
    if (!user) return;

    // Cleanup existing channel before creating new one
    if (presenceChannel) {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    }

    console.log('Setting up presence tracking for user:', user.id);

    const channel = supabase
      .channel('online_users', {
        config: {
          presence: {
            key: user.id, // Use user ID as presence key for easier lookup
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds: string[] = [];

        // Extract all user IDs from presence state
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            if (presence.user_id && !userIds.includes(presence.user_id)) {
              userIds.push(presence.user_id);
            }
          });
        });

        console.log('Presence sync - Online users:', userIds.length);
        setOnlineUsers(prevUsers => {
          // Only update if the list actually changed
          const sortedPrev = [...prevUsers].sort();
          const sortedNew = [...userIds].sort();
          if (JSON.stringify(sortedPrev) !== JSON.stringify(sortedNew)) {
            return userIds;
          }
          return prevUsers;
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        // Immediately add new users to online list
        const newUserIds = newPresences
          .map((p: any) => p.user_id)
          .filter((id: string) => id && id !== user.id);

        if (newUserIds.length > 0) {
          setOnlineUsers(prev => {
            const updated = [...new Set([...prev, ...newUserIds])];
            return updated;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        // Immediately remove users who left
        const leftUserIds = leftPresences
          .map((p: any) => p.user_id)
          .filter(Boolean);

        if (leftUserIds.length > 0) {
          setOnlineUsers(prev => prev.filter(id => !leftUserIds.includes(id)));
        }
      })
      .subscribe(async status => {
        console.log('Presence channel status:', status);
        if (status === 'SUBSCRIBED') {
          // Track current user as online
          const trackResult = await channel.track({
            user_id: user.id,
            user_name: `${user.nombre} ${user.apellido_paterno}`,
            online_at: new Date().toISOString(),
          });
          console.log('User tracked as online:', trackResult);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Presence channel error - attempting reconnect');
          // Retry connection after a short delay
          setTimeout(() => {
            if (user) setupPresence();
          }, 3000);
        }
      });

    setPresenceChannel(channel);
  }, [user]);

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  // ============================================================================
  // FUNCIONES DE CHAT GRUPAL
  // ============================================================================

  // Crear chat grupal
  const createGroupChat = async (
    name: string,
    participantIds: string[],
    description?: string,
    metadata?: { area?: string; isInternal?: boolean; zona?: string }
  ): Promise<string> => {
    // =========================================================================
    // VALIDACIÓN INICIAL
    // =========================================================================
    if (!user) {
      console.error('createGroupChat: user es null');
      throw new Error(
        'Usuario no autenticado. Por favor inicia sesión nuevamente.'
      );
    }

    if (!session) {
      console.error('createGroupChat: session es null');
      throw new Error('Sesión no válida. Por favor inicia sesión nuevamente.');
    }

    // Para chats de área internos, permitir 1 solo participante
    const isInternalChat = metadata?.isInternal === true;
    if (!isInternalChat && participantIds.length < 2) {
      throw new Error(
        'Un grupo necesita al menos 2 participantes además de ti'
      );
    }

    // =========================================================================
    // PREPARAR DATOS - El creador DEBE estar PRIMERO en participants (RLS)
    // =========================================================================
    // Filtrar duplicados y asegurar que el creador está primero
    const uniqueParticipants = [...new Set(participantIds)].filter(
      id => id !== user.id
    );
    const allParticipants = [user.id, ...uniqueParticipants];

    console.log('========================================');
    console.log('🚀 CREANDO GRUPO');
    console.log('========================================');
    console.log('Nombre:', name);
    console.log('Creador ID:', user.id);
    console.log('Total participantes:', allParticipants.length);
    console.log('Participantes:', allParticipants);
    console.log('Es interno:', isInternalChat);
    console.log('Metadata:', metadata);

    try {
      // =========================================================================
      // VERIFICAR SESIÓN ACTIVA
      // =========================================================================
      const { data: currentSession, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error verificando sesión:', sessionError);
        throw new Error(
          'Error de autenticación. Por favor inicia sesión nuevamente.'
        );
      }

      if (!currentSession?.session) {
        console.error('No hay sesión activa');
        throw new Error(
          'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
        );
      }

      const authUserId = currentSession.session.user.id;
      console.log('✅ Sesión verificada. Auth UID:', authUserId);

      // Verificar que el auth UID coincida con user.id
      if (authUserId !== user.id) {
        console.error('Mismatch de IDs:', { authUserId, userId: user.id });
        throw new Error(
          'Error de sincronización de sesión. Por favor cierra sesión e inicia de nuevo.'
        );
      }

      // =========================================================================
      // CONSTRUIR OBJETO PARA INSERT - Solo campos básicos primero
      // =========================================================================
      // Usamos campos mínimos que sabemos existen para evitar errores de schema
      const chatRoomData: Record<string, any> = {
        tipo: 'group',
        participants: allParticipants,
        is_active: true,
        metadata: {
          participant_count: allParticipants.length,
          created_at: new Date().toISOString(),
          zona: metadata?.zona || (user as any).zona || null,
          area: metadata?.area || null,
          isInternal: isInternalChat,
          created_by_name:
            `${user.nombre || ''} ${user.apellido_paterno || ''}`.trim(),
        },
      };

      // Agregar campos opcionales si existen en el schema
      // Estos campos fueron agregados por la migración de grupos
      chatRoomData.name = name || 'Grupo sin nombre';
      chatRoomData.description = description || null;
      chatRoomData.is_group = true;
      chatRoomData.admin_ids = [user.id];
      chatRoomData.created_by = user.id;

      console.log(
        '📦 Datos para INSERT:',
        JSON.stringify(chatRoomData, null, 2)
      );

      // =========================================================================
      // EJECUTAR INSERT
      // =========================================================================
      const { data, error } = await supabaseClient
        .from('chat_rooms')
        .insert(chatRoomData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error en INSERT chat_rooms:');
        console.error('  Código:', error.code);
        console.error('  Mensaje:', error.message);
        console.error('  Detalles:', error.details);
        console.error('  Hint:', error.hint);

        // Manejar errores específicos
        if (error.code === '42501') {
          throw new Error(
            'No tienes permisos para crear grupos. ' +
              'Verifica que tu sesión esté activa y que las políticas de seguridad estén configuradas correctamente.'
          );
        }
        if (error.code === '23503') {
          throw new Error(
            'Error de referencia en la base de datos. ' +
              'Uno de los participantes no existe o hay un problema con tu usuario.'
          );
        }
        if (error.code === '23502') {
          // NOT NULL violation - probablemente falta una columna requerida
          throw new Error(
            `Error de datos: ${error.message}. Contacta al administrador.`
          );
        }
        if (error.code === '42703') {
          // Column does not exist - la migración no se ha ejecutado
          throw new Error(
            'La base de datos necesita una actualización. ' +
              'Contacta al administrador para ejecutar la migración de chat grupal.'
          );
        }

        throw new Error(`Error al crear el grupo: ${error.message}`);
      }

      if (!data) {
        console.error('❌ INSERT exitoso pero no se recibieron datos');
        throw new Error(
          'El grupo se creó pero no se pudo verificar. Intenta refrescar.'
        );
      }

      console.log('✅ Chat room creado exitosamente');
      console.log('  ID:', data.id);
      console.log('  Nombre:', data.name);

      // =========================================================================
      // AGREGAR MIEMBROS A chat_room_members (OPCIONAL - puede fallar)
      // =========================================================================
      try {
        const memberInserts = allParticipants.map(pId => ({
          chat_room_id: data.id,
          user_id: pId,
          role: pId === user.id ? 'admin' : 'member',
          added_by: user.id,
        }));

        const { error: membersError } = await supabaseClient
          .from('chat_room_members')
          .insert(memberInserts);

        if (membersError) {
          // No es crítico - el grupo ya fue creado
          console.warn(
            '⚠️ Error agregando a chat_room_members:',
            membersError.message
          );
        } else {
          console.log('✅ Miembros agregados a chat_room_members');
        }
      } catch (membersErr) {
        console.warn('⚠️ Error en chat_room_members (no crítico):', membersErr);
      }

      // =========================================================================
      // ACTUALIZAR ESTADO LOCAL
      // =========================================================================
      const newRoom: ChatRoom = {
        ...data,
        is_group: true,
        admin_ids: [user.id],
      } as ChatRoom;

      setChatRooms(prev => [newRoom, ...prev]);
      setMessages(prev => ({ ...prev, [data.id]: [] }));
      setupRealtimeSubscription(data.id);

      // =========================================================================
      // ENVIAR MENSAJE DE BIENVENIDA (OPCIONAL)
      // =========================================================================
      try {
        await sendMessage(data.id, `🎉 Grupo "${name}" creado`, 'system');
        console.log('✅ Mensaje de bienvenida enviado');
      } catch (msgError) {
        console.warn(
          '⚠️ Error enviando mensaje de bienvenida (no crítico):',
          msgError
        );
      }

      console.log('========================================');
      console.log('✅ GRUPO CREADO EXITOSAMENTE:', data.id);
      console.log('========================================');

      return data.id;
    } catch (error: any) {
      console.error('========================================');
      console.error('❌ ERROR CREANDO GRUPO');
      console.error('========================================');
      console.error('Tipo:', error?.constructor?.name);
      console.error('Mensaje:', error?.message);
      console.error('Stack:', error?.stack);

      // Re-lanzar errores ya formateados
      if (error.message && error.message.includes('Error')) {
        throw error;
      }

      // Error genérico
      throw new Error(
        'No se pudo crear el grupo. ' +
          'Verifica tu conexión a internet e intenta nuevamente.'
      );
    }
  };

  // Agregar participantes al grupo
  const addGroupParticipants = async (
    roomId: string,
    participantIds: string[]
  ): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.is_group) {
      throw new Error('Esta acción solo es válida para grupos');
    }

    if (!room.admin_ids?.includes(user.id)) {
      throw new Error('Solo los administradores pueden agregar participantes');
    }

    // REGLA DE NEGOCIO: Validar que los nuevos participantes sean de la misma zona
    const groupZona = room.metadata?.zona;
    if (groupZona) {
      // Verificar zona de los nuevos participantes
      const { data: usersData } = await supabaseClient
        .from('users')
        .select('id, zona')
        .in('id', participantIds);

      const invalidZoneUsers =
        usersData?.filter(u => u.zona !== groupZona) || [];
      if (invalidZoneUsers.length > 0) {
        throw new Error(
          `Solo puedes agregar usuarios de la zona ${groupZona}. ${invalidZoneUsers.length} usuario(s) son de otra zona.`
        );
      }
    }

    try {
      // Filtrar participantes que ya están en el grupo
      const currentParticipants = room.participants || [];
      const newParticipants = participantIds.filter(
        id => !currentParticipants.includes(id)
      );

      if (newParticipants.length === 0) {
        throw new Error(
          'Todos los usuarios seleccionados ya están en el grupo'
        );
      }

      // Actualizar chat_rooms
      const { error } = await supabaseClient
        .from('chat_rooms')
        .update({
          participants: [...currentParticipants, ...newParticipants],
          metadata: {
            ...room.metadata,
            participant_count:
              currentParticipants.length + newParticipants.length,
          },
        })
        .eq('id', roomId);

      if (error) throw error;

      // Agregar a chat_room_members
      const memberInserts = newParticipants.map(pId => ({
        chat_room_id: roomId,
        user_id: pId,
        role: 'member',
        added_by: user.id,
      }));

      await supabaseClient.from('chat_room_members').insert(memberInserts);

      // Actualizar estado local
      setChatRooms(prev =>
        prev.map(r =>
          r.id === roomId
            ? {
                ...r,
                participants: [...currentParticipants, ...newParticipants],
              }
            : r
        )
      );

      // Mensaje de sistema
      await sendMessage(
        roomId,
        `👥 ${user.nombre} agregó ${newParticipants.length} participante(s) al grupo`,
        'system'
      );
    } catch (error) {
      console.error('Error agregando participantes:', error);
      throw error;
    }
  };

  // Remover participante del grupo
  const removeGroupParticipant = async (
    roomId: string,
    participantId: string
  ): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.is_group) {
      throw new Error('Esta acción solo es válida para grupos');
    }

    if (!room.admin_ids?.includes(user.id)) {
      throw new Error('Solo los administradores pueden remover participantes');
    }

    try {
      const newParticipants = room.participants.filter(
        id => id !== participantId
      );
      const newAdmins =
        room.admin_ids?.filter(id => id !== participantId) || [];

      const { error } = await supabaseClient
        .from('chat_rooms')
        .update({
          participants: newParticipants,
          admin_ids: newAdmins,
          metadata: {
            ...room.metadata,
            participant_count: newParticipants.length,
          },
        })
        .eq('id', roomId);

      if (error) throw error;

      // Eliminar de chat_room_members
      await supabaseClient
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('user_id', participantId);

      // Actualizar estado local
      setChatRooms(prev =>
        prev.map(r =>
          r.id === roomId
            ? { ...r, participants: newParticipants, admin_ids: newAdmins }
            : r
        )
      );

      await sendMessage(
        roomId,
        `👤 Un participante fue removido del grupo`,
        'system'
      );
    } catch (error) {
      console.error('Error removiendo participante:', error);
      throw error;
    }
  };

  // Salir del grupo
  const leaveGroup = async (roomId: string): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.is_group) {
      throw new Error('Esta acción solo es válida para grupos');
    }

    try {
      const newParticipants = room.participants.filter(id => id !== user.id);
      let newAdmins = room.admin_ids?.filter(id => id !== user.id) || [];

      // Si no quedan admins, promover al primer miembro
      if (newAdmins.length === 0 && newParticipants.length > 0) {
        newAdmins = [newParticipants[0]];
        await supabaseClient
          .from('chat_room_members')
          .update({ role: 'admin' })
          .eq('chat_room_id', roomId)
          .eq('user_id', newParticipants[0]);
      }

      const { error } = await supabaseClient
        .from('chat_rooms')
        .update({
          participants: newParticipants,
          admin_ids: newAdmins,
          metadata: {
            ...room.metadata,
            participant_count: newParticipants.length,
          },
        })
        .eq('id', roomId);

      if (error) throw error;

      await supabaseClient
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('user_id', user.id);

      // Enviar mensaje antes de salir
      await sendMessage(roomId, `👋 ${user.nombre} salió del grupo`, 'system');

      // Remover de estado local
      setChatRooms(prev => prev.filter(r => r.id !== roomId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[roomId];
        return newMessages;
      });
    } catch (error) {
      console.error('Error saliendo del grupo:', error);
      throw error;
    }
  };

  // Actualizar información del grupo
  const updateGroupInfo = async (
    roomId: string,
    updates: { name?: string; description?: string; avatarUrl?: string }
  ): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.is_group) {
      throw new Error('Esta acción solo es válida para grupos');
    }

    if (!room.admin_ids?.includes(user.id)) {
      throw new Error('Solo los administradores pueden editar el grupo');
    }

    try {
      const { error } = await supabaseClient
        .from('chat_rooms')
        .update({
          name: updates.name ?? room.name,
          description: updates.description ?? room.description,
          avatar_url: updates.avatarUrl ?? room.avatar_url,
        })
        .eq('id', roomId);

      if (error) throw error;

      setChatRooms(prev =>
        prev.map(r =>
          r.id === roomId
            ? {
                ...r,
                name: updates.name ?? r.name,
                description: updates.description ?? r.description,
                avatar_url: updates.avatarUrl ?? r.avatar_url,
              }
            : r
        )
      );

      if (updates.name) {
        await sendMessage(
          roomId,
          `✏️ ${user.nombre} cambió el nombre del grupo a "${updates.name}"`,
          'system'
        );
      }
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      throw error;
    }
  };

  // Promover a administrador
  const promoteToAdmin = async (
    roomId: string,
    userId: string
  ): Promise<void> => {
    if (!user) throw new Error('Usuario no autenticado');

    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.is_group) {
      throw new Error('Esta acción solo es válida para grupos');
    }

    if (!room.admin_ids?.includes(user.id)) {
      throw new Error('Solo los administradores pueden promover usuarios');
    }

    try {
      const newAdmins = [...(room.admin_ids || []), userId];

      const { error } = await supabaseClient
        .from('chat_rooms')
        .update({ admin_ids: newAdmins })
        .eq('id', roomId);

      if (error) throw error;

      await supabaseClient
        .from('chat_room_members')
        .update({ role: 'admin' })
        .eq('chat_room_id', roomId)
        .eq('user_id', userId);

      setChatRooms(prev =>
        prev.map(r => (r.id === roomId ? { ...r, admin_ids: newAdmins } : r))
      );

      await sendMessage(
        roomId,
        `⭐ Un usuario fue promovido a administrador`,
        'system'
      );
    } catch (error) {
      console.error('Error promoviendo admin:', error);
      throw error;
    }
  };

  // Obtener miembros del grupo
  const getGroupMembers = async (roomId: string): Promise<ChatRoomMember[]> => {
    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(
          `
          *,
          user:users(id, nombre, apellido_paterno, apellido_materno, foto, is_online)
        `
        )
        .eq('chat_room_id', roomId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo miembros:', error);
      return [];
    }
  };

  // Verificar si es admin del grupo
  const isGroupAdmin = useCallback(
    (roomId: string): boolean => {
      if (!user) return false;
      const room = chatRooms.find(r => r.id === roomId);
      return room?.admin_ids?.includes(user.id) || false;
    },
    [chatRooms, user]
  );

  // Obtener estado de entrega de mensaje
  const getMessageDeliveryStatus = useCallback(
    (
      messageId: string
    ): 'pending' | 'sent' | 'delivered' | 'read' | 'failed' => {
      for (const roomMessages of Object.values(messages)) {
        const msg = roomMessages.find(
          m => m.id === messageId || m.localId === messageId
        );
        if (msg) {
          return msg.deliveryStatus || msg.status || 'sent';
        }
      }
      return 'sent';
    },
    [messages]
  );

  // Reintentar mensaje fallido
  const retryFailedMessage = async (localId: string): Promise<void> => {
    // Encontrar el mensaje fallido
    let foundMessage: ChatMessage | null = null;
    let foundRoomId: string | null = null;

    for (const [roomId, roomMessages] of Object.entries(messages)) {
      const msg = roomMessages.find(
        m => m.localId === localId && m.deliveryStatus === 'failed'
      );
      if (msg) {
        foundMessage = msg;
        foundRoomId = roomId;
        break;
      }
    }

    if (!foundMessage || !foundRoomId) {
      throw new Error('Mensaje no encontrado');
    }

    // Marcar como pendiente
    setMessages(prev => ({
      ...prev,
      [foundRoomId!]:
        prev[foundRoomId!]?.map(msg =>
          msg.localId === localId
            ? { ...msg, deliveryStatus: 'pending' as const, retryCount: 0 }
            : msg
        ) || [],
    }));

    // Agregar a cola de reintentos
    messageQueue.current.push({
      id: localId,
      roomId: foundRoomId,
      message: foundMessage.message,
      type: foundMessage.type,
      fileUrl: foundMessage.file_url,
      fileName: foundMessage.file_name,
      fileSize: foundMessage.file_size,
      audioDuration: foundMessage.audio_duration,
      replyTo: foundMessage.reply_to,
      retryCount: 0,
      createdAt: Date.now(),
    });

    processMessageQueue();
  };

  return (
    <ChatContext.Provider
      value={{
        chatRooms,
        messages,
        typingUsers,
        onlineUsers,
        connectionStatus,
        // Mensajes
        sendMessage,
        sendTypingIndicator,
        markMessagesAsRead,
        loadMoreMessages,
        deleteMessage,
        editMessage,
        retryFailedMessage,
        // Chat rooms
        createChatRoom,
        getChatRoom,
        // Chat grupal
        createGroupChat,
        addGroupParticipants,
        removeGroupParticipant,
        leaveGroup,
        updateGroupInfo,
        promoteToAdmin,
        getGroupMembers,
        isGroupAdmin,
        // Utilidades
        getUnreadCount,
        getRoomUnreadCount,
        isUserOnline,
        getMessageDeliveryStatus,
        // Estado
        loading,
        error,
        pendingMessagesCount: pendingMessages.length,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
