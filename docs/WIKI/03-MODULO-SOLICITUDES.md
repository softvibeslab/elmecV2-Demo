# MÓDULO 3: SOLICITUDES (Requests)

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

El módulo de Solicitudes es el **corazón del sistema de tickets** de ELMEC. Permite a los usuarios (customers) crear solicitudes de soporte, seguimiento, consultas, etc., y a los agentes gestionar y actualizar el estado de estas solicitudes.

### Funcionalidades Principales

- 📝 **Creación de Solicitudes**: Formulario completo con validación
- 🔍 **Búsqueda Avanzada**: Por título, mensaje, estado, prioridad, agente
- 🎯 **Gestión de Estado**: Workflow completo (nuevo → resuelto)
- 👤 **Asignación de Agentes**: Manual o automática
- 📎 **Adjuntar Archivos**: Hasta 3 archivos, 5MB c/u
- ⏰ **Actualización Automática**: Simulación de cambios de estado (demo)
- 🔔 **Notificaciones**: Al crear, asignar, actualizar solicitudes
- 📊 **Vista por Rol**: Customers ven sus solicitudes, Agents las asignadas, Admins todas

### Ubicación

**Archivo**: `/app/(tabs)/requests.tsx`
**Ruta**: `/requests`
**Layout Padre**: `app/(tabs)/_layout.tsx`

### Control de Acceso por Rol

| Rol          | Permisos                                                                               | Restricciones                                                                              |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **customer** | - Ver sus propias solicitudes<br>- Crear nuevas solicitudes<br>- Ver feedback y rating | - NO puede cambiar estados<br>- NO ve solicitudes de otros<br>- NO puede asignarse agentes |
| **agent**    | - Ver solicitudes asignadas<br>- Cambiar estados<br>- Ver info del cliente             | - Solo ve las que tiene asignadas<br>- NO puede crear solicitudes                          |
| **admin**    | - Ver TODAS las solicitudes<br>- Cambiar cualquier estado<br>- Reasignar agentes       | - Control total                                                                            |

---

## 🏗️ Arquitectura del Módulo

### Componentes y Estructura

```typescript
export default function Requests() {
  // ESTADOS PRINCIPALES - Lista y Filtros
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestWithRelations[]>([]);

  // ESTADOS - Modal de Creación
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    titulo: '',
    mensaje: '',
    tipo: 1,
    prioridad: 'media' as const,
    agente_id: '',
  });

  // ESTADOS - Archivos
  const [selectedFiles, setSelectedFiles] = useState<FileType[]>([]);

  // ESTADOS - UI/Loading
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DATOS - Agentes disponibles
  const [agents, setAgents] = useState<User[]>([]);

  // CONTEXTOS
  const { user } = useAuth();
  const { sendDemoNotification } = useNotifications();

  // EFECTOS
  useEffect(() => { loadRequests(); loadAgents(); }, [user]);
  useEffect(() => { setFilteredRequests(requests); }, [requests]);

  // DEMO: Actualización automática cada 15s
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular cambios de estado
    }, 15000);
    return () => clearInterval(interval);
  }, [requests]);

  return <SafeAreaView>...</SafeAreaView>
}
```

### Tipo Extendido: RequestWithRelations

```typescript
interface RequestWithRelations extends Request {
  usuario?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    empresa: string;
  };
  agente?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    categoria?: string;
  };
}

// Permite mostrar datos relacionados sin hacer queries adicionales
```

### Dependencias Críticas

| Dependencia                            | Propósito                           | Criticidad |
| -------------------------------------- | ----------------------------------- | ---------- |
| `@/lib/supabase`                       | CRUD de requests, queries con joins | 🔴 Crítica |
| `@/contexts/AuthContext`               | user.id, user.rol para filtrado     | 🔴 Crítica |
| `@/contexts/NotificationContext`       | Notificaciones in-app               | 🟡 Alta    |
| `@/components/AdvancedSearchComponent` | Búsqueda avanzada                   | 🟡 Alta    |
| `@/components/FileUploadComponent`     | Subir archivos                      | 🟢 Media   |
| `expo-router`                          | Navegación                          | 🟡 Alta    |

### Estructura Visual

```
┌──────────────────────────────────────────┐
│   HEADER                        [+]      │
│   Solicitudes                            │
│   X solicitud(es) [asignadas]            │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│   ADVANCED SEARCH COMPONENT              │
│   [🔍] Buscar solicitudes...             │
│   Filtros: [Estado] [Prioridad]         │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│   REQUEST CARD (ScrollView)              │
│   ┌────────────────────────────────────┐ │
│   │ [Icon] ESTADO    [PRIORIDAD]       │ │
│   │               DD/MM/YYYY HH:MM     │ │
│   │                                    │ │
│   │ Título de la Solicitud             │ │
│   │ Mensaje preview (3 líneas)...      │ │
│   │                                    │ │
│   │ [👤] Cliente: Nombre - Empresa    │ │  (Agents/Admins)
│   │ [👤] Agente: Nombre - Categoría   │ │  (Customers)
│   │ [⚠️] Sin agente asignado          │ │  (Si no hay agente)
│   │ [📎] 2 archivos adjuntos          │ │  (Si hay archivos)
│   │                                    │ │
│   │ [Feedback si está resuelto]       │ │
│   │ ⭐⭐⭐⭐⭐ (5/5)                      │ │
│   └────────────────────────────────────┘ │
│   (Tappable para cambiar estado)         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   MODAL: NUEVA SOLICITUD                 │
│   ┌────────────────────────────────────┐ │
│   │ Nueva Solicitud              [X]   │ │
│   │                                    │ │
│   │ Título *                           │ │
│   │ [_____________________________]    │ │
│   │                                    │ │
│   │ Tipo de Solicitud                  │ │
│   │ [Soporte][Factura][Info][Queja]   │ │
│   │                                    │ │
│   │ Prioridad                          │ │
│   │ [Baja][Media][Alta][Urgente]      │ │
│   │                                    │ │
│   │ Agente Destino (Opcional)          │ │
│   │ [Auto][Carlos R.][Ana G.][...]    │ │
│   │                                    │ │
│   │ Mensaje *                          │ │
│   │ [FILE UPLOAD COMPONENT]            │ │
│   │ [________________________________] │ │
│   │ [________________________________] │ │
│   │ [________________________________] │ │
│   │                                    │ │
│   │         [Enviar Solicitud]         │ │
│   └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## ⚙️ Funciones y Variables

### Variables de Estado - Lista y Datos

| Variable           | Tipo                     | Inicial | Descripción                                   | Scope     |
| ------------------ | ------------------------ | ------- | --------------------------------------------- | --------- |
| `requests`         | `RequestWithRelations[]` | `[]`    | Todas las solicitudes del usuario (según rol) | Component |
| `filteredRequests` | `RequestWithRelations[]` | `[]`    | Solicitudes tras aplicar búsqueda/filtros     | Computed  |
| `agents`           | `User[]`                 | `[]`    | Lista de agentes activos para asignación      | Component |
| `loading`          | `boolean`                | `true`  | Cargando solicitudes inicial                  | UI State  |
| `error`            | `string \| null`         | `null`  | Mensaje de error si falla carga               | UI State  |

### Variables de Estado - Modal de Creación

| Variable               | Tipo                                 | Inicial   | Descripción                      |
| ---------------------- | ------------------------------------ | --------- | -------------------------------- |
| `showNewRequestModal`  | `boolean`                            | `false`   | Visibilidad del modal            |
| `submitting`           | `boolean`                            | `false`   | Enviando formulario              |
| `newRequest.titulo`    | `string`                             | `''`      | Título (5-200 chars)             |
| `newRequest.mensaje`   | `string`                             | `''`      | Descripción detallada            |
| `newRequest.tipo`      | `number`                             | `1`       | Tipo: 1=Soporte, 2=Factura, etc. |
| `newRequest.prioridad` | `'baja'\|'media'\|'alta'\|'urgente'` | `'media'` | Nivel de prioridad               |
| `newRequest.agente_id` | `string`                             | `''`      | UUID del agente (vacío = auto)   |
| `selectedFiles`        | `FileType[]`                         | `[]`      | Archivos adjuntos (max 3)        |

### Constantes de Configuración

#### Tipos de Solicitud

```typescript
const requestTypes = [
  { id: 1, name: 'Soporte Técnico' },
  { id: 2, name: 'Facturación' },
  { id: 3, name: 'Información' },
  { id: 4, name: 'Queja' },
  { id: 5, name: 'Sugerencia' },
];

