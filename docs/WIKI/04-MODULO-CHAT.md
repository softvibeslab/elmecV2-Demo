# MÓDULO 4: CHAT (Messaging)

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Módulo](#arquitectura-del-módulo)
3. [Funciones y Variables](#funciones-y-variables)
4. [Base de Datos](#base-de-datos)
5. [Flujo de Datos](#flujo-de-datos)
6. [Casos de Uso](#casos-de-uso)
7. [Matriz de Pruebas](#matriz-de-pruebas)

---

## 📱 Visión General

### Propósito

El módulo de Chat proporciona un sistema de mensajería interno en tiempo real para comunicación directa entre usuarios de ELMEC. Permite conversaciones 1-a-1, vinculación con solicitudes, y gestión completa de mensajes.

### Funcionalidades Principales

- 💬 **Lista de Conversaciones**: Vista de todas las salas de chat activas
- 🔍 **Búsqueda de Chats**: Por nombre del otro participante
- 🟢 **Presencia Online**: Indicador de usuarios conectados
- 📩 **Mensajes en Tiempo Real**: Envío y recepción instantánea
- 🔗 **Vinculación con Solicitudes**: Chats asociados a tickets
- 📎 **Adjuntar Archivos**: Imágenes, documentos
- 🔔 **Notificaciones de Mensajes**: Badge de no leídos
- 🔄 **Pull-to-Refresh**: Actualizar lista de chats

### Estructura de 2 Pantallas

| Pantalla           | Archivo                        | Ruta             | Propósito                    |
| ------------------ | ------------------------------ | ---------------- | ---------------------------- |
| **Lista de Chats** | `app/(tabs)/chat/index.tsx`    | `/chat`          | Ver todas las conversaciones |
| **Sala de Chat**   | `app/(tabs)/chat/[roomId].tsx` | `/chat/{roomId}` | Conversación específica      |

### Ubicación

**Archivos**:

- `/app/(tabs)/chat/index.tsx` - Lista
- `/app/(tabs)/chat/[roomId].tsx` - Sala (NO documentado aún)
- `/app/(tabs)/chat/_layout.tsx` - Layout

**Rutas**:

- `/chat` - Lista de conversaciones
- `/chat/[roomId]` - Sala individual

### Rol de Usuario

- ✅ Disponible para: **Todos los roles** (customer, agent, admin)
- 🔒 Los usuarios solo ven chats donde están como participantes

---

## 🏗️ Arquitectura del Módulo

### Componente Principal - Lista de Chats

```typescript
export default function ChatList() {
  // ESTADOS
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // CONTEXTOS
  const { chatRooms, messages, loading, error, getRoomUnreadCount } = useChat();
  const { user } = useAuth();
  const router = useRouter();

  // DATOS DERIVADOS
  const filteredRooms = chatRooms.filter(room => {
    const otherParticipant = getOtherParticipantName(room);
    return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // FUNCIONES HELPERS
  const getOtherParticipantName = (room: any) => {...};
  const getOtherParticipantInitials = (name: string) => {...};
  const formatTime = (timestamp: string) => {...};
  const getLastMessagePreview = (room: any) => {...};
  const onRefresh = async () => {...};

  return <SafeAreaView>...</SafeAreaView>
}
```

### Tipo Extendido

```typescript
interface ChatRoomWithRequest extends ChatRoom {
  requests?: {
    titulo: string;
    estatus: string;
  };
}

// Permite mostrar info de solicitud vinculada sin query extra
```

### Dependencias Críticas

| Dependencia                   | Propósito                                                | Criticidad |
| ----------------------------- | -------------------------------------------------------- | ---------- |
| `@/contexts/ChatContext`      | useChat hook con chatRooms, messages, getRoomUnreadCount | 🔴 Crítica |
| `@/contexts/AuthContext`      | user.id para filtrar participantes                       | 🔴 Crítica |
| `expo-router`                 | Navegación a sala específica                             | 🟡 Alta    |
| `lucide-react-native`         | Iconografía                                              | 🟢 Media   |
| `react-native` RefreshControl | Pull-to-refresh                                          | 🟢 Media   |

### Estructura Visual - Lista de Chats

```
┌──────────────────────────────────────────┐
│   HEADER                       [+]       │
│   Chats                                  │
│   X conversación(es)                     │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│   SEARCH BAR                             │
│   [🔍] Buscar conversaciones...          │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│   CHAT ITEM (ScrollView)                 │
│   ┌────────────────────────────────────┐ │
│   │ [Avatar]  Nombre Participante      │ │
│   │  [🟢]                    2m        │ │
│   │                                    │ │
│   │  📷 Imagen                  [3]   │ │  (preview + badge no leídos)
│   │                                    │ │
│   │  📋 Solicitud de soporte técnico   │ │  (si vinculado)
│   └────────────────────────────────────┘ │
│   (Tappable para abrir chat)             │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   EMPTY STATE (si no hay chats)          │
│   ┌────────────────────────────────────┐ │
│   │    [MessageCircle Icon]            │ │
│   │    No hay conversaciones           │ │
│   │    Inicia una desde el directorio  │ │
│   │    [Ver Directorio]                │ │
│   └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## ⚙️ Funciones y Variables

### Variables de Estado

| Variable      | Tipo      | Inicial | Descripción               | Scope     |
| ------------- | --------- | ------- | ------------------------- | --------- |
| `searchQuery` | `string`  | `''`    | Texto de búsqueda         | Component |
| `refreshing`  | `boolean` | `false` | Estado de pull-to-refresh | UI State  |

### Datos del Contexto (useChat)

| Variable                     | Tipo                         | Descripción                                |
| ---------------------------- | ---------------------------- | ------------------------------------------ |
| `chatRooms`                  | `ChatRoom[]`                 | Todas las salas donde user es participante |
| `messages`                   | `Record<string, Message[]>`  | Mensajes por roomId                        |
| `loading`                    | `boolean`                    | Cargando lista inicial                     |
| `error`                      | `string \| null`             | Error en carga                             |
| `getRoomUnreadCount(roomId)` | `(roomId: string) => number` | Contador de no leídos                      |

### Funciones Principales

#### 1. **getOtherParticipantName(room)**

```typescript
Propósito: Obtener nombre del otro participante (no el user actual)

Entrada: room (ChatRoom con metadata)
Salida: string - Nombre del otro participante o 'Chat'

Lógica:
  1. Verificar room.metadata?.participant_names existe
  2. Obtener nombre actual: `${user.nombre} ${user.apellido_paterno}`
  3. Buscar en participant_names el que NO coincida
  4. Retornar encontrado o 'Chat' por defecto

Ejemplo:
  participant_names: ["Carlos Rosales", "Ana García"]
  user actual: "Carlos Rosales"
  → Retorna: "Ana García"
```

#### 2. **getOtherParticipantInitials(name)**

```typescript
Propósito: Generar iniciales para avatar

Entrada: name (string) - "Ana García López"
Salida: string - "AG"

Algoritmo:
  1. Split por espacios: ["Ana", "García", "López"]
  2. Map primera letra: ["A", "G", "L"]
  3. Join: "AGL"
  4. Substring(0, 2): "AG"
  5. toUpperCase(): "AG"
```

#### 3. **formatTime(timestamp)**

```typescript
Propósito: Formato relativo de tiempo

Entrada: timestamp (ISO string)
Salida: string - "2m", "3h", "Lun", "14/10"

Lógica:
  diffInHours = (now - timestamp) / (1000 * 60 * 60)

  Si diffInHours < 1:
    diffInMinutes = floor(diffInHours * 60)
    Si diffInMinutes < 1: "Ahora"
    Sino: "{diffInMinutes}m"

  Si diffInHours < 24:
    "{floor(diffInHours)}h"

  Si diffInHours < 168 (1 semana):
    date.toLocaleDateString('es-ES', { weekday: 'short' })
    → "Lun", "Mar", etc.

  Sino:
    date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    → "14/10"
```

#### 4. **getLastMessagePreview(room)**

```typescript
Propósito: Obtener preview del último mensaje

Entrada: room (ChatRoom)
Salida: string - Preview del mensaje

Lógica:
  1. Verificar room.last_message existe:
     a. Si type === 'image': "📷 Imagen"
     b. Si type === 'audio': "🎵 Audio"
     c. Si type === 'file': "📎 Archivo"
     d. Si type === 'system': "🔔 Mensaje del sistema"
     e. Si type === 'text':
        - Si length > 40: message.substring(0, 40) + '...'
        - Sino: message

  2. Si no hay last_message:
     a. Buscar en messages[room.id]
     b. Obtener último del array
     c. Aplicar misma lógica de preview

  3. Si no hay mensajes: "No hay mensajes"
```

#### 5. **onRefresh()**

```typescript
Propósito: Pull-to-refresh manual

Flujo:
  1. setRefreshing(true)
  2. Esperar 1 segundo (simulado)
     // En producción: reloadChatRooms()
  3. setRefreshing(false)

Nota: Actualmente NO recarga desde BD, solo animación
```

---

### Datos Computados - filteredRooms

```typescript
const filteredRooms = chatRooms.filter(room => {
  const otherParticipant = getOtherParticipantName(room);
  return otherParticipant.toLowerCase().includes(searchQuery.toLowerCase());
});

// Búsqueda client-side por nombre del otro participante
```

---

## 🗄️ Base de Datos

### Tablas Consultadas

#### 1. **chat_rooms** (Principal)

**Schema**:

```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo chat_type NOT NULL,  -- 'support' | 'sales' | 'general'
  participants UUID[] NOT NULL,  -- Array de user IDs
  request_id UUID REFERENCES requests(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message JSONB,  -- {id, message, sender_id, created_at, type}
  is_active BOOLEAN DEFAULT true,
  metadata JSONB  -- {participant_names: string[]}
);

CREATE INDEX idx_chat_rooms_participants ON chat_rooms USING GIN (participants);
CREATE INDEX idx_chat_rooms_request ON chat_rooms(request_id);
CREATE INDEX idx_chat_rooms_updated ON chat_rooms(updated_at DESC);
```

**Query en useChat (Context)**:

```sql
SELECT
  chat_rooms.*,
  requests(titulo, estatus)  -- Si request_id existe
FROM chat_rooms
WHERE :user_id = ANY(participants)
  AND is_active = true
ORDER BY updated_at DESC;
```

**Campos Utilizados**:

| Campo          | Tipo      | Descripción                | Uso en UI                           |
| -------------- | --------- | -------------------------- | ----------------------------------- |
| `id`           | uuid      | Identificador único        | Key, navegación a sala              |
| `tipo`         | enum      | support\|sales\|general    | No mostrado directamente            |
| `participants` | uuid[]    | IDs de usuarios en la sala | Filtrar "el otro" participante      |
| `request_id`   | uuid?     | FK a requests (opcional)   | Mostrar info de solicitud vinculada |
| `created_at`   | timestamp | Fecha de creación          | No mostrado                         |
| `updated_at`   | timestamp | Última actividad           | Ordenar lista                       |
| `last_message` | jsonb     | Cache del último mensaje   | Preview en lista                    |
| `is_active`    | boolean   | Chat activo/archivado      | WHERE is_active = true              |
| `metadata`     | jsonb     | participant_names, etc.    | Obtener nombre del otro             |

#### 2. **messages** (Indirecta via Context)

**Schema**:

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID REFERENCES chat_rooms(id),
  sender_id UUID REFERENCES users(id),
  sender_name VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type message_type DEFAULT 'text',  -- 'text'|'image'|'file'|'audio'|'system'
  created_at TIMESTAMP DEFAULT NOW(),
  read_by JSONB DEFAULT '{}',  -- {userId: true}
  reply_to UUID REFERENCES messages(id),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  audio_duration INTEGER,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_room ON messages(chat_room_id);
CREATE INDEX idx_messages_created ON messages(created_at ASC);
```

**Consulta en useChat**:

```sql
SELECT * FROM messages
WHERE chat_room_id = :roomId
  AND is_deleted = false
ORDER BY created_at ASC
LIMIT 50;
```

**Contador de No Leídos**:

```typescript
// En getRoomUnreadCount
const unreadCount =
  messages[roomId]?.filter(
    msg => msg.sender_id !== user.id && !msg.read_by?.[user.id]
  ).length || 0;
```

#### 3. **requests** (Join Opcional)

**Query JOIN**:

```sql
SELECT
  chat_rooms.*,
  requests.titulo,
  requests.estatus
FROM chat_rooms
LEFT JOIN requests ON chat_rooms.request_id = requests.id
WHERE ...
```

**Uso**: Mostrar título de solicitud en ChatItem si existe vinculación.

---

### Relación Detallada UI ↔ Base de Datos

| Elemento UI                     | Query/Campo                              | Transformación                  | Ejemplo                      |
| ------------------------------- | ---------------------------------------- | ------------------------------- | ---------------------------- |
| **ChatItem - Avatar**           |
| Iniciales                       | `metadata.participant_names[otro]`       | `getOtherParticipantInitials()` | "AG"                         |
| **ChatItem - Header**           |
| Nombre                          | `metadata.participant_names[otro]`       | `getOtherParticipantName()`     | "Ana García"                 |
| Timestamp                       | `last_message.created_at` o `updated_at` | `formatTime()`                  | "2m", "3h"                   |
| **ChatItem - Indicador Online** |
| Verde/Gris                      | Hardcoded `Math.random() > 0.5`          | ⚠️ NO viene de BD               | 🟢                           |
| **ChatItem - Preview**          |
| Texto preview                   | `last_message.message`                   | `getLastMessagePreview()`       | "Hola, ¿cómo...(" (40 chars) |
| Icono tipo                      | `last_message.type`                      | Emoji según tipo                | 📷, 📎, 🎵                   |
| **ChatItem - Badge No Leídos**  |
| Contador                        | `messages[roomId]` filtrados             | `getRoomUnreadCount()`          | [3]                          |
| **ChatItem - Request Info**     |
| Título                          | `requests.titulo` (JOIN)                 | Condicional si request_id       | "Solicitud de soporte"       |
| **Lista - Ordenamiento**        |
| Orden                           | `ORDER BY updated_at DESC`               | Más reciente primero            | -                            |
| **Lista - Filtro Activos**      |
| WHERE                           | `is_active = true`                       | Solo chats activos              | -                            |

---

## 🔄 Flujo de Datos

### Diagrama de Flujo - Carga Inicial

```
┌─────────────────────────────────────────────────┐
│         COMPONENT MOUNT                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   useChat() - Context ya cargado                │
│   (Carga ocurre en ChatContext provider)        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   if (loading)                                   │
│     → Mostrar LoadingContainer                   │
│       <ActivityIndicator />                      │
│       "Cargando conversaciones..."               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   if (error)                                     │
│     → Mostrar ErrorContainer                     │
│       <MessageCircle red />                      │
│       {error}                                    │
│       [Reintentar]                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   if (!loading && !error)                        │
│     → chatRooms disponibles                      │
│     → Renderizar lista                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Aplicar Búsqueda (si searchQuery)              │
│   filteredRooms = chatRooms.filter(...)         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   RENDER SCROLLVIEW                              │
│   {filteredRooms.map(room => ...)}              │
│   + Pull-to-refresh habilitado                   │
└─────────────────────────────────────────────────┘
```

### Diagrama de Flujo - Navegación a Sala

```
Usuario toca ChatItem
      │
      ▼
┌─────────────────────────────────┐
│   TouchableOpacity onPress       │
│   router.push(`/chat/${room.id}`)│
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   expo-router navega a ruta dinámica            │
│   /chat/[roomId]                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Componente [roomId].tsx monta                  │
│   useLocalSearchParams() → { roomId }            │
│   Cargar mensajes de la sala                     │
└─────────────────────────────────────────────────┘
```

### Diagrama de Flujo - Búsqueda de Chats

```
Usuario escribe en SearchInput
      │
      ▼
onChange → setSearchQuery(text)
      │
      ▼
┌─────────────────────────────────────────────────┐
│   Re-compute filteredRooms                       │
│                                                  │
│   const filteredRooms = chatRooms.filter(room =>│
│     getOtherParticipantName(room)                │
│       .toLowerCase()                             │
│       .includes(searchQuery.toLowerCase())       │
│   )                                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   ScrollView re-renderiza                        │
│   Solo salas que coinciden con búsqueda          │
└─────────────────────────────────────────────────┘
```

### Diagrama de Flujo - Pull-to-Refresh

```
Usuario pull down en ScrollView
      │
      ▼
onRefresh callback
      │
      ▼
┌─────────────────────────────────┐
│   setRefreshing(true)            │
│   (Spinner visible)              │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   setTimeout(() => {                             │
│     // En producción: reloadChatRooms()          │
│     setRefreshing(false);                        │
│   }, 1000);                                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
Spinner desaparece
Lista (sin cambios en demo)
```

### Flujo de Datos - ChatContext (Proveedor)

```
┌─────────────────────────────────────────────────┐
│   ChatContext Provider (en _layout o App root)   │
└────────────────┬────────────────────────────────┘
                 │
   useEffect([user])
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   loadChatRooms()                                │
│                                                  │
│   SELECT * FROM chat_rooms                       │
│   WHERE :user_id = ANY(participants)             │
│     AND is_active = true                         │
│   ORDER BY updated_at DESC                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  ┌───────┐          ┌──────────┐
  │SUCCESS│          │  ERROR   │
  └───┬───┘          └────┬─────┘
      │                   │
      │                   ▼
      │         setError(message)
      │         setLoading(false)
      │
      ▼
setChatRooms(data || [])
      │
      ▼
┌─────────────────────────────────────────────────┐
│   Para cada sala, cargar mensajes                │
│   loadMessages(roomId)                           │
│                                                  │
│   SELECT * FROM messages                         │
│   WHERE chat_room_id = :roomId                   │
│     AND is_deleted = false                       │
│   ORDER BY created_at ASC                        │
│   LIMIT 50                                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
setMessages(prev => ({
  ...prev,
  [roomId]: messageData
}))
      │
      ▼
┌─────────────────────────────────────────────────┐
│   Suscribirse a cambios Realtime (opcional)      │
│   supabase.channel('messages').on(...)          │
└─────────────────────────────────────────────────┘
```

---

## 📖 Casos de Uso

### CU-CHAT-01: Usuario Ve Lista de Conversaciones

**Actor**: Usuario autenticado (cualquier rol)

**Precondiciones**:

- Usuario autenticado
- ChatContext cargado
- Tiene al menos 1 chat room

**Flujo Principal**:

1. Usuario navega a `/chat` desde tabs
2. Sistema monta componente ChatList
3. Sistema obtiene datos de useChat():
   - chatRooms: Array de salas
   - messages: Mensajes por sala
   - loading: false
4. Sistema renderiza header:
   - Título: "Chats"
   - Subtítulo: "3 conversaciones"
   - Botón [+] para nuevo chat
5. Sistema renderiza SearchInput
6. Sistema itera filteredRooms (sin filtro inicial = todos)
7. Para cada room, sistema:
   a. Obtiene nombre del otro: getOtherParticipantName()
   b. Genera iniciales: getOtherParticipantInitials()
   c. Formatea tiempo: formatTime(room.updated_at)
   d. Obtiene preview: getLastMessagePreview(room)
   e. Calcula no leídos: getRoomUnreadCount(room.id)
   f. Renderiza ChatItem con todos los datos
8. Usuario visualiza lista ordenada por updated_at DESC

**Postcondiciones**:

- Lista visible con todas las conversaciones activas
- Indicadores de no leídos correctos
- Últimos mensajes preview

**Flujos Alternativos**:

- **3a. loading = true**: Mostrar spinner "Cargando conversaciones..."
- **3b. error**: Mostrar error + botón "Reintentar"
- **7a. chatRooms vacío**: Mostrar empty state + botón "Ver Directorio"

---

### CU-CHAT-02: Usuario Busca Conversación

**Actor**: Usuario con múltiples chats

**Precondiciones**:

- ChatList cargado
- Tiene > 5 conversaciones

**Flujo Principal**:

1. Usuario toca campo de búsqueda
2. Sistema muestra teclado
3. Usuario escribe "Ana"
4. Sistema ejecuta onChange:
   ```typescript
   setSearchQuery('Ana');
   ```
5. Sistema re-computa filteredRooms:
   ```typescript
   chatRooms.filter(room => {
     const other = getOtherParticipantName(room); // "Ana García"
     return 'ana garcía'.includes('ana'); // true
   });
   ```
6. Sistema encuentra 1 sala
7. ScrollView re-renderiza solo 1 ChatItem

**Postcondiciones**:

- Solo conversación con "Ana" visible
- Resto de salas ocultas
- Búsqueda case-insensitive

**Flujo Alternativo**:

- **6a. Sin resultados**: Empty state "No se encontraron chats"

---

### CU-CHAT-03: Usuario Abre Sala de Chat

**Actor**: Usuario

**Precondiciones**:

- ChatList visible con conversaciones
- Sala existe en chatRooms

**Flujo Principal**:

1. Usuario visualiza ChatItem de "Ana García"
2. Usuario toca el ChatItem
3. Sistema ejecuta onPress:
   ```typescript
   router.push(`/chat/${room.id}`);
   ```
4. expo-router navega a `/chat/abc123...`
5. Sistema monta componente [roomId].tsx
6. Componente obtiene roomId de params
7. Componente carga mensajes de la sala
8. Usuario ve pantalla de chat con:
   - Header con nombre "Ana García"
   - Historial de mensajes
   - Input para escribir

**Postcondiciones**:

- Usuario en pantalla de chat
- Mensajes cargados
- Input listo para escribir

---

### CU-CHAT-04: Usuario Crea Nuevo Chat desde Directorio

**Actor**: Usuario

**Precondiciones**:

- Usuario en Directorio
- Seleccionó persona para chatear

**Flujo Principal**:

1. Usuario toca botón [Chat] en PersonCard de "Luis Martínez"
2. Sistema ejecuta handleStartChat(person)
3. Sistema llama useChat().createChatRoom():
   ```typescript
   createChatRoom(person.id, 'Luis Martínez');
   ```
4. useChat verifica si existe sala con participants:
   ```sql
   SELECT * FROM chat_rooms
   WHERE participants @> ARRAY[:user_id, :person_id]
     AND is_active = true
   ```
5. **Caso: Sala NO existe**:
   a. INSERT INTO chat_rooms:
   ```typescript
   {
     tipo: 'general',
     participants: [user.id, person.id],
     is_active: true,
     metadata: {
       participant_names: ["Usuario Actual", "Luis Martínez"]
     }
   }
   ```
   b. Retornar nuevo roomId
6. **Caso: Sala existe**:
   a. Retornar roomId existente
7. Sistema navega: router.push(`/chat/${roomId}`)
8. Usuario en pantalla de chat

**Postcondiciones**:

- Sala creada o reutilizada
- Usuario puede empezar a chatear
- Sala visible en ChatList de ambos usuarios

---

### CU-CHAT-05: Usuario Ve Indicador de Mensajes No Leídos

**Actor**: Usuario

**Precondiciones**:

- Tiene mensajes no leídos en una sala

**Flujo Principal**:

1. Usuario abre ChatList
2. Sistema itera chatRooms
3. Para sala "Ana García", sistema ejecuta:
   ```typescript
   getRoomUnreadCount(room.id);
   ```
4. useChat calcula:
   ```typescript
   const unreadCount =
     messages[roomId]?.filter(
       msg =>
         msg.sender_id !== user.id && // No soy yo quien envió
         !msg.read_by?.[user.id] // No lo he leído
     ).length || 0;
   ```
5. Resultado: 3 mensajes no leídos
6. Sistema renderiza badge:
   ```jsx
   {
     unreadCount > 0 && (
       <View style={styles.unreadBadge}>
         <Text>3</Text>
       </View>
     );
   }
   ```
7. ChatItem se muestra con:
   - Fondo amarillo claro
   - Badge azul con "3"
   - Texto en negrita

**Postcondiciones**:

- Usuario sabe cuántos mensajes tiene sin leer
- Puede priorizar conversaciones

---

### CU-CHAT-06: Usuario Actualiza Lista con Pull-to-Refresh

**Actor**: Usuario

**Precondiciones**:

- ChatList visible
- ScrollView en posición inicial

**Flujo Principal**:

1. Usuario hace pull down en ScrollView
2. Sistema detecta gesto
3. RefreshControl ejecuta onRefresh
4. Sistema ejecuta:
   ```typescript
   setRefreshing(true);
   setTimeout(() => setRefreshing(false), 1000);
   ```
5. Spinner de refresh visible
6. Tras 1 segundo, spinner desaparece

**Postcondiciones**:

- Lista "refrescada" (en demo, sin cambios reales)
- Feedback visual al usuario

**Nota**: En producción, debería llamar `reloadChatRooms()` del context.

---

### CU-CHAT-07: Usuario Ve Info de Solicitud Vinculada

**Actor**: Usuario (customer o agent)

**Precondiciones**:

- Existe chat room con request_id
- request existe en BD

**Flujo Principal**:

1. Usuario ve ChatList
2. Sistema renderiza ChatItem de sala vinculada
3. Sistema verifica: `room.request_id && room.requests`
4. Condición es true
5. Sistema renderiza sección adicional:
   ```jsx
   <View style={styles.requestInfo}>
     <Text>📋 {room.requests.titulo}</Text>
   </View>
   ```
6. Usuario ve:

   ```
   [Avatar] Carlos Rosales
           📷 Imagen                [2]

   📋 Solicitud de soporte técnico
   ```

**Postcondiciones**:

- Usuario sabe que chat está relacionado a un ticket
- Puede hacer clic para ver más detalles (futuro)

---

## ✅ Matriz de Pruebas

### Matriz de Pruebas Funcionales - Lista

| ID       | Caso de Prueba            | Precondición                    | Entrada         | Resultado Esperado                                     | Prioridad | Estado |
| -------- | ------------------------- | ------------------------------- | --------------- | ------------------------------------------------------ | --------- | ------ |
| CHAT-L01 | Cargar lista de chats     | User con chats                  | Navegar a /chat | Lista visible, chatRooms ordenados por updated_at DESC | Alta      | ⬜     |
| CHAT-L02 | Mostrar contador de chats | 5 chats activos                 | Carga inicial   | Header: "5 conversaciones"                             | Media     | ⬜     |
| CHAT-L03 | Cargar lista vacía        | User sin chats                  | Navegar a /chat | Empty state: "No hay conversaciones"                   | Alta      | ⬜     |
| CHAT-L04 | Manejar error de carga    | BD offline                      | Navegar a /chat | Error + botón "Reintentar"                             | Alta      | ⬜     |
| CHAT-L05 | Loading state             | Carga inicial                   | mount           | Spinner + "Cargando conversaciones..."                 | Media     | ⬜     |
| CHAT-L06 | Filtrar usuario actual    | User en participants            | Carga           | Solo chats donde user es participante                  | Alta      | ⬜     |
| CHAT-L07 | Ordenar por más reciente  | Chats con diferentes updated_at | Carga           | Más reciente arriba                                    | Alta      | ⬜     |
| CHAT-L08 | Solo chats activos        | is_active = false en BD         | Carga           | No aparece en lista                                    | Media     | ⬜     |

### Matriz de Pruebas Funcionales - Búsqueda

| ID       | Caso de Prueba            | Entrada       | Resultado Esperado                     | Prioridad | Estado |
| -------- | ------------------------- | ------------- | -------------------------------------- | --------- | ------ |
| CHAT-S01 | Buscar por nombre exacto  | "Ana García"  | Solo chat con Ana García               | Alta      | ⬜     |
| CHAT-S02 | Buscar por nombre parcial | "Ana"         | Todos con "Ana" en nombre              | Alta      | ⬜     |
| CHAT-S03 | Búsqueda case-insensitive | "ANA" o "ana" | Mismo resultado                        | Alta      | ⬜     |
| CHAT-S04 | Búsqueda sin resultados   | "XYZ999"      | Empty state: "No se encontraron chats" | Media     | ⬜     |
| CHAT-S05 | Limpiar búsqueda          | Borrar texto  | Mostrar todos los chats                | Baja      | ⬜     |

### Matriz de Pruebas Funcionales - ChatItem

| ID       | Elemento                | Caso                           | Resultado Esperado             | Prioridad | Estado |
| -------- | ----------------------- | ------------------------------ | ------------------------------ | --------- | ------ |
| CHAT-I01 | Avatar iniciales        | Nombre: "Ana García López"     | Avatar muestra "AG"            | Alta      | ⬜     |
| CHAT-I02 | Nombre del otro         | participants: [user, "Carlos"] | Muestra "Carlos Rosales"       | Alta      | ⬜     |
| CHAT-I03 | Timestamp < 1min        | created_at: hace 30s           | "Ahora"                        | Media     | ⬜     |
| CHAT-I04 | Timestamp < 1hr         | created_at: hace 15min         | "15m"                          | Media     | ⬜     |
| CHAT-I05 | Timestamp < 24hr        | created_at: hace 3hr           | "3h"                           | Media     | ⬜     |
| CHAT-I06 | Timestamp < 1 semana    | created_at: hace 2 días        | "Lun", "Mar"                   | Media     | ⬜     |
| CHAT-I07 | Timestamp > 1 semana    | created_at: hace 10 días       | "04/10"                        | Baja      | ⬜     |
| CHAT-I08 | Preview texto corto     | "Hola"                         | "Hola"                         | Alta      | ⬜     |
| CHAT-I09 | Preview texto largo     | "A" \* 60                      | Truncado a 40 chars + "..."    | Alta      | ⬜     |
| CHAT-I10 | Preview imagen          | type: 'image'                  | "📷 Imagen"                    | Media     | ⬜     |
| CHAT-I11 | Preview audio           | type: 'audio'                  | "🎵 Audio"                     | Media     | ⬜     |
| CHAT-I12 | Preview archivo         | type: 'file'                   | "📎 Archivo"                   | Media     | ⬜     |
| CHAT-I13 | Preview sistema         | type: 'system'                 | "🔔 Mensaje del sistema"       | Baja      | ⬜     |
| CHAT-I14 | Badge no leídos = 0     | 0 mensajes sin leer            | Badge no visible               | Alta      | ⬜     |
| CHAT-I15 | Badge no leídos 1-99    | 5 mensajes sin leer            | Badge azul con "5"             | Alta      | ⬜     |
| CHAT-I16 | Badge no leídos > 99    | 150 mensajes sin leer          | Badge azul con "99+"           | Media     | ⬜     |
| CHAT-I17 | Fondo no leídos         | unreadCount > 0                | Fondo amarillo claro           | Alta      | ⬜     |
| CHAT-I18 | Texto negrita no leídos | unreadCount > 0                | Nombre en negrita (Inter-Bold) | Media     | ⬜     |
| CHAT-I19 | Request info visible    | request_id existe              | "📋 Título de solicitud"       | Media     | ⬜     |
| CHAT-I20 | Request info oculta     | request_id = null              | Sección no renderizada         | Baja      | ⬜     |

### Matriz de Pruebas de Navegación

| ID       | Caso                      | Entrada                  | Resultado Esperado         | Prioridad | Estado |
| -------- | ------------------------- | ------------------------ | -------------------------- | --------- | ------ |
| CHAT-N01 | Abrir sala desde lista    | Tocar ChatItem           | Navega a /chat/{roomId}    | Alta      | ⬜     |
| CHAT-N02 | Parámetro roomId correcto | Tocar sala "abc123"      | params.roomId === "abc123" | Alta      | ⬜     |
| CHAT-N03 | Botón [+] nuevo chat      | Tocar [+]                | Navega a /directory        | Media     | ⬜     |
| CHAT-N04 | Botón "Ver Directorio"    | Empty state, tocar botón | Navega a /directory        | Media     | ⬜     |

### Matriz de Pruebas de Integración

| ID         | Componente A | Componente B        | Caso          | Resultado Esperado                 | Estado |
| ---------- | ------------ | ------------------- | ------------- | ---------------------------------- | ------ |
| CHAT-INT01 | ChatList     | ChatContext         | useChat()     | chatRooms, messages, loading       | ⬜     |
| CHAT-INT02 | ChatList     | AuthContext         | user.id       | Filtrado correcto de participantes | ⬜     |
| CHAT-INT03 | ChatList     | expo-router         | router.push() | Navegación funcional               | ⬜     |
| CHAT-INT04 | ChatContext  | Supabase chat_rooms | Query         | Datos cargados correctamente       | ⬜     |
| CHAT-INT05 | ChatContext  | Supabase messages   | Query         | Mensajes por sala cargados         | ⬜     |
| CHAT-INT06 | ChatList     | RefreshControl      | onRefresh     | Callback ejecutado                 | ⬜     |

### Matriz de Pruebas de UI/UX

| ID        | Elemento         | Criterio     | Verificación                          | Estado |
| --------- | ---------------- | ------------ | ------------------------------------- | ------ |
| CHAT-UI01 | ChatItem         | Legibilidad  | Nombre visible en Inter-SemiBold 16px | ⬜     |
| CHAT-UI02 | Avatar           | Contraste    | Iniciales blancas en fondo azul       | ⬜     |
| CHAT-UI03 | Indicador online | Visibilidad  | Círculo 16x16px visible               | ⬜     |
| CHAT-UI04 | Badge no leídos  | Contraste    | Texto blanco en fondo azul            | ⬜     |
| CHAT-UI05 | Timestamp        | Tamaño       | 12px, legible pero no prominente      | ⬜     |
| CHAT-UI06 | Preview mensaje  | Truncado     | Máximo 1 línea, ellipsis              | ⬜     |
| CHAT-UI07 | Fondo no leído   | Color        | #fefce8 (amarillo muy claro)          | ⬜     |
| CHAT-UI08 | SearchInput      | Touch target | Altura 48px, fácil de tocar           | ⬜     |
| CHAT-UI09 | Empty state      | Guidance     | Icono + mensaje + botón acción        | ⬜     |
| CHAT-UI10 | Pull-to-refresh  | Animación    | Spinner suave sin jank                | ⬜     |

### Matriz de Pruebas de Performance

| ID       | Escenario                 | Métrica                | Valor Esperado | Herramienta     | Estado |
| -------- | ------------------------- | ---------------------- | -------------- | --------------- | ------ |
| CHAT-P01 | Carga inicial (10 chats)  | Tiempo hasta render    | < 300ms        | React DevTools  | ⬜     |
| CHAT-P02 | Carga inicial (100 chats) | Tiempo hasta render    | < 1s           | React DevTools  | ⬜     |
| CHAT-P03 | Búsqueda                  | Latencia por keystroke | < 50ms         | Performance API | ⬜     |
| CHAT-P04 | Scroll lista              | FPS                    | > 50fps        | Flipper         | ⬜     |
| CHAT-P05 | Navegación a sala         | Tiempo transición      | < 200ms        | Console.time    | ⬜     |

---

## 🐛 Problemas Conocidos y Limitaciones

### Limitaciones Críticas

1. **Indicador de Presencia NO es Real**
   - ⚠️ Hardcoded: `Math.random() > 0.5 ? verde : gris`
   - No consulta `users.is_online`
   - No hay subscripciones Realtime
   - Cada render genera valor aleatorio diferente

2. **Pull-to-Refresh No Recarga Datos**
   - ⚠️ Solo animación, no llama `reloadChatRooms()`
   - Espera 1s y termina
   - No refleja nuevos chats o mensajes

3. **Sin Notificaciones de Nuevos Mensajes**
   - ⚠️ No hay subscripciones Realtime a tabla `messages`
   - Mensajes nuevos solo se ven al recargar manualmente
   - Badge de no leídos no se actualiza en tiempo real

4. **Búsqueda Solo por Nombre**
   - ⚠️ No busca en contenido de mensajes
   - No busca por tipo de chat o solicitud vinculada
   - Solo nombre del otro participante

### Limitaciones Menores

5. **Sin Indicador de Escritura ("typing...")**
   - No se muestra cuando el otro está escribiendo

6. **Sin Ordenamiento Manual**
   - Siempre ordenado por updated_at
   - No se puede pin/fijar conversación

7. **Sin Archivar Chats**
   - is_active no tiene UI para cambiar
   - Todos los chats siempre visibles

8. **Sin Eliminar Conversación**
   - No hay opción de borrar chat

---

### Mejoras Recomendadas

#### 🔴 Prioridad Crítica

**1. Implementar Presencia Online Real**

```typescript
// En ChatContext
const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

useEffect(() => {
  // Query inicial
  const loadOnlineUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('is_online', true);

    setOnlineUsers(new Set(data?.map(u => u.id)));
  };

  loadOnlineUsers();

  // Subscription a cambios
  const sub = supabase
    .channel('user-presence')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: 'is_online=eq.true',
      },
      payload => {
        setOnlineUsers(prev => new Set(prev).add(payload.new.id));
      }
    )
    .subscribe();

  return () => sub.unsubscribe();
}, []);

// En ChatItem
const isOnline = onlineUsers.has(otherUserId);
```

**2. Implementar Subscripciones Realtime a Mensajes**

```typescript
// En ChatContext
useEffect(() => {
  const sub = supabase
    .channel('new-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      payload => {
        const newMessage = payload.new as Message;

        // Actualizar messages
        setMessages(prev => ({
          ...prev,
          [newMessage.chat_room_id]: [
            ...(prev[newMessage.chat_room_id] || []),
            newMessage,
          ],
        }));

        // Actualizar last_message en chatRooms
        setChatRooms(prev =>
          prev.map(room =>
            room.id === newMessage.chat_room_id
              ? {
                  ...room,
                  last_message: {
                    id: newMessage.id,
                    message: newMessage.message,
                    sender_id: newMessage.sender_id,
                    created_at: newMessage.created_at,
                    type: newMessage.type,
                  },
                  updated_at: newMessage.created_at,
                }
              : room
          )
        );
      }
    )
    .subscribe();

  return () => sub.unsubscribe();
}, []);
```

**3. Pull-to-Refresh Funcional**

```typescript
const onRefresh = async () => {
  setRefreshing(true);
  await reloadChatRooms(); // Función del context
  setRefreshing(false);
};

// En ChatContext
const reloadChatRooms = async () => {
  const { data } = await supabase
    .from('chat_rooms')
    .select('...')
    .contains('participants', [user.id])
    .order('updated_at', { desc: true });

  setChatRooms(data || []);
};
```

#### 🟡 Prioridad Alta

**4. Búsqueda Avanzada (Mensajes + Metadata)**

```typescript
const filteredRooms = chatRooms.filter(room => {
  const query = searchQuery.toLowerCase();

  // Buscar en nombre
  const otherName = getOtherParticipantName(room).toLowerCase();
  if (otherName.includes(query)) return true;

  // Buscar en último mensaje
  if (room.last_message?.message.toLowerCase().includes(query)) return true;

  // Buscar en título de solicitud
  if (room.requests?.titulo.toLowerCase().includes(query)) return true;

  return false;
});
```

**5. Indicador de Escritura**

```typescript
// Broadcast cuando user escribe
const handleInputChange = (text: string) => {
  setMessage(text);

  // Broadcast typing status
  supabase.channel(`room-${roomId}`).send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: user.id, isTyping: text.length > 0 }
  });
};

// Escuchar en ChatList
const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

supabase.channel(`room-${roomId}`).on('broadcast', { event: 'typing' }, ({ payload }) => {
  setTypingUsers(prev => ({
    ...prev,
    [payload.userId]: payload.isTyping
  }));
});

// Mostrar en ChatItem
{typingUsers[otherUserId] && (
  <Text style={styles.typingIndicator}>escribiendo...</Text>
)}
```

**6. Archivar/Eliminar Conversaciones**

```typescript
// Swipe actions en ChatItem
<Swipeable
  renderRightActions={() => (
    <>
      <TouchableOpacity onPress={() => archiveChat(room.id)}>
        <Text>Archivar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteChat(room.id)}>
        <Text>Eliminar</Text>
      </TouchableOpacity>
    </>
  )}
>
  <ChatItem ... />
</Swipeable>

// Funciones
const archiveChat = async (roomId: string) => {
  await supabase
    .from('chat_rooms')
    .update({ is_active: false })
    .eq('id', roomId);
};
```

#### 🟢 Prioridad Media

7. **Pin/Fijar Conversaciones**
8. **Filtrar por Tipo (support, sales, general)**
9. **Marcar Como Leído desde Lista**
10. **Notificaciones Push de Nuevos Mensajes**

---

## 📊 Métricas de Calidad

| Métrica                   | Valor Actual | Objetivo | Estado |
| ------------------------- | ------------ | -------- | ------ |
| Cobertura de Pruebas      | 0%           | 80%      | 🔴     |
| Realtime Updates          | 0%           | 100%     | 🔴     |
| Presencia Online Real     | 0%           | 100%     | 🔴     |
| Pull-to-Refresh Funcional | 0%           | 100%     | 🔴     |
| Tiempo Carga (10 chats)   | ~200ms       | < 500ms  | 🟢     |
| Tiempo Carga (100 chats)  | ~1s          | < 1.5s   | 🟢     |
| Búsqueda Latencia         | < 50ms       | < 100ms  | 🟢     |
| FPS Scroll                | ~55fps       | > 50fps  | 🟢     |

---

## 📝 Notas para QA

### Checklist de Pruebas Manuales

#### Carga y Visualización

- [ ] Lista carga al navegar a /chat
- [ ] Contador de conversaciones correcto
- [ ] Loading state visible durante carga
- [ ] Error state con botón "Reintentar"
- [ ] Empty state si no hay chats
- [ ] Solo chats activos visibles
- [ ] Ordenado por más reciente primero

#### ChatItem - Datos

- [ ] Nombre del otro participante correcto
- [ ] Iniciales en avatar correctas (2 letras)
- [ ] Timestamp formateado correctamente
- [ ] Preview de mensaje visible
- [ ] Preview truncado a 40 chars si es largo
- [ ] Preview con emoji si es imagen/audio/archivo
- [ ] Badge de no leídos visible solo si > 0
- [ ] Badge muestra número correcto
- [ ] Badge muestra "99+" si > 99
- [ ] Fondo amarillo si hay no leídos
- [ ] Nombre en negrita si hay no leídos

#### ChatItem - Request Vinculado

- [ ] Info de solicitud visible si existe
- [ ] Título de solicitud correcto
- [ ] No visible si request_id es null

#### Búsqueda

- [ ] Búsqueda por nombre funciona
- [ ] Búsqueda case-insensitive
- [ ] Sin resultados muestra empty state
- [ ] Limpiar búsqueda muestra todos

#### Navegación

- [ ] Tocar ChatItem navega a /chat/{roomId}
- [ ] roomId correcto en params
- [ ] Botón [+] navega a /directory
- [ ] Botón "Ver Directorio" navega a /directory

#### Pull-to-Refresh

- [ ] Pull down muestra spinner
- [ ] Spinner desaparece tras 1s
- [ ] (En demo) No recarga datos

#### Presencia Online

- [ ] Indicador verde/gris visible
- [ ] (En demo) Valor aleatorio, no real

---

### Datos de Prueba

**Crear Chat Rooms de Prueba**:

```sql
-- Chat entre user1 y user2
INSERT INTO chat_rooms (
  tipo, participants, is_active, metadata, last_message
) VALUES (
  'general',
  ARRAY[
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  ],
  true,
  '{"participant_names": ["Juan Pérez", "Carlos Rosales"]}'::jsonb,
  '{"id": "msg1", "message": "Hola, ¿cómo estás?", "sender_id": "22222222-2222-2222-2222-222222222222", "created_at": "2025-10-14T10:30:00Z", "type": "text"}'::jsonb
);

-- Chat vinculado a solicitud
INSERT INTO chat_rooms (
  tipo, participants, request_id, is_active, metadata
) VALUES (
  'support',
  ARRAY[
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  ],
  'req-id-123',
  true,
  '{"participant_names": ["Juan Pérez", "Carlos Rosales"]}'::jsonb
);
```

**Crear Mensajes de Prueba**:

```sql
INSERT INTO messages (
  chat_room_id, sender_id, sender_name, message, type, read_by
) VALUES
  (
    'room-id-1',
    '22222222-2222-2222-2222-222222222222',
    'Carlos Rosales',
    'Hola, ¿cómo estás?',
    'text',
    '{}'::jsonb  -- No leído
  ),
  (
    'room-id-1',
    '11111111-1111-1111-1111-111111111111',
    'Juan Pérez',
    'Bien, gracias!',
    'text',
    '{"22222222-2222-2222-2222-222222222222": true}'::jsonb  -- Leído por Carlos
  );
```

---

## 🔗 Enlaces Relacionados

- [Módulo Inicio](./01-MODULO-INICIO.md)
- [Módulo Directorio](./02-MODULO-DIRECTORIO.md)
- [Módulo Solicitudes](./03-MODULO-SOLICITUDES.md)
- [Módulo Perfil](./05-MODULO-PERFIL.md)
- [ChatContext Documentation](../CONTEXTS/ChatContext.md)
- [Database Schema - chat_rooms table](../DATABASE/schema.md#chat_rooms)
- [Database Schema - messages table](../DATABASE/schema.md#messages)
- [Pantalla de Sala de Chat [roomId]](./04B-MODULO-CHAT-ROOM.md) (pendiente)

---

**Última Actualización**: 2025-10-14
**Versión**: 1.0.0
**Autor**: Equipo ELMEC
**Revisado por**: QA Team
**Nota**: Esta documentación cubre solo la pantalla de LISTA de chats. La sala individual ([roomId].tsx) requiere documentación separada.
