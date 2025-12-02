/**
 * Firebase Chat Service for Group Chats
 *
 * Uses Firebase Realtime Database for low-latency group messaging.
 * Integrates with Supabase users (hybrid architecture).
 */

import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  off,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { getFirebaseDatabase } from '@/config/firebase';

// Types for Firebase Group Chat
export interface FirebaseGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  message: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  audioDuration?: number;
  replyTo?: string;
  mentions?: string[]; // User IDs mentioned in message
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
  isPinned?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface FirebaseGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'GRUPO_VENTAS' | 'GRUPO_SOPORTE' | 'GRUPO_COTIZACION' | 'custom';
  createdBy: string;
  admins: string[];
  participants: string[];
  participantNames: { [userId: string]: string };
  lastMessage?: {
    message: string;
    senderName: string;
    timestamp: number;
  };
  pinnedMessages?: string[];
  settings: {
    allowMentions: boolean;
    allowReactions: boolean;
    allowFileSharing: boolean;
    onlyAdminsCanPost: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface GroupParticipant {
  id: string;
  name: string;
  photo?: string;
  role: 'admin' | 'member';
  joinedAt: number;
  isOnline?: boolean;
  lastSeen?: number;
}

// Callback types
type MessageCallback = (message: FirebaseGroupMessage) => void;
type MessagesCallback = (messages: FirebaseGroupMessage[]) => void;
type GroupCallback = (group: FirebaseGroup) => void;
type PresenceCallback = (userId: string, isOnline: boolean) => void;

class FirebaseChatService {
  private db = getFirebaseDatabase();
  private listeners: Map<string, () => void> = new Map();

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Create a new group chat
   */
  async createGroup(
    name: string,
    description: string,
    icon: string,
    color: string,
    type: FirebaseGroup['type'],
    creatorId: string,
    creatorName: string,
    initialParticipants: { id: string; name: string }[] = []
  ): Promise<string> {
    const groupsRef = ref(this.db, 'groups');
    const newGroupRef = push(groupsRef);
    const groupId = newGroupRef.key!;

    const allParticipants = [
      { id: creatorId, name: creatorName },
      ...initialParticipants.filter(p => p.id !== creatorId),
    ];

    const participantNames: { [key: string]: string } = {};
    allParticipants.forEach(p => {
      participantNames[p.id] = p.name;
    });

    const group: FirebaseGroup = {
      id: groupId,
      name,
      description,
      icon,
      color,
      type,
      createdBy: creatorId,
      admins: [creatorId],
      participants: allParticipants.map(p => p.id),
      participantNames,
      settings: {
        allowMentions: true,
        allowReactions: true,
        allowFileSharing: true,
        onlyAdminsCanPost: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await set(newGroupRef, group);

    // Send welcome system message
    await this.sendMessage(groupId, {
      senderId: 'system',
      senderName: 'Sistema',
      message: `${creatorName} creó el grupo "${name}"`,
      type: 'system',
    });

    console.log('[FirebaseChat] Group created:', groupId);
    return groupId;
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<FirebaseGroup | null> {
    const groupRef = ref(this.db, `groups/${groupId}`);
    const snapshot = await get(groupRef);
    return snapshot.exists() ? (snapshot.val() as FirebaseGroup) : null;
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string): Promise<FirebaseGroup[]> {
    const groupsRef = ref(this.db, 'groups');
    const snapshot = await get(groupsRef);

    if (!snapshot.exists()) return [];

    const groups: FirebaseGroup[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      const group = child.val() as FirebaseGroup;
      if (group.participants?.includes(userId)) {
        groups.push(group);
      }
    });

    return groups.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || a.updatedAt;
      const bTime = b.lastMessage?.timestamp || b.updatedAt;
      return bTime - aTime;
    });
  }

  /**
   * Update group info
   */
  async updateGroup(
    groupId: string,
    updates: Partial<
      Pick<
        FirebaseGroup,
        'name' | 'description' | 'icon' | 'color' | 'settings'
      >
    >
  ): Promise<void> {
    const groupRef = ref(this.db, `groups/${groupId}`);
    await update(groupRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  /**
   * Add participant to group
   */
  async addParticipant(
    groupId: string,
    userId: string,
    userName: string,
    addedByName: string
  ): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    if (group.participants.includes(userId)) {
      throw new Error('User is already a participant');
    }

    const updates: any = {
      [`groups/${groupId}/participants`]: [...group.participants, userId],
      [`groups/${groupId}/participantNames/${userId}`]: userName,
      [`groups/${groupId}/updatedAt`]: Date.now(),
    };

    await update(ref(this.db), updates);

    // Send system message
    await this.sendMessage(groupId, {
      senderId: 'system',
      senderName: 'Sistema',
      message: `${addedByName} agregó a ${userName} al grupo`,
      type: 'system',
    });
  }

  /**
   * Remove participant from group
   */
  async removeParticipant(
    groupId: string,
    userId: string,
    removedByName: string,
    userName: string
  ): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    const updates: any = {
      [`groups/${groupId}/participants`]: group.participants.filter(
        id => id !== userId
      ),
      [`groups/${groupId}/updatedAt`]: Date.now(),
    };

    // Remove from admins if applicable
    if (group.admins.includes(userId)) {
      updates[`groups/${groupId}/admins`] = group.admins.filter(
        id => id !== userId
      );
    }

    await update(ref(this.db), updates);
    await remove(ref(this.db, `groups/${groupId}/participantNames/${userId}`));

    // Send system message
    await this.sendMessage(groupId, {
      senderId: 'system',
      senderName: 'Sistema',
      message: `${removedByName} removió a ${userName} del grupo`,
      type: 'system',
    });
  }

  /**
   * Make user an admin
   */
  async makeAdmin(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    if (!group.admins.includes(userId)) {
      await update(ref(this.db, `groups/${groupId}`), {
        admins: [...group.admins, userId],
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * Remove admin privileges
   */
  async removeAdmin(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    // Can't remove the creator as admin
    if (group.createdBy === userId) {
      throw new Error('Cannot remove creator as admin');
    }

    await update(ref(this.db, `groups/${groupId}`), {
      admins: group.admins.filter(id => id !== userId),
      updatedAt: Date.now(),
    });
  }

  // ==================== MESSAGING ====================

  /**
   * Send a message to a group
   */
  async sendMessage(
    groupId: string,
    messageData: {
      senderId: string;
      senderName: string;
      senderPhoto?: string;
      message: string;
      type?: FirebaseGroupMessage['type'];
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      audioDuration?: number;
      replyTo?: string;
      mentions?: string[];
    }
  ): Promise<string> {
    const messagesRef = ref(this.db, `messages/${groupId}`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key!;

    const message: FirebaseGroupMessage = {
      id: messageId,
      groupId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderPhoto: messageData.senderPhoto,
      message: messageData.message,
      type: messageData.type || 'text',
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
      fileSize: messageData.fileSize,
      audioDuration: messageData.audioDuration,
      replyTo: messageData.replyTo,
      mentions: messageData.mentions,
      isDeleted: false,
      createdAt: Date.now(),
    };

    await set(newMessageRef, message);

    // Update group's last message
    await update(ref(this.db, `groups/${groupId}`), {
      lastMessage: {
        message:
          messageData.type === 'text'
            ? messageData.message
            : `[${messageData.type}]`,
        senderName: messageData.senderName,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return messageId;
  }

  /**
   * Get messages for a group (with pagination)
   */
  async getMessages(
    groupId: string,
    limit: number = 50
  ): Promise<FirebaseGroupMessage[]> {
    const messagesRef = ref(this.db, `messages/${groupId}`);
    const messagesQuery = query(
      messagesRef,
      orderByChild('createdAt'),
      limitToLast(limit)
    );
    const snapshot = await get(messagesQuery);

    if (!snapshot.exists()) return [];

    const messages: FirebaseGroupMessage[] = [];
    snapshot.forEach((child: DataSnapshot) => {
      messages.push(child.val() as FirebaseGroupMessage);
    });

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Edit a message
   */
  async editMessage(
    groupId: string,
    messageId: string,
    newText: string
  ): Promise<void> {
    await update(ref(this.db, `messages/${groupId}/${messageId}`), {
      message: newText,
      isEdited: true,
      updatedAt: Date.now(),
    });
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(groupId: string, messageId: string): Promise<void> {
    await update(ref(this.db, `messages/${groupId}/${messageId}`), {
      message: 'Este mensaje fue eliminado',
      isDeleted: true,
      updatedAt: Date.now(),
    });
  }

  /**
   * Add reaction to a message
   */
  async addReaction(
    groupId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const messageRef = ref(this.db, `messages/${groupId}/${messageId}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) throw new Error('Message not found');

    const message = snapshot.val() as FirebaseGroupMessage;
    const reactions = message.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    if (!emojiReactions.includes(userId)) {
      reactions[emoji] = [...emojiReactions, userId];
      await update(messageRef, { reactions });
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(
    groupId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const messageRef = ref(this.db, `messages/${groupId}/${messageId}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) return;

    const message = snapshot.val() as FirebaseGroupMessage;
    const reactions = message.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    reactions[emoji] = emojiReactions.filter(id => id !== userId);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }

    await update(messageRef, { reactions });
  }

  /**
   * Pin/Unpin a message
   */
  async togglePinMessage(groupId: string, messageId: string): Promise<boolean> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    const pinnedMessages = group.pinnedMessages || [];
    const isPinned = pinnedMessages.includes(messageId);

    const newPinnedMessages = isPinned
      ? pinnedMessages.filter(id => id !== messageId)
      : [...pinnedMessages, messageId];

    await update(ref(this.db, `groups/${groupId}`), {
      pinnedMessages: newPinnedMessages,
    });

    await update(ref(this.db, `messages/${groupId}/${messageId}`), {
      isPinned: !isPinned,
    });

    return !isPinned;
  }

  // ==================== REAL-TIME LISTENERS ====================

  /**
   * Subscribe to new messages in a group
   */
  subscribeToMessages(
    groupId: string,
    onNewMessage: MessageCallback,
    onMessageUpdated?: MessageCallback
  ): () => void {
    const messagesRef = ref(this.db, `messages/${groupId}`);

    const addedListener = onChildAdded(
      messagesRef,
      (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          onNewMessage(snapshot.val() as FirebaseGroupMessage);
        }
      }
    );

    const changedListener = onMessageUpdated
      ? onChildChanged(messagesRef, (snapshot: DataSnapshot) => {
          if (snapshot.exists()) {
            onMessageUpdated(snapshot.val() as FirebaseGroupMessage);
          }
        })
      : null;

    // Return cleanup function
    return () => {
      off(messagesRef, 'child_added');
      if (changedListener) {
        off(messagesRef, 'child_changed');
      }
    };
  }

  /**
   * Subscribe to group updates
   */
  subscribeToGroup(groupId: string, onGroupUpdated: GroupCallback): () => void {
    const groupRef = ref(this.db, `groups/${groupId}`);

    const listener = onValue(groupRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        onGroupUpdated(snapshot.val() as FirebaseGroup);
      }
    });

    return () => off(groupRef);
  }

  // ==================== PRESENCE ====================

  /**
   * Set user presence in a group
   */
  async setPresence(
    groupId: string,
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    const presenceRef = ref(this.db, `presence/${groupId}/${userId}`);
    await set(presenceRef, {
      isOnline,
      lastSeen: Date.now(),
    });
  }

  /**
   * Subscribe to presence changes in a group
   */
  subscribeToPresence(
    groupId: string,
    onPresenceChanged: PresenceCallback
  ): () => void {
    const presenceRef = ref(this.db, `presence/${groupId}`);

    const listener = onValue(presenceRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((child: DataSnapshot) => {
          const userId = child.key!;
          const data = child.val();
          onPresenceChanged(userId, data.isOnline);
        });
      }
    });

    return () => off(presenceRef);
  }

  // ==================== TYPING INDICATORS ====================

  /**
   * Set typing status
   */
  async setTyping(
    groupId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    const typingRef = ref(this.db, `typing/${groupId}/${userId}`);
    if (isTyping) {
      await set(typingRef, {
        userName,
        timestamp: Date.now(),
      });
    } else {
      await remove(typingRef);
    }
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(
    groupId: string,
    onTypingChanged: (typingUsers: { id: string; name: string }[]) => void
  ): () => void {
    const typingRef = ref(this.db, `typing/${groupId}`);

    const listener = onValue(typingRef, (snapshot: DataSnapshot) => {
      const typingUsers: { id: string; name: string }[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child: DataSnapshot) => {
          const data = child.val();
          // Only show if typing within last 10 seconds
          if (Date.now() - data.timestamp < 10000) {
            typingUsers.push({
              id: child.key!,
              name: data.userName,
            });
          }
        });
      }
      onTypingChanged(typingUsers);
    });

    return () => off(typingRef);
  }

  // ==================== UTILITY ====================

  /**
   * Parse mentions from message text (@username)
   */
  parseMentions(
    text: string,
    participantNames: { [key: string]: string }
  ): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1].toLowerCase();
      for (const [userId, name] of Object.entries(participantNames)) {
        if (name.toLowerCase().includes(mentionedName)) {
          mentions.push(userId);
        }
      }
    }

    return [...new Set(mentions)];
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Export singleton instance
export const firebaseChatService = new FirebaseChatService();
export default firebaseChatService;