// Mapea a: requests.tipo (integer)
```

#### Estados del Workflow

```typescript
type RequestStatus =
  | 'nuevo' // Recién creada, sin asignar
  | 'asignado' // Asignada a agente, sin iniciar
  | 'en_proceso' // Agente trabajando
  | 'pausado' // Bloqueada temporalmente
  | 'resuelto' // Completada, pendiente cierre
  | 'cerrado'; // Finalizada

// Workflow típico: nuevo → asignado → en_proceso → resuelto → cerrado
```

#### Prioridades

```typescript
const priorities = [
  { value: 'baja', label: 'Baja', color: '#10b981' }, // Verde
  { value: 'media', label: 'Media', color: '#f59e0b' }, // Naranja
  { value: 'alta', label: 'Alta', color: '#ef4444' }, // Rojo
  { value: 'urgente', label: 'Urgente', color: '#dc2626' }, // Rojo oscuro
];
```

---

### Funciones Principales

#### 1. **loadRequests()**

```typescript
Propósito: Cargar solicitudes desde Supabase según rol del usuario

Flujo:
  1. Validar user existe
  2. setLoading(true), setError(null)
  3. Construir query base:
     SELECT *,
       usuario:users!requests_usuario_id_fkey(...),
       agente:users!requests_agente_id_fkey(...)
     FROM requests
     ORDER BY created_at DESC

  4. Aplicar filtro según rol:
     - customer: WHERE usuario_id = user.id
     - agent: WHERE agente_id = user.id
     - admin: (sin filtro, ver todas)

  5. Ejecutar query
  6. Si error: setError(message)
  7. Si éxito: setRequests(data || [])
  8. setLoading(false)

Manejo de Errores:
  - Network error → "Error al cargar las solicitudes: [message]"
  - No data → requests = []
  - Logs en console.error

Ejecutada en:
  - useEffect([user]) - al montar y cuando cambia user
```

#### 2. **loadAgents()**

```typescript
Propósito: Cargar lista de agentes para selector de asignación

Query:
  SELECT id, nombre, apellido_paterno, apellido_materno, categoria, zona
  FROM users
  WHERE rol = 'agent' AND activo = true
  ORDER BY nombre ASC

Resultado:
  - setAgents(data || [])
  - Usado en modal de creación
  - Solo nombres completos, categorías y zonas

Ejecutada en:
  - useEffect([user]) - en paralelo con loadRequests()
```

#### 3. **handleCreateRequest()**

```typescript
Propósito: Validar y crear nueva solicitud

Validaciones:
  1. Título y mensaje no vacíos
  2. Título entre 5-200 caracteres
  3. Usuario autenticado

Flujo Principal:
  1. setSubmitting(true)
  2. Construir requestData:
     {
       titulo, mensaje, tipo, prioridad,
       estatus: 'nuevo',
       usuario_id: user.id,
       agente_id: newRequest.agente_id || null,
       archivos: [file.uri, ...],
       tags: [],
       metadata: { files: [...] }
     }

  3. INSERT en Supabase con RETURNING *
  4. Si éxito:
     - Agregar a lista: setRequests([data, ...requests])
     - Resetear formulario
     - Cerrar modal
     - Enviar notificación de éxito
     - Si tiene agente: crear notificación para agente

  5. Si error:
     - Alert "No se pudo crear la solicitud"
     - console.error

  6. setSubmitting(false)

Notificaciones:
  - Al usuario: "Solicitud creada"
  - Al agente (si asignado): "Nueva solicitud asignada"

Postcondiciones:
  - Formulario limpio
  - Modal cerrado
  - Solicitud visible en lista
```

#### 4. **handleUpdateRequestStatus(requestId, newStatus)**

```typescript
Propósito: Cambiar estado de una solicitud (solo agents/admins)

Flujo:
  1. Usar supabaseClient (sin tipos estrictos)
  2. UPDATE requests
     SET estatus = newStatus, updated_at = NOW()
     WHERE id = requestId

  3. Si éxito:
     - Actualizar lista local:
       setRequests(prev => prev.map(req =>
         req.id === requestId
           ? { ...req, estatus: newStatus, updated_at: NOW() }
           : req
       ))

     - Enviar notificación al usuario:
       "Tu solicitud [titulo] cambió a: [newStatus]"

  4. Si error:
     - console.error (no Alert, es background)

Llamada desde:
  - onPress de RequestCard (solo para agents/admins)
  - Alert.alert con opciones de estado
  - Simulación automática cada 15s (demo)
```

#### 5. **handleSearch(filters)**

```typescript
Propósito: Aplicar filtros de búsqueda avanzada

Entrada (filters):
  {
    query: string,           // Texto de búsqueda
    status: string[],        // ['nuevo', 'en_proceso']
    priority: string[]       // ['alta', 'urgente']
  }

Algoritmo:
  1. Iniciar con requests completo

  2. Filtrar por texto (si query no vacío):
     - request.titulo.includes(query) OR
     - request.mensaje.includes(query) OR
     - request.agente.nombre.includes(query)

  3. Filtrar por estado (si status.length > 0):
     - request.estatus IN status

  4. Filtrar por prioridad (si priority.length > 0):
     - request.prioridad IN priority

  5. setFilteredRequests(result)

Ejecutada en:
  - AdvancedSearchComponent.onSearch callback
  - Búsqueda en tiempo real (client-side)
```

#### 6. **handleClearSearch()**

```typescript
Propósito: Resetear filtros de búsqueda

Acción:
  setFilteredRequests(requests)

Efecto:
  - Muestra todas las solicitudes del usuario
  - AdvancedSearchComponent resetea sus inputs
```

#### 7. **handleFileSelected(file)**

```typescript
Propósito: Agregar archivo a lista de adjuntos

Validaciones (en FileUploadComponent):
  - Máximo 3 archivos
  - Máximo 5MB por archivo
  - Tipos permitidos: images, PDFs, docs

Acción:
  setSelectedFiles(prev => [...prev, file])

Estructura file:
  {
    uri: string,      // Local path o URL
    name: string,     // Nombre del archivo
    type: string,     // MIME type
    size: number      // Bytes
  }
```

#### 8. **handleFileRemoved(index)**

```typescript
Propósito: Eliminar archivo de lista

Acción:
  setSelectedFiles(prev => prev.filter((_, i) => i !== index))
```

---

### Funciones de Utilidad y Helpers

#### getStatusIcon(status: string)

```typescript
Mapeo de estado → Icono Lucide:
  'nuevo' → AlertTriangle (naranja)
  'asignado' → Clock (azul)
  'en_proceso' → Clock (púrpura)
  'pausado' → AlertTriangle (rojo)
  'resuelto' → CheckCircle (verde)
  'cerrado' → CheckCircle (gris)
  default → AlertTriangle (gris)

Uso: Icono en RequestCard header
```

#### getStatusText(status: string)

```typescript
Traduce código → Texto legible:
  'nuevo' → 'Nuevo'
  'asignado' → 'Asignado'
  'en_proceso' → 'En proceso'
  'pausado' → 'Pausado'
  'resuelto' → 'Resuelto'
  'cerrado' → 'Cerrado'
  default → 'Desconocido'
```

#### getStatusColor(status: string)

```typescript
Color para badge y texto:
  'nuevo' → '#f59e0b'      (naranja)
  'asignado' → '#3b82f6'   (azul)
  'en_proceso' → '#8b5cf6' (púrpura)
  'pausado' → '#ef4444'    (rojo)
  'resuelto' → '#10b981'   (verde)
  'cerrado' → '#6b7280'    (gris)
