# 📚 WIKI COMPLETA - ELMEC v2 Mobile App

**Versión:** 2.0.0
**Fecha:** Octubre 2025
**Estado:** Producción
**Plataforma:** React Native + Expo + Supabase

---

## 📑 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Módulos Principales](#módulos-principales)
4. [Base de Datos](#base-de-datos)
5. [Autenticación y Seguridad](#autenticación-y-seguridad)
6. [API y Servicios](#api-y-servicios)
7. [Configuración del Proyecto](#configuración-del-proyecto)
8. [Guía de Desarrollo](#guía-de-desarrollo)
9. [Despliegue](#despliegue)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

### ¿Qué es ELMEC v2?

ELMEC v2 es una aplicación móvil empresarial diseñada para gestionar:

- **Solicitudes de clientes** (soporte, ventas, cotizaciones)
- **Chat en tiempo real** entre clientes y agentes
- **Notificaciones push** para actualizaciones
- **Calculadora de precios** con plantillas
- **Directorio de vendedores** por zonas
- **Gestión de usuarios** con roles diferenciados

### Características Principales

✅ **Autenticación Segura** con Supabase Auth
✅ **Realtime Chat** con Supabase Realtime
✅ **Gestión de Solicitudes** con workflow completo
✅ **Notificaciones Push** con sistema de prioridades
✅ **Calculadora Avanzada** con guardar/compartir
✅ **Roles y Permisos** (Admin, Agente, Cliente)
✅ **Modo Offline** para funcionalidades básicas
✅ **UI/UX Moderna** con animaciones nativas

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│           FRONTEND (React Native)           │
├─────────────────────────────────────────────┤
│  • Expo Router (Navegación)                 │
│  • React Context (Estado Global)            │
│  • Lucide React Native (Iconos)             │
│  • React Native Safe Area Context           │
└─────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────┐
│            BACKEND (Supabase)               │
├─────────────────────────────────────────────┤
│  • PostgreSQL (Base de Datos)               │
│  • Supabase Auth (Autenticación)            │
│  • Supabase Realtime (WebSockets)           │
│  • Supabase Storage (Archivos)              │
│  • Row Level Security (RLS)                 │
└─────────────────────────────────────────────┘
```

### Arquitectura de Carpetas

```
elmecV2-Demo/
├── app/                      # Rutas de la aplicación (Expo Router)
│   ├── (tabs)/              # Tabs principales
│   │   ├── index.tsx        # Dashboard
│   │   ├── requests.tsx     # Solicitudes
│   │   ├── chat/            # Chat
│   │   ├── calculator.tsx   # Calculadora
│   │   ├── directory.tsx    # Directorio
│   │   └── notifications.tsx
│   ├── auth/                # Autenticación
│   ├── settings/            # Configuración
│   └── _layout.tsx          # Layout raíz
├── components/              # Componentes reutilizables
│   ├── AdvancedSearchComponent.tsx
│   ├── FileUploadComponent.tsx
│   └── ChatMessage.tsx
├── contexts/                # Contexts de React
│   ├── AuthContext.tsx
│   ├── ChatContext.tsx
│   └── NotificationContext.tsx
├── lib/                     # Librerías y configuración
│   └── supabase.ts         # Cliente Supabase
├── types/                   # TypeScript types
│   └── supabase.ts
├── utils/                   # Utilidades
│   ├── fileUpload.ts
│   └── validators.ts
├── services/                # Servicios de API
│   └── apiService.ts
├── supabase/                # Configuración de Supabase
│   └── migrations/         # Migraciones SQL
└── scripts/                 # Scripts de utilidad
    ├── test-requests-creation.js
    └── setup-supabase-complete.js
```

---

## 📦 Módulos Principales

### 1. Dashboard (Home)

**Ubicación:** `app/(tabs)/index.tsx`

**Funcionalidades:**

- Vista general de métricas del usuario
- Solicitudes recientes
- Notificaciones importantes
- Acceso rápido a funciones principales

**Datos mostrados:**

- Total de solicitudes
- Solicitudes pendientes
- Mensajes sin leer
- Últimas actualizaciones

### 2. Solicitudes (Requests)

**Ubicación:** `app/(tabs)/requests.tsx`

**Flujo Completo:**

```
Cliente crea solicitud
         ↓
Sistema valida datos
         ↓
Se asigna a agente (opcional)
         ↓
Agente recibe notificación
         ↓
Agente actualiza estatus
         ↓
Cliente recibe notificación
         ↓
Chat disponible entre ambos
```

**Estados de Solicitud:**

1. `nuevo` - Recién creada
2. `asignado` - Asignada a agente
3. `en_proceso` - En trabajo
4. `pausado` - Pausada temporalmente
5. `resuelto` - Completada
6. `cerrado` - Cerrada y archivada

**Prioridades:**

- `baja` - Verde
- `media` - Amarillo
- `alta` - Naranja
- `urgente` - Rojo

**Tipos de Solicitud:**

1. Ventas
2. Soporte
3. Cotización
4. Rastreo de pedidos

### 3. Chat

**Ubicación:** `app/(tabs)/chat/`

**Características:**

- ✅ Mensajes en tiempo real (Supabase Realtime)
- ✅ Indicador de "escribiendo..."
- ✅ Indicador online/offline
- ✅ Envío de archivos
- ✅ Envío de imágenes
- ✅ Mensajes de audio
- ✅ Responder a mensajes
- ✅ Editar/Eliminar mensajes

**Tipos de Mensaje:**

- `text` - Mensaje de texto
- `image` - Imagen adjunta
- `file` - Archivo adjunto
- `audio` - Mensaje de voz
- `system` - Mensaje del sistema

**Estructura de Chat Room:**

```typescript
{
  id: string,
  tipo: 'support' | 'sales' | 'general',
  participants: string[], // IDs de usuarios
  request_id?: string, // Solicitud asociada
  last_message: object,
  is_active: boolean,
  metadata: {
    participant_names: string[],
    created_by: string
  }
}
```

### 4. Calculadora

**Ubicación:** `app/(tabs)/calculator.tsx`

**Funcionalidades:**

- Cálculos básicos y avanzados
- Guardar sesiones de cálculo
- Plantillas predefinidas
- Compartir resultados
- Historial de cálculos

**Casos de Uso:**

- Cotización de materiales
- Cálculo de descuentos
- Conversiones de unidades
- Estimaciones de costos

### 5. Directorio de Vendedores

**Ubicación:** `app/(tabs)/directory.tsx`

**Funcionalidades:**

- Listado de agentes por zona
- Filtrado por categoría
- Búsqueda por nombre
- Ver perfil de agente
- Contacto directo (chat/llamada)

**Filtros Disponibles:**

- Por zona geográfica
- Por categoría (Ventas, Soporte, etc.)
- Por disponibilidad
- Por especialidad

### 6. Notificaciones

**Ubicación:** `app/(tabs)/notifications.tsx`

**Tipos de Notificación:**

- `request_update` - Actualización de solicitud
- `new_message` - Nuevo mensaje en chat
- `assignment` - Nueva asignación
- `reminder` - Recordatorio
- `system` - Mensaje del sistema

**Prioridades:**

- `low` - Información general
- `medium` - Atención recomendada
- `high` - Requiere acción

**Flujo de Notificaciones:**

```
Evento ocurre en el sistema
         ↓
Se crea registro en tabla notifications
         ↓
Realtime trigger envía a clientes conectados
         ↓
Usuario recibe notificación en app
         ↓
Badge de contador se actualiza
```

---

## 🗄️ Base de Datos

### Tablas Principales

#### 1. users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  empresa TEXT,
  correo_electronico TEXT,
  celular TEXT,
  ciudad TEXT,
  estado TEXT,
  rol TEXT CHECK (rol IN ('customer', 'agent', 'admin')),
  categoria TEXT,
  zona TEXT,
  activo BOOLEAN DEFAULT true,
  foto TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  last_login TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. requests

```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo INTEGER NOT NULL,
  prioridad TEXT CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  estatus TEXT CHECK (estatus IN ('nuevo', 'asignado', 'en_proceso', 'pausado', 'resuelto', 'cerrado')),
  usuario_id UUID REFERENCES users(id),
  agente_id UUID REFERENCES users(id),
  fecha_vencimiento TIMESTAMP,
  archivos TEXT[],
  tags TEXT[],
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 3. chat_rooms

```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('support', 'sales', 'general')),
  participants UUID[] NOT NULL,
  request_id UUID REFERENCES requests(id),
  last_message JSONB,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 4. messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID REFERENCES chat_rooms(id),
  sender_id UUID REFERENCES users(id),
  sender_name TEXT,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'file', 'audio', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  audio_duration INTEGER,
  reply_to UUID REFERENCES messages(id),
  read_by JSONB,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 5. notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT CHECK (type IN ('request_update', 'new_message', 'assignment', 'reminder', 'system')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  data JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### Índices Importantes

```sql
-- Índices para requests
CREATE INDEX idx_requests_usuario_id ON requests(usuario_id);
CREATE INDEX idx_requests_agente_id ON requests(agente_id);
CREATE INDEX idx_requests_estatus ON requests(estatus);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);

-- Índices para messages
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Índices para notificaciones
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 🔐 Autenticación y Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

#### Políticas de Requests

```sql
-- Usuarios ven sus propias solicitudes
CREATE POLICY "users_can_view_own_requests"
ON requests FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

-- Agentes ven solicitudes asignadas
CREATE POLICY "agents_can_view_assigned_requests"
ON requests FOR SELECT
TO authenticated
USING (agente_id = auth.uid());

-- Admins ven todas
CREATE POLICY "admins_can_view_all_requests"
ON requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.rol = 'admin'
  )
);

-- Usuarios autenticados pueden crear
CREATE POLICY "authenticated_users_can_create_requests"
ON requests FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());
```

### Flujo de Autenticación

```
Usuario ingresa credenciales
         ↓
Supabase Auth valida
         ↓
Se genera JWT token
         ↓
Token se almacena en AsyncStorage
         ↓
Todas las requests incluyen token
         ↓
RLS valida permisos en cada query
```

### Roles y Permisos

| Rol          | Permisos                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **customer** | - Crear solicitudes<br>- Ver sus solicitudes<br>- Chatear con agentes<br>- Recibir notificaciones                                |
| **agent**    | - Ver solicitudes asignadas<br>- Actualizar estatus<br>- Chatear con clientes<br>- Ver directorio<br>- Crear/editar calculadoras |
| **admin**    | - Todos los permisos<br>- Asignar solicitudes<br>- Gestionar usuarios<br>- Ver estadísticas globales<br>- Acceso a configuración |

---

## 🔌 API y Servicios

### Supabase Client

**Ubicación:** `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// Cliente con tipos estrictos
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Cliente sin tipos (para operaciones con 'any')
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

### Contextos de React

#### AuthContext

```typescript
const {
  user, // Usuario actual
  session, // Sesión de Supabase
  isLoading, // Estado de carga
  isAuthenticated, // Estado de autenticación
  signIn, // Función de login
  signOut, // Función de logout
} = useAuth();
```

#### ChatContext

```typescript
const {
  chatRooms, // Lista de salas de chat
  messages, // Mensajes por sala
  typingUsers, // Usuarios escribiendo
  sendMessage, // Enviar mensaje
  createChatRoom, // Crear sala
  markMessagesAsRead, // Marcar como leído
} = useChat();
```

#### NotificationContext

```typescript
const {
  notifications, // Lista de notificaciones
  unreadCount, // Contador no leídas
  sendNotification, // Enviar notificación
  markAsRead, // Marcar como leída
} = useNotifications();
```

---

## ⚙️ Configuración del Proyecto

### Variables de Entorno

Archivo `.env`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Configuración
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_EAS_PROJECT_ID=elmec-mobile-app-demo

# Opcionales
DEFAULT_TEMP_PASSWORD=ChangeMe123!
EXPO_PUBLIC_BASIC_AUTH=false
EXPO_PUBLIC_OFFLINE_MODE=false
```

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd elmecV2-Demo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar en desarrollo
npm start

# 5. Opciones de ejecución
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

### Dependencias Principales

```json
{
  "expo": "~52.0.29",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "expo-router": "~4.0.14",
  "@supabase/supabase-js": "^2.47.10",
  "lucide-react-native": "^0.468.0",
  "react-native-safe-area-context": "4.12.0"
}
```

---

## 👨‍💻 Guía de Desarrollo

### Crear un Nuevo Módulo

1. **Crear archivo de ruta en `app/(tabs)/`**

```typescript
// app/(tabs)/nuevo-modulo.tsx
import { View, Text } from 'react-native';

export default function NuevoModulo() {
  return (
    <View>
      <Text>Nuevo Módulo</Text>
    </View>
  );
}
```

2. **Agregar tab en `app/(tabs)/_layout.tsx`**

```typescript
<Tabs.Screen
  name="nuevo-modulo"
  options={{
    title: 'Nuevo',
    tabBarIcon: ({ color }) => <IconName size={28} color={color} />,
  }}
/>
```

3. **Crear componentes en `components/`**
4. **Agregar lógica en contextos si es necesario**
5. **Actualizar tipos en `types/supabase.ts`**

### Mejores Prácticas

✅ **DO:**

- Usar TypeScript para todo
- Implementar manejo de errores
- Agregar logging para depuración
- Usar Context para estado global
- Implementar loading states
- Validar inputs del usuario
- Usar RLS para seguridad
- Documentar código complejo

❌ **DON'T:**

- Hardcodear credenciales
- Ignorar errores silenciosamente
- Hacer queries sin optimizar
- Exponer service role key en cliente
- Olvidar cleanup de subscriptions
- Usar inline styles excesivamente

---

## 🚀 Despliegue

### Build para Producción

```bash
# Android
npm run build:android
eas build --platform android --profile production

# iOS
npm run build:ios
eas build --platform ios --profile production
```

### Variables de Entorno en Producción

```bash
# .env.production
EXPO_PUBLIC_SUPABASE_URL=https://prod.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<production-key>
EXPO_PUBLIC_ENVIRONMENT=production
```

### Checklist de Despliegue

- [ ] Actualizar versión en `app.json`
- [ ] Ejecutar tests
- [ ] Validar variables de entorno
- [ ] Build exitoso sin warnings
- [ ] Probar en dispositivos físicos
- [ ] Validar políticas RLS en producción
- [ ] Configurar dominio personalizado
- [ ] Habilitar analytics
- [ ] Configurar error tracking (Sentry)

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. "Session expired" o "Invalid JWT"

**Causa:** Token expirado
**Solución:**

```typescript
// Verificar y refrescar sesión
const { data, error } = await supabase.auth.refreshSession();
```

#### 2. "Could not find column X"

**Causa:** Caché de esquema desactualizado
**Solución:**

- Reiniciar Supabase
- Verificar migraciones aplicadas
- Usar `supabaseClient` sin tipos estrictos

#### 3. "Permission denied for table"

**Causa:** Políticas RLS bloqueando
**Solución:**

- Verificar políticas en Supabase Dashboard
- Validar que el usuario esté autenticado
- Revisar logs de Supabase

#### 4. Realtime no funciona

**Causa:** Subscripción no configurada
**Solución:**

```typescript
// Verificar que RLS permite SELECT
// Verificar que el canal está suscrito
const channel = supabase.channel('room_1').subscribe();
```

---

## 📞 Soporte y Recursos

### Documentación Oficial

- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/docs)

### Comandos Útiles

```bash
# Ver logs
npm run logs

# Limpiar caché
npm run clean

# Tests
npm test

# Lint
npm run lint

# Format
npm run format
```

---

**Última actualización:** Octubre 2025
**Mantenido por:** Equipo ELMEC Development
**Versión del documento:** 1.0.0
