# WIKI PRINCIPAL - ELMEC MOBILE APP

## TABLA DE CONTENIDOS

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura Global](#arquitectura-global)
3. [Casos de Uso Transversales](#casos-de-uso-transversales)
4. [Flujo de Datos Entre Módulos](#flujo-de-datos-entre-módulos)
5. [Modelo de Datos Completo](#modelo-de-datos-completo)
6. [Contextos y Estado Global](#contextos-y-estado-global)
7. [Navegación y Routing](#navegación-y-routing)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Realtime y Subscriptions](#realtime-y-subscriptions)
10. [Guías de Desarrollo](#guías-de-desarrollo)

---

## VISIÓN GENERAL DEL SISTEMA

### Propósito

ELMEC Mobile App es una aplicación empresarial integral para gestión de personal, comunicación interna y seguimiento de solicitudes de servicio. Permite a los empleados:

- 📊 **Monitorear** actividad y métricas de la empresa
- 👥 **Conectar** con colegas y iniciar comunicación
- 📝 **Gestionar** solicitudes de servicio con seguimiento completo
- 💬 **Comunicar** en tiempo real vía chat
- ⚙️ **Configurar** preferencias y perfil personal

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│         ELMEC Mobile App                │
├─────────────────────────────────────────┤
│  Frontend Framework                     │
│  • React Native (Expo)                  │
│  • TypeScript                           │
│  • Expo Router (file-based routing)     │
├─────────────────────────────────────────┤
│  UI Components                          │
│  • React Native components              │
│  • lucide-react-native (icons)          │
│  • Custom styled components             │
├─────────────────────────────────────────┤
│  State Management                       │
│  • React Context API                    │
│  • useState, useEffect hooks            │
│  • Custom hooks                         │
├─────────────────────────────────────────┤
│  Backend & Database                     │
│  • Supabase (PostgreSQL)                │
│  • Supabase Auth                        │
│  • Supabase Realtime                    │
│  • Supabase Storage                     │
├─────────────────────────────────────────┤
│  Notifications                          │
│  • Expo Notifications (mobile)          │
│  • Web Notifications API (web)          │
├─────────────────────────────────────────┤
│  Deployment                             │
│  • Netlify (web)                        │
│  • Expo EAS (mobile - future)           │
└─────────────────────────────────────────┘
```

### Módulos del Sistema

| Módulo          | Ruta                         | Descripción                                   | Usuarios |
| --------------- | ---------------------------- | --------------------------------------------- | -------- |
| **Inicio**      | `/(tabs)/index.tsx`          | Dashboard con estadísticas y acciones rápidas | Todos    |
| **Directorio**  | `/(tabs)/directory.tsx`      | Listado de personal con búsqueda y filtros    | Todos    |
| **Solicitudes** | `/(tabs)/requests/index.tsx` | Sistema de tickets/requests                   | Todos    |
| **Chat**        | `/(tabs)/chat/index.tsx`     | Lista de conversaciones                       | Todos    |
| **Perfil**      | `/(tabs)/profile.tsx`        | Perfil de usuario o AdminDashboard            | Todos    |

---

## ARQUITECTURA GLOBAL

### Diagrama de Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (React Native)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────┐  ┌───────┐│
│  │  Inicio   │  │Directorio │  │Solicitudes│  │ Chat  │  │Perfil ││
│  │ Dashboard │  │  Personal │  │  Tickets  │  │  List │  │ User  ││
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───┬───┘  └───┬───┘│
│        │              │              │            │          │    │
│        └──────────────┴──────────────┴────────────┴──────────┘    │
│                                │                                   │
│  ┌─────────────────────────────┴───────────────────────────────┐  │
│  │                     CONTEXTS LAYER                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │   Auth   │  │   Chat   │  │  Notif   │  │  Theme   │   │  │
│  │  │ Context  │  │ Context  │  │ Context  │  │ Context  │   │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │  │
│  └───────┼─────────────┼─────────────┼─────────────┼──────────┘  │
│          │             │             │             │             │
│  ┌───────┴─────────────┴─────────────┴─────────────┴──────────┐  │
│  │                   SUPABASE CLIENT                           │  │
│  │  • Auth Manager                                             │  │
│  │  • Query Builder                                            │  │
│  │  • Realtime Manager                                         │  │
│  │  • Storage Manager                                          │  │
│  └─────────────────────────┬───────────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │    INTERNET     │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                    SUPABASE CLOUD                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   AUTH       │  │  REALTIME    │  │   STORAGE    │           │
│  │              │  │              │  │              │           │
│  │ • JWT Tokens │  │ • WebSockets │  │ • Files      │           │
│  │ • Sessions   │  │ • Presence   │  │ • Images     │           │
│  │ • Users      │  │ • Broadcast  │  │ • Documents  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│  ┌──────┴─────────────────┴─────────────────┴──────┐            │
│  │          POSTGRESQL DATABASE                     │            │
│  │                                                   │            │
│  │  Tables:                                          │            │
│  │  • users                                          │            │
│  │  • requests (solicitudes)                         │            │
│  │  • chat_rooms                                     │            │
│  │  • messages                                       │            │
│  │  • notifications (future)                         │            │
│  │                                                   │            │
│  │  RLS Policies: ✅ users, ⚠️ requests              │            │
│  │  Indexes: On foreign keys & timestamps           │            │
│  │  Triggers: updated_at automation                 │            │
│  └───────────────────────────────────────────────────┘            │
└────────────────────────────────────────────────────────────────────┘
```

---

### Arquitectura de Componentes

```
App Root (_layout.tsx)
│
├─> Providers Wrapper
│   ├─> AuthProvider (sesión, usuario, logout)
│   ├─> NotificationProvider (in-app, push)
│   └─> ChatProvider (rooms, messages, unread)
│
└─> Navigation Root
    │
    ├─> /auth (No autenticado)
    │   └─> login.tsx
    │
    └─> /(tabs) (Autenticado)
        │
        ├─> index.tsx (Inicio/Dashboard)
        │   ├─> QuickActions Component
        │   └─> RecentActivity Component
        │
        ├─> directory.tsx (Directorio)
        │   ├─> SearchBar Component
        │   ├─> FilterSection Component
        │   └─> PersonCard Component (FlatList)
        │
        ├─> /requests (Solicitudes)
        │   ├─> index.tsx (Lista)
        │   │   ├─> SearchFilters Component
        │   │   └─> RequestCard Component (FlatList)
        │   │
        │   ├─> create.tsx (Crear)
        │   │   └─> RequestForm Component
        │   │
        │   └─> [id].tsx (Detalle)
        │       ├─> RequestHeader Component
        │       ├─> RequestTimeline Component
        │       └─> RequestActions Component
        │
        ├─> /chat (Chat)
        │   ├─> index.tsx (Lista de rooms)
        │   │   └─> RoomCard Component (FlatList)
        │   │
        │   └─> [roomId].tsx (Conversación)
        │       ├─> MessageList Component
        │       ├─> MessageInput Component
        │       └─> MessageBubble Component
        │
        └─> profile.tsx (Perfil)
            ├─> If user.rol === 'admin'
            │   └─> AdminDashboard Component
            │       ├─> StatCard Component
            │       ├─> SimpleChart Component
            │       └─> QuickActions Component
            │
            └─> If user.rol !== 'admin'
                ├─> ProfileHeader Component
                ├─> PersonalInfo Component
                ├─> HealthCheck Component
                ├─> NotificationList Component
                └─> SettingsMenu Component
```

---

## CASOS DE USO TRANSVERSALES

### CU-TRANS-01: Login y Acceso al Sistema

**Descripción**: Usuario inicia sesión y accede al dashboard principal

**Actores**: Todos los usuarios (usuario, agente, admin)

**Flujo Principal**:

```
1. Usuario abre la app
   └─> App verifica sesión existente
       ├─> Si existe sesión válida → Ir al paso 5
       └─> Si NO existe sesión → Continuar

2. Sistema muestra pantalla de login
   └─> Formulario con email y password

3. Usuario ingresa credenciales
   └─> Email: [email]
   └─> Password: [password]

4. Usuario toca botón "Iniciar Sesión"
   └─> Sistema valida con Supabase Auth
       ├─> Credenciales inválidas
       │   └─> Mostrar error: "Credenciales incorrectas"
       │   └─> Volver al paso 3
       │
       └─> Credenciales válidas
           └─> Supabase Auth crea sesión
               ├─> Token JWT generado
               ├─> Session guardada en storage
               └─> Continuar al paso 5

5. Sistema carga perfil completo del usuario
   └─> Query: SELECT * FROM users WHERE id = auth.uid()
   └─> AuthContext.user poblado

6. Sistema redirige según rol
   ├─> Si rol = 'admin'
   │   └─> Navegar a /(tabs)/profile (AdminDashboard)
   │
   └─> Si rol != 'admin'
       └─> Navegar a /(tabs)/index (Dashboard)

7. Sistema suscribe a canales realtime
   ├─> Canal 'presence' (indicadores online)
   ├─> Canal 'messages' (nuevos mensajes)
   └─> Canal 'notifications' (alertas)

8. Sistema solicita permisos de notificaciones
   ├─> Mobile: Expo Notifications
   └─> Web: Browser Notification API

9. Dashboard cargado y funcional
```

**Postcondiciones**:

- Usuario autenticado
- Token JWT válido en storage
- AuthContext.user poblado
- Canales realtime suscritos
- Dashboard visible

**Módulos Involucrados**:

- `app/auth/login.tsx`
- `contexts/AuthContext.tsx`
- `contexts/NotificationContext.tsx`
- `app/(tabs)/index.tsx` o `app/(tabs)/profile.tsx`

---

### CU-TRANS-02: Crear Solicitud desde Dashboard

**Descripción**: Usuario crea una nueva solicitud iniciando desde el dashboard

**Actores**: Usuario, Agente

**Flujo Principal**:

```
1. Usuario está en Dashboard (Inicio)
   └─> Ve sección "Acciones Rápidas"

2. Usuario toca "Nueva Solicitud"
   └─> Sistema ejecuta navigation
       router.push('/(tabs)/requests/create')

3. Sistema navega a pantalla de creación
   └─> Formulario vacío cargado

4. Usuario completa campos:
   ├─> Título (obligatorio, max 200 chars)
   ├─> Tipo (select: Soporte, Mantenimiento, Consulta, Otro)
   ├─> Prioridad (select: Baja, Media, Alta, Urgente)
   ├─> Mensaje (obligatorio, textarea)
   └─> Archivos (opcional, hasta 5 archivos)

5. Usuario toca botón "Crear Solicitud"
   └─> Sistema valida campos
       ├─> Título vacío → Error: "El título es obligatorio"
       ├─> Mensaje vacío → Error: "El mensaje es obligatorio"
       └─> Validación OK → Continuar

6. Sistema crea solicitud en base de datos
   └─> INSERT INTO requests
       {
         titulo: [título],
         tipo: [tipo_id],
         prioridad: [prioridad],
         mensaje: [mensaje],
         usuario_id: auth.uid(),
         estatus: 'nuevo',
         archivos: [array_uris], // ⚠️ No suben realmente
         created_at: NOW()
       }

7. Sistema muestra confirmación
   └─> Alert "Solicitud creada exitosamente"
   └─> ID de la solicitud: [id]

8. Sistema navega a detalle de la solicitud
   └─> router.replace(`/(tabs)/requests/${newRequestId}`)

9. Pantalla de detalle muestra la solicitud recién creada
   └─> Estatus: "Nuevo" (badge amarillo)
   └─> Timeline con evento: "Solicitud creada"
```

**Postcondiciones**:

- Nueva solicitud en BD con estatus 'nuevo'
- Usuario en pantalla de detalle de la solicitud
- Puede ver timeline y acciones disponibles

**Módulos Involucrados**:

- `app/(tabs)/index.tsx` (QuickAction)
- `app/(tabs)/requests/create.tsx`
- `app/(tabs)/requests/[id].tsx`

**Datos Fluyen A Través De**:

```
Dashboard → Navigation → Create Form → Supabase → Detail Screen
   ↓                          ↓             ↓           ↓
Botón                    Validación     INSERT     Query SELECT
```

---

### CU-TRANS-03: Iniciar Chat desde Directorio

**Descripción**: Usuario busca un colega y inicia una conversación

**Actores**: Todos los usuarios

**Flujo Principal**:

```
1. Usuario está en Directorio
   └─> Ve lista de todo el personal

2. Usuario busca persona específica
   └─> Escribe en SearchBar: "Carlos"
   └─> Sistema filtra client-side
       WHERE nombre LIKE '%Carlos%'
          OR apellido_paterno LIKE '%Carlos%'

3. Sistema muestra resultados filtrados
   └─> PersonCard: "Carlos Rosales"
       ├─> Avatar con iniciales "CR"
       ├─> Puesto: Gerente de Operaciones
       ├─> Zona: Norte
       └─> Botones: Call, WhatsApp, Chat

4. Usuario toca botón "Chat" (MessageCircle icon)
   └─> Sistema ejecuta handleStartChat(person)

5. Sistema verifica si ya existe chat room
   └─> Query: SELECT * FROM chat_rooms
       WHERE :current_user_id = ANY(participants)
         AND :target_user_id = ANY(participants)

   ├─> Si existe room
   │   └─> Ir al paso 7 con existingRoomId
   │
   └─> Si NO existe room
       └─> Crear nueva room

6. Sistema crea nuevo chat room
   └─> INSERT INTO chat_rooms
       {
         participants: [current_user_id, target_user_id],
         created_by: current_user_id,
         is_active: true,
         created_at: NOW()
       }
   └─> Retorna newRoomId

7. Sistema navega a la conversación
   └─> router.push(`/(tabs)/chat/${roomId}`)

8. Pantalla de chat cargada
   ├─> Header con nombre del otro participante
   ├─> Lista de mensajes (vacía si es nuevo)
   ├─> Input para escribir mensaje
   └─> Usuario puede comenzar a conversar

9. Usuario escribe primer mensaje (opcional)
   └─> "Hola Carlos, necesito revisar..."
   └─> Toca botón enviar

10. Sistema inserta mensaje en BD
    └─> INSERT INTO messages
        {
          room_id: [roomId],
          sender_id: auth.uid(),
          content: [mensaje],
          created_at: NOW()
        }

11. Mensaje aparece en pantalla
    └─> Alineado a la derecha (current user)
    └─> Color de fondo azul
```

**Postcondiciones**:

- Chat room existe (creado o encontrado)
- Usuario en pantalla de conversación
- Puede enviar y recibir mensajes

**Módulos Involucrados**:

- `app/(tabs)/directory.tsx`
- `app/(tabs)/chat/[roomId].tsx`
- `contexts/ChatContext.tsx`

**Flujo de Datos**:

```
Directorio → handleStartChat → Supabase → Navigation → Chat Screen
    ↓              ↓               ↓            ↓           ↓
PersonCard    Check/Create    chat_rooms   router.push  Load msgs
              room            INSERT                     & subscribe
```

---

### CU-TRANS-04: Seguimiento Completo de Solicitud

**Descripción**: Ciclo de vida completo de una solicitud desde creación hasta cierre

**Actores**: Usuario (creador), Agente (asignado), Admin

**Flujo Completo**:

```
FASE 1: CREACIÓN (Usuario)
────────────────────────────
1. Usuario crea solicitud (ver CU-TRANS-02)
   └─> Estatus inicial: 'nuevo'
   └─> agente_id: NULL

FASE 2: ASIGNACIÓN (Admin/Sistema)
───────────────────────────────────
2. Admin/Agente ve lista de solicitudes nuevas
   └─> En Solicitudes, filtro: estatus = 'nuevo'

3. Agente toma la solicitud
   └─> Toca solicitud → Pantalla de detalle
   └─> Toca botón "Asignarme"

4. Sistema actualiza solicitud
   └─> UPDATE requests
       SET estatus = 'asignado',
           agente_id = :current_user_id,
           updated_at = NOW()
       WHERE id = :request_id

5. Timeline actualizado
   └─> Evento agregado: "Asignado a [Agente]"

FASE 3: EN PROCESO (Agente)
────────────────────────────
6. Agente cambia estatus a "En Proceso"
   └─> Dropdown de estatus → Selecciona "En Proceso"

7. Sistema actualiza estatus
   └─> UPDATE requests
       SET estatus = 'en_proceso',
           updated_at = NOW()
       WHERE id = :request_id

8. Agente agrega comentarios (futuro)
   └─> "Revisando el problema..."
   └─> INSERT INTO request_comments

9. Si necesita pausar
   └─> Dropdown → "Pausado"
   └─> UPDATE estatus = 'pausado'

FASE 4: RESOLUCIÓN (Agente)
────────────────────────────
10. Agente resuelve el problema
    └─> Dropdown → "Resuelto"

11. Sistema actualiza
    └─> UPDATE requests
        SET estatus = 'resuelto',
            updated_at = NOW()
        WHERE id = :request_id

12. Sistema notifica al usuario (futuro)
    └─> Notificación: "Tu solicitud ha sido resuelta"

FASE 5: CALIFICACIÓN (Usuario)
───────────────────────────────
13. Usuario recibe notificación
    └─> Abre solicitud resuelta

14. Usuario ve formulario de calificación
    └─> Estrellas: 1-5
    └─> Comentario opcional

15. Usuario califica
    └─> Selecciona 5 estrellas
    └─> Escribe: "Excelente servicio"

16. Sistema guarda calificación
    └─> UPDATE requests
        SET rating = 5,
            feedback = 'Excelente servicio'
        WHERE id = :request_id

FASE 6: CIERRE AUTOMÁTICO (Sistema)
────────────────────────────────────
17. Sistema verifica solicitudes resueltas
    └─> Cron job o trigger
    └─> Si resuelto por más de 7 días sin actividad

18. Sistema cierra automáticamente
    └─> UPDATE requests
        SET estatus = 'cerrado',
            closed_at = NOW()
        WHERE estatus = 'resuelto'
          AND updated_at < NOW() - INTERVAL '7 days'
```

**Estados de la Solicitud**:

```
nuevo → asignado → en_proceso ⇄ pausado → resuelto → cerrado
  ↓                                            ↓
  └──────────────> cerrado (cancelado) ────────┘
```

**Postcondiciones**:

- Solicitud cerrada con calificación
- Métricas actualizadas en AdminDashboard
- Usuario satisfecho

**Módulos Involucrados**:

- `app/(tabs)/requests/create.tsx`
- `app/(tabs)/requests/index.tsx`
- `app/(tabs)/requests/[id].tsx`
- `app/(tabs)/profile.tsx` (AdminDashboard)

---

### CU-TRANS-05: Logout y Cierre de Sesión

**Descripción**: Usuario cierra sesión de forma segura

**Actores**: Todos los usuarios

**Flujo Principal**:

```
1. Usuario está en cualquier parte de la app
   └─> Navega a tab "Perfil"

2. Sistema muestra pantalla de perfil
   └─> Scroll hasta el final

3. Usuario ve botón "Cerrar Sesión" (rojo)
   └─> Toca el botón

4. Sistema muestra Alert de confirmación
   ┌─────────────────────────────────────┐
   │     Cerrar Sesión                   │
   ├─────────────────────────────────────┤
   │ ¿Estás seguro que deseas cerrar     │
   │ sesión?                             │
   ├─────────────────────────────────────┤
   │  [Cancelar]    [Cerrar Sesión]      │
   └─────────────────────────────────────┘

5. Usuario confirma "Cerrar Sesión"
   └─> Sistema ejecuta logout()

6. AuthContext.logout() ejecuta múltiples limpiezas:
   ├─> 6.1: supabase.auth.signOut()
   │   └─> Invalida token JWT
   │   └─> Limpia session de Supabase
   │
   ├─> 6.2: Limpia storage local
   │   └─> AsyncStorage.removeItem('supabase.auth.token')
   │   └─> localStorage.clear() (web)
   │
   ├─> 6.3: Limpia cookies
   │   └─> document.cookie = '' (web)
   │
   ├─> 6.4: Desuscribe canales realtime
   │   └─> supabase.removeAllChannels()
   │
   ├─> 6.5: Limpia contexts
   │   └─> AuthContext.setUser(null)
   │   └─> ChatContext.clearRooms()
   │   └─> NotificationContext.clearNotifications()
   │
   └─> 6.6: Limpia estados locales
       └─> Resetea todos los useState de componentes

7. Sistema redirige a pantalla de login
   └─> router.replace('/auth')
   └─> replace() previene volver con botón atrás

8. Pantalla de login visible
   └─> Usuario NO autenticado
   └─> No puede acceder a tabs sin login

9. Verificación adicional (middleware)
   └─> Intentar acceder a /(tabs)/*
   └─> Middleware detecta: NO hay sesión
   └─> Redirige automáticamente a /auth
```

**Postcondiciones**:

- Sesión completamente limpia
- Token JWT invalidado
- Storage y cookies limpios
- Contexts reseteados
- Usuario en pantalla de login
- No puede volver atrás

**Módulos Involucrados**:

- `app/(tabs)/profile.tsx`
- `contexts/AuthContext.tsx`
- `app/auth/login.tsx`

**Verificaciones de Seguridad**:

- ✅ Token JWT invalidado en Supabase
- ✅ Storage local limpio
- ✅ Cookies removidas
- ✅ Canales realtime cerrados
- ✅ Estados globales reseteados
- ✅ No puede volver con hardware button

---

## FLUJO DE DATOS ENTRE MÓDULOS

### Diagrama: Flujo de Creación de Solicitud → Chat

```
┌─────────────┐
│   USUARIO   │
│  (Cliente)  │
└──────┬──────┘
       │
       │ 1. Toca "Nueva Solicitud"
       ▼
┌─────────────────────────┐
│  MÓDULO: INICIO         │
│  (Dashboard)            │
│                         │
│  QuickAction tapped     │
└──────┬──────────────────┘
       │
       │ 2. router.push('/(tabs)/requests/create')
       ▼
┌─────────────────────────┐
│  NAVEGACIÓN             │
│  (Expo Router)          │
│                         │
│  Routing Stack          │
└──────┬──────────────────┘
       │
       │ 3. Renderiza CreateRequest
       ▼
┌─────────────────────────┐
│  MÓDULO: SOLICITUDES    │
│  (Create Screen)        │
│                         │
│  Formulario visible     │
└──────┬──────────────────┘
       │
       │ 4. Usuario completa form
       │ 5. Toca "Crear"
       ▼
┌─────────────────────────┐
│  VALIDACIÓN             │
│  (Frontend)             │
│                         │
│  Campos obligatorios OK │
└──────┬──────────────────┘
       │
       │ 6. handleCreateRequest()
       ▼
┌─────────────────────────┐
│  SUPABASE CLIENT        │
│  (Query Builder)        │
│                         │
│  INSERT INTO requests   │
└──────┬──────────────────┘
       │
       │ 7. HTTP POST
       │    Authorization: Bearer [JWT]
       ▼
┌─────────────────────────────────┐
│     SUPABASE CLOUD              │
│                                 │
│  ┌──────────────────────────┐  │
│  │  1. Auth Verification    │  │
│  │     JWT válido?          │  │
│  └────────┬─────────────────┘  │
│           │ ✅ OK               │
│           ▼                     │
│  ┌──────────────────────────┐  │
│  │  2. RLS Policies Check   │  │
│  │     ⚠️ NO IMPLEMENTADAS   │  │
│  └────────┬─────────────────┘  │
│           │ ⚠️ Skip             │
│           ▼                     │
│  ┌──────────────────────────┐  │
│  │  3. INSERT Query         │  │
│  │     requests table       │  │
│  └────────┬─────────────────┘  │
│           │                     │
│           ▼                     │
│  ┌──────────────────────────┐  │
│  │  4. Trigger: updated_at  │  │
│  └────────┬─────────────────┘  │
│           │                     │
│           ▼                     │
│  ┌──────────────────────────┐  │
│  │  5. Return New Row       │  │
│  │     id: uuid             │  │
│  └────────┬─────────────────┘  │
└───────────┼─────────────────────┘
            │
            │ 8. Response { data: newRequest }
            ▼
┌─────────────────────────┐
│  MÓDULO: SOLICITUDES    │
│  (Create Screen)        │
│                         │
│  newRequestId obtenido  │
└──────┬──────────────────┘
       │
       │ 9. router.replace(`/requests/${id}`)
       ▼
┌─────────────────────────┐
│  MÓDULO: SOLICITUDES    │
│  (Detail Screen)        │
│                         │
│  Query: SELECT * WHERE  │
│         id = :id        │
└──────┬──────────────────┘
       │
       │ 10. Solicitud cargada
       │ 11. Usuario ve botón "Contactar Agente"
       │ 12. Toca botón
       ▼
┌─────────────────────────┐
│  MÓDULO: CHAT           │
│  (handleStartChat)      │
│                         │
│  1. Check existing room │
│  2. Create if needed    │
└──────┬──────────────────┘
       │
       │ 13. router.push(`/chat/${roomId}`)
       ▼
┌─────────────────────────┐
│  MÓDULO: CHAT           │
│  (Conversation Screen)  │
│                         │
│  Chat activo con agente │
└─────────────────────────┘
```

---

### Diagrama: Flujo de Datos Realtime (Chat)

```
USUARIO A (Emisor)                    SERVIDOR                    USUARIO B (Receptor)
─────────────────                  ─────────────                 ─────────────────

1. Escribe mensaje
   "Hola!"
   │
   │ 2. Toca botón enviar
   ▼
┌──────────────┐
│ sendMessage()│
└──────┬───────┘
       │
       │ 3. INSERT INTO messages
       │    {
       │      room_id,
       │      sender_id: userA,
       │      content: "Hola!",
       │      created_at: NOW()
       │    }
       ▼
┌────────────────────────┐
│  Supabase Client       │
│  (HTTP POST)           │
└──────┬─────────────────┘
       │
       │ 4. HTTP POST con JWT
       ▼
┌─────────────────────────────────────────┐
│         SUPABASE CLOUD                  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Auth Verification               │  │
│  │  JWT de User A válido ✅         │  │
│  └────────┬─────────────────────────┘  │
│           ▼                             │
│  ┌──────────────────────────────────┐  │
│  │  RLS Policies                    │  │
│  │  User A es participante? ✅      │  │
│  └────────┬─────────────────────────┘  │
│           ▼                             │
│  ┌──────────────────────────────────┐  │
│  │  INSERT INTO messages            │  │
│  │  Nuevo mensaje guardado          │  │
│  └────────┬─────────────────────────┘  │
│           │                             │
│           ▼                             │
│  ┌──────────────────────────────────┐  │
│  │  REALTIME ENGINE                 │  │
│  │  Detecta: INSERT en messages     │  │
│  │  room_id: [roomId]               │  │
│  └────────┬─────────────────────────┘  │
│           │                             │
│           ├─────────┬───────────────────┤
│           ▼         ▼                   │
│      WebSocket  WebSocket               │
│      User A     User B                  │
└───────┼─────────┼───────────────────────┘
        │         │
        │         │ 5. Broadcast event
        │         │    'postgres_changes'
        │         │    payload: { new: mensaje }
        │         ▼
        │    ┌──────────────┐
        │    │ Supabase     │
        │    │ Client       │
        │    │ (User B)     │
        │    └──────┬───────┘
        │           │
        │           │ 6. channel.on() callback
        │           ▼
        │    ┌──────────────┐              ┌──────────────┐
        │    │ ChatContext  │              │ UI Component │
        ▼    │ (User B)     │              │ (User B)     │
┌──────────────┐            │              │              │
│ ChatContext  │◄───────────┘              │              │
│ (User A)     │ 7. setMessages()          │              │
└──────┬───────┘    [new, ...prev]         │              │
       │                                   │              │
       │ 8. State update                  │              │
       ▼                                   ▼              ▼
┌──────────────┐                    ┌──────────────┐
│ MessageList  │                    │ MessageList  │
│ re-renders   │                    │ re-renders   │
│              │                    │              │
│ [Hola!] ─────┼───────────────────►│ [Hola!]      │
│   (sent)     │                    │   (received) │
└──────────────┘                    └──────────────┘

Usuario A ve                        Usuario B ve
su mensaje                          nuevo mensaje
al instante                         al instante
```

---

### Tabla: Interacciones Entre Módulos

| Desde                         | Hacia         | Acción                        | Datos Transferidos | Método                                                |
| ----------------------------- | ------------- | ----------------------------- | ------------------ | ----------------------------------------------------- |
| **Inicio** → Directorio       | Nav           | QuickAction "Ver Personal"    | Ninguno            | `router.push('/(tabs)/directory')`                    |
| **Inicio** → Solicitudes      | Nav           | QuickAction "Nueva Solicitud" | Ninguno            | `router.push('/(tabs)/requests/create')`              |
| **Inicio** → Chat             | Nav           | QuickAction "Mensajes"        | Ninguno            | `router.push('/(tabs)/chat')`                         |
| **Directorio** → Chat         | Nav + Data    | Botón "Iniciar Chat"          | `targetUserId`     | `handleStartChat(person)` → crea room → navega        |
| **Directorio** → External     | Linking       | Botón "Call"                  | `phoneNumber`      | `Linking.openURL('tel:${phone}')`                     |
| **Directorio** → External     | Linking       | Botón "WhatsApp"              | `phoneNumber`      | `Linking.openURL('whatsapp://send?phone=')`           |
| **Solicitudes List** → Detail | Nav           | Tap en RequestCard            | `requestId`        | `router.push('/(tabs)/requests/${id}')`               |
| **Solicitudes Detail** → Chat | Nav + Data    | Botón "Contactar Agente"      | `agentId`          | Crea room con agente → navega                         |
| **Chat List** → Conversation  | Nav           | Tap en RoomCard               | `roomId`           | `router.push('/(tabs)/chat/${roomId}')`               |
| **Perfil** → Auth             | Context       | Botón "Logout"                | Ninguno            | `logout()` → `router.replace('/auth')`                |
| **Auth Login** → Inicio       | Context + Nav | Login exitoso                 | `user` object      | `AuthContext.setUser()` → `router.replace('/(tabs)')` |

---

## MODELO DE DATOS COMPLETO

### Diagrama Entidad-Relación

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS SUPABASE                          │
└────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐
│       auth.users      │ (Tabla de Supabase Auth)
├───────────────────────┤
│ id (PK)          UUID │───┐
│ email         VARCHAR │   │
│ encrypted_pwd VARCHAR │   │
│ created_at  TIMESTAMP │   │
│ last_sign_in TIMESTAMP│   │
└───────────────────────┘   │
                            │
                            │ 1:1
                            │
                            ▼
┌────────────────────────────────────┐
│         public.users               │
├────────────────────────────────────┤
│ id (PK, FK)                   UUID │◄──┐
│ nombre                     VARCHAR │   │
│ apellido_paterno           VARCHAR │   │
│ apellido_materno           VARCHAR │   │
│ correo_electronico         VARCHAR │   │
│ celular                    VARCHAR │   │
│ empresa                    VARCHAR │   │
│ ciudad                     VARCHAR │   │
│ estado                     VARCHAR │   │
│ categoria                  VARCHAR │   │
│ zona                       VARCHAR │   │
│ rol                      user_role │   │ 1:N (como usuario)
│ activo                     BOOLEAN │   │
│ is_online                  BOOLEAN │   │
│ last_online            TIMESTAMPTZ │   │
│ created_at             TIMESTAMPTZ │   │
│ updated_at             TIMESTAMPTZ │   │
└────────────┬───────────────────────┘   │
             │                           │
             │ 1:N (como agente)         │
             │                           │
             ▼                           │
┌────────────────────────────────────────┴─────┐
│             requests                         │
├──────────────────────────────────────────────┤
│ id (PK)                               UUID   │
│ titulo                              VARCHAR  │
│ mensaje                              TEXT    │
│ tipo                                INTEGER  │
│ prioridad                    request_priority│
│ estatus                       request_status │
│ usuario_id (FK) ───────────────────────┐     │
│ agente_id (FK)  ───────────────────────┼──┐  │
│ archivos                              TEXT[] │  │
│ rating                              INTEGER  │  │
│ feedback                              TEXT   │  │
│ metadata                             JSONB   │  │
│ created_at                       TIMESTAMPTZ │  │
│ updated_at                       TIMESTAMPTZ │  │
│ closed_at                        TIMESTAMPTZ │  │
└──────────────────────────────────────────────┘  │
                                                   │
                 ┌─────────────────────────────────┘
                 │
                 │ N:N (participantes)
                 │
                 ▼
┌────────────────────────────────────┐
│         chat_rooms                 │
├────────────────────────────────────┤
│ id (PK)                       UUID │
│ participants                UUID[] │───┐ Array de users.id
│ created_by (FK)               UUID │◄──┼─────────────────┐
│ is_active                  BOOLEAN │   │                 │
│ last_message_at       TIMESTAMPTZ  │   │                 │
│ created_at            TIMESTAMPTZ  │   │                 │
│ updated_at            TIMESTAMPTZ  │   │                 │
└────────────┬───────────────────────┘   │                 │
             │                           │                 │
             │ 1:N                       │                 │
             ▼                           ▼                 │
┌────────────────────────────────────┐                     │
│          messages                  │                     │
├────────────────────────────────────┤                     │
│ id (PK)                       UUID │                     │
│ room_id (FK)                  UUID │                     │
│ sender_id (FK)                UUID │─────────────────────┘
│ content                       TEXT │
│ attachments                  TEXT[]│
│ metadata                     JSONB │
│ is_read                    BOOLEAN │
│ read_at               TIMESTAMPTZ  │
│ created_at            TIMESTAMPTZ  │
│ updated_at            TIMESTAMPTZ  │
└────────────────────────────────────┘


ENUMS:
──────
CREATE TYPE user_role AS ENUM (
  'usuario',  -- Usuario normal
  'agente',   -- Agente de soporte
  'admin'     -- Administrador
);

CREATE TYPE request_priority AS ENUM (
  'baja',
  'media',
  'alta',
  'urgente'
);

CREATE TYPE request_status AS ENUM (
  'nuevo',
  'asignado',
  'en_proceso',
  'pausado',
  'resuelto',
  'cerrado'
);


ÍNDICES IMPORTANTES:
────────────────────
-- users
CREATE INDEX idx_users_activo ON users(activo) WHERE activo = true;
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_zona ON users(zona);
CREATE INDEX idx_users_categoria ON users(categoria);

-- requests
CREATE INDEX idx_requests_usuario_id ON requests(usuario_id);
CREATE INDEX idx_requests_agente_id ON requests(agente_id);
CREATE INDEX idx_requests_estatus ON requests(estatus);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_requests_prioridad ON requests(prioridad);

-- chat_rooms
CREATE INDEX idx_chat_rooms_participants ON chat_rooms USING GIN(participants);
CREATE INDEX idx_chat_rooms_updated_at ON chat_rooms(updated_at DESC);

-- messages
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;


RLS POLICIES:
─────────────
-- users (✅ Implementadas)
CREATE POLICY "Users can view all active users"
ON users FOR SELECT
TO authenticated
USING (activo = true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- requests (⚠️ NO Implementadas - CRÍTICO)
-- Actualmente sin políticas, filtrado solo en frontend

-- chat_rooms (Parcialmente implementadas)
CREATE POLICY "Users can view own chat rooms"
ON chat_rooms FOR SELECT
TO authenticated
USING (auth.uid() = ANY(participants));

-- messages (Parcialmente implementadas)
CREATE POLICY "Users can view messages in their rooms"
ON messages FOR SELECT
TO authenticated
USING (
  room_id IN (
    SELECT id FROM chat_rooms
    WHERE auth.uid() = ANY(participants)
  )
);
```

---

### Cardinalidades y Relaciones

| Relación                            | Tipo | Descripción                            |
| ----------------------------------- | ---- | -------------------------------------- |
| `auth.users` ↔ `users`             | 1:1  | Un usuario de auth tiene un perfil     |
| `users` → `requests` (como usuario) | 1:N  | Un usuario crea muchas solicitudes     |
| `users` → `requests` (como agente)  | 1:N  | Un agente atiende muchas solicitudes   |
| `users` ↔ `chat_rooms`             | N:N  | Usuarios participan en múltiples rooms |
| `chat_rooms` → `messages`           | 1:N  | Un room tiene muchos mensajes          |
| `users` → `messages`                | 1:N  | Un usuario envía muchos mensajes       |

---

## CONTEXTOS Y ESTADO GLOBAL

### 1. AuthContext

**Archivo**: `contexts/AuthContext.tsx`

**Estado Gestionado**:

```typescript
interface AuthContextType {
  user: User | null; // Usuario actual
  loading: boolean; // Cargando sesión
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Responsabilidades**:

- ✅ Autenticar usuario con Supabase Auth
- ✅ Mantener sesión activa (token JWT)
- ✅ Cargar perfil completo desde `users` table
- ✅ Proveer función de logout
- ✅ Refrescar datos del usuario

**Consumido Por**:

- Todos los módulos (acceso a `user`)
- `app/auth/login.tsx` (login)
- `app/(tabs)/profile.tsx` (logout)

---

### 2. NotificationContext

**Archivo**: `contexts/NotificationContext.tsx`

**Estado Gestionado**:

```typescript
interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  inAppNotifications: InAppNotification[];
  unreadCount: number;
  sendDemoNotification: (title, body, type, data) => Promise<void>;
  sendLocalNotification: (title, body, data) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  registerForPushNotifications: () => Promise<string | null>;
}
```

**Responsabilidades**:

- ✅ Gestionar notificaciones in-app (estado en memoria)
- ✅ Solicitar permisos de notificaciones
- ✅ Registrar push token (Expo)
- ✅ Enviar notificaciones locales
- ⚠️ NO persiste notificaciones en BD

**Consumido Por**:

- `app/(tabs)/profile.tsx` (demo + gestión)
- `app/(tabs)/index.tsx` (potencial para alertas)

---

### 3. ChatContext

**Archivo**: `contexts/ChatContext.tsx`

**Estado Gestionado**:

```typescript
interface ChatContextType {
  rooms: ChatRoom[];
  loading: boolean;
  unreadCount: number;
  loadRooms: () => Promise<void>;
  createRoom: (participantIds: string[]) => Promise<string>;
  clearRooms: () => void;
}
```

**Responsabilidades**:

- ✅ Cargar lista de chat rooms del usuario
- ✅ Crear nuevo room si no existe
- ✅ Calcular contador de mensajes no leídos
- ⚠️ NO suscribe a realtime updates (limitación)

**Consumido Por**:

- `app/(tabs)/chat/index.tsx` (lista de rooms)
- `app/(tabs)/directory.tsx` (crear room)
- `app/(tabs)/requests/[id].tsx` (contactar agente)

---

### Diagrama de Flujo de Contexts

```
┌─────────────────────────────────────────────────────┐
│                    App Root                         │
│                   (_layout.tsx)                     │
└─────────────────────┬───────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Auth    │ │ Notif    │ │  Chat    │
  │ Provider │ │ Provider │ │ Provider │
  └────┬─────┘ └────┬─────┘ └────┬─────┘
       │            │            │
       ├────────────┴────────────┤
       │     Shared State        │
       │                         │
       ├─> user: User | null     │
       ├─> notifications: []     │
       └─> rooms: ChatRoom[]     │
                  │
                  │ Consumed by
                  ▼
    ┌──────────────────────────────┐
    │       All Components         │
    │                              │
    │  • useAuth()                 │
    │  • useNotifications()        │
    │  • useChat()                 │
    └──────────────────────────────┘
```

---

## NAVEGACIÓN Y ROUTING

### Estructura de Navegación (Expo Router)

```
app/
├── _layout.tsx (Root layout con providers)
├── index.tsx (Redirect a /auth o /(tabs))
│
├── auth/
│   ├── _layout.tsx
│   └── login.tsx
│
└── (tabs)/
    ├── _layout.tsx (Tab bar navigation)
    │
    ├── index.tsx (Inicio/Dashboard)
    │
    ├── directory.tsx (Directorio)
    │
    ├── requests/
    │   ├── _layout.tsx
    │   ├── index.tsx (Lista)
    │   ├── create.tsx (Crear)
    │   └── [id].tsx (Detalle)
    │
    ├── chat/
    │   ├── _layout.tsx
    │   ├── index.tsx (Lista de rooms)
    │   └── [roomId].tsx (Conversación)
    │
    └── profile.tsx (Perfil/Admin)
```

### Rutas y Protección

| Ruta                      | Protección | Renderiza               | Rol Requerido                      |
| ------------------------- | ---------- | ----------------------- | ---------------------------------- |
| `/auth`                   | Público    | Login screen            | Ninguno                            |
| `/(tabs)/index`           | Protegido  | Dashboard               | Autenticado                        |
| `/(tabs)/directory`       | Protegido  | Directorio              | Autenticado                        |
| `/(tabs)/requests`        | Protegido  | Lista solicitudes       | Autenticado                        |
| `/(tabs)/requests/create` | Protegido  | Crear solicitud         | usuario, agente                    |
| `/(tabs)/requests/[id]`   | Protegido  | Detalle solicitud       | Autenticado                        |
| `/(tabs)/chat`            | Protegido  | Lista chats             | Autenticado                        |
| `/(tabs)/chat/[roomId]`   | Protegido  | Conversación            | Autenticado                        |
| `/(tabs)/profile`         | Protegido  | Perfil o AdminDashboard | Autenticado (admin para dashboard) |

### Middleware de Protección

**Archivo**: `app/_layout.tsx` o middleware personalizado

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      // No autenticado
      router.replace('/auth');
    } else {
      // Autenticado, cargar usuario
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser(user);

      // Si ya está en /auth, redirigir a tabs
      if (pathname === '/auth') {
        router.replace('/(tabs)');
      }
    }
  };

  checkAuth();
}, []);
```

---

## AUTENTICACIÓN Y AUTORIZACIÓN

### Flujo de Autenticación

```
┌────────────┐
│   Usuario  │
└──────┬─────┘
       │
       │ 1. Ingresa email + password
       ▼
┌─────────────────┐
│ Login Component │
└──────┬──────────┘
       │
       │ 2. await supabase.auth.signInWithPassword()
       ▼
┌────────────────────────────┐
│     Supabase Auth API      │
│                            │
│  1. Verifica credentials   │
│  2. Genera JWT token       │
│  3. Crea session           │
└──────┬─────────────────────┘
       │
       │ 3. { data: { session, user } }
       ▼
┌─────────────────┐
│  AuthContext    │
│                 │
│  1. Guarda JWT  │
│  2. Query users │
│  3. setUser()   │
└──────┬──────────┘
       │
       │ 4. router.replace('/(tabs)')
       ▼
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
```

### JWT Token Structure

```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@elmec.com.mx",
  "role": "authenticated",
  "iat": 1234567890,
  "exp": 1234571490,
  "aud": "authenticated"
}
```

### Autorización por Rol

**Frontend**:

```typescript
// Condicional rendering
if (user?.rol === 'admin') {
  return <AdminDashboard />;
}

// Condicional de acciones
{user?.rol === 'agente' && (
  <Button onPress={handleAssignToMe}>Asignarme</Button>
)}
```

**Backend (RLS Policies)**:

```sql
-- Ejemplo: Solo admin puede ver todos los requests
CREATE POLICY "Admins can view all requests"
ON requests FOR SELECT
TO authenticated
USING (
  (SELECT rol FROM users WHERE id = auth.uid()) = 'admin'
);

-- Usuario solo ve sus propias solicitudes
CREATE POLICY "Users can view own requests"
ON requests FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid()
  OR agente_id = auth.uid()
);
```

---

## REALTIME Y SUBSCRIPTIONS

### Subscripciones Activas

| Canal      | Tabla      | Evento | Componente          | Propósito                        |
| ---------- | ---------- | ------ | ------------------- | -------------------------------- |
| `messages` | messages   | INSERT | `chat/[roomId].tsx` | Nuevos mensajes en conversación  |
| `presence` | N/A        | sync   | `directory.tsx`     | Indicadores online (futuro)      |
| `rooms`    | chat_rooms | UPDATE | `chat/index.tsx`    | Actualizar last_message (futuro) |

### Ejemplo de Subscription

```typescript
// En ChatRoomScreen
useEffect(() => {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      payload => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [roomId]);
```

---

## GUÍAS DE DESARROLLO

### Agregar Nuevo Módulo

1. **Crear estructura de archivos**:

```bash
mkdir app/(tabs)/nuevo-modulo
touch app/(tabs)/nuevo-modulo/_layout.tsx
touch app/(tabs)/nuevo-modulo/index.tsx
```

2. **Agregar tab en `(tabs)/_layout.tsx`**:

```typescript
<Tabs.Screen
  name="nuevo-modulo"
  options={{
    title: 'Nuevo Módulo',
    tabBarIcon: ({ color }) => <IconName size={28} color={color} />,
  }}
/>
```

3. **Crear componente principal**:

```typescript
// app/(tabs)/nuevo-modulo/index.tsx
export default function NuevoModulo() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      {/* Tu código aquí */}
    </SafeAreaView>
  );
}
```

4. **Documentar** en WIKI siguiendo estructura de otros módulos

---

### Agregar Nueva Query a Supabase

1. **Definir interfaz TypeScript**:

```typescript
interface MiNuevoDato {
  id: string;
  campo1: string;
  campo2: number;
}
```

2. **Crear función de query**:

```typescript
const loadMisDatos = async () => {
  const { data, error } = await supabase
    .from('mi_tabla')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  setMisDatos(data);
};
```

3. **Agregar RLS Policy**:

```sql
CREATE POLICY "Users can view own data"
ON mi_tabla FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

---

### Testing Checklist

Antes de cada release, ejecutar:

- [ ] Login/Logout funciona
- [ ] Navegación entre tabs funciona
- [ ] Queries retornan datos correctos según rol
- [ ] RLS policies bloquean acceso no autorizado
- [ ] Realtime subscriptions funcionan
- [ ] No hay memory leaks (remover listeners)
- [ ] Build de producción sin warnings
- [ ] Performance aceptable (Lighthouse/Flipper)

---

## APÉNDICE

### Variables de Entorno Requeridas

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Environment
EXPO_PUBLIC_ENVIRONMENT=production

# EAS (Futuro)
EXPO_PUBLIC_EAS_PROJECT_ID=...

# Netlify (Web deployment)
NETLIFY_AUTH_TOKEN=...
```

---

### Comandos Útiles

```bash
# Desarrollo
npm start              # Iniciar Expo dev server
npm run web            # Abrir en navegador
npm run ios            # Abrir en simulador iOS
npm run android        # Abrir en emulador Android

# Build
npm run build:production  # Build para web
npx expo export           # Export estático

# Testing
npm run test:logins       # Test credenciales

# Deployment
netlify deploy --prod --dir=dist

# Database
npx supabase db reset     # Reset local DB
npx supabase db push      # Push migrations
```

---

**Última Actualización**: 2025-01-XX
**Versión**: 1.0.0
**Mantenido Por**: Dev Team