```

#### getPriorityColor(priority: string)

```typescript
Color para badge de prioridad:
  'baja' → '#10b981'    (verde)
  'media' → '#f59e0b'   (naranja)
  'alta' → '#ef4444'    (rojo)
  'urgente' → '#dc2626' (rojo oscuro)
```

#### formatDate(dateString: string)

```typescript
Formato: DD/MM/YYYY HH:mm
Ejemplo: "14/10/2025 15:30"

Código:
  new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
```

#### getFullName(usuario: any)

```typescript
Construye nombre completo de usuario/agente:
  `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno}`.trim()

Manejo de null:
  Si !usuario → 'Usuario desconocido'
```

---

## 🗄️ Base de Datos

### Tablas Principales

#### 1. **requests** (Tabla Central)

**Schema**:

```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo INTEGER NOT NULL,
  prioridad request_priority NOT NULL,
  estatus request_status NOT NULL DEFAULT 'nuevo',
  usuario_id UUID NOT NULL REFERENCES users(id),
  agente_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  fecha_vencimiento TIMESTAMP,
  archivos TEXT[],
  tags TEXT[],
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  metadata JSONB
);

CREATE INDEX idx_requests_usuario ON requests(usuario_id);
CREATE INDEX idx_requests_agente ON requests(agente_id);
CREATE INDEX idx_requests_estatus ON requests(estatus);
CREATE INDEX idx_requests_created ON requests(created_at DESC);
```

**Campos Detallados**:

| Campo               | Tipo         | Nullable | Default | Descripción                  | Uso en UI                       |
| ------------------- | ------------ | -------- | ------- | ---------------------------- | ------------------------------- |
| `id`                | uuid         | NO       | auto    | Identificador único          | Key en FlatList                 |
| `titulo`            | varchar(200) | NO       | -       | Título de la solicitud       | Header de card                  |
| `mensaje`           | text         | NO       | -       | Descripción detallada        | Body de card (preview 3 líneas) |
| `tipo`              | integer      | NO       | -       | Categoría: 1-5               | Badge tipo (opcional en UI)     |
| `prioridad`         | enum         | NO       | -       | baja\|media\|alta\|urgente   | Badge con color                 |
| `estatus`           | enum         | NO       | 'nuevo' | Estado del workflow          | Badge principal                 |
| `usuario_id`        | uuid         | NO       | -       | FK a users (quien creó)      | Mostrar en agent/admin view     |
| `agente_id`         | uuid         | YES      | null    | FK a users (asignado)        | Mostrar en customer view        |
| `created_at`        | timestamp    | NO       | NOW()   | Fecha de creación            | Formato DD/MM/YYYY HH:mm        |
| `updated_at`        | timestamp    | NO       | NOW()   | Última actualización         | No mostrado directamente        |
| `fecha_vencimiento` | timestamp    | YES      | null    | Deadline (opcional)          | No implementado en UI           |
| `archivos`          | text[]       | YES      | null    | Array de URIs                | Contador "📎 X archivos"        |
| `tags`              | text[]       | YES      | null    | Etiquetas para búsqueda      | No implementado                 |
| `rating`            | integer      | YES      | null    | Calificación 1-5             | ⭐ si resuelto                  |
| `feedback`          | text         | YES      | null    | Comentario del cliente       | Mostrar si resuelto             |
| `metadata`          | jsonb        | YES      | null    | Datos extra (ej: files info) | Metadata de archivos            |

#### 2. **users** (Relación FK)

**Query con JOIN**:

```sql
SELECT
  requests.*,
  usuario:users!requests_usuario_id_fkey(
    nombre, apellido_paterno, apellido_materno, empresa
  ),
  agente:users!requests_agente_id_fkey(
    nombre, apellido_paterno, apellido_materno, categoria
  )
FROM requests
WHERE usuario_id = :current_user_id  -- Para customers
  OR agente_id = :current_user_id    -- Para agents
ORDER BY created_at DESC;
```

**Campos Utilizados**:

- `usuario.nombre`, `usuario.apellido_paterno`, `usuario.apellido_materno` → Nombre completo del cliente
- `usuario.empresa` → Empresa del cliente (para agents/admins)
- `agente.nombre`, `agente.apellido_paterno`, `agente.apellido_materno` → Nombre completo del agente
- `agente.categoria` → Categoría del agente (para customers)

#### 3. **notifications** (Escritura)

**Creación de Notificación al Asignar**:

```sql
INSERT INTO notifications (
  user_id,
  title,
  body,
  type,
  priority,
  data,
  read
) VALUES (
  :agente_id,
  'Nueva solicitud asignada',
  'Se te ha asignado la solicitud: ' || :titulo,
  'assignment',
  'medium',
  '{"requestId": "' || :request_id || '"}',
  false
);
```

---

### Relación Detallada UI ↔ Base de Datos

| Elemento UI                                    | Query/Campo                                            | Transformación                | Ejemplo                        |
| ---------------------------------------------- | ------------------------------------------------------ | ----------------------------- | ------------------------------ |
| **RequestCard - Header**                       |
| Icono estado                                   | `requests.estatus`                                     | `getStatusIcon(estatus)`      | Clock, CheckCircle             |
| Texto estado                                   | `requests.estatus`                                     | `getStatusText(estatus)`      | "En proceso"                   |
| Badge prioridad                                | `requests.prioridad`                                   | `getPriorityColor(prioridad)` | Badge rojo "ALTA"              |
| Fecha                                          | `requests.created_at`                                  | `formatDate(created_at)`      | "14/10/2025 15:30"             |
| **RequestCard - Body**                         |
| Título                                         | `requests.titulo`                                      | Directo                       | "Solicitud de soporte técnico" |
| Mensaje                                        | `requests.mensaje`                                     | `numberOfLines={3}`           | Preview truncado               |
| **RequestCard - Info Usuario (Agents/Admins)** |
| Nombre cliente                                 | `usuario.nombre + apellido_paterno + apellido_materno` | `getFullName(usuario)`        | "Carlos Rosales García"        |
| Empresa cliente                                | `usuario.empresa`                                      | Directo                       | "ELMEC"                        |
| **RequestCard - Info Agente (Customers)**      |
| Nombre agente                                  | `agente.nombre + apellido_paterno + apellido_materno`  | `getFullName(agente)`         | "Ana García López"             |
| Categoría agente                               | `agente.categoria`                                     | Directo                       | "Servicio al Cliente"          |
| **RequestCard - Sin Agente**                   |
| Alerta                                         | `!requests.agente_id`                                  | Condicional                   | "[⚠️] Sin agente asignado"     |
| **RequestCard - Archivos**                     |
| Contador                                       | `requests.archivos.length`                             | Condicional                   | "📎 2 archivos adjuntos"       |
| **RequestCard - Feedback (si resuelto)**       |
| Rating                                         | `requests.rating`                                      | `'⭐'.repeat(rating)`         | ⭐⭐⭐⭐⭐ (5/5)               |
| Comentario                                     | `requests.feedback`                                    | Directo                       | "Excelente servicio"           |
| **Modal - Selector Agente**                    |
| Lista agentes                                  | `SELECT * FROM users WHERE rol='agent'`                | Map a chips                   | [Carlos R.], [Ana G.]          |

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
│   useEffect([user])                              │
│   if (user) { loadRequests(); loadAgents(); }   │
└────────────────┬────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌────────────┐      ┌──────────────┐
│loadRequests│      │ loadAgents() │
└─────┬──────┘      └──────┬───────┘
      │                    │
      │                    ▼
      │         SELECT ... FROM users
      │         WHERE rol = 'agent'
      │                    │
      │                    ▼
      │            setAgents(data)
      │
      ▼
┌─────────────────────────────────────────────────┐
│   CONSTRUIR QUERY SEGÚN ROL                     │
│                                                  │
│   Base:                                          │
│   SELECT *, usuario:users(...), agente:users(...) │
│   FROM requests ORDER BY created_at DESC        │
│                                                  │
│   + Filtro:                                      │
│   - customer: WHERE usuario_id = user.id        │
│   - agent: WHERE agente_id = user.id            │
│   - admin: (sin filtro)                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         EJECUTAR QUERY SUPABASE                  │
└────────────────┬────────────────────────────────┘
                 │
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
      │         [Mostrar error UI]
      │
      ▼
setRequests(data || [])
setLoading(false)
      │
      ▼
┌─────────────────────────────────────────────────┐
│   useEffect([requests])                          │
│   setFilteredRequests(requests)                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         RENDER SCROLLVIEW                        │
│   {filteredRequests.map(request => ...)}        │
└─────────────────────────────────────────────────┘
```

