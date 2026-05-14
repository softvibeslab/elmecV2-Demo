// Supabase Database Types
export interface User {
  id: string;
  email: string;
  empresa: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_electronico: string;
  celular: string;
  ciudad: string;
  estado: string;
  rol: 'customer' | 'agent' | 'admin';
  status_aprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
  categoria?: 'Agentes de venta' | 'Servicio al Cliente' | 'Soporte';
  zona?: string;
  activo: boolean;
  foto?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_online: boolean;
  last_seen: string;
}

export interface Request {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: number;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estatus:
    | 'nuevo'
    | 'asignado'
    | 'sin_atender'
    | 'en_proceso'
    | 'pausado'
    | 'resuelto'
    | 'cerrado';
  usuario_id: string;
  agente_id?: string;
  created_at: string;
  updated_at: string;
  fecha_vencimiento?: string;
  archivos?: string[];
  tags?: string[];
  rating?: number;
  feedback?: string;
  metadata?: any;
}

export interface ChatRoom {
  id: string;
  tipo: 'support' | 'sales' | 'general' | 'group';
  participants: string[];
  request_id?: string;
  created_at: string;
  updated_at: string;
  last_message?: any;
  is_active: boolean;
  metadata?: any;
  // Group chat fields
  name?: string;
  description?: string;
  avatar_url?: string;
  is_group: boolean;
  admin_ids?: string[];
  created_by?: string;
  max_participants?: number;
  settings?: ChatRoomSettings;
}

export interface ChatRoomSettings {
  mute_notifications: boolean;
  only_admins_can_send: boolean;
  only_admins_can_edit_info: boolean;
  disappearing_messages?: number | null;
}

export interface ChatRoomMember {
  id: string;
  chat_room_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  added_by?: string;
  is_muted: boolean;
  muted_until?: string;
  last_read_at?: string;
  last_read_message_id?: string;
  notification_settings?: {
    sound: boolean;
    vibrate: boolean;
    preview: boolean;
  };
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  created_at: string;
  read_by?: any;
  reply_to?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  audio_duration?: number;
  edited_at?: string;
  is_deleted: boolean;
  // Delivery status fields (WhatsApp-like)
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  delivered_at?: string;
  client_message_id?: string;
  retry_count?: number;
}

export interface MessageReceipt {
  id: string;
  message_id: string;
  user_id: string;
  delivered_at?: string;
  read_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'request_update' | 'new_message' | 'assignment' | 'reminder' | 'system';
  priority: 'low' | 'medium' | 'high';
  data?: any;
  read: boolean;
  created_at: string;
  read_at?: string;
  expired_at?: string;
}

// Database schema types for type safety
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      requests: {
        Row: Request;
        Insert: Omit<Request, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Request, 'id' | 'created_at'>>;
      };
      chat_rooms: {
        Row: ChatRoom;
        Insert: Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChatRoom, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'customer' | 'agent' | 'admin';
      request_status:
        | 'nuevo'
        | 'asignado'
        | 'sin_atender'
        | 'en_proceso'
        | 'pausado'
        | 'resuelto'
        | 'cerrado';
      request_priority: 'baja' | 'media' | 'alta' | 'urgente';
      chat_type: 'support' | 'sales' | 'general';
      message_type: 'text' | 'image' | 'file' | 'audio' | 'system';
      notification_type:
        | 'request_update'
        | 'new_message'
        | 'assignment'
        | 'reminder'
        | 'system';
      notification_priority: 'low' | 'medium' | 'high';
    };
  };
}
