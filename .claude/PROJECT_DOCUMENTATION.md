# DOCUMENTACIÓN COMPLETA - ELMEC V2 DEMO

> Última actualización: 2025-10-14
> Versión: 1.0.0
> Estado: 85% Completo - Funcional para Demo

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Documentación por Módulo](#documentación-por-módulo)
4. [Estado de Completitud](#estado-de-completitud)
5. [Tareas Pendientes para Producción](#tareas-pendientes-para-producción)
6. [Guía de Deployment](#guía-de-deployment)

---

## Resumen Ejecutivo

### 📱 Descripción del Proyecto

**ELMEC V2 Demo** es una aplicación empresarial multiplataforma (iOS, Android, Web) desarrollada con **React Native + Expo** para la gestión integral de solicitudes, comunicación en tiempo real y calculadoras industriales especializadas.

### 🎯 Objetivos del Proyecto

- Gestionar solicitudes de clientes (CRM)
- Facilitar comunicación en tiempo real (Chat profesional)
- Directorio de personal con búsqueda avanzada
- Calculadoras industriales (Barrenado, Fresado)
- Sistema de notificaciones push y en app
- Dashboard administrativo

### 🏆 Características Destacadas

1. **Sistema de Chat Profesional** ⭐⭐⭐⭐⭐
   - Mensajería en tiempo real con Supabase Realtime
   - Texto, imágenes, audio, archivos, emojis
   - Responder, editar, eliminar mensajes
   - Typing indicators
   - Optimistic updates

2. **Autenticación Completa**
   - Login/Register con Supabase Auth
   - Sesiones persistentes
   - Protección de rutas
   - Modo BASIC_AUTH para desarrollo

3. **Gestión de Solicitudes CRM**
   - Crear solicitudes con archivos adjuntos
   - Asignación automática/manual de agentes
   - Estados y prioridades
   - Filtros avanzados

4. **Real-time Features**
   - Chat en tiempo real
   - Indicadores de estado online
   - Notificaciones push

### 📊 Estadísticas del Proyecto

| Métrica                        | Valor   |
| ------------------------------ | ------- |
| Archivos TypeScript/JavaScript | 57      |
| Líneas de código               | ~9,031  |
| Pantallas                      | 20      |
| Componentes reutilizables      | 14+     |
| Contexts globales              | 3       |
| Redux Slices                   | 1       |
| Custom Hooks                   | 3       |
| Dependencias principales       | 45      |
| Completitud estimada           | **85%** |

---

## Arquitectura del Proyecto

### 🛠️ Stack Tecnológico

#### Frontend

```
- React Native: 0.82.0
- React: 19.2.0
- Expo: ~53.0.23
- TypeScript: 5.8.3
- Expo Router: ~5.1.7 (File-based routing)
```

#### Estado Global

```
- Redux Toolkit: 2.9.0 (Calculadora)
- Context API (Auth, Chat, Notifications)
```

#### Backend as a Service

```
- Supabase: 2.57.2
  - PostgreSQL Database
  - Supabase Auth (JWT)
  - Realtime Subscriptions
  - Row Level Security (RLS)
```

#### UI/UX

```
- React Native StyleSheet (estilos nativos)
- expo-linear-gradient (gradientes)
- lucide-react-native (iconografía)
- @expo-google-fonts/inter (tipografía)
```

#### Deployment

```
- Netlify (Web)
- EAS (Mobile - configurado)
- Node 20.19.4
```

### 📁 Estructura de Directorios

```
elmecV2-Demo/
├── .claude/                    # Documentación y logs de sesión
│   ├── SESSION_LOG.md
│   ├── PROJECT_DOCUMENTATION.md
│   └── README.md
│
├── app/                        # Pantallas (Expo Router)
│   ├── (tabs)/                # Navegación por tabs
│   │   ├── index.tsx          # Home/Dashboard
│   │   ├── directory.tsx      # Directorio de personal
│   │   ├── requests.tsx       # Gestión de solicitudes
│   │   ├── chat/              # Sistema de chat
│   │   │   ├── index.tsx      # Lista de conversaciones
│   │   │   └── [roomId].tsx   # Conversación individual
│   │   ├── calculator.tsx     # Calculadoras
│   │   └── profile.tsx        # Perfil de usuario
│   │
│   ├── auth/                  # Autenticación
│   │   ├── index.tsx          # Pantalla de bienvenida
│   │   ├── login.tsx          # Inicio de sesión
│   │   └── register.tsx       # Registro
│   │
│   ├── calculator/            # Pantallas de calculadora
│   │   ├── index.tsx          # Menú de calculadoras
│   │   ├── BarrenadoScreen.tsx
│   │   ├── FresadoScreen.tsx
│   │   └── SettingsCalculadoraScreen.tsx
│   │
│   ├── _layout.tsx            # Layout raíz
│   ├── index.tsx              # Entrada principal
│   └── +not-found.tsx         # 404
│
├── components/                # Componentes reutilizables
│   ├── ContextProviders.tsx   # Wrapper de providers
│   ├── ErrorBoundary.tsx      # Captura de errores
│   ├── AdminDashboard.tsx     # Dashboard admin
│   ├── AdvancedSearchComponent.tsx
│   ├── FileUploadComponent.tsx
│   ├── HealthCheck.tsx
│   ├── NotificationToast.tsx
│   ├── HeaderComponent.tsx
│   ├── MessageBubble.tsx
│   ├── TypingIndicator.tsx
│   ├── EmojiPicker.tsx
│   ├── api.ts
│   └── calculator/
│       ├── CalculatorView.tsx
│       └── BarrenadoView.tsx
│
├── contexts/                  # Estado global con Context API
│   ├── AuthContext.tsx        # Autenticación
│   ├── ChatContext.tsx        # Chat en tiempo real
│   └── NotificationContext.tsx # Notificaciones
│
├── store/                     # Redux Store
│   ├── index.ts               # Configuración del store
│   ├── hooks.ts               # Hooks tipados
│   └── calculatorSlice.ts     # Slice de calculadora
│
├── services/                  # Servicios de API
│   ├── supabaseService.ts     # Servicio de Supabase
│   └── apiService.ts          # API genérica
│
├── hooks/                     # Custom Hooks
│   ├── useChat.ts
│   ├── useFrameworkReady.ts
│   └── useSupabaseHealth.ts
│
├── types/                     # Definiciones TypeScript
│   ├── supabase.ts            # Tipos de DB
│   ├── supabase-override.d.ts
│   └── supabase-helpers.ts
│
├── utils/                     # Utilidades
│   ├── logger.ts              # Sistema de logging
│   ├── errorHandler.ts        # Manejo de errores
│   └── calculatorUtils.ts     # Cálculos
│
├── lib/                       # Librerías configuradas
│   └── supabase.ts            # Cliente Supabase
│
├── constants/                 # Constantes
│   ├── types.ts
│   ├── commons.ts
│   └── calculator.ts
│
├── i18n/                      # Internacionalización
│   └── index.ts               # Configuración i18next
│
├── scripts/                   # Scripts de utilidad
│   ├── create-auth-users.js
│   ├── test-logins.js
│   └── validate-demo-data.js
│
├── assets/                    # Recursos estáticos
├── supabase/                  # Migraciones de DB
├── public/                    # Archivos públicos web
│
├── package.json
├── tsconfig.json
├── netlify.toml
├── babel.config.js
├── metro.config.js
├── eslint.config.js
└── .env.example
```

---

## Documentación por Módulo

### 1. AUTENTICACIÓN

#### 📄 contexts/AuthContext.tsx

**Estado**: ✅ Completo

**Propósito**: Gestión centralizada de autenticación y sesión de usuario

**Funcionalidades**:

- Login con email/password
- Registro de nuevos usuarios
- Logout con actualización de estado offline
- Cargar perfil desde database
- Mantener sesión persistente
- Modo BASIC_AUTH para desarrollo

**Estado Expuesto**:

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: UserData) => Promise<boolean>;
  logout: () => Promise<void>;
}
```

**Flujo de Login**:

1. Usuario envía email + password
2. AuthContext llama a `supabase.auth.signInWithPassword()`
3. Si exitoso, carga perfil de tabla `users`
4. Actualiza estado `is_online` y `last_login`
5. Guarda sesión en AsyncStorage (persistencia)
6. Redirige a `/(tabs)`

**Manejo de Errores**:

- Invalid credentials
- Email not confirmed
- User not found
- Network errors
- Timeout errors

**Archivos Relacionados**:

- `app/auth/login.tsx` (UI de login)
- `app/auth/register.tsx` (UI de registro)
- `services/supabaseService.ts` (métodos de API)

---

#### 📄 app/auth/login.tsx

**Estado**: ✅ Completo

**Componentes**:

- Input de email con icono
- Input de password con toggle show/hide
- Botón de login con loading state
- Back button
- Credenciales de prueba (demo)

**Validaciones**:

- Campos requeridos
- Formato de email
- Manejo de errores específicos

**Estados**:

```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
```

---

#### 📄 app/auth/register.tsx

**Estado**: ✅ Completo

**Campos del Formulario**:

- Empresa
- Nombre, Apellido Paterno, Apellido Materno
- Email
- Celular
- Ciudad, Estado
- Contraseña

**Flujo de Registro**:

1. Validar campos requeridos
2. Crear usuario en `auth.users` (Supabase Auth)
3. Crear perfil en `public.users` con rol 'customer'
4. Mostrar éxito y redirigir a login

---

### 2. SISTEMA DE CHAT

#### 📄 contexts/ChatContext.tsx

**Estado**: ✅ Completo y Avanzado ⭐⭐⭐⭐⭐

**Propósito**: Sistema de chat en tiempo real con todas las features modernas

**Funcionalidades Principales**:

- Cargar chat rooms del usuario
- Cargar mensajes con paginación
- Enviar mensajes (texto, imagen, audio, archivo, sistema)
- Real-time subscriptions con Supabase
- Typing indicators
- Editar y eliminar mensajes
- Marcar mensajes como leídos
- Contadores de no leídos
- Optimistic updates

**Estado Expuesto**:

```typescript
interface ChatContextType {
  chatRooms: ChatRoom[]
  messages: { [roomId: string]: ChatMessage[] }
  typingUsers: { [roomId: string]: TypingUser[] }
  sendMessage: (roomId, message, type?, fileUrl?, ...) => Promise<void>
  sendTypingIndicator: (roomId, isTyping) => void
  createChatRoom: (participantId, name, requestId?) => Promise<string>
  markMessagesAsRead: (roomId) => Promise<void>
  loadMoreMessages: (roomId) => Promise<void>
  deleteMessage: (messageId) => Promise<void>
  editMessage: (messageId, newMessage) => Promise<void>
  getChatRoom: (roomId) => ChatRoom | undefined
  getUnreadCount: () => number
  getRoomUnreadCount: (roomId) => number
  loading: boolean
  error: string | null
}
```

**Real-time Subscriptions**:

```typescript
// Escucha INSERT de nuevos mensajes
supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    },
    handleNewMessage
  )
  .subscribe();