### Diagrama de Flujo - Crear Solicitud

```
Usuario Toca [+]
      │
      ▼
setShowNewRequestModal(true)
      │
      ▼
┌─────────────────────────────────┐
│   MODAL DE CREACIÓN             │
│   - Título (TextInput)          │
│   - Tipo (Chips selección)      │
│   - Prioridad (Chips)           │
│   - Agente (Chips opcionales)   │
│   - Mensaje (TextArea)          │
│   - Archivos (Upload component) │
└─────────────────┬───────────────┘
                  │
    Usuario completa y toca [Enviar Solicitud]
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   handleCreateRequest()                          │
│                                                  │
│   1. Validar:                                    │
│      - titulo && mensaje                         │
│      - titulo.length >= 5 && <= 200              │
│      - user autenticado                          │
│                                                  │
│   2. setSubmitting(true)                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Construir requestData                          │
│   {                                              │
│     titulo, mensaje, tipo, prioridad,            │
│     estatus: 'nuevo',                            │
│     usuario_id: user.id,                         │
│     agente_id: newRequest.agente_id || null,     │
│     archivos: selectedFiles.map(f => f.uri),     │
│     metadata: { files: [...] }                   │
│   }                                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   INSERT INTO requests                           │
│   RETURNING *,                                   │
│     usuario:users(...),                          │
│     agente:users(...)                            │
└────────────────┬────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  ┌───────┐          ┌──────────┐
  │SUCCESS│          │  ERROR   │
  └───┬───┘          └────┬─────┘
      │                   │
      │                   ▼
      │         Alert "No se pudo crear"
      │         setSubmitting(false)
      │         return
      │
      ▼
┌─────────────────────────────────────────────────┐
│   Post-Creación                                  │
│                                                  │
│   1. setRequests([data, ...prev])                │
│   2. Resetear newRequest                         │
│   3. setSelectedFiles([])                        │
│   4. setShowNewRequestModal(false)               │
│   5. sendDemoNotification("Solicitud creada")    │
│                                                  │
│   6. Si agente_id:                               │
│      INSERT INTO notifications                   │
│      (user_id: agente_id, tipo: 'assignment')    │
│                                                  │
│   7. Alert "Éxito"                               │
│   8. setSubmitting(false)                        │
└─────────────────────────────────────────────────┘
```

### Diagrama de Flujo - Actualización de Estado (Agent/Admin)

```
Agent toca RequestCard
      │
      ▼
┌─────────────────────────────────┐
│   onPress verificar rol          │
│   if (user.rol === 'agent' ||    │
│       user.rol === 'admin')      │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   Alert.alert("Cambiar Estado",                  │
│     "Solicitud: [titulo]",                       │
│     [                                            │
│       {text: 'Cancelar'},                        │
│       {text: 'Asignar', onPress: ...},           │
│       {text: 'En Proceso', onPress: ...},        │
│       {text: 'Pausar', onPress: ...},            │
│       {text: 'Resolver', onPress: ...},          │
│       {text: 'Cerrar', onPress: ...}             │
│     ]                                            │
│   )                                              │
└─────────────────┬───────────────────────────────┘
                  │
    Usuario selecciona estado (ej: 'en_proceso')
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   handleUpdateRequestStatus(requestId, 'en_proceso') │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   UPDATE requests                                │
│   SET estatus = 'en_proceso',                    │
│       updated_at = NOW()                         │
│   WHERE id = requestId                           │
└────────────────┬────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
  ┌───────┐          ┌──────────┐
  │SUCCESS│          │  ERROR   │
  └───┬───┘          └────┬─────┘
      │                   │
      │                   ▼
      │         console.error
      │         (silencioso, no Alert)
      │
      ▼
┌─────────────────────────────────────────────────┐
│   Actualizar Lista Local                         │
│                                                  │
│   setRequests(prev => prev.map(req =>            │
│     req.id === requestId                         │
│       ? {...req, estatus: 'en_proceso', updated_at: NOW()} │
│       : req                                      │
│   ))                                             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Notificar al Usuario (Cliente)                 │
│                                                  │
│   sendDemoNotification(                          │
│     'Solicitud actualizada',                     │
│     'Tu solicitud "[titulo]" cambió a: En proceso' │
│   )                                              │
└─────────────────────────────────────────────────┘
```

### Flujo de Simulación Automática (Demo)

```
┌─────────────────────────────────┐
│   useEffect([requests])          │
│   setInterval(() => { ... }, 15s)│
└─────────────────┬───────────────┘
                  │
      Cada 15 segundos
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   if (Math.random() > 0.95)  // 5% probabilidad │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Filtrar solicitudes pendientes:                │
│   pendingRequests = requests.filter(r =>        │
│     ['nuevo', 'asignado', 'en_proceso'].includes(r.estatus) │
│   )                                              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Seleccionar una al azar:                       │
│   randomRequest = pendingRequests[random]        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Determinar siguiente estado:                   │
│   - Si 'nuevo' → 'asignado'                      │
│   - Si 'asignado' → 'en_proceso'                 │
│   - Si 'en_proceso' && random > 0.7 → 'resuelto' │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   handleUpdateRequestStatus(id, newStatus)       │
│   (mismo flujo que actualización manual)         │
└─────────────────────────────────────────────────┘

Nota: Este loop se limpia en cleanup del useEffect
```

---

## 📖 Casos de Uso

### CU-REQ-01: Customer Crea Nueva Solicitud

**Actor**: Usuario con rol 'customer'

**Precondiciones**:

- Usuario autenticado
- Pantalla Requests cargada
- Lista de agentes disponible

**Flujo Principal**:

1. Usuario toca botón [+] en header
2. Sistema muestra modal de nueva solicitud
3. Usuario completa campo "Título": "Problema con facturación"
4. Usuario selecciona "Tipo": [Facturación]
5. Usuario selecciona "Prioridad": [Alta]
6. Usuario selecciona "Agente": [Carlos Rosales] (opcional)
7. Usuario escribe "Mensaje": "La factura del mes pasado tiene un error en el monto..."
8. Usuario toca [Adjuntar] y selecciona archivo PDF
9. Sistema agrega archivo a `selectedFiles`
10. Usuario toca [Enviar Solicitud]
11. Sistema valida:
    - ✅ Título tiene 25 caracteres (5-200)
    - ✅ Mensaje no vacío
    - ✅ Usuario autenticado
12. Sistema ejecuta INSERT con:
    ```typescript
    {
      titulo: "Problema con facturación",
      mensaje: "La factura del mes pasado...",
      tipo: 2,
      prioridad: 'alta',
      estatus: 'nuevo',
      usuario_id: user.id,
      agente_id: "uuid-carlos",
      archivos: ["file:///path/factura.pdf"],
      metadata: { files: [{name: "factura.pdf", size: 45000}] }
    }
    ```
13. Sistema recibe solicitud creada con id
14. Sistema agrega solicitud al inicio de la lista
15. Sistema cierra modal y resetea formulario
16. Sistema muestra toast: "Solicitud creada: Problema con facturación"
17. Sistema crea notificación para Carlos:
    ```typescript
    {
      user_id: "uuid-carlos",
      title: "Nueva solicitud asignada",
      body: "Se te ha asignado: Problema con facturación",
      type: 'assignment'
    }
    ```
