// Tipos auxiliares para resolver problemas de inferencia de Supabase
export type SupabaseUpdate<T> = Partial<T> & Record<string, any>;

export type MessageUpdate = {
  message?: string;
  is_deleted?: boolean;
  edited_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type NotificationUpdate = {
  read?: boolean;
  read_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type UserUpdate = {
  last_seen?: string;
  is_online?: boolean;
  updated_at?: string;
  [key: string]: any;
};

export type RequestUpdate = {
  estatus?: string;
  updated_at?: string;
  [key: string]: any;
};