// Escucha UPDATE de mensajes editados
supabase
  .channel('messages-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
    },
    handleMessageUpdate
  )
  .subscribe();
```

**Tipos de Mensajes Soportados**:

- `text`: Mensajes de texto plano
- `image`: Imágenes con preview
- `audio`: Grabaciones de audio
- `file`: Documentos y archivos
- `system`: Mensajes del sistema

---

#### 📄 app/(tabs)/chat/[roomId].tsx

**Estado**: ✅ Completo y Avanzado ⭐⭐⭐⭐⭐

**Features Implementadas**:

1. **Mensajes en Tiempo Real**
   - Subscription a nuevos mensajes
   - Optimistic updates (mensaje aparece antes de confirmar)
   - Auto-scroll a nuevos mensajes

2. **Picker de Emojis**
   - 6 categorías (Frecuentes, Personas, Naturaleza, Comida, Actividades, Objetos)
   - 200+ emojis
   - Buscar emojis

3. **Adjuntar Archivos**

   ```typescript
   // Opciones de adjuntos
   - Galería de imágenes (con edición)
   - Cámara fotográfica
   - Documentos/archivos
   ```

4. **Grabación de Audio** (solo móvil)

   ```typescript
   // Estados de grabación
   - Grabando
   - Pausado
   - Listo para enviar
   - Reproductor en mensajes
   ```

5. **Acciones de Mensaje**
   - Responder (quote)
   - Editar (solo mensajes propios)
   - Eliminar (solo mensajes propios)
   - Copiar al portapapeles

6. **Typing Indicators**

   ```typescript
   // Muestra "Usuario está escribiendo..."
   sendTypingIndicator(roomId, true);
   ```

7. **Load More Messages**
   - Paginación de mensajes antiguos
   - Scroll hacia arriba para cargar más

**Componentes UI**:

- Header con nombre de chat room y participantes
- FlatList de mensajes (optimizado con `getItemLayout`)
- Input bar con emojis y adjuntos
- Modal de opciones de mensaje
- Audio recorder UI
- Image preview modal

**Performance Optimizations**:

```typescript
// FlatList optimizations
removeClippedSubviews={true}
maxToRenderPerBatch={10}
windowSize={21}
getItemLayout={(data, index) => ({
  length: 80,
  offset: 80 * index,
  index,
})}
```

---

### 3. GESTIÓN DE SOLICITUDES (CRM)

#### 📄 app/(tabs)/requests.tsx

**Estado**: ✅ Completo (con simulaciones demo)

**Funcionalidades**:

1. **Crear Nueva Solicitud**

   ```typescript
   interface RequestData {
     titulo: string;
     mensaje: string;
     tipo:
       | 'soporte_tecnico'
       | 'facturacion'
       | 'informacion'
       | 'queja'
       | 'sugerencia';
     prioridad: 'baja' | 'media' | 'alta' | 'urgente';
     agente_id?: string; // Asignación manual o automática
     attachments?: File[]; // Hasta 3 archivos, max 5MB
   }
   ```

2. **Lista de Solicitudes**
   - Vista según rol:
     - `customer`: Solo sus solicitudes
     - `agent`: Solicitudes asignadas
     - `admin`: Todas las solicitudes
   - Filtros avanzados:
     - Por estado
     - Por prioridad
     - Por tipo
     - Por fecha
   - Búsqueda por título/mensaje

3. **Actualizar Estado** (solo agent/admin)
   - nuevo → asignado → en_proceso → pausado → resuelto → cerrado
   - Notificación al usuario cuando cambia estado

4. **Detalles de Solicitud**
   - Información del cliente
   - Agente asignado
   - Archivos adjuntos
   - Historial de cambios
   - Feedback del usuario

**Simulación Demo**:

```typescript
// useEffect que simula cambios automáticos de estado
// ⚠️ REMOVER en producción
useEffect(() => {
  const interval = setInterval(() => {
    // Cambia estados aleatoriamente cada 10s
  }, 10000);
  return () => clearInterval(interval);
}, []);
```

**Componentes Relacionados**:

- `AdvancedSearchComponent`: Búsqueda y filtros
- `FileUploadComponent`: Subida de archivos

---

### 4. DIRECTORIO DE PERSONAL

#### 📄 app/(tabs)/directory.tsx

**Estado**: ✅ Completo y Optimizado

**Funcionalidades**:

1. **Lista de Usuarios**
   - Todos los usuarios activos (excepto el usuario actual)
   - Indicador de estado online (círculo verde)
   - Avatar, nombre, empresa, rol, categoría

2. **Búsqueda**
   - Por nombre
   - Por email
   - Por empresa
   - Búsqueda en tiempo real

3. **Filtros**
   - Por categoría (A, B, C, etc.)
   - Por zona (Norte, Sur, etc.)
   - Limpiar filtros

4. **Acciones por Usuario**
   ```typescript
   // Acciones disponibles
   - Llamar (tel:)
   - WhatsApp (wa.me)
   - Email (mailto:)
   - Iniciar Chat (crea chat room)
   - Enviar Solicitud (pre-asigna agente)
   ```

**Performance Optimizations**:

```typescript
// FlatList optimizations
<FlatList
  data={filteredUsers}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: 120,
    offset: 120 * index,
    index,
  })}
  maxToRenderPerBatch={10}
  windowSize={21}