18. Sistema muestra Alert "Éxito: Solicitud creada correctamente"

**Postcondiciones**:

- Solicitud visible en lista del customer
- Solicitud visible en lista del agente (Carlos)
- Notificación enviada al agente
- Modal cerrado
- Formulario limpio

**Flujos Alternativos**:

- **11a. Título vacío**: Alert "Por favor, completa el título y mensaje"
- **11b. Título < 5 chars**: Alert "El título debe tener entre 5 y 200 caracteres"
- **13a. Error BD**: Alert "No se pudo crear la solicitud", console.error

---

### CU-REQ-02: Agent Cambia Estado de Solicitud

**Actor**: Usuario con rol 'agent'

**Precondiciones**:

- Agent autenticado
- Tiene solicitudes asignadas
- Pantalla Requests cargada

**Flujo Principal**:

1. Agent visualiza solicitud "Problema con facturación" con estado "nuevo"
2. Agent toca la RequestCard
3. Sistema verifica `user.rol === 'agent'`
4. Sistema muestra Alert con opciones:
   - [Cancelar]
   - [Asignar]
   - [En Proceso]
   - [Pausar]
   - [Resolver]
   - [Cerrar]
5. Agent selecciona [En Proceso]
6. Sistema ejecuta `handleUpdateRequestStatus(requestId, 'en_proceso')`
7. Sistema ejecuta UPDATE:
   ```sql
   UPDATE requests
   SET estatus = 'en_proceso', updated_at = NOW()
   WHERE id = requestId
   ```
8. Sistema actualiza lista local sin re-fetch:
   ```typescript
   setRequests(prev =>
     prev.map(req =>
       req.id === requestId
         ? {
             ...req,
             estatus: 'en_proceso',
             updated_at: new Date().toISOString(),
           }
         : req
     )
   );
   ```
9. RequestCard se re-renderiza con:
   - Icono: Clock púrpura
   - Texto: "En proceso"
   - Color badge: #8b5cf6
10. Sistema envía notificación al cliente:
    ```typescript
    sendDemoNotification(
      'Solicitud actualizada',
      'Tu solicitud "Problema con facturación" cambió a: En proceso',
      'info',
      { requestId }
    );
    ```

**Postcondiciones**:

- Estado actualizado en BD
- UI actualizada sin reload
- Cliente recibe notificación

**Flujos Alternativos**:

- **7a. Error UPDATE**: console.error, UI NO cambia (rollback implícito)
- **3a. Usuario es customer**: onPress no hace nada

---

### CU-REQ-03: Admin Ve Todas las Solicitudes

**Actor**: Usuario con rol 'admin'

**Precondiciones**:

- Admin autenticado
- Existen solicitudes de múltiples customers

**Flujo Principal**:

1. Admin navega a `/requests`
2. Sistema ejecuta `loadRequests()`
3. Sistema detecta `user.rol === 'admin'`
4. Sistema construye query SIN filtro de usuario:
   ```sql
   SELECT *,
     usuario:users(...),
     agente:users(...)
   FROM requests
   ORDER BY created_at DESC
   -- Sin WHERE (admin ve todas)
   ```
5. Sistema recibe todas las solicitudes del sistema
6. Sistema renderiza lista completa
7. Admin puede ver:
   - Solicitudes de customer1, customer2, etc.
   - Info del cliente en cada card
   - Info del agente asignado
8. Admin puede cambiar estado de cualquier solicitud (como agent)

**Postcondiciones**:

- Admin tiene visibilidad completa
- Puede gestionar cualquier solicitud

---

### CU-REQ-04: Customer Busca Sus Solicitudes

**Actor**: Usuario con rol 'customer'

**Precondiciones**:

- Customer con múltiples solicitudes creadas
- AdvancedSearchComponent renderizado

**Flujo Principal**:

1. Customer toca campo de búsqueda en AdvancedSearchComponent
2. Customer escribe "facturación"
3. Sistema ejecuta `handleSearch({ query: "facturación", status: [], priority: [] })`
4. Sistema filtra `requests` donde:
   ```typescript
   request.titulo.toLowerCase().includes('facturación') ||
     request.mensaje.toLowerCase().includes('facturación') ||
     (request.agente && getFullName(request.agente).includes('facturación'));
   ```
5. Sistema encuentra 2 solicitudes:
   - "Problema con facturación"
   - "Consulta sobre facturación de enero"
6. Sistema ejecuta `setFilteredRequests([...resultados])`
7. ScrollView re-renderiza solo 2 cards

**Postcondiciones**:

- Solo solicitudes matching visibles
- Contador actualizado: "2 solicitudes"

**Flujo Alternativo**:

- **4a. Sin resultados**: Estado vacío "No se encontraron solicitudes"

---

### CU-REQ-05: Agent Filtra por Estado y Prioridad

**Actor**: Agent

**Precondiciones**:

- Agent con solicitudes en varios estados
- AdvancedSearchComponent expandido

**Flujo Principal**:

1. Agent toca filtros en AdvancedSearchComponent
2. Agent selecciona estados: [en_proceso, pausado]
3. Agent selecciona prioridades: [alta, urgente]
4. Sistema ejecuta `handleSearch({ query: "", status: ['en_proceso', 'pausado'], priority: ['alta', 'urgente'] })`
5. Sistema filtra requests donde:
   ```typescript
   ['en_proceso', 'pausado'].includes(request.estatus) &&
     ['alta', 'urgente'].includes(request.prioridad);
   ```
6. Sistema muestra solo solicitudes que cumplen AMBAS condiciones

**Postcondiciones**:

- Vista filtrada según criterios
- Agent puede enfocarse en urgentes en proceso

---

### CU-REQ-06: Sistema Simula Actualización Automática (Demo)

**Actor**: Sistema (automatizado)

**Precondiciones**:

- Existen solicitudes con estado 'nuevo', 'asignado' o 'en_proceso'
- useEffect de simulación activo

**Flujo Principal**:

1. Cada 15 segundos, interval se dispara
2. Sistema genera número aleatorio (ej: 0.97)
3. Sistema verifica: 0.97 > 0.95 ✅
4. Sistema filtra solicitudes pendientes:
   ```typescript
   pendingRequests = requests.filter(r =>
     ['nuevo', 'asignado', 'en_proceso'].includes(r.estatus)
   );
   ```
5. Sistema encuentra 3 solicitudes pendientes
6. Sistema selecciona una al azar (ej: índice 1)
7. Solicitud seleccionada tiene estado 'en_proceso'
8. Sistema genera random: 0.75 > 0.7 ✅
9. Sistema determina nuevo estado: 'resuelto'
10. Sistema ejecuta `handleUpdateRequestStatus(id, 'resuelto')`
11. Sistema actualiza BD y lista local
12. Cliente recibe notificación: "Tu solicitud cambió a: Resuelto"

**Postcondiciones**:

- Estado actualizado automáticamente
- Cliente ve cambio en tiempo (casi) real
- Demo de sistema "vivo"

**Notas**:

- Probabilidad 5% cada 15s ≈ 1 actualización cada 5 minutos
- Solo afecta solicitudes pendientes
- Cleanup en unmount previene memory leaks

---

## ✅ Matriz de Pruebas

### Matriz de Pruebas Funcionales - CRUD

