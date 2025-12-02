import { supabase, supabaseClient } from '@/lib/supabase';
import {
  User,
  Request,
  ChatRoom,
  Message,
  Notification,
} from '@/types/supabase';
import {
  MessageUpdate,
  NotificationUpdate,
  UserUpdate,
  RequestUpdate,
} from '@/types/supabase-helpers';

export class SupabaseService {
  // Authentication Services
  static async registerUser(
    userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
      password: string;
    }
  ): Promise<User> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.correo_electronico,
        password: userData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Crear perfil de usuario evitando duplicación de 'email'
        const { password, email, ...userProfile } = userData as any;

        const { data, error } = await supabaseClient
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            ...userProfile,
            activo: true,
            is_online: false,
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data as User;
      }

      throw new Error('User creation failed');
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  static async loginUser(email: string, password: string): Promise<User> {
    // Input validation
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    if (!email.includes('@')) {
      throw new Error('Formato de email inválido');
    }

    try {
      // Clear any existing session first
      await supabase.auth.signOut();

      // Set timeout for authentication request
      const authPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error('Tiempo de espera agotado. Verifica tu conexión.')
            ),
          15000
        );
      });

      const authResult = (await Promise.race([
        authPromise,
        timeoutPromise,
      ])) as any;

      const { data: authData, error: authError } = authResult;

      if (authError) {
        // Enhanced error handling with specific messages
        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        }
        if (authError.message?.includes('Email not confirmed')) {
          throw new Error('Debes confirmar tu email antes de iniciar sesión');
        }
        if (authError.message?.includes('Too many requests')) {
          throw new Error(
            'Demasiados intentos. Espera unos minutos antes de intentar de nuevo'
          );
        }
        if (authError.message?.includes('User not found')) {
          throw new Error('No existe una cuenta con este email');
        }
        throw new Error(authError.message || 'Error de autenticación');
      }

      if (!authData?.user) {
        throw new Error('Error en la autenticación. Intenta de nuevo');
      }

      // Get user profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Tiempo de espera agotado al cargar perfil')),
          10000
        );
      });

      const profileResult = (await Promise.race([
        profilePromise,
        profileTimeoutPromise,
      ])) as any;

      const { data: userData, error: profileError } = profileResult;

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          throw new Error(
            'Perfil de usuario no encontrado. Contacta al administrador'
          );
        }
        throw new Error('Error al cargar el perfil de usuario');
      }

      if (!userData) {
        throw new Error('No se pudo cargar la información del usuario');
      }

      // Check if user is active
      if (userData.activo === false) {
        throw new Error(
          'Tu cuenta está desactivada. Contacta al administrador'
        );
      }

      // Update last login and online status (non-blocking)
      const updateData = {
        last_login: new Date().toISOString(),
        is_online: true,
        updated_at: new Date().toISOString(),
      };

      // Fire and forget update - don't block login (use IIFE with try/catch to satisfy TS)
      (async () => {
        try {
          const result: any = await supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', authData.user.id);
          if (result?.error) {
            console.warn(
              'Warning: Could not update user status:',
              result.error
            );
          }
        } catch (updateErr) {
          console.warn('Warning: Failed to update user status:', updateErr);
        }
      })();

      return userData as User;
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        email: email?.substring(0, 3) + '***', // Log partial email for debugging
        timestamp: new Date().toISOString(),
      });

      // Re-throw with user-friendly message
      if (error.message && typeof error.message === 'string') {
        throw error;
      }

      throw new Error(
        'Error de conexión. Verifica tu internet e intenta de nuevo'
      );
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // @ts-ignore - Supabase type inference issue
        await supabaseClient
          .from('users')
          .update({
            is_online: false,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // User Services
  static async getUserInfo(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting user info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  static async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<void> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabaseClient
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async getDirectoryUsers(
    role?: string,
    excludeUserId?: string
  ): Promise<User[]> {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (role) {
        query = query.eq('rol', role);
      }

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting directory users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting directory users:', error);
      return [];
    }
  }

  static async searchUsers(
    searchQuery: string,
    filters?: {
      categoria?: string;
      zona?: string;
      rol?: string;
      excludeUserId?: string;
    }
  ): Promise<User[]> {
    try {
      let query = supabase.from('users').select('*').eq('activo', true);

      // Apply text search
      if (searchQuery.trim()) {
        query = query.or(
          `nombre.ilike.%${searchQuery}%,apellido_paterno.ilike.%${searchQuery}%,apellido_materno.ilike.%${searchQuery}%,correo_electronico.ilike.%${searchQuery}%,empresa.ilike.%${searchQuery}%`
        );
      }

      // Apply filters
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      if (filters?.zona) {
        query = query.eq('zona', filters.zona);
      }

      if (filters?.rol) {
        query = query.eq('rol', filters.rol);
      }

      if (filters?.excludeUserId) {
        query = query.neq('id', filters.excludeUserId);
      }

      query = query.order('nombre', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  static async updateUserOnlineStatus(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabaseClient
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  // Request Services
  static async createRequest(
    requestData: Omit<Request, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Request> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabaseClient
        .from('requests')
        .insert(requestData)
        .select()
        .single();

      if (error) throw error;

      // Create notification for agent if assigned
      if (requestData.agente_id) {
        await this.createNotification({
          user_id: requestData.agente_id,
          title: 'Nueva solicitud asignada',
          body: `Se te ha asignado la solicitud: ${requestData.titulo}`,
          type: 'assignment',
          priority: 'medium',
          data: { requestId: data.id },
          read: false,
        });
      }

      return data as Request;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  static async getUserRequests(
    userId: string,
    role: string
  ): Promise<Request[]> {
    try {
      const field = role === 'customer' ? 'usuario_id' : 'agente_id';
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq(field, userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user requests:', error);
      return [];
    }
  }

  static async getAllRequests(): Promise<Request[]> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(
          `
          *,
          usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno, empresa),
          agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno, categoria)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all requests:', error);
      return [];
    }
  }

  static async getRequestsForUser(
    userId: string,
    role: string
  ): Promise<Request[]> {
    try {
      let query = supabase
        .from('requests')
        .select(
          `
          *,
          usuario:users!requests_usuario_id_fkey(nombre, apellido_paterno, apellido_materno, empresa),
          agente:users!requests_agente_id_fkey(nombre, apellido_paterno, apellido_materno, categoria)
        `
        )
        .order('created_at', { ascending: false });

      // Filtrar según el rol del usuario
      if (role === 'customer') {
        query = query.eq('usuario_id', userId);
      } else if (role === 'agent') {
        query = query.eq('agente_id', userId);
      }
      // Los admins pueden ver todas las solicitudes

      const { data, error } = await query;

      if (error) {
        console.error('Error getting requests for user:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting requests for user:', error);
      return [];
    }
  }

  static async updateRequestStatus(
    requestId: string,
    status: string
  ): Promise<void> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabaseClient
        .from('requests')
        .update({
          estatus: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  static async getAgents(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, nombre, apellido_paterno, apellido_materno, categoria, zona'
        )
        .eq('rol', 'agent')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error getting agents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting agents:', error);
      return [];
    }
  }

  // Chat Services
  static async getChatRoomsForUser(userId: string): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          request:requests(titulo, estatus),
          participants_info:users!inner(id, nombre, apellido_paterno, apellido_materno, foto, is_online)
        `
        )
        .contains('participants', [userId])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error getting chat rooms:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      return [];
    }
  }

  static async getChatRoomMessages(
    roomId: string,
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    try {
      let query = supabase
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

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting chat room messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting chat room messages:', error);
      return [];
    }
  }

  static async createChatRoom(
    participants: string[],
    tipo: ChatRoom['tipo'],
    requestId?: string
  ): Promise<ChatRoom> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabaseClient
        .from('chat_rooms')
        .insert({
          tipo,
          participants,
          request_id: requestId,
          is_active: true,
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatRoom;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  static async sendMessage(
    chatRoomId: string,
    senderId: string,
    senderName: string,
    message: string,
    type: Message['type'] = 'text'
  ): Promise<Message> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: senderId,
          sender_name: senderName,
          message,
          type,
          is_deleted: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update chat room with last message
      // @ts-ignore - Supabase type inference issue
      await supabaseClient
        .from('chat_rooms')
        .update({
          last_message: {
            id: data.id,
            message: data.message,
            sender_id: data.sender_id,
            created_at: data.created_at,
            type: data.type,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatRoomId);

      return data as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async sendChatMessage(
    chatRoomId: string,
    senderId: string,
    senderName: string,
    message: string,
    type: Message['type'] = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    audioDuration?: number,
    replyTo?: string
  ): Promise<Message> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: senderId,
          sender_name: senderName,
          message,
          type,
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

      if (error) throw error;

      // Update chat room with last message
      // @ts-ignore - Supabase type inference issue
      await supabaseClient
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
        .eq('id', chatRoomId);

      return data as Message;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(
    roomId: string,
    userId: string
  ): Promise<void> {
    try {
      // In a real implementation, you would update the read_by JSONB field
      // For now, we'll just log the action
      console.log(
        `Marking messages as read for room ${roomId} by user ${userId}`
      );

      // You could implement this by updating the read_by field:
      // UPDATE messages SET read_by = jsonb_set(read_by, '{userId}', 'true')
      // WHERE chat_room_id = roomId AND sender_id != userId
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  static async deleteMessage(messageId: string): Promise<void> {
    try {
      // @ts-ignore - Supabase type inference issue
      const { error } = await supabaseClient
        .from('messages')
        .update({
          is_deleted: true,
          message: 'Este mensaje fue eliminado',
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  static async editMessage(
    messageId: string,
    newMessage: string
  ): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('messages')
        .update({
          message: newMessage,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Notification Services
  static async createNotification(
    notificationData: Omit<Notification, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .insert(notificationData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

export default SupabaseService;