/>
```

**Estados**:

```typescript
const [users, setUsers] = useState<User[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
const [selectedZona, setSelectedZona] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);
```

---

### 5. NOTIFICACIONES

#### 📄 contexts/NotificationContext.tsx

**Estado**: ✅ Completo

**Tipos de Notificaciones**:

1. **In-App Notifications**

   ```typescript
   interface InAppNotification {
     id: string;
     title: string;
     body: string;
     type: 'info' | 'success' | 'warning' | 'error';
     read: boolean;
     data?: any;
     created_at: string;
   }
   ```

2. **Push Notifications (Expo)**
   - Solicitud de permisos
   - Registro de token
   - Listeners de notificaciones

3. **Web Notifications API** (web)
   - Fallback para navegadores
   - Request permissions

**Funcionalidades**:

```typescript
// Enviar notificación demo
sendDemoNotification(title, body, type, data);

// Enviar notificación local
sendLocalNotification(title, body, data);

// Marcar como leído
markNotificationAsRead(id);

// Marcar todas como leído
markAllAsRead();

// Limpiar notificaciones
clearNotifications();
```

**Configuración de Listeners**:

```typescript
// Notificación recibida mientras app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notificación tapped
Notifications.addNotificationResponseReceivedListener(response => {
  // Navegar a pantalla específica según data
});
```

---

### 6. CALCULADORAS INDUSTRIALES

#### 📄 store/calculatorSlice.ts

**Estado**: ✅ Completo

**Estado de Redux**:

```typescript
interface CalculatorState {
  // Parámetros de entrada
  D: string; // Diámetro de la herramienta
  Z: string; // Número de dientes/filos
  N: string; // Velocidad de rotación (RPM)
  Vc: string; // Velocidad de corte (m/min)
  fz: string; // Avance por diente
  fn: string; // Avance por revolución
  vf: string; // Velocidad de avance
  ap: string; // Profundidad axial
  ae: string; // Profundidad radial
  np: string; // Número de pasadas
  lm: string; // Longitud a mecanizar