| ID      | Caso de Prueba                 | Actor      | Entrada                                                            | Resultado Esperado                                    | Prioridad | Estado |
| ------- | ------------------------------ | ---------- | ------------------------------------------------------------------ | ----------------------------------------------------- | --------- | ------ |
| REQ-C01 | Crear solicitud válida         | Customer   | Título: "Test", Mensaje: "Mensaje test", Tipo: 1, Prioridad: media | Solicitud creada, visible en lista, BD insertada      | Alta      | ⬜     |
| REQ-C02 | Crear sin título               | Customer   | Título: "", Mensaje: "Test"                                        | Alert "Por favor, completa todos los campos"          | Alta      | ⬜     |
| REQ-C03 | Crear sin mensaje              | Customer   | Título: "Test", Mensaje: ""                                        | Alert "Por favor, completa todos los campos"          | Alta      | ⬜     |
| REQ-C04 | Título < 5 caracteres          | Customer   | Título: "Hi", Mensaje: "Test"                                      | Alert "El título debe tener entre 5 y 200 caracteres" | Alta      | ⬜     |
| REQ-C05 | Título > 200 caracteres        | Customer   | Título: "A" \* 250, Mensaje: "Test"                                | Alert de validación                                   | Media     | ⬜     |
| REQ-C06 | Crear con agente asignado      | Customer   | Agente: Carlos Rosales                                             | Solicitud con agente_id, notificación a agente        | Alta      | ⬜     |
| REQ-C07 | Crear sin agente (auto)        | Customer   | Agente: (vacío)                                                    | Solicitud con agente_id = null                        | Alta      | ⬜     |
| REQ-C08 | Adjuntar 1 archivo             | Customer   | 1 PDF (2MB)                                                        | Archivo en metadata, archivos[0] = URI                | Media     | ⬜     |
| REQ-C09 | Adjuntar 3 archivos            | Customer   | 3 archivos                                                         | Todos en array archivos                               | Media     | ⬜     |
| REQ-C10 | Adjuntar > 3 archivos          | Customer   | 4 archivos                                                         | FileUpload muestra error "Máximo 3 archivos"          | Baja      | ⬜     |
| REQ-C11 | Archivo > 5MB                  | Customer   | 1 archivo 7MB                                                      | FileUpload muestra error "Máximo 5MB"                 | Baja      | ⬜     |
| REQ-R01 | Customer ve sus solicitudes    | Customer   | Login como customer1                                               | Solo solicitudes con usuario_id = customer1.id        | Alta      | ⬜     |
| REQ-R02 | Agent ve solicitudes asignadas | Agent      | Login como agent1                                                  | Solo solicitudes con agente_id = agent1.id            | Alta      | ⬜     |
| REQ-R03 | Admin ve todas                 | Admin      | Login como admin                                                   | Todas las solicitudes sin filtro                      | Alta      | ⬜     |
| REQ-R04 | Cargar con datos vacíos        | Customer   | BD sin solicitudes del user                                        | Estado vacío "No tienes solicitudes aún"              | Media     | ⬜     |
| REQ-R05 | Error de conexión              | Cualquiera | BD offline                                                         | Error + botón "Reintentar"                            | Alta      | ⬜     |
| REQ-U01 | Agent actualiza a 'asignado'   | Agent      | Solicitud 'nuevo' → 'asignado'                                     | Estado cambia, BD actualizada, notif enviada          | Alta      | ⬜     |
| REQ-U02 | Agent actualiza a 'en_proceso' | Agent      | Solicitud 'asignado' → 'en_proceso'                                | Estado cambia correctamente                           | Alta      | ⬜     |
| REQ-U03 | Agent actualiza a 'resuelto'   | Agent      | Solicitud 'en_proceso' → 'resuelto'                                | Estado cambia, icono CheckCircle verde                | Alta      | ⬜     |
| REQ-U04 | Customer intenta actualizar    | Customer   | Toca RequestCard                                                   | onPress no hace nada (no Alert)                       | Alta      | ⬜     |
| REQ-U05 | Admin actualiza cualquiera     | Admin      | Cualquier solicitud → nuevo estado                                 | Actualización exitosa                                 | Alta      | ⬜     |

### Matriz de Pruebas Funcionales - Búsqueda y Filtros

| ID      | Caso de Prueba                    | Filtros                                 | Resultado Esperado                           | Prioridad | Estado |
| ------- | --------------------------------- | --------------------------------------- | -------------------------------------------- | --------- | ------ |
| REQ-S01 | Buscar por título exacto          | query: "Problema con facturación"       | Solo esa solicitud                           | Alta      | ⬜     |
| REQ-S02 | Buscar por título parcial         | query: "factura"                        | Todas con "factura" en título o mensaje      | Alta      | ⬜     |
| REQ-S03 | Buscar por agente                 | query: "Carlos"                         | Solicitudes con agente "Carlos Rosales"      | Media     | ⬜     |
| REQ-S04 | Buscar sin resultados             | query: "XYZ999"                         | Estado vacío "No se encontraron solicitudes" | Media     | ⬜     |
| REQ-S05 | Filtrar por estado único          | status: ['en_proceso']                  | Solo solicitudes en proceso                  | Alta      | ⬜     |
| REQ-S06 | Filtrar por múltiples estados     | status: ['nuevo', 'asignado']           | Solicitudes nuevo O asignado                 | Alta      | ⬜     |
| REQ-S07 | Filtrar por prioridad alta        | priority: ['alta']                      | Solo prioridad alta                          | Media     | ⬜     |
| REQ-S08 | Filtrar por múltiples prioridades | priority: ['alta', 'urgente']           | Alta O urgente                               | Media     | ⬜     |
| REQ-S09 | Combinar búsqueda + estado        | query: "factura", status: ['resuelto']  | Factura Y resuelto                           | Alta      | ⬜     |
| REQ-S10 | Combinar búsqueda + prioridad     | query: "soporte", priority: ['urgente'] | Soporte Y urgente                            | Alta      | ⬜     |
| REQ-S11 | Limpiar búsqueda                  | Tras filtrar, tocar "Limpiar"           | Mostrar todas las solicitudes del user       | Media     | ⬜     |

### Matriz de Pruebas de Integración

| ID      | Componente A | Componente B              | Caso                    | Resultado Esperado                      | Estado |
| ------- | ------------ | ------------------------- | ----------------------- | --------------------------------------- | ------ |
| REQ-I01 | Requests     | Supabase requests table   | INSERT nueva solicitud  | Registro creado con todos los campos    | ⬜     |
| REQ-I02 | Requests     | Supabase users table (FK) | Query con JOINs         | Datos de usuario y agente incluidos     | ⬜     |
| REQ-I03 | Requests     | AuthContext               | Filtrado por rol        | Query correcta según user.rol           | ⬜     |
| REQ-I04 | Requests     | NotificationContext       | Crear solicitud         | Toast "Solicitud creada" mostrado       | ⬜     |
| REQ-I05 | Requests     | Supabase notifications    | Asignar agente          | Notificación insertada para agente      | ⬜     |
| REQ-I06 | Requests     | AdvancedSearchComponent   | Buscar                  | Callback onSearch ejecutado con filtros | ⬜     |
| REQ-I07 | Requests     | FileUploadComponent       | Subir archivo           | Callback onFileSelected con file data   | ⬜     |
| REQ-I08 | Requests     | expo-router params        | Navegar desde Directory | Param selectedAgent recibido y usado    | ⬜     |

### Matriz de Pruebas de UI/UX

| ID      | Elemento           | Criterio          | Verificación                                         | Estado |
| ------- | ------------------ | ----------------- | ---------------------------------------------------- | ------ |
| REQ-U01 | RequestCard        | Legibilidad       | Título en Inter-SemiBold 18px, visible               | ⬜     |
| REQ-U02 | Badge Estado       | Contraste         | Texto legible en color de fondo                      | ⬜     |
| REQ-U03 | Badge Prioridad    | Colores correctos | Verde/Naranja/Rojo/Rojo oscuro                       | ⬜     |
| REQ-U04 | Iconos de estado   | Visibilidad       | Clock, CheckCircle, AlertTriangle claros             | ⬜     |
| REQ-U05 | Modal altura       | Scroll            | Formulario largo scrollable en dispositivos pequeños | ⬜     |
| REQ-U06 | Botón [+]          | Touch target      | Mínimo 48x48px, fácil de tocar                       | ⬜     |
| REQ-U07 | Chips de tipo      | Feedback          | Cambio visual al seleccionar (azul)                  | ⬜     |
| REQ-U08 | Chips de prioridad | Colores           | Fondo cambia a color de prioridad                    | ⬜     |
| REQ-U09 | Loading estado     | UX                | Spinner + texto "Cargando solicitudes..."            | ⬜     |
| REQ-U10 | Empty state        | Guidance          | Mensaje claro + sugerencia de acción                 | ⬜     |
| REQ-U11 | Fecha formato      | Localización      | DD/MM/YYYY HH:mm en español                          | ⬜     |
| REQ-U12 | Mensaje preview    | Truncado          | Máximo 3 líneas, ellipsis al final                   | ⬜     |

