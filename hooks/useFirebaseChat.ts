/**
 * useFirebaseChat Hook
 *
 * React hook for Firebase group chat functionality.
 * Manages real-time subscriptions and state.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  firebaseChatService,
  FirebaseGroup,
  FirebaseGroupMessage,
} from '@/services/firebaseChatService';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useAuth } from '@/contexts/AuthContext';

interface UseFirebaseChatOptions {
  groupId: string;
  messageLimit?: number;
}

interface UseFirebaseChatReturn {
  // State
  group: FirebaseGroup | null;
  messages: FirebaseGroupMessage[];
  typingUsers: { id: string; name: string }[];
  loading: boolean;
  error: string | null;

  // Actions
  sendMessage: (
    message: string,
    type?: 'text' | 'image' | 'file' | 'audio',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    audioDuration?: number,
    replyTo?: string
  ) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<boolean>;
  setTyping: (isTyping: boolean) => void;
  loadMoreMessages: () => Promise<void>;
  refreshGroup: () => Promise<void>;
}

export function useFirebaseChat({
  groupId,
  messageLimit = 50,
}: UseFirebaseChatOptions): UseFirebaseChatReturn {
  const { user } = useAuth();

  const [group, setGroup] = useState<FirebaseGroup | null>(null);
  const [messages, setMessages] = useState<FirebaseGroupMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<{
    messages?: () => void;
    group?: () => void;
    typing?: () => void;
    presence?: () => void;
  }>({});

  const messageIdsRef = useRef<Set<string>>(new Set());

  // Load initial data
  useEffect(() => {
    if (!groupId || !user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load group info
        const groupData = await firebaseChatService.getGroup(groupId);
        if (!groupData) {
          setError('Grupo no encontrado');
          return;
        }
        setGroup(groupData);

        // Load initial messages
        const initialMessages = await firebaseChatService.getMessages(
          groupId,
          messageLimit
        );
        setMessages(initialMessages);
        initialMessages.forEach(m => messageIdsRef.current.add(m.id));

        // Set user presence
        await firebaseChatService.setPresence(groupId, user.id, true);
      } catch (err: any) {
        console.error('[useFirebaseChat] Error loading data:', err);
        setError(err.message || 'Error al cargar el grupo');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Cleanup presence on unmount
    return () => {
      if (user) {
        firebaseChatService.setPresence(groupId, user.id, false);
      }
    };
  }, [groupId, user?.id]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!groupId || !user) return;

    // Subscribe to new messages
    unsubscribeRef.current.messages = firebaseChatService.subscribeToMessages(
      groupId,
      (newMessage: FirebaseGroupMessage) => {
        // Avoid duplicates
        if (!messageIdsRef.current.has(newMessage.id)) {
          messageIdsRef.current.add(newMessage.id);
          setMessages(prev => [...prev, newMessage]);

          // Send push notification if message is from another user
          if (newMessage.senderId !== user.id && newMessage.type !== 'system') {
            // Check for mentions
            if (newMessage.mentions?.includes(user.id)) {
              pushNotificationService.sendMentionNotification(
                user.id,
                newMessage.senderName,
                group?.name || 'Grupo',
                newMessage.message.substring(0, 50),
                groupId,
                newMessage.id
              );
            }
          }
        }
      },
      (updatedMessage: FirebaseGroupMessage) => {
        setMessages(prev =>
          prev.map(m => (m.id === updatedMessage.id ? updatedMessage : m))
        );
      }
    );

    // Subscribe to group updates
    unsubscribeRef.current.group = firebaseChatService.subscribeToGroup(
      groupId,
      (updatedGroup: FirebaseGroup) => {
        setGroup(updatedGroup);
      }
    );

    // Subscribe to typing indicators
    unsubscribeRef.current.typing = firebaseChatService.subscribeToTyping(
      groupId,
      users => {
        // Filter out current user
        setTypingUsers(users.filter(u => u.id !== user.id));
      }
    );

    // Cleanup subscriptions
    return () => {
      Object.values(unsubscribeRef.current).forEach(unsub => unsub?.());
      unsubscribeRef.current = {};
    };
  }, [groupId, user?.id, group?.name]);

  // Send message
  const sendMessage = useCallback(
    async (
      message: string,
      type: 'text' | 'image' | 'file' | 'audio' = 'text',
      fileUrl?: string,
      fileName?: string,
      fileSize?: number,
      audioDuration?: number,
      replyTo?: string
    ) => {
      if (!user || !group) {
        throw new Error('Usuario o grupo no disponible');
      }

      // Parse mentions
      const mentions = firebaseChatService.parseMentions(
        message,
        group.participantNames
      );

      await firebaseChatService.sendMessage(groupId, {
        senderId: user.id,
        senderName: `${user.nombre} ${user.apellido_paterno}`,
        senderPhoto: user.foto || undefined,
        message,
        type,
        fileUrl,
        fileName,
        fileSize,
        audioDuration,
        replyTo,
        mentions,
      });

      // Send push notifications to group (except sender)
      if (type === 'text') {
        await pushNotificationService.sendToGroup(
          groupId,
          group.participants,
          user.id,
          {
            title: `${group.name}`,
            body: `${user.nombre}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            data: {
              type: 'group_message',
              groupId,
            },
          }
        );
      }

      // Send mention notifications
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== user.id) {
          await pushNotificationService.sendMentionNotification(
            mentionedUserId,
            `${user.nombre} ${user.apellido_paterno}`,
            group.name,
            message.substring(0, 50),
            groupId,
            '' // Message ID will be set by the listener
          );
        }
      }

      // Clear typing indicator
      await firebaseChatService.setTyping(groupId, user.id, '', false);
    },
    [groupId, user, group]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      await firebaseChatService.editMessage(groupId, messageId, newText);
    },
    [groupId]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      await firebaseChatService.deleteMessage(groupId, messageId);
    },
    [groupId]
  );

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      await firebaseChatService.addReaction(groupId, messageId, emoji, user.id);
    },
    [groupId, user?.id]
  );

  // Remove reaction
  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      await firebaseChatService.removeReaction(
        groupId,
        messageId,
        emoji,
        user.id
      );
    },
    [groupId, user?.id]
  );

  // Toggle pin message
  const togglePinMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      return await firebaseChatService.togglePinMessage(groupId, messageId);
    },
    [groupId]
  );

  // Set typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!user) return;
      firebaseChatService.setTyping(
        groupId,
        user.id,
        `${user.nombre} ${user.apellido_paterno}`,
        isTyping
      );
    },
    [groupId, user]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (messages.length === 0) return;

    const oldestMessage = messages[0];
    // Load messages older than the oldest one we have
    const olderMessages = await firebaseChatService.getMessages(
      groupId,
      messageLimit
    );
    const newMessages = olderMessages.filter(
      m =>
        !messageIdsRef.current.has(m.id) &&
        m.createdAt < oldestMessage.createdAt
    );

    if (newMessages.length > 0) {
      newMessages.forEach(m => messageIdsRef.current.add(m.id));
      setMessages(prev => [...newMessages, ...prev]);
    }
  }, [groupId, messages, messageLimit]);

  // Refresh group data
  const refreshGroup = useCallback(async () => {
    const groupData = await firebaseChatService.getGroup(groupId);
    if (groupData) {
      setGroup(groupData);
    }
  }, [groupId]);

  return {
    group,
    messages,
    typingUsers,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    togglePinMessage,
    setTyping,
    loadMoreMessages,
    refreshGroup,
  };
}

/**
 * Hook for managing user's groups list
 */
export function useFirebaseGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<FirebaseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userGroups = await firebaseChatService.getUserGroups(user.id);
      setGroups(userGroups);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = useCallback(
    async (
      name: string,
      description: string,
      icon: string,
      color: string,
      type: FirebaseGroup['type'],
      initialParticipants: { id: string; name: string }[] = []
    ): Promise<string> => {
      if (!user) throw new Error('Usuario no autenticado');

      const groupId = await firebaseChatService.createGroup(
        name,
        description,
        icon,
        color,
        type,
        user.id,
        `${user.nombre} ${user.apellido_paterno}`,
        initialParticipants
      );

      await loadGroups();
      return groupId;
    },
    [user, loadGroups]
  );

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
  };
}

export default useFirebaseChat;