  // Resultados calculados
  tc: string; // Tiempo de corte
  Q: string; // Tasa de remoción de material

  // Configuración
  medida: 'mt' | 'im'; // Métrico o Imperial
  velocidad: 'n' | 'fn'; // RPM o Avance

  // UI State
  editable: number;
  keyboardHeight: string;
  scrollHeight: string;
  textoCa: string;
}
```

**Actions**:

```typescript
// Actualizar campo
setField({ field: 'D', value: '10' });

// Limpiar todos los campos
clearAll();

// Cambiar sistema de medida
setMedida('mt'); // o 'im'

// Cambiar tipo de velocidad
setVelocidad('n'); // o 'fn'

// Actualizar texto de categoría
updateTextoCa('Texto...');
```

**Archivos de Pantalla**:

- `app/calculator/index.tsx` ✅ (Menú)
- `app/calculator/BarrenadoScreen.tsx` ⚠️ (No verificado)
- `app/calculator/FresadoScreen.tsx` ⚠️ (No verificado)
- `app/calculator/SettingsCalculadoraScreen.tsx` ⚠️ (No verificado)

---

### 7. PERFIL Y CONFIGURACIÓN

#### 📄 app/(tabs)/profile.tsx

**Estado**: ✅ Completo (menús de configuración pendientes)

**Secciones**:

1. **Información Personal**
   - Avatar
   - Nombre completo
   - Email
   - Empresa
   - Rol

2. **Notificaciones** (últimas 5)
   - Lista de notificaciones in-app
   - Botones demo para enviar notificaciones
   - Marcar como leído
   - Marcar todas
   - Limpiar

3. **Menú de Configuración** (próximamente)
   - Configuración
   - Notificaciones
   - Privacidad y Seguridad
   - Ayuda y Soporte

4. **Admin Dashboard** (solo admin)
   - Componente `AdminDashboard` renderizado condicionalmente

5. **Health Check**
   - Componente `HealthCheck` para verificar conexión Supabase

6. **Logout**
   - Confirmación con Alert
   - Actualiza estado offline en DB
   - Limpia sesión
   - Redirige a `/auth`

---

### 8. HOME/DASHBOARD

#### 📄 app/(tabs)/index.tsx

**Estado**: 🚧 Completo (datos hardcodeados)

**Secciones**:

1. **Saludo Personalizado**

   ```typescript
   const greeting = `Hola, ${user?.nombre} ${user?.apellido_paterno}`;
   ```

2. **Accesos Rápidos**
   - Directorio
   - Nueva Solicitud
   - Calculadora

3. **Actividad Reciente** ⚠️ (hardcodeado)

   ```typescript
   const recentActivity = [
     {
       id: '1',
       title: 'Nueva solicitud...',
       time: 'Hace 5 min',
       type: 'solicitud',
     },
     // ...
   ];
   ```

4. **Estadísticas** ⚠️ (hardcodeado)
   ```typescript
   const stats = [
     { label: 'Solicitudes', value: '12', icon: FileText },
     { label: 'Mensajes', value: '24', icon: MessageCircle },
     { label: 'Contactos', value: '48', icon: Users },
   ];
   ```

**TODO**:

- [ ] Reemplazar datos hardcodeados con queries reales a Supabase
- [ ] Implementar gráficos de actividad
- [ ] Agregar filtros de fecha

---

## Estado de Completitud

### ✅ MÓDULOS COMPLETOS (85%)

| Módulo                | Completitud     | Notas                                       |
| --------------------- | --------------- | ------------------------------------------- |
| **Autenticación**     | 100%            | Login, Register, Logout, Sesión persistente |
| **Sistema de Chat**   | 100% ⭐⭐⭐⭐⭐ | Completo y avanzado                         |
| **Directorio**        | 100%            | Optimizado con FlatList                     |
| **Solicitudes CRM**   | 95%             | Funcional, con simulaciones demo            |
| **Notificaciones**    | 100%            | In-app, Push, Web                           |
| **Perfil**            | 90%             | Funcional, menús de config pendientes       |
| **Redux Store**       | 100%            | Configurado para calculadora                |
| **TypeScript**        | 100%            | Tipado estricto completo                    |
| **Deployment Config** | 100%            | Netlify configurado                         |
| **Real-time**         | 100%            | Supabase Realtime integrado                 |

### 🚧 MÓDULOS EN DESARROLLO (60%)

| Módulo              | Completitud | Notas                           |
| ------------------- | ----------- | ------------------------------- |
| **Calculadoras**    | 60%         | Archivos no verificados         |
| **Home/Dashboard**  | 85%         | UI completa, datos hardcodeados |
| **Admin Dashboard** | 50%         | No verificado                   |
| **Configuración**   | 30%         | Menús pendientes                |
| **Componentes**     | 70%         | Varios no verificados           |

### ⏳ MÓDULOS PENDIENTES (0%)

| Módulo             | Completitud | Notas                    |
| ------------------ | ----------- | ------------------------ |
| **Tests**          | 0%          | Sin tests implementados  |
| **Optimizaciones** | 30%         | Code splitting pendiente |
| **Documentación**  | 40%         | README básico            |
| **Modo Offline**   | 0%          | No implementado          |

---

## Tareas Pendientes para Producción

### 🔴 PRIORIDAD CRÍTICA (Pre-Deployment)

#### 1. Tests

```bash
# TODO: Implementar tests básicos
- [ ] Test de login/logout
- [ ] Test de creación de solicitudes
- [ ] Test de envío de mensajes
- [ ] Test de búsqueda en directorio
- [ ] Configurar CI/CD con tests
```

#### 2. Verificar Archivos de Calculadora

```bash
# TODO: Verificar existencia e implementación
- [ ] app/calculator/BarrenadoScreen.tsx
- [ ] app/calculator/FresadoScreen.tsx
- [ ] app/calculator/SettingsCalculadoraScreen.tsx
- [ ] Conectar Redux con vistas
- [ ] Implementar lógica de cálculos
```

#### 3. Remover Simulaciones Demo

```typescript
// TODO: Remover de app/(tabs)/requests.tsx (líneas 433-467)
useEffect(() => {
  const interval = setInterval(() => {
    // Simulación de cambios de estado
  }, 10000);
  return () => clearInterval(interval);
}, []);
```

#### 4. Reemplazar Datos Hardcodeados

```typescript
// TODO: En app/(tabs)/index.tsx
// Reemplazar:
const recentActivity = [
  /* datos estáticos */
];
const stats = [
  /* datos estáticos */
];

