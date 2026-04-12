# MÓDULO 5: PERFIL (PROFILE)

## TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura del Módulo](#arquitectura-del-módulo)
3. [Componentes Principales](#componentes-principales)
4. [Funciones y Variables](#funciones-y-variables)
5. [Base de Datos y Esquema](#base-de-datos-y-esquema)
6. [Mapeo UI ↔ Base de Datos](#mapeo-ui--base-de-datos)
7. [Flujo de Datos](#flujo-de-datos)
8. [Casos de Uso](#casos-de-uso)
9. [Matriz de Pruebas](#matriz-de-pruebas)
10. [Limitaciones Conocidas](#limitaciones-conocidas)
11. [Mejoras Recomendadas](#mejoras-recomendadas)
12. [Checklist de QA](#checklist-de-qa)

---

## VISIÓN GENERAL

### Propósito

El módulo de Perfil es el centro de configuración personal y administración del sistema. Permite a los usuarios:

- Ver y gestionar su información personal
- Configurar notificaciones y preferencias
- Acceder al panel de administración (solo administradores)
- Monitorear el estado del sistema (health check)
- Cerrar sesión de forma segura

### Ubicación

- **Archivo Principal**: `/app/(tabs)/profile.tsx`
- **Componentes**:
  - `/components/AdminDashboard.tsx`
  - `/components/HealthCheck.tsx`
- **Contextos**:
  - `@/contexts/AuthContext`
  - `@/contexts/NotificationContext`
- **Hooks**: `@/hooks/useSupabaseHealth`

### Características Principales

1. **Vista Dual**: Perfil de usuario vs. Dashboard de administrador
2. **Información Personal**: Empresa, correo, teléfono, ubicación
3. **Gestión de Notificaciones**: Demo de 4 tipos (info, success, warning, error)
4. **Estado del Sistema**: Health check con 4 indicadores
5. **Menú de Configuración**: 4 opciones de configuración
6. **Cierre de Sesión**: Con confirmación de seguridad

---

## ARQUITECTURA DEL MÓDULO

```
┌─────────────────────────────────────────────────────────────────┐
│                     MÓDULO PERFIL                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─ Role Check
                              │
                 ┌────────────┴────────────┐
                 │                         │
          ┌──────▼──────┐          ┌──────▼──────┐
          │   Usuario   │          │    Admin    │
          │   Normal    │          │  Dashboard  │
          └─────────────┘          └─────────────┘
                 │                         │
    ┌────────────┼────────────┐           │
    │            │            │           │
┌───▼───┐  ┌────▼────┐  ┌────▼────┐  ┌───▼───┐
│ Header│  │Personal │  │Notif    │  │ Admin │
│Avatar │  │  Info   │  │Manager  │  │ Stats │
└───┬───┘  └────┬────┘  └────┬────┘  └───┬───┘
    │           │            │           │
    │           │            │           │
┌───▼───┐  ┌────▼────┐  ┌────▼────┐  ┌───▼───┐
│ User  │  │ 4 Info  │  │ Demo    │  │Charts │
│ Data  │  │ Fields  │  │Buttons  │  │& KPIs │
└───┬───┘  └────┬────┘  └────┬────┘  └───┬───┘
    │           │            │           │
    │           │      ┌─────▼─────┐     │
    │           │      │Health     │     │
    │           │      │Check      │     │
    │           │      └─────┬─────┘     │
    │           │            │           │
    │      ┌────▼────┐  ┌────▼────┐     │
    │      │Settings │  │Notif    │     │
    │      │  Menu   │  │  List   │     │
    │      └────┬────┘  └─────────┘     │
    │           │                       │
    └───────────┴───────────────────────┘
                │
           ┌────▼────┐
           │ Logout  │
           │ Button  │
           └─────────┘
```

### Flujo de Renderizado Condicional

```
User Logs In
     │
     ├─ Load user from AuthContext
     │
     ├─ Check user.rol
     │
     ├─ If rol === 'admin'
     │  └─> Render AdminDashboard
     │       └─> Mock stats loaded
     │       └─> Period selector (24h, 7d, 30d, 90d)
     │       └─> 4 Stat Cards + Charts
     │       └─> Quick Actions
     │
     └─ If rol !== 'admin'
        └─> Render Profile Screen
            ├─> Header (avatar + name)
            ├─> Personal Info (4 fields)
            ├─> HealthCheck Component
            ├─> Notifications Section
            │   ├─> Demo Buttons (4 types)
            │   └─> Notification List (last 5)
            ├─> Settings Menu (4 options)
            └─> Logout Button
```

---

## COMPONENTES PRINCIPALES

### 1. Profile Component (Main)

**Archivo**: `/app/(tabs)/profile.tsx`

**Props**: Ninguno (usa tabs layout)

**Hooks Utilizados**:

- `useAuth()` - Usuario actual y función logout
- `useNotifications()` - Gestión de notificaciones in-app
- `useRouter()` - Navegación programática

**Renderizado Condicional**:

```typescript
if (user?.rol === 'admin') {
  return <AdminDashboard />; // Vista de administrador
}
// Vista de usuario normal continúa...
```

---

### 2. AdminDashboard Component

**Archivo**: `/components/AdminDashboard.tsx`

**Propósito**: Panel ejecutivo con métricas del sistema para administradores

**Estado Local**:

```typescript
interface DashboardStats {
  totalUsers: number; // Total de usuarios
  activeUsers: number; // Usuarios activos
  totalRequests: number; // Total solicitudes
  pendingRequests: number; // Solicitudes pendientes
  resolvedRequests: number; // Solicitudes resueltas
  totalMessages: number; // Total mensajes
  avgResponseTime: number; // Tiempo promedio respuesta (horas)
  satisfactionRate: number; // Calificación promedio (1-5)
}
```

**Datos Mock**: Actualmente usa datos hardcodeados:

```typescript
const mockStats: DashboardStats = {
  totalUsers: 156,
  activeUsers: 89,
  totalRequests: 342,
  pendingRequests: 23,
  resolvedRequests: 298,
  totalMessages: 1247,
  avgResponseTime: 2.4,
  satisfactionRate: 4.6,
};
```

---

### 3. HealthCheck Component

**Archivo**: `/components/HealthCheck.tsx`

**Propósito**: Monitor de salud del sistema en tiempo real

**Hook Utilizado**: `useSupabaseHealth()`

**Estado Monitoreado**:

```typescript
interface HealthStatus {
  isConnected: boolean; // Conexión a Supabase
  isAuthenticated: boolean; // Sesión válida
  databaseAccessible: boolean; // Acceso a tablas
  realtimeConnected: boolean; // Canal realtime
  lastChecked: Date; // Última verificación
  errors: string[]; // Errores detectados
}
```

**Verificaciones Automáticas**:

- Ejecuta health check cada 30 segundos
- Testea acceso a tabla `users`
- Verifica canal realtime con timeout de 5s

---

## FUNCIONES Y VARIABLES

### Variables de Estado

#### Profile Screen (Usuario Normal)

| Variable                 | Tipo                                   | Fuente               | Descripción                    |
| ------------------------ | -------------------------------------- | -------------------- | ------------------------------ |
| `user`                   | `User \| null`                         | `useAuth()`          | Usuario autenticado actual     |
| `logout`                 | `() => Promise<void>`                  | `useAuth()`          | Función de cierre de sesión    |
| `inAppNotifications`     | `InAppNotification[]`                  | `useNotifications()` | Lista de notificaciones in-app |
| `unreadCount`            | `number`                               | `useNotifications()` | Contador de no leídas          |
| `markNotificationAsRead` | `(id: string) => void`                 | `useNotifications()` | Marcar como leída              |
| `markAllAsRead`          | `() => void`                           | `useNotifications()` | Marcar todas leídas            |
| `clearNotifications`     | `() => void`                           | `useNotifications()` | Limpiar todas                  |
| `sendDemoNotification`   | `(title, body, type) => Promise<void>` | `useNotifications()` | Enviar notificación demo       |
| `router`                 | `Router`                               | `useRouter()`        | Navegación                     |

#### Admin Dashboard

| Variable            | Tipo                              | Inicial    | Descripción                  |
| ------------------- | --------------------------------- | ---------- | ---------------------------- |
| `stats`             | `DashboardStats`                  | Ver arriba | Estadísticas del dashboard   |
| `loading`           | `boolean`                         | `true`     | Estado de carga              |
| `selectedPeriod`    | `'24h' \| '7d' \| '30d' \| '90d'` | `'7d'`     | Periodo seleccionado         |
| `requestsChartData` | `ChartData[]`                     | Calculado  | Datos para gráfico de barras |

#### Health Check

| Variable      | Tipo                  | Descripción                                                |
| ------------- | --------------------- | ---------------------------------------------------------- |
| `health`      | `HealthStatus`        | Estado completo del sistema                                |
| `checkHealth` | `() => Promise<void>` | Función para re-verificar                                  |
| `isHealthy`   | `boolean`             | `isConnected && databaseAccessible && errors.length === 0` |

---

### Funciones Principales

#### 1. handleLogout()

**Archivo**: `profile.tsx:47-66`
**Propósito**: Cerrar sesión con confirmación

```typescript
const handleLogout = () => {
  Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Cerrar Sesión',
      style: 'destructive',
      onPress: async () => {
        try {
          await logout();
          router.replace('/auth');
        } catch (error) {
          console.error('❌ Error en handleLogout:', error);
        }
      },
    },
  ]);
};
```

**Flujo**:

1. Muestra alerta de confirmación
2. Si confirma → ejecuta `logout()` del AuthContext
3. Redirige a `/auth` con `router.replace()`
4. Maneja errores en consola

**Testing**: Verificar que logout limpia sesión y redirige correctamente

---

#### 2. sendDemoNotification()

**Archivo**: `NotificationContext.tsx:183-223`
**Propósito**: Enviar notificación de demostración

```typescript
const sendDemoNotification = useCallback(
  async (
    title: string,
    body: string,
    type: InAppNotification['type'] = 'info',
    data?: any
  ) => {
    const newNotification: InAppNotification = {
      id: Date.now().toString(),
      title,
      body,
      type,
      timestamp: new Date().toISOString(),
      data,
      read: false,
    };

    setInAppNotifications(prev => [newNotification, ...prev]);

    // Web notification
    if (Platform.OS === 'web') {
      sendWebNotification(title, body);
    } else {
      // Native notification
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: null, // Immediate
      });
    }
  },
  []
);
```

**Parámetros**:

- `title` (string): Título de la notificación
- `body` (string): Cuerpo del mensaje
- `type` ('info' | 'success' | 'warning' | 'error'): Tipo de notificación
- `data` (any): Datos adicionales opcionales

**Comportamiento**:

- Crea objeto `InAppNotification` con ID único (timestamp)
- Agrega al inicio del array de notificaciones
- **Web**: Envía notificación del navegador si tiene permisos
- **Mobile**: Programa notificación nativa con Expo Notifications

**Testing**:

- Verificar que cada tipo muestra el color correcto
- Validar que incrementa `unreadCount`
- Confirmar notificación nativa en mobile
- Confirmar notificación web en navegador

---

#### 3. checkHealth()

**Archivo**: `useSupabaseHealth.ts:23-96`
**Propósito**: Verificar estado de todos los servicios de Supabase

```typescript
const checkHealth = async () => {
  const errors: string[] = [];
  let isConnected = false;
  let isAuthenticated = false;
  let databaseAccessible = false;
  let realtimeConnected = false;

  try {
    // 1. Check basic connection + auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    isConnected = true;
    isAuthenticated = !!session;

    // 2. Check database access
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        errors.push(`Database error: ${error.message}`);
      } else {
        databaseAccessible = true;
      }
    } catch (dbError: any) {
      errors.push(`Database connection failed: ${dbError.message}`);
    }

    // 3. Check realtime
    try {
      const channel = supabase.channel('health-check');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Realtime connection timeout'));
        }, 5000);

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            realtimeConnected = true;
            resolve(true);
          })
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              realtimeConnected = true;
              resolve(true);
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timeout);
              reject(new Error('Realtime channel error'));
            }
          });
      });

      supabase.removeChannel(channel);
    } catch (realtimeError: any) {
      errors.push(`Realtime error: ${realtimeError.message}`);
    }
  } catch (connectionError: any) {
    errors.push(`Connection error: ${connectionError.message}`);
  }

  setHealth({
    isConnected,
    isAuthenticated,
    databaseAccessible,
    realtimeConnected,
    lastChecked: new Date(),
    errors,
  });
};
```

**Verificaciones**:

1. **Conexión**: Intenta obtener sesión de Supabase Auth
2. **Autenticación**: Verifica que existe sesión válida
3. **Base de Datos**: Query de prueba a tabla `users`
4. **Realtime**: Suscripción a canal temporal con timeout 5s

**Auto-Refresh**: Se ejecuta automáticamente cada 30 segundos

**Testing**:

- Con conexión: Todos los indicadores ✅
- Sin conexión a internet: `isConnected` ❌
- Sin sesión: `isAuthenticated` ❌
- Con RLS restrictivo: `databaseAccessible` ❌
- Sin websockets: `realtimeConnected` ❌

---

#### 4. markNotificationAsRead()

**Archivo**: `NotificationContext.tsx:234-240`
**Propósito**: Marcar una notificación específica como leída

```typescript
const markNotificationAsRead = (id: string) => {
  setInAppNotifications(prev =>
    prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    )
  );
};
```

**Parámetro**: `id` - ID de la notificación
**Efecto**:

- Actualiza propiedad `read` de la notificación
- Decrementa `unreadCount`
- Quita el indicador visual (punto azul)

---

#### 5. markAllAsRead()

**Archivo**: `NotificationContext.tsx:242-246`
**Propósito**: Marcar todas las notificaciones como leídas

```typescript
const markAllAsRead = () => {
  setInAppNotifications(prev =>
    prev.map(notification => ({ ...notification, read: true }))
  );
};
```

**Efecto**:

- Marca todas con `read: true`
- `unreadCount` se vuelve 0
- Útil para "limpiar" badges

---

#### 6. clearNotifications()

**Archivo**: `NotificationContext.tsx:248-250`
**Propósito**: Eliminar todas las notificaciones

```typescript
const clearNotifications = () => {
  setInAppNotifications([]);
};
```

**Efecto**:

- Vacía completamente el array
- `unreadCount` = 0
- Muestra mensaje "No hay notificaciones"

**⚠️ Advertencia**: No hay confirmación, acción inmediata

---

### Constantes del Menú de Configuración

#### menuItems

**Archivo**: `profile.tsx:68-118`

```typescript
const menuItems = [
  {
    title: 'Configuración',
    subtitle: 'Preferencias de la aplicación',
    icon: Settings,
    color: '#6b7280',
    onPress: () =>
      Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
  },
  {
    title: 'Notificaciones',
    subtitle: 'Gestionar alertas y avisos',
    icon: Bell,
    color: '#f59e0b',
    onPress: () => {
      Alert.alert(
        'Gestionar Notificaciones',
        `Tienes ${unreadCount} notificaciones sin leer`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Marcar todas como leídas', onPress: markAllAsRead },
          {
            text: 'Limpiar todas',
            style: 'destructive',
            onPress: clearNotifications,
          },
        ]
      );
    },
  },
  {
    title: 'Privacidad y Seguridad',
    subtitle: 'Controla tu información',
    icon: Shield,
    color: '#10b981',
    onPress: () =>
      Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
  },
  {
    title: 'Ayuda y Soporte',
    subtitle: 'Centro de ayuda y FAQ',
    icon: HelpCircle,
    color: '#3b82f6',
    onPress: () =>
      Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
  },
];
```

**Estado Actual**:

- ✅ **Notificaciones**: Funcional (gestiona notificaciones in-app)
- ⚠️ **Configuración**: Placeholder
- ⚠️ **Privacidad**: Placeholder
- ⚠️ **Ayuda**: Placeholder

---

## BASE DE DATOS Y ESQUEMA

### Tablas Utilizadas

#### 1. users (Lectura)

**Propósito**: Información del usuario actual

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  correo_electronico VARCHAR(255) UNIQUE NOT NULL,
  celular VARCHAR(20),
  empresa VARCHAR(100),
  ciudad VARCHAR(100),
  estado VARCHAR(100),
  categoria VARCHAR(50),
  zona VARCHAR(50),
  rol user_role NOT NULL DEFAULT 'usuario',
  activo BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_online TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('usuario', 'agente', 'admin');
```

**Campos Mostrados en Perfil**:

- `nombre`, `apellido_paterno`, `apellido_materno` → Header (nombre completo)
- `correo_electronico` → Header (email) + Info Card
- `empresa` → Info Card
- `celular` → Info Card
- `ciudad`, `estado` → Info Card (concatenados)
- `rol` → Determina vista (admin vs usuario)

**Query Implícita** (vía AuthContext):

```sql
SELECT * FROM users WHERE id = :current_user_id;
```

---

#### 2. Health Check Query

**Tabla**: `users`
**Query**:

```sql
SELECT count FROM users LIMIT 1;
```

**Propósito**: Verificar acceso a base de datos
**Frecuencia**: Cada 30 segundos
**Manejo de Errores**: Captura error y lo agrega a `health.errors[]`

---

### Tablas Consultadas por AdminDashboard (Futuro)

Actualmente usa datos mock, pero debería consultar:

```sql
-- Total y usuarios activos
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_online = true) as active_users
FROM users
WHERE activo = true;

-- Estadísticas de solicitudes
SELECT
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE estatus = 'nuevo') as pending_requests,
  COUNT(*) FILTER (WHERE estatus = 'resuelto') as resolved_requests
FROM requests
WHERE created_at >= NOW() - INTERVAL '7 days'; -- según selectedPeriod

-- Total mensajes
SELECT COUNT(*) as total_messages
FROM messages
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Tiempo promedio de respuesta
SELECT AVG(
  EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600
) as avg_response_hours
FROM requests
WHERE estatus = 'resuelto'
  AND updated_at >= NOW() - INTERVAL '7 days';

-- Calificación promedio
SELECT AVG(rating) as satisfaction_rate
FROM requests
WHERE rating IS NOT NULL
  AND updated_at >= NOW() - INTERVAL '7 days';
```

---

## MAPEO UI ↔ BASE DE DATOS

### Vista de Usuario Normal

#### Header Section

```typescript
// UI Component: Avatar
<View style={styles.avatar}>
  <Text style={styles.avatarText}>
    {user?.nombre?.charAt(0)}           // Primera letra nombre
    {user?.apellido_paterno?.charAt(0)} // Primera letra apellido
  </Text>
</View>

// UI Component: User Name
<Text style={styles.userName}>
  {user?.nombre} {user?.apellido_paterno} {user?.apellido_materno}
</Text>
// DB: users.nombre + users.apellido_paterno + users.apellido_materno

// UI Component: Email
<Text style={styles.userEmail}>{user?.correo_electronico}</Text>
// DB: users.correo_electronico
```

**Fuente de Datos**: `useAuth().user`
**Origen**: AuthContext obtiene de Supabase Auth + users table

---

#### Personal Info Card

| Campo UI  | Icono    | Label                | Valor                              | Campo DB                        |
| --------- | -------- | -------------------- | ---------------------------------- | ------------------------------- |
| Empresa   | Building | "Empresa"            | `user?.empresa`                    | `users.empresa`                 |
| Email     | Mail     | "Correo Electrónico" | `user?.correo_electronico`         | `users.correo_electronico`      |
| Teléfono  | Phone    | "Teléfono"           | `user?.celular`                    | `users.celular`                 |
| Ubicación | MapPin   | "Ubicación"          | `${user?.ciudad}, ${user?.estado}` | `users.ciudad` + `users.estado` |

**Componente**:

```typescript
// profile.tsx:139-178
<View style={styles.infoCard}>
  <View style={styles.infoItem}>
    <Building size={20} color="#6b7280" />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>Empresa</Text>
      <Text style={styles.infoValue}>{user?.empresa}</Text>
    </View>
  </View>
  {/* ...3 campos más */}
</View>
```

---

#### Health Check Indicators

| Indicador UI  | Icono    | Label           | Campo Estado                | Verificación                 |
| ------------- | -------- | --------------- | --------------------------- | ---------------------------- |
| Conexión      | Wifi     | "Conexión"      | `health.isConnected`        | `supabase.auth.getSession()` |
| Autenticación | Shield   | "Autenticación" | `health.isAuthenticated`    | `session !== null`           |
| Base de Datos | Database | "Base de Datos" | `health.databaseAccessible` | Query a `users`              |
| Tiempo Real   | Zap      | "Tiempo Real"   | `health.realtimeConnected`  | Canal realtime               |

**Fuente**: `useSupabaseHealth().health`
**Actualización**: Cada 30 segundos + manual con refresh button

**Componente**:

```typescript
// HealthCheck.tsx:38-64
<View style={styles.statusList}>
  <View style={styles.statusItem}>
    <Wifi size={20} color={getStatusColor(health.isConnected)} />
    <Text style={styles.statusLabel}>Conexión</Text>
    {getStatusIcon(health.isConnected)}
  </View>
  {/* ...3 indicadores más */}
</View>
```

---

#### Notifications Section

**Demo Buttons**:

```typescript
// profile.tsx:192-248
const demoButtons = [
  { label: 'Info', type: 'info', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Éxito', type: 'success', color: '#10b981', bg: '#ecfdf5' },
  { label: 'Advertencia', type: 'warning', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Error', type: 'error', color: '#ef4444', bg: '#fef2f2' },
];
```

**Fuente de Datos**: Estado local del `NotificationContext`
**No hay base de datos**: Las notificaciones son solo in-memory (se pierden al recargar)

**Notification List**:

```typescript
// profile.tsx:252-281
{inAppNotifications.slice(0, 5).map(notification => (
  <TouchableOpacity
    key={notification.id}
    style={[
      styles.notificationItem,
      !notification.read && styles.unreadNotification,
    ]}
    onPress={() => markNotificationAsRead(notification.id)}
  >
    <View style={styles.notificationContent}>
      <Text style={styles.notificationTitle}>{notification.title}</Text>
      <Text style={styles.notificationBody}>{notification.body}</Text>
      <Text style={styles.notificationTime}>
        {new Date(notification.timestamp).toLocaleTimeString('es-ES')}
      </Text>
    </View>
    {!notification.read && <View style={styles.unreadDot} />}
  </TouchableOpacity>
))}
```

**Mapeo**:

- `notification.title` → Texto título
- `notification.body` → Texto cuerpo
- `notification.timestamp` → Hora formateada
- `notification.read` → Fondo amarillo si false + punto azul

---

### Vista de Administrador (AdminDashboard)

#### Stat Cards

| Card             | Valor                       | Subtítulo                             | Icono         | Color   | Fuente Actual | Fuente Futura                           |
| ---------------- | --------------------------- | ------------------------------------- | ------------- | ------- | ------------- | --------------------------------------- |
| Total Usuarios   | `stats.totalUsers`          | `${stats.activeUsers} activos`        | Users         | #3b82f6 | Mock (156)    | `COUNT(*) FROM users WHERE activo=true` |
| Solicitudes      | `stats.totalRequests`       | `${stats.pendingRequests} pendientes` | FileText      | #10b981 | Mock (342)    | `COUNT(*) FROM requests`                |
| Mensajes         | `stats.totalMessages`       | "Total enviados"                      | MessageCircle | #f59e0b | Mock (1247)   | `COUNT(*) FROM messages`                |
| Tiempo Respuesta | `${stats.avgResponseTime}h` | "Promedio"                            | Clock         | #8b5cf6 | Mock (2.4h)   | AVG de `requests`                       |

**Código**:

```typescript
// AdminDashboard.tsx:206-239
<View style={styles.statsGrid}>
  <StatCard
    title="Total Usuarios"
    value={stats.totalUsers}
    subtitle={`${stats.activeUsers} activos`}
    icon={<Users />}
    color="#3b82f6"
    trend={{ value: 12, isPositive: true }}
  />
  {/* ...3 cards más */}
</View>
```

---

#### Charts & Metrics

**Bar Chart Data**:

```typescript
// AdminDashboard.tsx:78-87
const requestsChartData: ChartData[] = useMemo(
  () => [
    { label: 'Resueltas', value: stats.resolvedRequests, color: '#10b981' },
    {
      label: 'En proceso',
      value:
        stats.totalRequests - stats.resolvedRequests - stats.pendingRequests,
      color: '#3b82f6',
    },
    { label: 'Pendientes', value: stats.pendingRequests, color: '#f59e0b' },
  ],
  [stats]
);
```

**Métricas Clave**:

```typescript
// AdminDashboard.tsx:248-281
<View style={styles.metricsList}>
  <View style={styles.metricItem}>
    <CheckCircle size={20} color="#10b981" />
    <Text>Tasa de Resolución</Text>
    <Text>
      {((stats.resolvedRequests / stats.totalRequests) * 100).toFixed(1)}%
    </Text>
  </View>

  <View style={styles.metricItem}>
    <Activity size={20} color="#3b82f6" />
    <Text>Satisfacción Cliente</Text>
    <Text>{stats.satisfactionRate}/5.0</Text>
  </View>

  <View style={styles.metricItem}>
    <TrendingUp size={20} color="#f59e0b" />
    <Text>Usuarios Activos</Text>
    <Text>
      {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
    </Text>
  </View>
</View>
```

**⚠️ CRÍTICO**: Todos los datos son hardcodeados, no reflejan datos reales

---

## FLUJO DE DATOS

### Diagrama de Flujo - Carga Inicial

```
App Start
   │
   ├─> AuthContext.useEffect()
   │   └─> Load user from Supabase Auth
   │       └─> Query users table for full profile
   │           └─> Set user state
   │
   ├─> NotificationContext.useEffect()
   │   ├─> Platform === 'web'?
   │   │   └─> Request browser notification permission
   │   └─> Platform === 'mobile'?
   │       └─> Register for Expo push notifications
   │           └─> Get push token
   │
   └─> Profile Component Mounts
       │
       ├─> Check user.rol
       │
       ├─> IF rol === 'admin'
       │   └─> Render AdminDashboard
       │       └─> useEffect (load mock stats after 1s)
       │           └─> setStats(mockStats)
       │               └─> Render charts
       │
       └─> IF rol !== 'admin'
           └─> Render Profile Screen
               │
               ├─> Header Section
               │   └─> Display user.nombre, apellido, email
               │
               ├─> Personal Info Section
               │   └─> Display empresa, email, celular, ubicación
               │
               ├─> HealthCheck Component
               │   └─> useSupabaseHealth()
               │       └─> checkHealth() immediately
               │           ├─> Test auth.getSession()
               │           ├─> Test SELECT from users
               │           └─> Test realtime channel
               │               └─> Update health state
               │       └─> setInterval(checkHealth, 30000)
               │
               ├─> Notifications Section
               │   ├─> Demo Buttons (4 types)
               │   └─> Notification List
               │       └─> Display last 5 from inAppNotifications
               │
               └─> Settings Menu
                   └─> 4 menu items
```

---

### Diagrama de Flujo - Enviar Notificación Demo

```
User clicks "Info" button
   │
   └─> sendDemoNotification('Información', 'Esta es...', 'info')
       │
       ├─> Create InAppNotification object
       │   ├─> id: Date.now().toString()
       │   ├─> title: 'Información'
       │   ├─> body: 'Esta es una notificación de información'
       │   ├─> type: 'info'
       │   ├─> timestamp: new Date().toISOString()
       │   └─> read: false
       │
       ├─> setInAppNotifications(prev => [newNotification, ...prev])
       │   └─> UI updates: unreadCount++, new item appears
       │
       └─> Platform.OS === 'web'?
           ├─> YES: sendWebNotification(title, body)
           │   └─> new Notification(title, { body, icon })
           │       └─> Browser shows notification
           │
           └─> NO: Notifications.scheduleNotificationAsync()
               └─> Native notification appears
                   └─> Sound plays (if enabled)
```

---

### Diagrama de Flujo - Marcar Notificación como Leída

```
User clicks notification item
   │
   └─> onPress={() => markNotificationAsRead(notification.id)}
       │
       └─> setInAppNotifications(prev =>
             prev.map(n =>
               n.id === id
                 ? { ...n, read: true }
                 : n
             )
           )
           │
           └─> UI Updates:
               ├─> Fondo amarillo → blanco
               ├─> Punto azul desaparece
               └─> unreadCount decrements
```

---

### Diagrama de Flujo - Logout

```
User clicks "Cerrar Sesión" button
   │
   └─> handleLogout()
       │
       └─> Alert.alert('Cerrar Sesión', '¿Estás seguro...?')
           │
           ├─> User clicks "Cancelar"
           │   └─> Alert closes, nothing happens
           │
           └─> User clicks "Cerrar Sesión"
               │
               └─> try {
                     await logout(); // AuthContext
                     router.replace('/auth');
                   }
                   │
                   └─> logout() function:
                       ├─> await supabase.auth.signOut()
                       │   └─> Clear session from storage
                       │       └─> Clear cookies
                       │
                       ├─> setUser(null)
                       │   └─> AuthContext state cleared
                       │
                       └─> router.replace('/auth')
                           └─> Navigate to login screen
                               └─> Cannot go back (replace, not push)
```

---

### Diagrama de Flujo - Health Check

```
HealthCheck component mounts
   │
   └─> useSupabaseHealth()
       │
       ├─> useEffect (on mount)
       │   ├─> checkHealth() immediately
       │   └─> setInterval(checkHealth, 30000)
       │
       └─> checkHealth() function:
           │
           ├─> Test 1: Connection & Auth
           │   └─> const { data: { session } } = await supabase.auth.getSession()
           │       ├─> SUCCESS: isConnected = true
           │       │            isAuthenticated = !!session
           │       └─> ERROR: Add to errors[]
           │
           ├─> Test 2: Database Access
           │   └─> await supabase.from('users').select('count').limit(1)
           │       ├─> SUCCESS: databaseAccessible = true
           │       └─> ERROR: Add to errors[], databaseAccessible = false
           │
           ├─> Test 3: Realtime Connection
           │   └─> const channel = supabase.channel('health-check')
           │       └─> channel.subscribe()
           │           ├─> Timeout 5s
           │           ├─> SUBSCRIBED: realtimeConnected = true
           │           └─> ERROR: Add to errors[], realtimeConnected = false
           │
           └─> setHealth({
                 isConnected,
                 isAuthenticated,
                 databaseAccessible,
                 realtimeConnected,
                 lastChecked: new Date(),
                 errors
               })
               │
               └─> UI Updates:
                   ├─> Each indicator shows ✅ or ❌
                   ├─> Colors change (green/red)
                   ├─> Overall status updates
                   └─> lastChecked timestamp updates
```

**User can refresh manually**:

```
User clicks refresh button
   │
   └─> onPress={checkHealth}
       └─> Runs full health check again
           └─> UI updates with new results
```

---

## CASOS DE USO

### CU-PERFIL-01: Ver Información Personal

**Actor**: Usuario autenticado
**Precondiciones**:

- Usuario ha iniciado sesión
- Está en tab "Perfil"

**Flujo Principal**:

1. Sistema carga datos del usuario desde AuthContext
2. Sistema muestra avatar con iniciales (nombre + apellido)
3. Sistema muestra nombre completo
4. Sistema muestra correo electrónico
5. Sistema muestra 4 campos de información personal:
   - Empresa
   - Correo electrónico
   - Teléfono celular
   - Ubicación (ciudad, estado)

**Postcondiciones**: Información personal visible y actualizada

**Criterios de Aceptación**:

- ✅ Avatar muestra primeras letras de nombre y apellido
- ✅ Nombre completo incluye nombre + paterno + materno
- ✅ Todos los campos muestran datos del usuario actual
- ✅ Campos vacíos muestran `undefined` o espacio en blanco
- ✅ Layout responsive adapta a diferentes tamaños de pantalla

---

### CU-PERFIL-02: Enviar Notificación de Demostración

**Actor**: Usuario autenticado
**Precondiciones**: Usuario en pantalla de perfil

**Flujo Principal**:

1. Usuario navega a sección "Notificaciones"
2. Usuario ve 4 botones de demo: Info, Éxito, Advertencia, Error
3. Usuario toca botón "Éxito"
4. Sistema crea notificación in-app con:
   - ID único (timestamp)
   - Título: "Éxito"
   - Cuerpo: "Operación completada correctamente"
   - Tipo: 'success'
   - Estado: no leída
5. Sistema agrega notificación al inicio de la lista
6. Sistema incrementa contador de no leídas
7. **Si plataforma es web**: Sistema envía notificación del navegador
8. **Si plataforma es mobile**: Sistema programa notificación nativa
9. Sistema muestra notificación en la lista con fondo amarillo

**Postcondiciones**:

- Nueva notificación visible en lista
- Contador actualizado
- Notificación del sistema enviada

**Criterios de Aceptación**:

- ✅ Notificación aparece inmediatamente
- ✅ Color de fondo amarillo indica no leída
- ✅ Punto azul visible a la derecha
- ✅ Hora actual se muestra correctamente
- ✅ En web: Browser notification si permisos concedidos
- ✅ En mobile: Native notification con sonido

---

### CU-PERFIL-03: Marcar Notificación como Leída

**Actor**: Usuario autenticado
**Precondiciones**:

- Existen notificaciones no leídas
- `unreadCount > 0`

**Flujo Principal**:

1. Usuario ve lista de notificaciones
2. Usuario identifica notificación no leída (fondo amarillo + punto azul)
3. Usuario toca la notificación
4. Sistema ejecuta `markNotificationAsRead(notification.id)`
5. Sistema actualiza propiedad `read` a `true`
6. Sistema remueve fondo amarillo
7. Sistema remueve punto azul
8. Sistema decrementa `unreadCount`
9. Sistema actualiza contador en título de sección

**Postcondiciones**:

- Notificación marcada como leída
- Contador decrementado
- Cambio visual aplicado

**Criterios de Aceptación**:

- ✅ Fondo cambia de amarillo (#fef9e7) a blanco (#ffffff)
- ✅ Punto azul desaparece
- ✅ Contador se actualiza inmediatamente
- ✅ Otros indicadores no se ven afectados

---

### CU-PERFIL-04: Gestionar Notificaciones Masivamente

**Actor**: Usuario autenticado
**Precondiciones**: Usuario en pantalla de perfil

**Flujo Principal**:

1. Usuario toca menú item "Notificaciones"
2. Sistema muestra Alert con 3 opciones:
   - "Cancelar"
   - "Marcar todas como leídas"
   - "Limpiar todas" (destructivo)
3. Usuario selecciona "Marcar todas como leídas"
4. Sistema ejecuta `markAllAsRead()`
5. Sistema marca todas las notificaciones con `read: true`
6. Sistema actualiza UI quitando todos los fondos amarillos
7. Sistema actualiza contador a 0

**Flujo Alternativo 3A**: Usuario selecciona "Limpiar todas"

- 3A.1: Sistema ejecuta `clearNotifications()`
- 3A.2: Sistema vacía array de notificaciones
- 3A.3: Sistema muestra mensaje "No hay notificaciones"
- 3A.4: Sistema resetea contador a 0

**Postcondiciones**: Notificaciones gestionadas según selección

**Criterios de Aceptación**:

- ✅ Alert muestra contador actual: "Tienes X notificaciones sin leer"
- ✅ "Marcar todas" preserva notificaciones pero las marca leídas
- ✅ "Limpiar todas" elimina completamente las notificaciones
- ✅ "Cancelar" cierra alert sin cambios
- ✅ Cambios se reflejan inmediatamente en UI

---

### CU-PERFIL-05: Verificar Estado del Sistema

**Actor**: Usuario autenticado
**Precondiciones**: Usuario en pantalla de perfil

**Flujo Principal**:

1. Sistema monta componente HealthCheck
2. Sistema ejecuta `checkHealth()` automáticamente
3. Sistema verifica 4 servicios en secuencia:
   - **Conexión**: Intenta obtener sesión de Supabase
   - **Autenticación**: Verifica que sesión existe
   - **Base de Datos**: Query de prueba a tabla users
   - **Realtime**: Suscripción a canal temporal (timeout 5s)
4. Sistema actualiza indicadores visuales:
   - ✅ Verde si servicio OK
   - ❌ Rojo si servicio falla
5. Sistema muestra timestamp "Última verificación: HH:MM:SS"
6. Sistema muestra estado general:
   - ✅ "Sistema funcionando correctamente" (verde) si todos OK
   - ⚠️ "Se detectaron problemas" (rojo) si alguno falla
7. **Si hay errores**: Sistema lista errores específicos en panel rojo

**Flujo Alternativo**: Usuario refresca manualmente

- 1A: Usuario toca botón de refresh
- 2A: Sistema ejecuta `checkHealth()` de nuevo
- 3A: Sistema actualiza timestamp
- 4A: Sistema muestra nuevos resultados

**Postcondiciones**:

- Estado actual del sistema visible
- Verificación programada cada 30s

**Criterios de Aceptación**:

- ✅ Verificación automática cada 30 segundos
- ✅ Refresh manual funciona sin delay
- ✅ Cada indicador muestra estado correcto
- ✅ Errores específicos se listan con detalles
- ✅ Timeout de realtime no bloquea UI (máx 5s)
- ✅ Timestamp se actualiza en cada check

---

### CU-PERFIL-06: Cerrar Sesión

**Actor**: Usuario autenticado
**Precondiciones**: Usuario en pantalla de perfil

**Flujo Principal**:

1. Usuario navega al final de la pantalla
2. Usuario toca botón "Cerrar Sesión" (rojo)
3. Sistema muestra Alert de confirmación:
   - Título: "Cerrar Sesión"
   - Mensaje: "¿Estás seguro que deseas cerrar sesión?"
   - Botones: "Cancelar" | "Cerrar Sesión" (destructivo)
4. Usuario toca "Cerrar Sesión"
5. Sistema ejecuta `logout()` del AuthContext:
   - Llama `supabase.auth.signOut()`
   - Limpia sesión local
   - Limpia cookies
   - Resetea estado `user` a `null`
6. Sistema navega a `/auth` con `router.replace()`
7. Sistema muestra pantalla de login
8. Usuario no puede volver con botón "atrás"

**Flujo Alternativo 4A**: Usuario cancela

- 4A.1: Usuario toca "Cancelar"
- 4A.2: Alert se cierra
- 4A.3: Usuario permanece en pantalla de perfil

**Postcondiciones**:

- Sesión cerrada completamente
- Usuario en pantalla de login
- No puede acceder a rutas protegidas sin autenticarse

**Criterios de Aceptación**:

- ✅ Confirmación obligatoria antes de cerrar sesión
- ✅ Sesión se limpia completamente de storage
- ✅ Redirección a `/auth` exitosa
- ✅ No se puede volver atrás con hardware button
- ✅ Intentar acceder a tabs muestra login
- ✅ Logs en consola para debugging

---

### CU-PERFIL-07: Acceder a Dashboard de Administrador

**Actor**: Administrador (rol 'admin')
**Precondiciones**:

- Usuario autenticado
- `user.rol === 'admin'`

**Flujo Principal**:

1. Administrador navega a tab "Perfil"
2. Sistema verifica `user?.rol`
3. Sistema detecta rol === 'admin'
4. Sistema renderiza `<AdminDashboard />` en lugar de vista de perfil
5. Sistema muestra:
   - Header: "Panel de Administración" + "Dashboard ejecutivo - ELMEC"
   - Period Selector: 24h, 7d, 30d, 90d (default: 7d)
   - 4 Stat Cards con iconos y trends
   - Gráfico de barras: Distribución de Solicitudes
   - Métricas Clave: 3 KPIs calculados
   - Acciones Rápidas: 3 botones (placeholder)
6. Sistema carga datos mock después de 1 segundo (loading state)
7. Sistema renderiza estadísticas

**Postcondiciones**: Dashboard de admin visible con métricas

**Criterios de Aceptación**:

- ✅ Solo usuarios con rol 'admin' ven dashboard
- ✅ Usuarios normales ven mensaje "Acceso Denegado" si intentan acceder
- ✅ Period selector funciona (cambia estado)
- ✅ Stat cards muestran trends (↑ verde / ↓ rojo)
- ✅ Gráfico de barras muestra 3 categorías
- ✅ Métricas calculadas correctamente:
  - Tasa de resolución: `(resueltas / total) * 100`
  - Satisfacción: `satisfactionRate / 5.0`
  - % Activos: `(activos / total) * 100`
- ⚠️ Acciones rápidas muestran placeholder

---

### CU-PERFIL-08: Cambiar Periodo en Dashboard Admin

**Actor**: Administrador
**Precondiciones**:

- Usuario es admin
- Dashboard visible

**Flujo Principal**:

1. Administrador ve period selector con 4 opciones: 24h, 7d, 30d, 90d
2. Opción actual marcada con fondo azul y texto blanco
3. Administrador toca "30d"
4. Sistema ejecuta `setSelectedPeriod('30d')`
5. Sistema ejecuta `useEffect` con dependencia `[selectedPeriod]`
6. Sistema simula carga (loading: true)
7. Después de 1 segundo, sistema actualiza stats con datos mock
8. Sistema actualiza visual del selector (30d ahora activo)
9. **En producción debería**: Re-query database con filtro de fechas

**Postcondiciones**:

- Periodo seleccionado actualizado
- Datos (mock) re-cargados

**Criterios de Aceptación**:

- ✅ Botón activo tiene estilo diferente
- ✅ Click actualiza estado inmediatamente
- ✅ Loading state muestra transición (actual: 1s delay)
- ⚠️ Datos mock no cambian realmente (limitación actual)
- 🔜 Debe filtrar queries con fecha según periodo

---

## MATRIZ DE PRUEBAS

### 1. PRUEBAS FUNCIONALES - Vista Usuario

| ID           | Caso de Prueba                  | Pasos                                                                        | Resultado Esperado                                                                          | Prioridad |
| ------------ | ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| PF-PERFIL-01 | Mostrar información de usuario  | 1. Login<br>2. Ir a tab Perfil                                               | - Avatar con iniciales<br>- Nombre completo<br>- Email visible<br>- 4 campos info poblados  | Alta      |
| PF-PERFIL-02 | Avatar con iniciales correctas  | 1. Login como "Carlos Rosales"<br>2. Ver avatar                              | Avatar muestra "CR"                                                                         | Media     |
| PF-PERFIL-03 | Ubicación concatenada           | 1. Login<br>2. Ver campo Ubicación                                           | Muestra "Ciudad, Estado" correctamente                                                      | Media     |
| PF-PERFIL-04 | Enviar notificación Info        | 1. Ir a Perfil<br>2. Scroll a Notificaciones<br>3. Click botón "Info"        | - Notificación aparece<br>- Fondo amarillo<br>- Punto azul<br>- Contador +1                 | Alta      |
| PF-PERFIL-05 | Enviar notificación Éxito       | 1. Click botón "Éxito"                                                       | - Notificación con título "Éxito"<br>- Color verde en demo<br>- En lista con fondo amarillo | Alta      |
| PF-PERFIL-06 | Enviar notificación Advertencia | 1. Click botón "Advertencia"                                                 | - Título "Advertencia"<br>- Color amarillo en demo                                          | Alta      |
| PF-PERFIL-07 | Enviar notificación Error       | 1. Click botón "Error"                                                       | - Título "Error"<br>- Color rojo en demo                                                    | Alta      |
| PF-PERFIL-08 | Marcar notificación individual  | 1. Enviar notificación<br>2. Click en ella                                   | - Fondo cambia a blanco<br>- Punto azul desaparece<br>- Contador -1                         | Alta      |
| PF-PERFIL-09 | Marcar todas como leídas        | 1. Enviar 3 notificaciones<br>2. Menu Notificaciones<br>3. "Marcar todas..." | - Todas las notificaciones blancas<br>- Contador = 0<br>- Notificaciones aún en lista       | Alta      |
| PF-PERFIL-10 | Limpiar todas                   | 1. Enviar notificaciones<br>2. Menu<br>3. "Limpiar todas"                    | - Array vacío<br>- Mensaje "No hay notificaciones"<br>- Contador = 0                        | Alta      |
| PF-PERFIL-11 | Cancelar gestión notificaciones | 1. Menu Notificaciones<br>2. "Cancelar"                                      | Alert cierra, sin cambios                                                                   | Baja      |
| PF-PERFIL-12 | Health Check inicial            | 1. Montar componente                                                         | - 4 indicadores se verifican<br>- Timestamp actualizado<br>- Estado general calculado       | Alta      |
| PF-PERFIL-13 | Health Check exitoso            | 1. Con buena conexión<br>2. Ver HealthCheck                                  | - Todos ✅ verdes<br>- "Sistema funcionando correctamente"                                  | Alta      |
| PF-PERFIL-14 | Health Check con error          | 1. Sin conexión<br>2. Ver HealthCheck                                        | - Indicadores ❌ rojos<br>- Panel de errores visible<br>- "Se detectaron problemas"         | Alta      |
| PF-PERFIL-15 | Refresh manual health check     | 1. Ver HealthCheck<br>2. Click refresh button                                | - Re-ejecuta verificaciones<br>- Timestamp actualizado                                      | Media     |
| PF-PERFIL-16 | Menu item Configuración         | 1. Click "Configuración"                                                     | Alert "Próximamente"                                                                        | Baja      |
| PF-PERFIL-17 | Menu item Notificaciones        | 1. Click "Notificaciones"                                                    | Alert con opciones de gestión                                                               | Alta      |
| PF-PERFIL-18 | Menu item Privacidad            | 1. Click "Privacidad..."                                                     | Alert "Próximamente"                                                                        | Baja      |
| PF-PERFIL-19 | Menu item Ayuda                 | 1. Click "Ayuda y Soporte"                                                   | Alert "Próximamente"                                                                        | Baja      |
| PF-PERFIL-20 | Cerrar sesión con confirmación  | 1. Click "Cerrar Sesión"<br>2. Confirmar                                     | - Alert de confirmación<br>- Logout ejecutado<br>- Redirige a /auth<br>- Sesión limpia      | Crítica   |
| PF-PERFIL-21 | Cancelar cierre de sesión       | 1. Click "Cerrar Sesión"<br>2. "Cancelar"                                    | Alert cierra, sesión activa                                                                 | Media     |
| PF-PERFIL-22 | Scroll completo                 | 1. Scroll desde top a bottom                                                 | - Todos los elementos visibles<br>- Sin elementos cortados                                  | Media     |

---

### 2. PRUEBAS FUNCIONALES - Vista Admin

| ID          | Caso de Prueba          | Pasos                                                | Resultado Esperado                                                                                     | Prioridad |
| ----------- | ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------- |
| PF-ADMIN-01 | Acceso con rol admin    | 1. Login como admin<br>2. Ir a tab Perfil            | AdminDashboard renderizado, no vista de perfil                                                         | Crítica   |
| PF-ADMIN-02 | Acceso denegado sin rol | 1. Login como usuario<br>2. Intentar acceder a admin | Vista de perfil normal (no dashboard)                                                                  | Alta      |
| PF-ADMIN-03 | Cargar estadísticas     | 1. Admin entra a dashboard                           | - Loading 1 segundo<br>- Stats pobladas                                                                | Alta      |
| PF-ADMIN-04 | Stat Cards renderizadas | 1. Ver dashboard                                     | 4 cards visibles con valores correctos                                                                 | Alta      |
| PF-ADMIN-05 | Trends en Stat Cards    | 1. Ver cards                                         | - Flechas ↑ o ↓<br>- Colores verde/rojo<br>- Porcentaje mostrado                                       | Media     |
| PF-ADMIN-06 | Period selector default | 1. Montar dashboard                                  | "7d" seleccionado por defecto                                                                          | Media     |
| PF-ADMIN-07 | Cambiar a 24h           | 1. Click "24h"                                       | - Botón activo<br>- Loading<br>- Stats actualizadas                                                    | Alta      |
| PF-ADMIN-08 | Cambiar a 30d           | 1. Click "30d"                                       | Periodo cambia, datos re-cargan                                                                        | Alta      |
| PF-ADMIN-09 | Cambiar a 90d           | 1. Click "90d"                                       | Periodo cambia                                                                                         | Alta      |
| PF-ADMIN-10 | Gráfico de barras       | 1. Ver charts section                                | - 3 barras (Resueltas, En proceso, Pendientes)<br>- Colores correctos<br>- Valores mostrados           | Alta      |
| PF-ADMIN-11 | Métricas clave          | 1. Ver Métricas Clave                                | - 3 métricas calculadas<br>- Tasa resolución en %<br>- Satisfacción en /5.0<br>- Usuarios activos en % | Alta      |
| PF-ADMIN-12 | Quick Actions           | 1. Ver sección inferior                              | 3 botones visibles (no funcionales)                                                                    | Baja      |
| PF-ADMIN-13 | Responsive en tablet    | 1. Ver en tablet                                     | Layout adapta, cards en grid                                                                           | Media     |

---

### 3. PRUEBAS DE INTEGRACIÓN

| ID           | Caso de Prueba                  | Pasos                                                  | Resultado Esperado                                                               | Prioridad |
| ------------ | ------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- | --------- |
| PI-PERFIL-01 | AuthContext integration         | 1. Login<br>2. Ver perfil                              | Datos de user poblados desde AuthContext                                         | Crítica   |
| PI-PERFIL-02 | NotificationContext integration | 1. Enviar notificación<br>2. Ver contador              | Context actualizado, UI sincronizada                                             | Alta      |
| PI-PERFIL-03 | Logout y redirección            | 1. Logout<br>2. Intentar volver                        | - Sesión limpia<br>- AuthContext.user = null<br>- No puede acceder a tabs        | Crítica   |
| PI-PERFIL-04 | Health check con Supabase       | 1. Ver HealthCheck<br>2. Verificar logs                | - Query a users ejecutada<br>- Canal realtime creado<br>- Sin errores en console | Alta      |
| PI-PERFIL-05 | Notificación web en navegador   | 1. En web<br>2. Dar permisos<br>3. Enviar notificación | Browser notification aparece                                                     | Alta      |
| PI-PERFIL-06 | Notificación nativa en mobile   | 1. En mobile<br>2. Enviar notificación                 | Native notification con sonido                                                   | Alta      |
| PI-PERFIL-07 | Auto-refresh health check       | 1. Esperar 30 segundos                                 | Health check se ejecuta automáticamente                                          | Media     |
| PI-PERFIL-08 | Persistencia de sesión          | 1. Login<br>2. Cerrar app<br>3. Reabrir                | Usuario sigue autenticado, datos visibles                                        | Alta      |
| PI-PERFIL-09 | Cambio de rol en tiempo real    | 1. Admin cambia rol de usuario<br>2. Usuario refresca  | Vista cambia según nuevo rol                                                     | Media     |

---

### 4. PRUEBAS UI/UX

| ID           | Caso de Prueba                 | Pasos                        | Resultado Esperado                                                                                                 | Prioridad |
| ------------ | ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------- |
| PU-PERFIL-01 | Avatar circular perfecto       | 1. Ver header                | Avatar 80x80, radio 40, centrado                                                                                   | Media     |
| PU-PERFIL-02 | Colores de notificaciones      | 1. Enviar cada tipo          | - Info: azul (#3b82f6)<br>- Éxito: verde (#10b981)<br>- Advertencia: amarillo (#f59e0b)<br>- Error: rojo (#ef4444) | Media     |
| PU-PERFIL-03 | Fondo de notificación no leída | 1. Enviar notificación       | Fondo #fef9e7 (amarillo pálido)                                                                                    | Media     |
| PU-PERFIL-04 | Punto indicador no leído       | 1. Ver notificación sin leer | Círculo azul 8x8 a la derecha                                                                                      | Media     |
| PU-PERFIL-05 | Iconos de HealthCheck          | 1. Ver HealthCheck           | - Wifi, Shield, Database, Zap<br>- Colores según estado                                                            | Media     |
| PU-PERFIL-06 | Sombras en cards               | 1. Ver profile               | Cards con sombras sutiles, elevation 4                                                                             | Baja      |
| PU-PERFIL-07 | Botón logout destacado         | 1. Ver botón logout          | - Color rojo (#ef4444)<br>- Borde rojo claro<br>- Icono LogOut visible                                             | Alta      |
| PU-PERFIL-08 | Footer con versión             | 1. Scroll al final           | "ELMEC Mobile App" + "Versión 1.0.0"                                                                               | Baja      |
| PU-PERFIL-09 | Responsive en móvil pequeño    | 1. Ver en iPhone SE          | Todo visible, sin overflow                                                                                         | Alta      |
| PU-PERFIL-10 | Responsive en tablet           | 1. Ver en iPad               | Layout aprovecha espacio, cards más anchas                                                                         | Media     |
| PU-PERFIL-11 | Animaciones suaves             | 1. Interactuar con botones   | TouchableOpacity con feedback visual                                                                               | Baja      |
| PU-PERFIL-12 | Fuentes consistentes           | 1. Revisar tipografía        | Inter-Regular, SemiBold, Bold según jerarquía                                                                      | Media     |

---

### 5. PRUEBAS DE SEGURIDAD

| ID           | Caso de Prueba                   | Pasos                                        | Resultado Esperado                    | Prioridad |
| ------------ | -------------------------------- | -------------------------------------------- | ------------------------------------- | --------- |
| PS-PERFIL-01 | Acceso sin autenticación         | 1. Sin login<br>2. Intentar /profile         | Redirige a /auth                      | Crítica   |
| PS-PERFIL-02 | Logout limpia storage            | 1. Logout<br>2. Inspeccionar localStorage    | Token y cookies removidos             | Crítica   |
| PS-PERFIL-03 | AdminDashboard con rol usuario   | 1. Login usuario normal<br>2. Ver tab perfil | NO muestra dashboard admin            | Crítica   |
| PS-PERFIL-04 | Confirmación obligatoria logout  | 1. Click logout                              | Alert de confirmación aparece siempre | Alta      |
| PS-PERFIL-05 | No permite volver después logout | 1. Logout<br>2. Hardware back button         | No puede volver a tabs                | Alta      |
| PS-PERFIL-06 | Health check no expone secrets   | 1. Ver logs de health check                  | No muestra API keys o tokens          | Alta      |

---

### 6. PRUEBAS DE RENDIMIENTO

| ID           | Caso de Prueba              | Pasos                                           | Resultado Esperado                                    | Prioridad |
| ------------ | --------------------------- | ----------------------------------------------- | ----------------------------------------------------- | --------- |
| PR-PERFIL-01 | Carga inicial rápida        | 1. Navegar a Perfil                             | Renderiza en <500ms                                   | Alta      |
| PR-PERFIL-02 | Health check no bloquea UI  | 1. Durante health check<br>2. Scroll            | UI sigue responsive                                   | Alta      |
| PR-PERFIL-03 | Timeout realtime controlado | 1. Sin conexión realtime                        | Timeout a 5s, no cuelga app                           | Alta      |
| PR-PERFIL-04 | Muchas notificaciones       | 1. Enviar 50 notificaciones<br>2. Scroll lista  | - Solo muestra últimas 5<br>- Scroll suave            | Media     |
| PR-PERFIL-05 | Re-renders optimizados      | 1. Enviar notificación<br>2. Verificar DevTools | Solo notification list re-renderiza                   | Media     |
| PR-PERFIL-06 | useMemo para chart data     | 1. Cambiar periodo en admin                     | requestsChartData recalcula solo cuando stats cambian | Media     |

---

## LIMITACIONES CONOCIDAS

### 1. Datos Hardcodeados en AdminDashboard

**Problema**:

```typescript
// AdminDashboard.tsx:61-75
const mockStats: DashboardStats = {
  totalUsers: 156,
  activeUsers: 89,
  totalRequests: 342,
  // ... todos los datos son estáticos
};
```

**Impacto**:

- Las métricas NO reflejan datos reales de la base de datos
- Cambiar periodo (24h, 7d, 30d, 90d) no afecta los datos mostrados
- Trends (↑ 12%, ↓ 5%) son hardcodeados, no reales
- Gráfico de barras muestra valores fijos

**Afectado**: Administradores no pueden tomar decisiones basadas en datos reales

---

### 2. Notificaciones No Persistentes

**Problema**:

```typescript
// NotificationContext.tsx:90-92
const [inAppNotifications, setInAppNotifications] = useState<
  InAppNotification[]
>([]);
// Estado solo en memoria, no en base de datos
```

**Impacto**:

- Recargar app: Todas las notificaciones desaparecen
- No hay historial persistente
- No se pueden consultar notificaciones antiguas
- No hay sincronización entre dispositivos

**Escenario**:

1. Usuario recibe 5 notificaciones
2. Cierra app
3. Reabre app
4. **Resultado**: 0 notificaciones (pérdida de información)

---

### 3. Opciones de Menú No Implementadas

**Problema**: 3 de 4 opciones de menú son placeholders

```typescript
// profile.tsx:75, 107, 115
onPress: () =>
  Alert.alert('Próximamente', 'Esta función estará disponible pronto');
```

**Opciones Afectadas**:

- ❌ Configuración (preferencias de la app)
- ❌ Privacidad y Seguridad (control de información)
- ❌ Ayuda y Soporte (centro de ayuda)
- ✅ Notificaciones (único funcional)

**Impacto**: Usuario no puede personalizar experiencia ni obtener ayuda

---

### 4. Health Check Sin Almacenamiento de Historial

**Problema**:

- Se ejecuta cada 30 segundos
- Muestra solo estado actual
- No guarda histórico de verificaciones
- No hay gráficos de tiempo de actividad (uptime)

**Impacto**:

- No se puede rastrear cuándo ocurrieron problemas
- No hay métricas de disponibilidad (99.9% uptime, etc.)
- No se puede analizar patrones de fallos

---

### 5. Falta RLS para Protección de Dashboard Admin

**Problema**:
El dashboard admin se protege solo en frontend:

```typescript
// profile.tsx:43-45
if (user?.rol === 'admin') {
  return <AdminDashboard />;
}
```

**Vulnerabilidad**:

- No hay RLS policies para queries de estadísticas
- Un usuario malicioso podría modificar el código del cliente
- Podría ejecutar queries de admin desde herramientas de desarrollo

**Debería Existir**:

```sql
-- Política RLS para proteger queries de admin
CREATE POLICY "Only admins can read all users"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE rol = 'admin'
  )
);
```

---

### 6. Notificaciones Web Requieren Permisos Manual

**Problema**:

```typescript
// NotificationContext.tsx:135-141
const requestWebNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
};
```

**Impacto**:

- Se solicita permiso automáticamente al cargar app
- Usuarios pueden denegar sin entender para qué sirve
- No hay explicación previa (mejor UX sería explicar antes de solicitar)
- No hay forma de re-solicitar si se denegó

---

### 7. Health Check Timeout Puede Parecer Colgado

**Problema**:

```typescript
// useSupabaseHealth.ts:58-60
const timeout = setTimeout(() => {
  reject(new Error('Realtime connection timeout'));
}, 5000);
```

**Impacto**:

- Durante 5 segundos, UI puede parecer congelada si realtime falla
- No hay indicador de loading durante verificación
- Usuario no sabe que está esperando

**Mejor UX**:

- Mostrar spinner o progress indicator
- Indicar "Verificando conexión realtime..."
- Reducir timeout a 3 segundos

---

### 8. No Hay Edición de Información Personal

**Problema**:
Todos los campos de información personal son solo lectura:

```typescript
<Text style={styles.infoValue}>{user?.empresa}</Text>
<Text style={styles.infoValue}>{user?.correo_electronico}</Text>
<Text style={styles.infoValue}>{user?.celular}</Text>
```

**Impacto**:

- Usuario no puede actualizar teléfono
- Usuario no puede cambiar empresa o ubicación
- Requiere contactar admin para cambios

**Funcionalidad Esperada**:

- Botón "Editar Perfil"
- Formulario para actualizar datos
- Validación y guardado en Supabase

---

### 9. Falta Push Notifications Reales

**Problema**:

```typescript
// NotificationContext.tsx:169
projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'demo-project-id-12345',
```

**Impacto**:

- Push tokens no se pueden generar sin EAS project ID
- Notificaciones solo funcionan cuando app está abierta
- No hay notificaciones desde backend

**Para Implementar**:

1. Configurar EAS Build
2. Obtener y almacenar push tokens en base de datos
3. Crear endpoint backend para enviar notificaciones
4. Configurar Firebase Cloud Messaging (Android) y APNs (iOS)

---

### 10. Avatar No Permite Cambiar Foto

**Problema**:
Avatar solo muestra iniciales:

```typescript
<Text style={styles.avatarText}>
  {user?.nombre?.charAt(0)}
  {user?.apellido_paterno?.charAt(0)}
</Text>
```

**Funcionalidad Faltante**:

- Subir foto de perfil
- Almacenar en Supabase Storage
- Mostrar imagen en lugar de iniciales
- Opción de eliminar foto y volver a iniciales

---

## MEJORAS RECOMENDADAS

### 1. Conectar AdminDashboard a Datos Reales

**Prioridad**: 🔴 Crítica

**Implementación**:

```typescript
// AdminDashboard.tsx
import { supabase } from '@/lib/supabase';

const loadRealStats = async (period: string) => {
  const periodMap = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };
  const days = periodMap[period];

  // 1. Total y usuarios activos
  const { data: usersData } = await supabase
    .from('users')
    .select('id, is_online')
    .eq('activo', true);

  const totalUsers = usersData?.length || 0;
  const activeUsers = usersData?.filter(u => u.is_online).length || 0;

  // 2. Estadísticas de solicitudes
  const { data: requestsData } = await supabase
    .from('requests')
    .select('id, estatus, created_at, updated_at')
    .gte('created_at', `now() - interval '${days} days'`);

  const totalRequests = requestsData?.length || 0;
  const pendingRequests =
    requestsData?.filter(r => r.estatus === 'nuevo').length || 0;
  const resolvedRequests =
    requestsData?.filter(r => r.estatus === 'resuelto').length || 0;

  // 3. Total mensajes
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `now() - interval '${days} days'`);

  // 4. Tiempo promedio de respuesta (en horas)
  const resolvedWithTime =
    requestsData?.filter(r => r.estatus === 'resuelto' && r.updated_at) || [];

  const avgResponseTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime();
          const updated = new Date(r.updated_at).getTime();
          const hours = (updated - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / resolvedWithTime.length
      : 0;

  // 5. Calificación promedio
  const { data: ratingsData } = await supabase
    .from('requests')
    .select('rating')
    .not('rating', 'is', null)
    .gte('updated_at', `now() - interval '${days} days'`);

  const satisfactionRate =
    ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
      : 0;

  return {
    totalUsers,
    activeUsers,
    totalRequests,
    pendingRequests,
    resolvedRequests,
    totalMessages: totalMessages || 0,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    satisfactionRate: Math.round(satisfactionRate * 10) / 10,
  };
};

// Usar en useEffect
useEffect(() => {
  setLoading(true);
  loadRealStats(selectedPeriod)
    .then(setStats)
    .finally(() => setLoading(false));
}, [selectedPeriod]);
```

**Beneficio**: Dashboard muestra métricas reales y actualizadas

---

### 2. Persistir Notificaciones en Base de Datos

**Prioridad**: 🟠 Alta

**Schema**:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Actualizar Context**:

```typescript
// NotificationContext.tsx
const loadNotifications = async () => {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (data) {
    setInAppNotifications(data);
  }
};

const sendDemoNotification = async (title, body, type, data) => {
  const { data: newNotification } = await supabase
    .from('notifications')
    .insert({
      user_id: user?.id,
      title,
      body,
      type,
      data,
    })
    .select()
    .single();

  if (newNotification) {
    setInAppNotifications(prev => [newNotification, ...prev]);
  }
};

const markNotificationAsRead = async (id: string) => {
  await supabase.from('notifications').update({ read: true }).eq('id', id);

  setInAppNotifications(prev =>
    prev.map(n => (n.id === id ? { ...n, read: true } : n))
  );
};
```

**Beneficio**: Notificaciones persisten entre sesiones

---

### 3. Implementar Edición de Perfil

**Prioridad**: 🟠 Alta

**Componente Nuevo**: `/components/EditProfile.tsx`

```typescript
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const EditProfile: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const [empresa, setEmpresa] = useState(user?.empresa || '');
  const [celular, setCelular] = useState(user?.celular || '');
  const [ciudad, setCiudad] = useState(user?.ciudad || '');
  const [estado, setEstado] = useState(user?.estado || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          empresa,
          celular,
          ciudad,
          estado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshUser(); // Recargar usuario en AuthContext
      onSuccess();
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar Perfil</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Empresa</Text>
            <TextInput
              style={styles.input}
              value={empresa}
              onChangeText={setEmpresa}
              placeholder="Nombre de la empresa"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={celular}
              onChangeText={setCelular}
              placeholder="Número de teléfono"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput
              style={styles.input}
              value={ciudad}
              onChangeText={setCiudad}
              placeholder="Ciudad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Estado</Text>
            <TextInput
              style={styles.input}
              value={estado}
              onChangeText={setEstado}
              placeholder="Estado"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
```

**Integración en Profile**:

```typescript
// profile.tsx
const [showEditModal, setShowEditModal] = useState(false);

// Agregar botón en header
<TouchableOpacity onPress={() => setShowEditModal(true)}>
  <Edit size={20} color="#1e40af" />
</TouchableOpacity>

// Renderizar modal
{showEditModal && (
  <EditProfile
    onClose={() => setShowEditModal(false)}
    onSuccess={() => setShowEditModal(false)}
  />
)}
```

---

### 4. Agregar Upload de Avatar

**Prioridad**: 🟡 Media

**Implementación**:

```typescript
import * as ImagePicker from 'expo-image-picker';

const handleUploadAvatar = async () => {
  // 1. Solicitar permisos
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permisos', 'Se requieren permisos para acceder a las fotos');
    return;
  }

  // 2. Seleccionar imagen
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return;

  // 3. Upload a Supabase Storage
  const file = result.assets[0];
  const fileName = `${user?.id}/avatar-${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, {
      uri: file.uri,
      type: 'image/jpeg',
      name: fileName,
    });

  if (error) {
    Alert.alert('Error', 'No se pudo subir la imagen');
    return;
  }

  // 4. Obtener URL pública
  const { data: publicUrl } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // 5. Actualizar users table
  await supabase
    .from('users')
    .update({ avatar_url: publicUrl.publicUrl })
    .eq('id', user?.id);

  // 6. Refrescar usuario
  await refreshUser();
};
```

**Actualizar Avatar Display**:

```typescript
{user?.avatar_url ? (
  <Image
    source={{ uri: user.avatar_url }}
    style={styles.avatar}
  />
) : (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>
      {user?.nombre?.charAt(0)}
      {user?.apellido_paterno?.charAt(0)}
    </Text>
  </View>
)}
```

---

### 5. Implementar Configuración Completa

**Prioridad**: 🟡 Media

**Settings Structure**:

```typescript
interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
}
```

**Schema**:

```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  theme VARCHAR(10) DEFAULT 'auto',
  language VARCHAR(5) DEFAULT 'es',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Settings Screen**:

```typescript
// app/(tabs)/profile/settings.tsx
export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>();

  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <Switch
          value={settings?.notifications_enabled}
          onValueChange={(value) => updateSetting('notifications_enabled', value)}
        />
      </View>
      {/* ...más configuraciones */}
    </ScrollView>
  );
}
```

---

### 6. Agregar Centro de Ayuda

**Prioridad**: 🟢 Baja

**Estructura**:

```typescript
// app/(tabs)/profile/help.tsx
const helpCategories = [
  {
    title: 'Primeros Pasos',
    icon: Rocket,
    articles: [
      { title: '¿Cómo crear una solicitud?', id: 'create-request' },
      { title: '¿Cómo chatear con un agente?', id: 'start-chat' },
    ],
  },
  {
    title: 'Cuenta y Perfil',
    icon: User,
    articles: [
      { title: 'Editar información personal', id: 'edit-profile' },
      { title: 'Cambiar contraseña', id: 'change-password' },
    ],
  },
  // ...más categorías
];
```

**FAQ Component**:

```typescript
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
      <Text style={styles.question}>{question}</Text>
      {expanded && <Text style={styles.answer}>{answer}</Text>}
    </TouchableOpacity>
  );
};
```

---

### 7. Optimizar Health Check con Loading State

**Prioridad**: 🟡 Media

**Actualización**:

```typescript
// useSupabaseHealth.ts
const [isChecking, setIsChecking] = useState(false);

const checkHealth = async () => {
  setIsChecking(true);
  // ...verificaciones
  setIsChecking(false);
};

return {
  health,
  checkHealth,
  isHealthy,
  isChecking, // Nuevo: para mostrar spinner
};
```

**UI Update**:

```typescript
// HealthCheck.tsx
const { isChecking } = useSupabaseHealth();

<TouchableOpacity style={styles.refreshButton} onPress={checkHealth}>
  {isChecking ? (
    <ActivityIndicator size="small" color="#6b7280" />
  ) : (
    <RefreshCw size={16} color="#6b7280" />
  )}
</TouchableOpacity>
```

---

### 8. Agregar Historial de Health Check

**Prioridad**: 🟢 Baja

**Schema**:

```sql
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_connected BOOLEAN,
  is_authenticated BOOLEAN,
  database_accessible BOOLEAN,
  realtime_connected BOOLEAN,
  errors JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at DESC);
```

**Guardar Histórico**:

```typescript
const checkHealth = async () => {
  // ...verificaciones

  // Guardar en BD
  await supabase.from('health_checks').insert({
    is_connected: isConnected,
    is_authenticated: isAuthenticated,
    database_accessible: databaseAccessible,
    realtime_connected: realtimeConnected,
    errors: JSON.stringify(errors),
  });
};
```

**Mostrar Gráfico de Uptime**:

```typescript
const { data: history } = await supabase
  .from('health_checks')
  .select('*')
  .order('checked_at', { ascending: false })
  .limit(100);

// Calcular uptime de últimas 24h
const uptime =
  (history.filter(h => h.is_connected).length / history.length) * 100;
```

---

## CHECKLIST DE QA

### Pre-Testing Setup

- [ ] Base de datos Supabase accesible
- [ ] Usuarios de prueba creados (normal + admin)
- [ ] Permisos de notificaciones concedidos
- [ ] Conexión a internet estable
- [ ] Dispositivos de prueba: iOS, Android, Web

---

### Vista de Usuario Normal

#### Header Section

- [ ] Avatar muestra iniciales correctas (primera letra nombre + apellido)
- [ ] Avatar es circular y centrado
- [ ] Nombre completo se muestra correctamente
- [ ] Email se muestra debajo del nombre
- [ ] Layout responsive en diferentes tamaños de pantalla

#### Personal Info Card

- [ ] Campo "Empresa" poblado correctamente
- [ ] Campo "Correo Electrónico" poblado
- [ ] Campo "Teléfono" poblado
- [ ] Campo "Ubicación" muestra "ciudad, estado"
- [ ] Iconos correctos para cada campo
- [ ] Campos vacíos no muestran "undefined" (manejar gracefully)

#### Health Check Component

- [ ] Componente visible en pantalla
- [ ] 4 indicadores se muestran: Conexión, Autenticación, BD, Realtime
- [ ] Indicadores muestran ✅ cuando OK
- [ ] Indicadores muestran ❌ cuando falla
- [ ] Colores correctos (verde OK, rojo error)
- [ ] Timestamp "Última verificación" actualizado
- [ ] Estado general correcto ("Sistema funcionando" o "Problemas detectados")
- [ ] Panel de errores visible cuando hay errores
- [ ] Errores listados con detalles
- [ ] Botón refresh ejecuta nueva verificación
- [ ] Auto-refresh cada 30 segundos funciona

#### Notificaciones Demo

- [ ] 4 botones visibles: Info, Éxito, Advertencia, Error
- [ ] Colores correctos para cada tipo
- [ ] Click en "Info" crea notificación azul
- [ ] Click en "Éxito" crea notificación verde
- [ ] Click en "Advertencia" crea notificación amarilla
- [ ] Click en "Error" crea notificación roja
- [ ] Nueva notificación aparece al inicio de la lista
- [ ] Fondo amarillo para notificaciones no leídas
- [ ] Punto azul visible a la derecha si no leída
- [ ] Contador `(unreadCount)` se actualiza correctamente
- [ ] Timestamp muestra hora correcta (HH:MM)
- [ ] **Web**: Browser notification aparece (si permisos OK)
- [ ] **Mobile**: Native notification aparece con sonido

#### Gestión de Notificaciones

- [ ] Click en notificación la marca como leída
- [ ] Fondo cambia a blanco al marcar como leída
- [ ] Punto azul desaparece al marcar como leída
- [ ] Contador decrementa al marcar como leída
- [ ] Menu "Notificaciones" muestra alert con opciones
- [ ] Alert muestra contador actual de no leídas
- [ ] "Marcar todas como leídas" marca todas
- [ ] "Limpiar todas" vacía la lista
- [ ] "Cancelar" cierra alert sin cambios
- [ ] Lista muestra últimas 5 notificaciones
- [ ] Mensaje "No hay notificaciones" cuando lista vacía

#### Settings Menu

- [ ] 4 opciones de menú visibles
- [ ] Iconos correctos para cada opción
- [ ] Colores de fondo de iconos correctos
- [ ] "Configuración" muestra placeholder
- [ ] "Notificaciones" abre gestión de notificaciones
- [ ] "Privacidad y Seguridad" muestra placeholder
- [ ] "Ayuda y Soporte" muestra placeholder

#### Logout

- [ ] Botón "Cerrar Sesión" visible y destacado (rojo)
- [ ] Click muestra alert de confirmación
- [ ] "Cancelar" cierra alert sin logout
- [ ] "Cerrar Sesión" ejecuta logout
- [ ] Sesión se limpia de storage
- [ ] Redirige a `/auth`
- [ ] No puede volver con botón atrás
- [ ] Logs en consola para debugging

#### General UI/UX

- [ ] Scroll suave de arriba a abajo
- [ ] Todos los elementos visibles sin cortes
- [ ] Sombras en cards visibles
- [ ] Fuentes consistentes (Inter family)
- [ ] Footer con versión visible
- [ ] Responsive en móvil pequeño (iPhone SE)
- [ ] Responsive en tablet (iPad)
- [ ] Responsive en web desktop
- [ ] TouchableOpacity da feedback visual
- [ ] No hay elementos superpuestos

---

### Vista de Administrador

#### Acceso y Renderizado

- [ ] Usuario con rol 'admin' ve AdminDashboard
- [ ] Usuario normal NO ve AdminDashboard
- [ ] Header "Panel de Administración" visible
- [ ] Subtítulo "Dashboard ejecutivo - ELMEC" visible

#### Period Selector

- [ ] 4 opciones visibles: 24h, 7d, 30d, 90d
- [ ] Opción por defecto es "7d"
- [ ] Click en opción la marca como activa
- [ ] Opción activa tiene fondo azul y texto blanco
- [ ] Cambio de periodo ejecuta loading
- [ ] Stats se actualizan después de cambio

#### Stat Cards

- [ ] 4 cards visibles en grid
- [ ] Card "Total Usuarios" muestra valor y subtítulo
- [ ] Card "Solicitudes" muestra valor y subtítulo
- [ ] Card "Mensajes" muestra valor y subtítulo
- [ ] Card "Tiempo Respuesta" muestra valor en horas
- [ ] Iconos correctos para cada card
- [ ] Colores de fondo de iconos correctos
- [ ] Trends visibles (flecha + porcentaje)
- [ ] Trends verdes para positivo
- [ ] Trends rojas para negativo
- [ ] Valores numéricos formateados correctamente

#### Charts & Metrics

- [ ] Gráfico de barras visible
- [ ] Título "Distribución de Solicitudes"
- [ ] 3 barras: Resueltas, En proceso, Pendientes
- [ ] Colores correctos: verde, azul, amarillo
- [ ] Altura de barras proporcional a valores
- [ ] Labels debajo de cada barra
- [ ] Valores numéricos debajo de labels
- [ ] Métricas Clave visibles
- [ ] Tasa de Resolución calculada correctamente (%)
- [ ] Satisfacción Cliente con formato X/5.0
- [ ] Usuarios Activos con formato X%
- [ ] Iconos correctos para cada métrica

#### Quick Actions

- [ ] Sección "Acciones Rápidas" visible
- [ ] 3 botones visibles
- [ ] Iconos correctos
- [ ] Botones no funcionales (placeholder OK)

#### General Admin UI

- [ ] Scroll suave de arriba a abajo
- [ ] Cards con sombras
- [ ] Responsive en diferentes pantallas
- [ ] Loading state muestra transición

---

### Pruebas de Integración

#### AuthContext

- [ ] Datos del usuario cargan desde AuthContext
- [ ] Cambios en user se reflejan en UI
- [ ] Logout limpia estado de AuthContext
- [ ] Rol del usuario determina vista correcta

#### NotificationContext

- [ ] Enviar notificación actualiza context
- [ ] Contador sincronizado con context
- [ ] Marcar como leída actualiza context
- [ ] Limpiar notificaciones actualiza context

#### Supabase Integration

- [ ] Health check query a users ejecutada
- [ ] Canal realtime conecta correctamente
- [ ] Logout ejecuta supabase.auth.signOut()
- [ ] Sin errores en consola

#### Navigation

- [ ] Tab navigation funciona
- [ ] Logout redirige a /auth
- [ ] router.replace previene volver atrás

---

### Pruebas de Seguridad

- [ ] Acceso sin autenticación redirige a login
- [ ] Logout limpia tokens de storage
- [ ] Logout limpia cookies
- [ ] Usuario normal NO puede ver admin dashboard
- [ ] Health check no expone secrets en logs
- [ ] Confirmación obligatoria para logout

---

### Pruebas de Rendimiento

- [ ] Carga inicial < 500ms
- [ ] Health check no bloquea UI
- [ ] Timeout realtime a 5s funciona
- [ ] 50+ notificaciones se renderizan sin lag
- [ ] Scroll suave con muchas notificaciones
- [ ] Re-renders optimizados (solo lo necesario)

---

### Pruebas en Múltiples Plataformas

#### iOS

- [ ] Todos los tests funcionales pasan
- [ ] Native notifications funcionan
- [ ] Permisos se solicitan correctamente
- [ ] Layout responsive OK

#### Android

- [ ] Todos los tests funcionales pasan
- [ ] Native notifications funcionan
- [ ] Permisos se solicitan correctamente
- [ ] Layout responsive OK

#### Web

- [ ] Todos los tests funcionales pasan
- [ ] Browser notifications funcionan
- [ ] Permisos se solicitan correctamente
- [ ] Layout responsive (mobile, tablet, desktop)
- [ ] No hay errores de "window is not defined"

---

### Edge Cases

- [ ] Usuario sin empresa/celular no rompe UI
- [ ] Usuario sin ciudad/estado muestra gracefully
- [ ] Sin conexión a internet health check falla correctamente
- [ ] Sin permisos de notificaciones no rompe app
- [ ] Logout durante health check no causa error
- [ ] Muchas notificaciones (100+) no causa crash
- [ ] Nombres largos no rompen layout
- [ ] Email largo no desborda

---

### Final Validation

- [ ] No hay errores en consola
- [ ] No hay warnings en consola
- [ ] No hay memory leaks
- [ ] App no crashea en ningún escenario
- [ ] Performance aceptable en dispositivos low-end
- [ ] Accesibilidad: labels para screen readers
- [ ] Dark mode compatible (si aplica)

---

## CONCLUSIÓN

El **Módulo de Perfil** es el hub central para gestión de usuario y administración del sistema. Cumple funciones críticas de autenticación, configuración y monitoreo.

### Fortalezas

✅ Vista dual (usuario/admin) bien implementada
✅ Health check robusto con auto-refresh
✅ Sistema de notificaciones demo funcional
✅ Logout seguro con confirmación
✅ UI limpia y profesional

### Áreas de Mejora Prioritarias

🔴 **Crítico**: Conectar AdminDashboard a datos reales de BD
🟠 **Alta**: Persistir notificaciones en base de datos
🟠 **Alta**: Implementar edición de perfil
🟡 **Media**: Agregar upload de avatar
🟡 **Media**: Completar opciones de menú (Configuración, Privacidad, Ayuda)

### Próximos Pasos

1. Implementar queries reales para AdminDashboard
2. Crear tabla `notifications` y migrar a persistencia
3. Agregar formulario de edición de perfil
4. Implementar push notifications reales con EAS
5. Crear centro de ayuda con FAQ
6. Agregar historial de health checks

---

**Fecha de Documentación**: 2025-01-XX
**Versión del Módulo**: 1.0.0
**Estado**: ✅ Funcional con limitaciones documentadas
