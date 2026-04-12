# 🔧 MANUAL TÉCNICO - ELMEC v2

**Versión:** 2.0.0
**Fecha:** Octubre 2025
**Audiencia:** Desarrolladores, DevOps, Arquitectos
**Nivel:** Avanzado

---

## 📑 Índice

1. [Arquitectura Técnica](#arquitectura-técnica)
2. [Stack Tecnológico Detallado](#stack-tecnológico-detallado)
3. [Estructura de Código](#estructura-de-código)
4. [Base de Datos](#base-de-datos)
5. [APIs y Servicios](#apis-y-servicios)
6. [Seguridad](#seguridad)
7. [Performance](#performance)
8. [Testing](#testing)
9. [CI/CD](#cicd)
10. [Monitoreo](#monitoreo)

---

## 🏗️ Arquitectura Técnica

### Diagrama de Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENTE MÓVIL                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   iOS      │  │  Android   │  │    Web     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         └──────────────┬──────────────┘                     │
│                        │                                     │
│              ┌─────────▼─────────┐                          │
│              │  React Native App │                          │
│              │  (Expo Framework) │                          │
│              └─────────┬─────────┘                          │
└────────────────────────┼──────────────────────────────────┘
                         │
                         │ HTTPS/WSS
                         │
        ┌────────────────▼────────────────┐
        │      SUPABASE PLATFORM          │
        ├─────────────────────────────────┤
        │  ┌──────────────────────────┐  │
        │  │   PostgreSQL Database    │  │
        │  │   - RLS Policies         │  │
        │  │   - Triggers             │  │
        │  │   - Functions            │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │   Supabase Auth          │  │
        │  │   - JWT Tokens           │  │
        │  │   - Session Management   │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │   Realtime Engine        │  │
        │  │   - WebSocket Server     │  │
        │  │   - Presence             │  │
        │  │   - Broadcast            │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │   Storage (S3)           │  │
        │  │   - Files                │  │
        │  │   - Images               │  │
        │  └──────────────────────────┘  │
        └─────────────────────────────────┘
```

### Patrones de Arquitectura Utilizados

#### 1. **Context Provider Pattern**

```typescript
// Estructura de contexto
<AuthProvider>
  <NotificationProvider>
    <ChatProvider>
      <App />
    </ChatProvider>
  </NotificationProvider>
</AuthProvider>
```

**Ventajas:**

- Estado global sin prop drilling
- Fácil acceso desde cualquier componente
- Re-renders optimizados

**Uso:**

```typescript
// En cualquier componente
const { user, signIn, signOut } = useAuth();
const { messages, sendMessage } = useChat();
```

#### 2. **Repository Pattern**

```typescript
// services/RequestRepository.ts
class RequestRepository {
  async getAll(userId: string): Promise<Request[]> {
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('usuario_id', userId);
    return data;
  }

  async create(request: CreateRequestDTO): Promise<Request> {
    const { data } = await supabase.from('requests').insert(request).single();
    return data;
  }
}
```

#### 3. **Optimistic Updates**

```typescript
// Actualización optimista en chat
const sendMessage = async (message: string) => {
  const tempId = `temp_${Date.now()}`;

  // 1. Agregar mensaje inmediatamente a UI
  setMessages(prev => [
    ...prev,
    {
      id: tempId,
      message,
      isDelivered: false,
    },
  ]);

  // 2. Enviar a servidor
  const { data } = await supabase.from('messages').insert({ message });

  // 3. Reemplazar mensaje temporal con real
  setMessages(prev =>
    prev.map(msg => (msg.id === tempId ? { ...data, isDelivered: true } : msg))
  );
};
```

---

## 💻 Stack Tecnológico Detallado

### Frontend

#### React Native 0.76.5

- **Navegación:** Expo Router v4 (File-based routing)
- **Gestión de Estado:** React Context API + useState/useReducer
- **Estilos:** StyleSheet API nativa
- **Iconos:** Lucide React Native
- **Safe Areas:** react-native-safe-area-context

#### TypeScript 5.3

```typescript
// types/supabase.ts - Definición de tipos
export interface User {
  id: string;
  email: string;
  rol: 'customer' | 'agent' | 'admin';
  // ...
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<User>;
      };
    };
  };
}
```

### Backend

#### Supabase

- **Base de Datos:** PostgreSQL 15
- **ORM:** PostgREST (Auto-generado)
- **Autenticación:** GoTrue (JWT)
- **Realtime:** Phoenix Channels
- **Storage:** S3-compatible

#### Configuración de Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente tipado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Cliente sin tipos (para operaciones flexibles)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 📂 Estructura de Código

### Organización de Carpetas

```
src/
├── app/                          # Expo Router routes
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── _layout.tsx          # Tabs layout configuration
│   │   ├── index.tsx            # Dashboard (Home)
│   │   ├── requests.tsx         # Requests module
│   │   ├── chat/                # Chat module
│   │   │   ├── index.tsx        # Chat list
│   │   │   └── [roomId].tsx     # Chat room (dynamic route)
│   │   ├── calculator.tsx       # Calculator
│   │   ├── directory.tsx        # Sales directory
│   │   └── notifications.tsx    # Notifications
│   ├── auth/                    # Authentication
│   │   ├── index.tsx            # Login screen
│   │   └── register.tsx         # Register screen
│   ├── settings/                # Settings
│   │   ├── index.tsx            # Settings menu
│   │   ├── account.tsx          # Account settings
│   │   └── preferences.tsx      # User preferences
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point (redirect logic)
│
├── components/                   # Reusable components
│   ├── ui/                      # UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── AdvancedSearchComponent.tsx
│   ├── FileUploadComponent.tsx
│   ├── ChatMessage.tsx
│   └── LoadingScreen.tsx
│
├── contexts/                     # React Contexts
│   ├── AuthContext.tsx          # Authentication state
│   ├── ChatContext.tsx          # Chat state & realtime
│   └── NotificationContext.tsx  # Notifications state
│
├── lib/                         # Libraries & configuration
│   ├── supabase.ts             # Supabase client
│   └── constants.ts            # App constants
│
├── types/                       # TypeScript definitions
│   ├── supabase.ts             # Supabase types
│   └── index.ts                # General types
│
├── utils/                       # Utility functions
│   ├── fileUpload.ts           # File upload helpers
│   ├── validators.ts           # Input validators
│   └── formatters.ts           # Data formatters
│
└── services/                    # API services
    ├── apiService.ts           # External API calls
    └── requestService.ts       # Request-specific logic
```

### Convenciones de Código

#### Nomenclatura

```typescript
// ✅ Componentes: PascalCase
export default function RequestCard() {}

// ✅ Archivos de componentes: PascalCase.tsx
RequestCard.tsx;
ChatMessage.tsx;

// ✅ Hooks: camelCase con prefijo 'use'
const useAuth = () => {};
const useRequests = () => {};

// ✅ Contexts: PascalCase con sufijo 'Context'
const AuthContext = createContext();

// ✅ Tipos/Interfaces: PascalCase
interface User {}
type RequestStatus = 'nuevo' | 'asignado';

// ✅ Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://...';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ✅ Variables y funciones: camelCase
const userName = 'John';
function fetchRequests() {}
```

#### Estructura de Componente

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

// 1. Types/Interfaces
interface RequestCardProps {
  request: Request;
  onPress: () => void;
}

// 2. Component
export default function RequestCard({ request, onPress }: RequestCardProps) {
  // 3. Hooks
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 5. Handlers
  const handlePress = () => {
    setLoading(true);
    onPress();
  };

  // 6. Render helpers
  const renderStatus = () => {
    return <Text>{request.status}</Text>;
  };

  // 7. Render
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{request.titulo}</Text>
      {renderStatus()}
    </View>
  );
}

// 8. Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

---

## 🗄️ Base de Datos

### Esquema Completo

#### ERD (Entity Relationship Diagram)

```
┌─────────────┐         ┌─────────────┐
│    users    │◄────────│  requests   │
│             │         │             │
│ • id (PK)   │    ┌────│ • usuario_id│
│ • email     │    │    │ • agente_id │
│ • rol       │    │    └─────────────┘
└─────────────┘    │
       ▲           │
       │           │
       │    ┌──────▼──────┐
       │    │ chat_rooms  │
       │    │             │
       └────│• participants│
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │  messages   │
            │             │
            │• sender_id  │
            └─────────────┘
```

### Migraciones

#### Ubicación: `supabase/migrations/`

**Convención de nombres:**

```
YYYYMMDDHHMMSS_descripcion.sql
20250909105521_create_users_table.sql
20250909110455_create_requests_table.sql
```

**Ejemplo de migración:**

```sql
-- 20250909105521_create_requests_table.sql

-- 1. Crear tabla
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL CHECK (char_length(titulo) >= 5),
  mensaje TEXT NOT NULL CHECK (char_length(mensaje) >= 10),
  tipo INTEGER NOT NULL CHECK (tipo BETWEEN 1 AND 5),
  prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  estatus TEXT NOT NULL DEFAULT 'nuevo' CHECK (estatus IN ('nuevo', 'asignado', 'en_proceso', 'pausado', 'resuelto', 'cerrado')),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agente_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fecha_vencimiento TIMESTAMP,
  archivos TEXT[],
  tags TEXT[],
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. Crear índices
CREATE INDEX idx_requests_usuario_id ON requests(usuario_id);
CREATE INDEX idx_requests_agente_id ON requests(agente_id);
CREATE INDEX idx_requests_estatus ON requests(estatus);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_prioridad ON requests(prioridad);

-- 3. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- 5. Comentarios
COMMENT ON TABLE requests IS 'Tabla de solicitudes de clientes';
COMMENT ON COLUMN requests.tipo IS '1=Ventas, 2=Soporte, 3=Cotización, 4=Rastreo, 5=Otro';
```

### Triggers Importantes

#### 1. Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Notificación automática en nueva solicitud

```sql
CREATE OR REPLACE FUNCTION notify_new_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Enviar notificación al agente asignado
  IF NEW.agente_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type, priority, data)
    VALUES (
      NEW.agente_id,
      'Nueva solicitud asignada',
      'Se te ha asignado: ' || NEW.titulo,
      'assignment',
      CASE NEW.prioridad
        WHEN 'urgente' THEN 'high'
        WHEN 'alta' THEN 'high'
        WHEN 'media' THEN 'medium'
        ELSE 'low'
      END,
      jsonb_build_object('requestId', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_request();
```

### Functions (Stored Procedures)

#### Función: Obtener estadísticas de usuario

```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  resolved_requests BIGINT,
  unread_messages BIGINT,
  unread_notifications BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE r.usuario_id = user_id) AS total_requests,
    COUNT(*) FILTER (WHERE r.usuario_id = user_id AND r.estatus IN ('nuevo', 'asignado', 'en_proceso')) AS pending_requests,
    COUNT(*) FILTER (WHERE r.usuario_id = user_id AND r.estatus = 'resuelto') AS resolved_requests,
    COUNT(*) FILTER (WHERE m.sender_id != user_id AND NOT (m.read_by ? user_id::text)) AS unread_messages,
    COUNT(*) FILTER (WHERE n.user_id = user_id AND NOT n.read) AS unread_notifications
  FROM requests r
  LEFT JOIN messages m ON m.chat_room_id IN (
    SELECT id FROM chat_rooms WHERE user_id = ANY(participants)
  )
  LEFT JOIN notifications n ON n.user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Uso
SELECT * FROM get_user_stats('uuid-del-usuario');
```

---

## 🔌 APIs y Servicios

### Supabase REST API

#### Estructura de Request

```typescript
// GET - Obtener datos
const { data, error } = await supabase
  .from('requests')
  .select(
    `
    *,
    usuario:users!requests_usuario_id_fkey(nombre, email),
    agente:users!requests_agente_id_fkey(nombre, email)
  `
  )
  .eq('usuario_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

// POST - Crear dato
const { data, error } = await supabase
  .from('requests')
  .insert({
    titulo: 'Nueva solicitud',
    mensaje: 'Descripción...',
    tipo: 1,
    prioridad: 'media',
    usuario_id: userId,
  })
  .select()
  .single();

// PATCH - Actualizar dato
const { data, error } = await supabase
  .from('requests')
  .update({ estatus: 'en_proceso' })
  .eq('id', requestId)
  .select()
  .single();

// DELETE - Eliminar dato
const { error } = await supabase.from('requests').delete().eq('id', requestId);
```

#### Filtros Avanzados

```typescript
// Búsqueda de texto
const { data } = await supabase
  .from('requests')
  .select('*')
  .textSearch('titulo', 'soporte tecnico', {
    type: 'websearch',
    config: 'spanish',
  });

// Filtros múltiples
const { data } = await supabase
  .from('requests')
  .select('*')
  .eq('estatus', 'nuevo')
  .in('prioridad', ['alta', 'urgente'])
  .gte('created_at', '2025-01-01')
  .order('created_at', { ascending: false });

// Joins complejos
const { data } = await supabase
  .from('requests')
  .select(
    `
    *,
    usuario:users!requests_usuario_id_fkey(*),
    agente:users!requests_agente_id_fkey(*),
    chat_rooms!chat_rooms_request_id_fkey(
      id,
      messages(count)
    )
  `
  )
  .eq('id', requestId)
  .single();
```

### Supabase Realtime

#### Configuración de Canal

```typescript
// Suscripción a cambios en tabla
const channel = supabase
  .channel('requests_changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'requests',
      filter: `usuario_id=eq.${userId}`,
    },
    payload => {
      console.log('Nueva solicitud:', payload.new);
      // Actualizar UI
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'requests',
      filter: `id=eq.${requestId}`,
    },
    payload => {
      console.log('Solicitud actualizada:', payload.new);
      // Actualizar UI
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

#### Presence (Usuarios Online)

```typescript
const channel = supabase.channel('room_1');

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Usuarios online:', state);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('Usuario conectado:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('Usuario desconectado:', leftPresences);
  })
  .subscribe(async status => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });
```

#### Broadcast (Typing Indicators)

```typescript
// Enviar indicador de escritura
const sendTypingIndicator = (isTyping: boolean) => {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      user_id: userId,
      user_name: userName,
      typing: isTyping,
    },
  });
};

// Recibir indicadores
channel
  .on('broadcast', { event: 'typing' }, payload => {
    console.log('Usuario escribiendo:', payload);
    setTypingUsers(prev => ({
      ...prev,
      [payload.user_id]: payload,
    }));
  })
  .subscribe();
```

### Supabase Storage

```typescript
// Subir archivo
const uploadFile = async (file: File) => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `requests/${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('request-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from('request-files').getPublicUrl(filePath);

  return { path: filePath, url: publicUrl };
};

// Descargar archivo
const downloadFile = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('request-files')
    .download(filePath);

  if (error) throw error;
  return data;
};

// Eliminar archivo
const deleteFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('request-files')
    .remove([filePath]);

  if (error) throw error;
};
```

---

## 🔐 Seguridad

### Row Level Security (RLS) Policies

#### Tabla: requests

```sql
-- SELECT: Usuarios ven sus propias solicitudes
CREATE POLICY "users_view_own_requests" ON requests
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

-- SELECT: Agentes ven solicitudes asignadas
CREATE POLICY "agents_view_assigned_requests" ON requests
  FOR SELECT
  TO authenticated
  USING (agente_id = auth.uid());

-- SELECT: Admins ven todas
CREATE POLICY "admins_view_all_requests" ON requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- INSERT: Usuarios autenticados pueden crear
CREATE POLICY "users_create_requests" ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- UPDATE: Solo agentes asignados y admins
CREATE POLICY "agents_update_assigned_requests" ON requests
  FOR UPDATE
  TO authenticated
  USING (
    agente_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- DELETE: Solo admins
CREATE POLICY "admins_delete_requests" ON requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

### JWT Tokens

#### Estructura del Token

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "iat": 1699999999,
  "exp": 1700003599
}
```

#### Validación de Token

```typescript
// El token se incluye automáticamente en headers
// Authorization: Bearer <token>

// Refrescar token antes de expirar
const refreshToken = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    // Redirect to login
    router.push('/auth');
  }
};

// Auto-refresh configurado en supabase client
// autoRefreshToken: true
```

### Validación de Input

```typescript
// utils/validators.ts

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '');
};
```

---

## ⚡ Performance

### Optimizaciones Implementadas

#### 1. React.memo para componentes

```typescript
import React, { memo } from 'react';

const RequestCard = memo(({ request, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{request.titulo}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si el request cambió
  return prevProps.request.id === nextProps.request.id &&
         prevProps.request.updated_at === nextProps.request.updated_at;
});
```

#### 2. useMemo y useCallback

```typescript
const RequestsList = ({ requests }: Props) => {
  // Memoizar cálculos costosos
  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.estatus !== 'cerrado');
  }, [requests]);

  // Memoizar callbacks
  const handlePress = useCallback((id: string) => {
    router.push(`/requests/${id}`);
  }, []);

  return (
    <FlatList
      data={filteredRequests}
      renderItem={({ item }) => (
        <RequestCard request={item} onPress={() => handlePress(item.id)} />
      )}
      keyExtractor={item => item.id}
    />
  );
};
```

#### 3. FlatList con windowSize optimizado

```typescript
<FlatList
  data={requests}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  // Performance optimizations
  windowSize={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  removeClippedSubviews={true}
  // Pull to refresh
  refreshing={loading}
  onRefresh={loadRequests}
  // Infinite scroll
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

#### 4. Índices de Base de Datos

```sql
-- Índices para queries frecuentes
CREATE INDEX CONCURRENTLY idx_requests_usuario_status
  ON requests(usuario_id, estatus);

CREATE INDEX CONCURRENTLY idx_requests_created_at_desc
  ON requests(created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_room_created
  ON messages(chat_room_id, created_at);

-- Índice parcial para solicitudes activas
CREATE INDEX CONCURRENTLY idx_requests_active
  ON requests(estatus, prioridad)
  WHERE estatus IN ('nuevo', 'asignado', 'en_proceso');
```

### Monitoreo de Performance

```typescript
// utils/performance.ts

export const measureTime = async <T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
};

// Uso
const requests = await measureTime('Load Requests', () =>
  supabase.from('requests').select('*')
);
```

---

## 🧪 Testing

### Configuración de Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

### Tests Unitarios

```typescript
// __tests__/utils/validators.test.ts
import { validateEmail, validatePassword } from '@/utils/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('debe validar email correcto', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('debe rechazar email inválido', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('debe validar password fuerte', () => {
      const result = validatePassword('Pass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar password débil', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

### Tests de Integración

```typescript
// __tests__/contexts/AuthContext.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

describe('AuthContext', () => {
  it('debe iniciar sesión correctamente', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

### Script de Prueba de Solicitudes

Ver: `scripts/test-requests-creation.js`

```bash
# Ejecutar prueba
node scripts/test-requests-creation.js

# Salida esperada:
# ✅ Conexión a Supabase
# ✅ Usuario de prueba encontrado
# ✅ Solicitud creada
# ✅ Solicitud leída
# ✅ Solicitud eliminada
```

---

## 🚀 CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: TypeScript check
        run: npx tsc --noEmit

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build for Android
        run: eas build --platform android --non-interactive

      - name: Build for iOS
        run: eas build --platform ios --non-interactive
```

### EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 📊 Monitoreo

### Logging Strategy

```typescript
// utils/logger.ts

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private static instance: Logger;

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    // En desarrollo: console
    if (__DEV__) {
      console.log(logMessage, data || '');
    }

    // En producción: enviar a servicio de logging
    if (!__DEV__) {
      // Enviar a Sentry, LogRocket, etc.
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error) {
    this.log(LogLevel.ERROR, message, {
      message: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = Logger.getInstance();

// Uso
logger.info('Usuario inició sesión', { userId: user.id });
logger.error('Error al crear solicitud', error);
```

### Métricas y Analytics

```typescript
// utils/analytics.ts

export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  // Google Analytics, Mixpanel, etc.
  console.log('Track Event:', eventName, properties);
};

export const trackScreen = (screenName: string) => {
  trackEvent('screen_view', { screen_name: screenName });
};

// Uso en componentes
useEffect(() => {
  trackScreen('Requests');
}, []);

const handleCreateRequest = () => {
  trackEvent('request_created', {
    type: request.tipo,
    priority: request.prioridad,
  });
};
```

---

## 📞 Soporte Técnico

### Comandos Útiles

```bash
# Desarrollo
npm start                 # Iniciar desarrollo
npm run android          # Android
npm run ios              # iOS
npm run web              # Web

# Testing
npm test                 # Tests unitarios
npm run test:watch       # Tests en watch mode
npm run test:coverage    # Coverage report

# Calidad de código
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # TypeScript

# Build
npm run build:android    # Build Android
npm run build:ios        # Build iOS

# Utilidades
npm run clean            # Limpiar caché
npm run reset            # Reset completo
```

### Recursos

- **Expo Docs:** https://docs.expo.dev
- **Supabase Docs:** https://supabase.com/docs
- **React Native Docs:** https://reactnative.dev

---

**Documento mantenido por:** Equipo de Desarrollo ELMEC
**Última actualización:** Octubre 2025
**Versión:** 1.0.0