// Por queries reales a Supabase
```

#### 5. Corregir Bugs Conocidos

```typescript
// TODO: app/(tabs)/chat/index.tsx:153
// Reemplazar window.location.reload() con router.replace()

// TODO: metro.config.js
// Resolver conflicto de react-native-reanimated
```

#### 6. Limpiar Logs de Consola

```bash
# TODO: Buscar y remover console.log
grep -r "console.log" app/ components/ contexts/

# Usar sistema de logging con niveles
import { logger } from '@/utils/logger'
logger.info('...')
```

---

### 🟡 PRIORIDAD MEDIA (Post-Launch)

#### 1. Completar Dashboard

```typescript
// TODO: app/(tabs)/index.tsx
- [ ] Implementar query de actividad reciente real
- [ ] Implementar estadísticas reales del usuario
- [ ] Agregar gráficos de actividad
- [ ] Filtros de fecha
```

#### 2. Implementar Admin Dashboard

```typescript
// TODO: components/AdminDashboard.tsx
- [ ] Gestión de usuarios
- [ ] Estadísticas globales
- [ ] Reportes descargables
- [ ] Métricas de solicitudes
```

#### 3. Menús de Configuración

```typescript
// TODO: Crear pantallas
- [ ] app/settings/index.tsx (Configuración)
- [ ] app/settings/notifications.tsx
- [ ] app/settings/privacy.tsx
- [ ] app/settings/help.tsx
```

#### 4. Verificar Componentes

```bash
# TODO: Leer y verificar implementación
- [ ] components/NotificationToast.tsx
- [ ] components/AdvancedSearchComponent.tsx
- [ ] components/FileUploadComponent.tsx
- [ ] components/HealthCheck.tsx
- [ ] components/calculator/*.tsx
```

#### 5. Subida de Archivos a Supabase Storage

```typescript
// TODO: services/supabaseService.ts
export const uploadFile = async (file: File, bucket: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`${userId}/${file.name}`, file);

  if (error) throw error;
  return data;
};
```

---

### 🟢 PRIORIDAD BAJA (Mejoras Futuras)

#### 1. Modo Offline

```typescript
// TODO: Implementar
- [ ] Offline storage con SQLite
- [ ] Sync cuando vuelve online
- [ ] Indicadores de conexión
```

#### 2. Internacionalización

```typescript
// TODO: i18n/locales/en.json
- [ ] Agregar inglés
- [ ] Detectar idioma del dispositivo
- [ ] Selector de idioma en configuración
```

#### 3. PWA Avanzado

```typescript
// TODO: service-worker.js
- [ ] Service Workers
- [ ] Precaching de assets
- [ ] Instalación como app de escritorio
```

#### 4. Analytics

```bash
# TODO: Integrar analytics
npm install firebase @react-native-firebase/analytics

# Trackear eventos
analytics().logEvent('solicitud_creada', { tipo, prioridad })
```

---

## Guía de Deployment

### 📦 Pre-Deployment Checklist

```bash
# 1. Verificar variables de entorno
✓ EXPO_PUBLIC_SUPABASE_URL configurada
✓ EXPO_PUBLIC_SUPABASE_ANON_KEY configurada
✓ EXPO_PUBLIC_ENVIRONMENT=production

# 2. Verificar configuración de Supabase
✓ RLS habilitado en todas las tablas
✓ Políticas de seguridad configuradas
✓ Service Role Key guardada de forma segura

# 3. Build de producción
npm run build:production

# 4. Tests (cuando estén implementados)
npm run test
npm run lint
npm run type-check

# 5. Verificar archivos generados
ls -la dist/
```

### 🚀 Deployment a Netlify (Web)

#### Opción 1: Automático (GitHub)

1. **Conectar repositorio a Netlify**
   - Login en Netlify
   - New site from Git
   - Seleccionar repositorio

2. **Configurar Build Settings**

   ```
   Build command: npm ci && npm run build:production
   Publish directory: dist
   Node version: 20.19.4
   ```

3. **Agregar Environment Variables**
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_ENVIRONMENT=production`

4. **Deploy**
   - Push a rama `netifly` (o main)
   - Netlify detecta cambios y deploya automáticamente

#### Opción 2: Manual (CLI)

```bash
# 1. Build local
npm run build:production

# 2. Deploy a producción
npm run deploy

# O preview
npm run deploy:preview
```

### 📱 Deployment Móvil (EAS)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure project
eas build:configure

# 4. Build para stores
eas build --platform all

# 5. Submit a stores
eas submit --platform all
```

### 🔒 Security Headers (Netlify)

Ya configurados en `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
```

### 🔍 Verificación Post-Deployment

```bash
# 1. Verificar que el sitio carga
curl -I https://tu-app.netlify.app

# 2. Verificar headers de seguridad
curl -I https://tu-app.netlify.app | grep -i "X-Frame-Options"

# 3. Verificar conexión con Supabase
# Abrir sitio y verificar login

# 4. Verificar todas las funcionalidades
- [ ] Login funciona
- [ ] Directorio carga
- [ ] Chat funciona
- [ ] Solicitudes se pueden crear
- [ ] Notificaciones funcionan
```

---

## Troubleshooting

### Errores Comunes

#### 1. "Supabase Auth Error: Invalid JWT"

```bash
# Solución: Verificar que las keys de Supabase sean correctas
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

#### 2. "Cannot connect to Supabase"

```bash
# Solución: Verificar firewall y CSP headers
# Netlify debe permitir conexiones a *.supabase.co
```

#### 3. "Module not found: @/"

```bash
# Solución: Verificar babel-plugin-module-resolver
# babel.config.js debe tener:
plugins: [
  ['module-resolver', {
    root: ['.'],
    alias: { '@': './' }
  }]
]
```

#### 4. "Expo Router navigation not working"

```bash
# Solución: Verificar que todos los archivos tengan default export
# Verificar que _layout.tsx esté en cada carpeta de rutas
```

---

## Recursos Adicionales

### Documentación Oficial

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)

### Comunidad

- [Expo Discord](https://discord.com/invite/4gtbPAdpaE)
- [Supabase Discord](https://discord.supabase.com/)
- [React Native Community](https://reactnative.dev/community/overview)

### Herramientas

- [Supabase Studio](https://supabase.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com/)
- [EAS Dashboard](https://expo.dev/)

---

## Contacto y Soporte

Para dudas o soporte técnico:

- **Email**: soporte@elmec.com.mx
- **GitHub Issues**: [Crear issue](https://github.com/tu-usuario/elmecV2-Demo/issues)

---

**Última actualización**: 2025-10-14
**Versión del proyecto**: 1.0.0
**Mantenido por**: Equipo ELMEC

---

## Apéndices

### A. Variables de Entorno

```bash
# .env (NO COMMITEAR)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJyyy... # Solo backend
DEFAULT_TEMP_PASSWORD=abc321
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_BASIC_AUTH=false
EXPO_PUBLIC_OFFLINE_MODE=false
EAS_PROJECT_ID=xxx-xxx-xxx
```

### B. Scripts npm

```json
{
  "dev": "EXPO_NO_TELEMETRY=1 expo start",
  "build": "expo export --platform web --output-dir dist --clear",
  "build:production": "NODE_ENV=production EXPO_PUBLIC_ENVIRONMENT=production expo export --platform web --output-dir dist --clear",
  "deploy": "npm run build:production && netlify deploy --prod",
  "lint": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
  "type-check": "tsc --noEmit",
  "test": "jest",
  "android": "expo run:android",
  "ios": "expo run:ios"
}
```

### C. Estructura de Base de Datos

```sql
-- Tablas principales
users (id, email, nombre, rol, empresa, activo, is_online, last_seen)
requests (id, titulo, mensaje, tipo, prioridad, estatus, usuario_id, agente_id)
chat_rooms (id, tipo, participants[], request_id, last_message, is_active)
messages (id, chat_room_id, sender_id, message, type, file_url, reply_to)
notifications (id, user_id, title, body, type, priority, read, data)
```

---

**FIN DE LA DOCUMENTACIÓN**