### Matriz de Pruebas de Performance

| ID      | Escenario                    | Métrica                   | Valor Esperado   | Herramienta     | Estado |
| ------- | ---------------------------- | ------------------------- | ---------------- | --------------- | ------ |
| REQ-P01 | Carga inicial (10 requests)  | Tiempo hasta render       | < 300ms          | React DevTools  | ⬜     |
| REQ-P02 | Carga inicial (100 requests) | Tiempo hasta render       | < 1s             | React DevTools  | ⬜     |
| REQ-P03 | Crear solicitud              | Tiempo INSERT + UI update | < 500ms          | Console.time    | ⬜     |
| REQ-P04 | Actualizar estado            | Tiempo UPDATE + UI update | < 200ms          | Console.time    | ⬜     |
| REQ-P05 | Búsqueda client-side         | Latencia por keystroke    | < 50ms           | Performance API | ⬜     |
| REQ-P06 | Aplicar filtros              | Re-render tiempo          | < 100ms          | React DevTools  | ⬜     |
| REQ-P07 | Scroll lista larga           | FPS                       | > 50fps          | Flipper         | ⬜     |
| REQ-P08 | Modal animation              | Suavidad                  | Sin jank visible | Visual          | ⬜     |

### Matriz de Pruebas de Seguridad y Validación

| ID        | Caso                         | Input Malicioso                      | Resultado Esperado                        | Estado |
| --------- | ---------------------------- | ------------------------------------ | ----------------------------------------- | ------ |
| REQ-SEC01 | SQL Injection en título      | `'; DROP TABLE requests; --`         | Texto escapado, no ejecuta SQL            | ⬜     |
| REQ-SEC02 | XSS en mensaje               | `<script>alert('XSS')</script>`      | Texto renderizado como string, no ejecuta | ⬜     |
| REQ-SEC03 | IDOR - ver solicitud de otro | Manipular requestId en UI            | Solo ver propias solicitudes (customer)   | ⬜     |
| REQ-SEC04 | Actualizar sin permisos      | Customer intenta UPDATE via devtools | BD rechaza (RLS policies)                 | ⬜     |
| REQ-SEC05 | Archivo malicioso            | .exe disfrazado de .pdf              | FileUpload valida MIME type               | ⬜     |

---

## 🐛 Problemas Conocidos y Limitaciones

### Limitaciones Críticas

1. **Búsqueda Solo Client-Side (Problema de Escala)**
   - ⚠️ Carga TODAS las solicitudes del usuario y filtra en frontend
   - Con 1000+ solicitudes, muy lento
   - No usa full-text search de Supabase
   - No hay paginación

2. **Archivos No se Suben Realmente**
   - ⚠️ `selectedFiles` solo guarda URIs locales
   - No hay integración con Supabase Storage
   - Archivos no persisten tras cerrar app
   - Solo metadata en BD, no archivos reales

3. **Actualización Automática es Solo Demo**
   - ⚠️ Simulación con `setInterval`, no refleja cambios reales
   - No hay subscripciones Realtime a tabla `requests`
   - Cambios de otros usuarios NO se ven
   - Puede causar inconsistencias

4. **Sin Validación de Roles en Backend (RLS)**
   - ⚠️ Filtrado solo en frontend (`WHERE usuario_id = ...`)
   - Si se manipula query, customer podría ver otras solicitudes
   - Necesita Row Level Security en Supabase

### Limitaciones Menores

5. **Sin Edición de Solicitudes**
   - Una vez creada, no se puede editar título/mensaje
   - Solo se puede cambiar estado (agents)

6. **Sin Historial de Cambios**
   - No se registra quién cambió el estado ni cuándo
   - Solo `updated_at` genérico

7. **Sin Asignación Automática Inteligente**
   - "Asignación automática" (`agente_id = null`) no hace nada
   - No hay lógica de round-robin o load balancing

8. **Sin Fechas de Vencimiento Funcionales**
   - Campo `fecha_vencimiento` existe en BD pero no en UI
   - No hay recordatorios de deadlines

9. **Rating y Feedback Solo Manual**
   - No hay UI para que customer agregue rating/feedback
   - Solo se muestra si ya existe en BD

---

### Mejoras Recomendadas

#### 🔴 Prioridad Crítica

**1. Implementar Supabase Storage para Archivos**

```typescript
// Reemplazar guardado de URIs por upload real
const uploadFile = async (file: FileType) => {
  const { data, error } = await supabase.storage
    .from('request-attachments')
    .upload(`${user.id}/${requestId}/${file.name}`, file);

  if (error) throw error;
  return data.path; // Guardar path en BD
};

// Actualizar handleCreateRequest
const archivos = await Promise.all(selectedFiles.map(f => uploadFile(f)));
```

**2. Implementar Row Level Security (RLS)**

```sql
-- En Supabase SQL Editor
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests or assigned requests"
  ON requests FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    agente_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Only customers can create requests"
  ON requests FOR INSERT
  WITH CHECK (
    usuario_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol = 'customer'
    )
  );

CREATE POLICY "Only agents and admins can update status"
  ON requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol IN ('agent', 'admin')
    )
  );
```

**3. Implementar Subscripciones Realtime**

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('requests-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'requests',
        filter: `usuario_id=eq.${user.id}`, // O agente_id
      },
      payload => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new as Request, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev =>
            prev.map(r =>
              r.id === payload.new.id ? (payload.new as Request) : r
            )
          );
        }
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, [user]);

// Eliminar setInterval de simulación
```

**4. Implementar Paginación Server-Side**

```typescript
const PAGE_SIZE = 20;
const [page, setPage] = useState(0);
const [hasMore, setHasMore] = useState(true);

const loadRequests = async (pageNum = 0) => {
  const { data, error, count } = await supabase
    .from('requests')
    .select('*, usuario(*), agente(*)', { count: 'exact' })
    .eq(filterField, user.id)
    .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)
    .order('created_at', { ascending: false });

  if (pageNum === 0) {
    setRequests(data || []);
  } else {
    setRequests(prev => [...prev, ...(data || [])]);
  }

  setHasMore((data?.length || 0) === PAGE_SIZE);
};

// En ScrollView
<ScrollView
  onScroll={({nativeEvent}) => {
    if (isCloseToBottom(nativeEvent) && hasMore && !loading) {
      setPage(prev => prev + 1);
      loadRequests(page + 1);
    }
  }}
/>
```

#### 🟡 Prioridad Alta

**5. Agregar UI para Rating y Feedback**

```typescript
// Mostrar modal cuando estado cambia a 'resuelto'
const RatingModal = ({ requestId, onSubmit }) => (
  <Modal visible={showRating}>
    <Text>¿Cómo calificarías este soporte?</Text>
    <StarRating value={rating} onChange={setRating} />
    <TextInput
      placeholder="Comentarios opcionales"
      value={feedback}
      onChangeText={setFeedback}
    />
    <Button onPress={() => {
      supabase.from('requests')
        .update({ rating, feedback })
        .eq('id', requestId);
      onSubmit();
    }}>
      Enviar
    </Button>
  </Modal>
);
```

**6. Implementar Asignación Automática Inteligente**

```typescript
// Función en backend o Edge Function
const assignAgent = async requestData => {
  // Opción 1: Round-robin por tipo
  const { data: agents } = await supabase
    .from('users')
    .select('id, categoria')
    .eq('rol', 'agent')
    .eq('categoria', getCategoryForType(requestData.tipo))
    .eq('activo', true);

  // Contar solicitudes activas por agente
  const agentsWithLoad = await Promise.all(
    agents.map(async agent => {
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('agente_id', agent.id)
        .in('estatus', ['nuevo', 'asignado', 'en_proceso']);

      return { ...agent, load: count };
    })
  );

  // Asignar al menos cargado
  const leastLoaded = agentsWithLoad.sort((a, b) => a.load - b.load)[0];
  return leastLoaded.id;
};
```

**7. Agregar Historial de Cambios (Audit Log)**

```sql
CREATE TABLE request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  changed_by UUID REFERENCES users(id),
  old_status request_status,
  new_status request_status,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para auto-insertar
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estatus <> NEW.estatus THEN
    INSERT INTO request_history (
      request_id, changed_by, old_status, new_status
    ) VALUES (
      NEW.id, auth.uid(), OLD.estatus, NEW.estatus
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER request_status_change_trigger
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_status_change();
```

#### 🟢 Prioridad Media

8. **Agregar UI para Fechas de Vencimiento**
9. **Permitir Editar Solicitud (solo si estado='nuevo')**
10. **Exportar Solicitudes a PDF/CSV**
11. **Agregar Filtros Avanzados (por fecha, por tipo)**
12. **Notificaciones Push (no solo in-app)**
13. **Adjuntar imágenes desde cámara**

---

## 📊 Métricas de Calidad

| Métrica                | Valor Actual   | Objetivo | Estado |
| ---------------------- | -------------- | -------- | ------ |
| Cobertura de Pruebas   | 0%             | 85%      | 🔴     |
| Queries Optimizadas    | 2/2 (100%)     | 100%     | 🟢     |
| RLS Implementado       | 0%             | 100%     | 🔴     |
| Storage Funcional      | 0%             | 100%     | 🔴     |
| Realtime Updates       | 0% (solo demo) | 100%     | 🔴     |
| Tiempo Carga (10 req)  | ~300ms         | < 500ms  | 🟢     |
| Tiempo Carga (100 req) | ~2s            | < 1s     | 🔴     |
| Seguridad (RLS)        | ⚠️ Vulnerable  | Seguro   | 🔴     |
| Accesibilidad          | No medido      | WCAG AA  | 🟡     |

---

## 📝 Notas para QA

### Checklist Completo de Pruebas Manuales

#### Creación de Solicitudes

- [ ] Modal abre al tocar [+]
- [ ] Validación de título vacío
- [ ] Validación de mensaje vacío
- [ ] Validación de título < 5 chars
- [ ] Selección de tipo funciona
- [ ] Selección de prioridad funciona
- [ ] Selección de agente funciona
- [ ] Opción "Asignación automática" disponible
- [ ] FileUpload permite seleccionar archivo
- [ ] FileUpload muestra archivos seleccionados
- [ ] FileUpload permite eliminar archivo
- [ ] Botón [Enviar] muestra "Enviando..." durante submit
- [ ] Solicitud aparece en lista tras crear
- [ ] Modal se cierra tras crear
- [ ] Formulario se resetea tras crear
- [ ] Toast de éxito se muestra
- [ ] Alert de éxito se muestra

#### Visualización por Rol

- [ ] Customer solo ve sus solicitudes
- [ ] Agent solo ve solicitudes asignadas
- [ ] Admin ve todas las solicitudes
- [ ] Info de cliente visible para agents/admins
- [ ] Info de agente visible para customers
- [ ] Alerta "Sin agente" visible si agente_id = null

#### Actualización de Estado

- [ ] Customer NO puede cambiar estado (onPress sin efecto)
- [ ] Agent puede cambiar estado (Alert con opciones)
- [ ] Admin puede cambiar estado
- [ ] Todas las transiciones de estado funcionan:
  - [ ] nuevo → asignado
  - [ ] asignado → en_proceso
  - [ ] en_proceso → pausado
  - [ ] en_proceso → resuelto
  - [ ] resuelto → cerrado
- [ ] Icono cambia según estado
- [ ] Color de badge cambia
- [ ] Texto de estado se traduce correctamente
- [ ] Notificación enviada tras cambio

#### Búsqueda y Filtros

- [ ] Búsqueda por título funciona
- [ ] Búsqueda por mensaje funciona
- [ ] Búsqueda por agente funciona
- [ ] Búsqueda case-insensitive
- [ ] Filtro por estado único funciona
- [ ] Filtro por múltiples estados funciona
- [ ] Filtro por prioridad funciona
- [ ] Combinación búsqueda + filtros funciona
- [ ] Botón "Limpiar" resetea filtros
- [ ] Contador actualizado con resultados

#### UI/UX

- [ ] RequestCard tiene sombra sutil
- [ ] Badges tienen colores correctos
- [ ] Fechas en formato DD/MM/YYYY HH:mm
- [ ] Mensaje truncado a 3 líneas
- [ ] Feedback visible si estado = resuelto
- [ ] Rating visible si existe
- [ ] Archivos contador visible
- [ ] Loading state con spinner
- [ ] Empty state con mensaje
- [ ] Error state con "Reintentar"

#### Simulación Automática (Demo)

- [ ] Cada ~15s una solicitud cambia estado
- [ ] Solo cambian solicitudes pendientes
- [ ] Notificación enviada tras cambio auto
- [ ] Cleanup en unmount (no memory leak)

---

### Datos de Prueba

**Crear Usuarios de Prueba**:

```sql
-- Customer
INSERT INTO users (id, nombre, apellido_paterno, email, rol, correo_electronico, empresa, activo)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Juan',
  'Pérez',
  'juan.perez@test.com',
  'customer',
  'juan.perez@test.com',
  'ELMEC',
  true
);

-- Agent
INSERT INTO users (id, nombre, apellido_paterno, email, rol, categoria, correo_electronico, empresa, activo)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Carlos',
  'Rosales',
  'c.rosales@elmec.com.mx',
  'agent',
  'Soporte Técnico',
  'c.rosales@elmec.com.mx',
  'ELMEC',
  true
);

-- Admin
INSERT INTO users (id, nombre, apellido_paterno, email, rol, correo_electronico, empresa, activo)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Ana',
  'García',
  'ana.garcia@elmec.com.mx',
  'admin',
  'ana.garcia@elmec.com.mx',
  'ELMEC',
  true
);
```

**Crear Solicitudes de Prueba**:

```sql
INSERT INTO requests (
  titulo, mensaje, tipo, prioridad, estatus, usuario_id, agente_id
) VALUES
  (
    'Problema con facturación',
    'La factura del mes pasado tiene un error en el monto total.',
    2,
    'alta',
    'nuevo',
    '11111111-1111-1111-1111-111111111111',
    NULL
  ),
  (
    'Soporte técnico para instalación',
    'Necesito ayuda para instalar el software nuevo.',
    1,
    'media',
    'asignado',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'Consulta sobre productos',
    'Quisiera información sobre los nuevos productos del catálogo.',
    3,
    'baja',
    'en_proceso',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  );
```

---

## 🔗 Enlaces Relacionados

- [Módulo Inicio](./01-MODULO-INICIO.md)
- [Módulo Directorio](./02-MODULO-DIRECTORIO.md)
- [Módulo Chat](./04-MODULO-CHAT.md)
- [Módulo Perfil](./05-MODULO-PERFIL.md)
- [Database Schema - requests table](../DATABASE/schema.md#requests)
- [Supabase Service API](../SERVICES/supabaseService.md)
- [AdvancedSearchComponent](../COMPONENTS/AdvancedSearchComponent.md)
- [FileUploadComponent](../COMPONENTS/FileUploadComponent.md)

---

**Última Actualización**: 2025-10-14
**Versión**: 1.0.0
**Autor**: Equipo ELMEC
**Revisado por**: QA Team
**Criticidad**: ALTA - Módulo Core del Sistema
