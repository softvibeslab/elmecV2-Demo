# MÓDULO 2: DIRECTORIO (Directory)

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

El módulo Directorio permite a los usuarios buscar y contactar a otros miembros de la organización ELMEC. Funciona como una libreta de contactos empresarial con capacidades avanzadas de búsqueda, filtrado y múltiples métodos de contacto.

### Funcionalidades Principales

- 🔍 Búsqueda en tiempo real por nombre, email, empresa
- 🎯 Filtrado por categoría y zona geográfica
- 📞 Llamadas telefónicas directas
- 💬 WhatsApp Business integration
- ✉️ Cliente de email
- 💬 Chat interno de la aplicación
- 📋 Creación rápida de solicitudes
- 🟢 Indicador de presencia online

### Ubicación

**Archivo**: `/app/(tabs)/directory.tsx`
**Ruta**: `/directory`
**Layout Padre**: `app/(tabs)/_layout.tsx`

### Rol de Usuario

- ✅ Disponible para: **Todos los roles** (customer, agent, admin)
- 🔒 Los usuarios NO ven su propio perfil en la lista

---

## 🏗️ Arquitectura del Módulo

### Componentes y Estructura

```typescript
// Componente Principal
export default function Directory() {
  // Estados Principales
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks y Contextos
  const { createChatRoom } = useChat();
  const { sendDemoNotification } = useNotifications();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  // Configuración Estática
  const categories = ['Todos', 'Agentes de venta', 'Servicio al Cliente', 'Soporte Técnico'];
  const zones = ['Todas', 'Norte', 'Sur', 'Centro', 'Este', 'Oeste'];

  return <SafeAreaView>...</SafeAreaView>
}
```

### Dependencias Externas

| Dependencia                      | Propósito                 | Crítico |
| -------------------------------- | ------------------------- | ------- |
| `@/lib/supabase`                 | Conexión a base de datos  | ✅      |
| `@/hooks/useChat`                | Creación de salas de chat | ✅      |
| `@/contexts/NotificationContext` | Notificaciones in-app     | ✅      |
| `@/contexts/AuthContext`         | Usuario actual            | ✅      |
| `expo-router`                    | Navegación                | ✅      |
| `react-native/Linking`           | Llamadas, Email, WhatsApp | ✅      |
| `lucide-react-native`            | Iconografía               | ⚠️      |
| `react-native-safe-area-context` | SafeAreaView              | ⚠️      |

### Estructura Visual

```
┌──────────────────────────────────┐
│   HEADER                         │
│   Directorio                     │
│   X personas disponibles         │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│   SEARCH BAR           [Filter]  │
│   [🔍] Buscar por nombre...      │
└──────────────────────────────────┘
┌──────────────────────────────────┐ (Condicional)
│   FILTERS (si showFilters=true)  │
│   Categoría: [Chips...]          │
│   Zona: [Chips...]               │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│   PERSON CARD                    │
│   ┌────────────────────────────┐ │
│   │ Nombre Apellido       [🟢] │ │
│   │ Rol | Empresa             │ │
│   │ [Categoría] [Zona]        │ │
│   │                            │ │
│   │ email@example.com          │ │
│   │ +52 123 456 7890           │ │
│   │ Ciudad, Estado             │ │
│   │                            │ │
│   │ [Llamar] [WhatsApp] [Email]│ │
│   │ [Chat] [Solicitud]         │ │
│   └────────────────────────────┘ │
└──────────────────────────────────┘
(FlatList con virtualización)
```

---

## ⚙️ Funciones y Variables

### Variables de Estado

| Variable            | Tipo           | Inicial   | Descripción                      | Persistencia |
| ------------------- | -------------- | --------- | -------------------------------- | ------------ |
| `personnel`         | `User[]`       | `[]`      | Lista completa de usuarios de BD | Runtime      |
| `filteredPersonnel` | `User[]`       | `[]`      | Lista filtrada para mostrar      | Computed     |
| `searchQuery`       | `string`       | `''`      | Texto de búsqueda                | Runtime      |
| `selectedCategory`  | `string`       | `'Todos'` | Categoría seleccionada           | Runtime      |
| `selectedZone`      | `string`       | `'Todas'` | Zona seleccionada                | Runtime      |
| `showFilters`       | `boolean`      | `false`   | Toggle de filtros avanzados      | Runtime      |
| `loading`           | `boolean`      | `true`    | Estado de carga inicial          | Runtime      |
| `error`             | `string\|null` | `null`    | Mensaje de error                 | Runtime      |

### Constantes de Configuración

#### categories

```typescript
const categories = [
  'Todos', // Opción por defecto
  'Agentes de venta', // Filtro específico
  'Servicio al Cliente', // Filtro específico
  'Soporte Técnico', // Filtro específico
];

// Mapea a: users.categoria
```

#### zones

```typescript
const zones = [
  'Todas', // Opción por defecto
  'Norte', // Mapea a users.zona
  'Sur',
  'Centro',
  'Este',
  'Oeste',
];
```

---

### Funciones Principales

#### 1. **loadPersonnel()**

```typescript
Propósito: Cargar todos los usuarios activos desde Supabase
Flujo:
  1. setLoading(true)
  2. Query Supabase:
     SELECT * FROM users
     WHERE activo = true
     ORDER BY nombre ASC
  3. Filtrar currentUser del resultado
  4. setPersonnel(filteredData)
  5. setLoading(false)

Manejo de Errores:
  - Captura error de Supabase
  - setError(message)
  - console.error logs

Ejecutada en:
  - useEffect[] (mount)
```

#### 2. **applyFilters()**

```typescript
Propósito: Aplicar filtros de búsqueda y categorías
Entrada: Usa states (searchQuery, selectedCategory, selectedZone)
Salida: setFilteredPersonnel(result)

Algoritmo:
  1. Iniciar con personnel completo
  2. Si searchQuery no vacío:
     - Filtrar por nombre completo (ilike)
     - Filtrar por email (ilike)
     - Filtrar por empresa (ilike)
  3. Si selectedCategory != 'Todos':
     - Filtrar por users.categoria === selectedCategory
  4. Si selectedZone != 'Todas':
     - Filtrar por users.zona === selectedZone
  5. Retornar filtered array

Ejecutada en:
  - useEffect([personnel, searchQuery, selectedCategory, selectedZone])
```

#### 3. **getFullName(person: User)**

```typescript
Propósito: Construir nombre completo
Entrada: User object
Salida: string - "Nombre Apellido_Paterno Apellido_Materno"

Código:
  return `${person.nombre} ${person.apellido_paterno} ${person.apellido_materno}`.trim();
```

#### 4. **handleCall(phoneNumber: string)**

```typescript
Propósito: Iniciar llamada telefónica
Entrada: phoneNumber - string con formato libre
Salida: Abre dialer del dispositivo

Flujo:
  1. Construir URL: `tel:${phoneNumber}`
  2. Linking.canOpenURL(url)
  3. Si soportado: Linking.openURL(url)
  4. Si no: Alert.alert('Error', 'No se puede realizar la llamada')

Plataformas:
  - iOS: Abre Phone app
  - Android: Abre Dialer
  - Web: No soportado (mostrar error)
```

#### 5. **handleEmail(email: string)**

```typescript
Propósito: Abrir cliente de email
Entrada: email - dirección de correo
Salida: Abre mail client

Flujo:
  1. Construir URL: `mailto:${email}`
  2. Linking.canOpenURL(url)
  3. Si soportado: Linking.openURL(url)
  4. Si no: Alert.alert('Error', 'No se puede abrir el cliente de correo')

Comportamiento:
  - iOS: Abre Mail app
  - Android: Muestra selector de apps de email
  - Web: Abre cliente por defecto
```

#### 6. **handleWhatsApp(phoneNumber: string)**

```typescript
Propósito: Abrir chat de WhatsApp
Entrada: phoneNumber - puede tener formato
Salida: Abre WhatsApp con el contacto

Flujo:
  1. Limpiar número: phoneNumber.replace(/\D/g, '') // Solo dígitos
  2. Construir URL: `whatsapp://send?phone=${cleanPhone}`
  3. Linking.canOpenURL(url)
  4. Si soportado: Linking.openURL(url)
  5. Si no: Alert.alert('Error', 'WhatsApp no está instalado')

Formato Esperado:
  - Input: "+52 123 456 7890" o "1234567890"
  - Output URL: "whatsapp://send?phone=521234567890"
```

#### 7. **handleStartChat(person: User)**

```typescript
Propósito: Iniciar chat interno con el usuario
Entrada: person - User object
Salida: Navegación a pantalla de chat

Flujo:
  1. Llamar createChatRoom(person.id, getFullName(person))
  2. Obtener roomId
  3. router.push(`/chat/${roomId}`)
  4. Enviar notificación de demo
  5. Catch error: Alert.alert('Error', 'No se pudo iniciar el chat')

Interacción con Hooks:
  - useChat().createChatRoom() → Crea registro en chat_rooms
  - useNotifications().sendDemoNotification() → Muestra toast
```

#### 8. **handleSendRequest(person: User)**

```typescript
Propósito: Navegar a crear solicitud con agente pre-seleccionado
Entrada: person - User object
Salida: Navegación a /requests con params

Flujo:
  router.push({
    pathname: '/(tabs)/requests',
    params: { selectedAgent: person.id.toString() }
  });

Recepción en Requests:
  - Lee param selectedAgent
  - Pre-selecciona agente en formulario
```

---

### Funciones de Utilidad

#### getCategoryColor(category: string)

```typescript
Propósito: Asignar color a badge de categoría
Mapeo:
  'Agentes de venta' → '#3b82f6' (azul)
  'Servicio al Cliente' → '#10b981' (verde)
  'Soporte Técnico' | 'Soporte' → '#f59e0b' (naranja)
  default → '#6b7280' (gris)

Usado en: CategoryBadge backgroundColor
```

#### getRoleDisplayName(rol: string)

```typescript
Propósito: Traducir rol a texto legible
Mapeo:
  'admin' → 'Administrador'
  'agent' → 'Agente'
  'customer' → 'Cliente'
  default → 'Usuario'

Usado en: Texto de rol en PersonCard
```

---

## 🗄️ Base de Datos

### Tablas Consultadas

#### 1. **users** (Principal)

**Query Principal**:

```sql
SELECT *
FROM users
WHERE activo = true
ORDER BY nombre ASC;
```

**Campos Utilizados en UI**:

| Campo DB             | Tipo     | Uso en UI                | Ejemplo                    |
| -------------------- | -------- | ------------------------ | -------------------------- |
| `id`                 | uuid     | Identificador único      | `43fdc40e-ca9a-...`        |
| `nombre`             | varchar  | Nombre en card           | `"Carlos"`                 |
| `apellido_paterno`   | varchar  | Apellido en card         | `"Rosales"`                |
| `apellido_materno`   | varchar  | Apellido en card         | `"García"`                 |
| `correo_electronico` | varchar  | Email en card + contacto | `"c.rosales@elmec.com.mx"` |
| `celular`            | varchar  | Teléfono + WhatsApp      | `"+52 123 456 7890"`       |
| `ciudad`             | varchar  | Ubicación                | `"Monterrey"`              |
| `estado`             | varchar  | Ubicación                | `"Nuevo León"`             |
| `empresa`            | varchar  | Info de la card          | `"ELMEC"`                  |
| `rol`                | enum     | Badge de rol             | `'agent'`                  |
| `categoria`          | varchar? | Badge + Filtro           | `"Agentes de venta"`       |
| `zona`               | varchar? | Badge + Filtro           | `"Norte"`                  |
| `is_online`          | boolean  | Indicador verde          | `true`/`false`             |
| `activo`             | boolean  | Filtro WHERE             | `true`                     |

**Relaciones**:

- Ninguna en esta vista (select flat)

---

### Relación Detallada UI ↔ Base de Datos

| Elemento UI       | Query                                               | Campo(s)                                            | Transformación                        |
| ----------------- | --------------------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| Nombre completo   | `SELECT nombre, apellido_paterno, apellido_materno` | `${nombre} ${apellido_paterno} ${apellido_materno}` | `getFullName()`                       |
| Email clickeable  | `SELECT correo_electronico`                         | Directa                                             | `mailto:${correo_electronico}`        |
| Teléfono (Llamar) | `SELECT celular`                                    | Directa                                             | `tel:${celular}`                      |
| WhatsApp          | `SELECT celular`                                    | Limpiar formato                                     | `whatsapp://send?phone=${cleanPhone}` |
| Ubicación         | `SELECT ciudad, estado`                             | Concatenar                                          | `${ciudad}, ${estado}`                |
| Badge Categoría   | `SELECT categoria`                                  | Directa + color                                     | `getCategoryColor(categoria)`         |
| Badge Zona        | `SELECT zona`                                       | Directa                                             | Con icono MapPin                      |
| Indicador online  | `SELECT is_online`                                  | Boolean → componente                                | Círculo verde/gris                    |
| Filtro Categoría  | `WHERE categoria = ?`                               | Comparación                                         | `selectedCategory`                    |
| Filtro Zona       | `WHERE zona = ?`                                    | Comparación                                         | `selectedZone`                        |
| Búsqueda texto    | `WHERE nombre ILIKE '%q%'`                          | Texto parcial                                       | `searchQuery.toLowerCase()`           |

---

## 🔄 Flujo de Datos

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────┐
│                    COMPONENT MOUNT                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              useEffect[] → loadPersonnel()               │
│              setLoading(true)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         SUPABASE QUERY                                   │
│    .from('users')                                        │
│    .select('*')                                          │
│    .eq('activo', true)                                   │
│    .order('nombre', {ascending: true})                   │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────┐           ┌──────────┐
    │ SUCCESS │           │  ERROR   │
    └────┬────┘           └────┬─────┘
         │                     │
         │                     ▼
         │              setError(msg)
         │              setLoading(false)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│    Filter out currentUser                                │
│    filteredData = data.filter(p => p.id !== user.id)    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         setPersonnel(filteredData)
         setLoading(false)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│   useEffect([personnel, ...]) → applyFilters()          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              APPLY FILTERS LOGIC                         │
│   1. Start with personnel                                │
│   2. Filter by searchQuery (nombre/email/empresa)        │
│   3. Filter by selectedCategory                          │
│   4. Filter by selectedZone                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         setFilteredPersonnel(result)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              RENDER FLATLIST                             │
│   data={filteredPersonnel}                               │
│   renderItem={PersonCard}                                │
│   + Virtualización optimizada                            │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Interacción del Usuario

```
Usuario → Acción                    Sistema → Respuesta
══════════════════════════════════════════════════════════
Toca campo búsqueda      →     Focus input, mostrar teclado
Escribe texto            →     onChange → setSearchQuery
                                useEffect → applyFilters()
                                Re-render FlatList

Toca botón Filtro        →     setShowFilters(!showFilters)
                                Mostrar/ocultar chips

Toca chip Categoría      →     setSelectedCategory(value)
                                useEffect → applyFilters()
                                Re-render FlatList

Toca chip Zona           →     setSelectedZone(value)
                                useEffect → applyFilters()
                                Re-render FlatList

Toca [Llamar]            →     handleCall(celular)
                                Linking.openURL('tel:...')
                                Abre dialer nativo

Toca [WhatsApp]          →     handleWhatsApp(celular)
                                Linking.openURL('whatsapp:...')
                                Abre WhatsApp app

Toca [Email]             →     handleEmail(email)
                                Linking.openURL('mailto:...')
                                Abre cliente email

Toca [Chat]              →     handleStartChat(person)
                                createChatRoom() → roomId
                                router.push(`/chat/${roomId}`)
                                Navega a pantalla chat

Toca [Solicitud]         →     handleSendRequest(person)
                                router.push('/requests', {params})
                                Navega con agente pre-seleccionado
```

---

## 📖 Casos de Uso

### CU-DIR-01: Cargar Directorio de Personal

**Actor**: Usuario autenticado

**Precondiciones**:

- Usuario autenticado con sesión válida
- Tabla `users` contiene registros

**Flujo Principal**:

1. Usuario navega a `/directory`
2. Sistema ejecuta `loadPersonnel()`
3. Sistema consulta Supabase:
   ```sql
   SELECT * FROM users WHERE activo = true ORDER BY nombre ASC
   ```
4. Sistema recibe array de usuarios
5. Sistema filtra usuario actual del array
6. Sistema guarda en `setPersonnel(filteredData)`
7. Sistema ejecuta `applyFilters()` automáticamente
8. Sistema renderiza lista en FlatList

**Postcondiciones**:

- `personnel` contiene todos los usuarios activos excepto el actual
- `filteredPersonnel` contiene el mismo array inicialmente
- Lista visible en pantalla
- `loading = false`

**Flujos Alternativos**:

- **3a. Error de conexión**: Sistema muestra mensaje de error y botón "Reintentar"
- **4a. No hay usuarios**: Sistema muestra estado vacío con mensaje

---

### CU-DIR-02: Buscar Usuario por Nombre

**Actor**: Usuario

**Precondiciones**:

- Directorio cargado (`personnel.length > 0`)
- Usuario en pantalla Directory

**Flujo Principal**:

1. Usuario toca campo de búsqueda
2. Sistema muestra teclado
3. Usuario escribe texto (ej: "Carlos")
4. Sistema ejecuta `setSearchQuery("Carlos")` en cada keystroke
5. `useEffect` detecta cambio en `searchQuery`
6. Sistema ejecuta `applyFilters()`
7. Sistema filtra `personnel` donde:
   - `nombre.toLowerCase().includes("carlos")` OR
   - `email.toLowerCase().includes("carlos")` OR
   - `empresa.toLowerCase().includes("carlos")`
8. Sistema actualiza `setFilteredPersonnel(result)`
9. FlatList re-renderiza con resultados filtrados

**Postcondiciones**:

- Solo usuarios que coinciden con búsqueda son visibles
- Contador actualizado: "X personas disponibles"
- Si no hay resultados: mostrar estado vacío

**Variantes**:

- Usuario puede buscar por email completo
- Usuario puede buscar por empresa
- Búsqueda es case-insensitive

---

### CU-DIR-03: Filtrar por Categoría

**Actor**: Usuario

**Precondiciones**:

- Directorio cargado
- Filtros visibles (`showFilters = true`)

**Flujo Principal**:

1. Usuario toca botón [Filter]
2. Sistema muestra `setShowFilters(true)`
3. Sistema renderiza chips de categorías
4. Usuario toca chip "Agentes de venta"
5. Sistema ejecuta `setSelectedCategory("Agentes de venta")`
6. `useEffect` detecta cambio
7. Sistema ejecuta `applyFilters()`
8. Sistema filtra donde `person.categoria === "Agentes de venta"`
9. Sistema actualiza `filteredPersonnel`
10. Chip seleccionado cambia de estilo (backgroundColor azul)

**Postcondiciones**:

- Solo usuarios de la categoría seleccionada visibles
- Chip activo destacado visualmente
- Otros filtros se mantienen activos

**Flujo Alternativo**:

- **4a. Usuario toca "Todos"**: Sistema limpia filtro de categoría

---

### CU-DIR-04: Realizar Llamada Telefónica

**Actor**: Usuario

**Precondiciones**:

- Directorio cargado
- Usuario seleccionado tiene `celular` válido
- Dispositivo soporta llamadas

**Flujo Principal**:

1. Usuario visualiza PersonCard de "Carlos Rosales"
2. Usuario toca botón [Llamar]
3. Sistema ejecuta `handleCall(person.celular)`
4. Sistema construye URL: `tel:+521234567890`
5. Sistema ejecuta `Linking.canOpenURL(url)`
6. Sistema verifica soporte: true
7. Sistema ejecuta `Linking.openURL(url)`
8. Sistema operativo abre dialer con número pre-cargado
9. Usuario confirma llamada en dialer

**Postcondiciones**:

- App permanece en segundo plano
- Llamada iniciada en Phone app nativa

**Flujos Alternativos**:

- **6a. No soportado (Web)**: Alert "No se puede realizar la llamada"
- **8a. Usuario cancela**: Vuelve a la app

---

### CU-DIR-05: Enviar Mensaje por WhatsApp

**Actor**: Usuario

**Precondiciones**:

- WhatsApp instalado en dispositivo
- Usuario seleccionado tiene `celular` válido

**Flujo Principal**:

1. Usuario toca botón [WhatsApp] en PersonCard
2. Sistema ejecuta `handleWhatsApp(person.celular)`
3. Sistema limpia número: `celular.replace(/\D/g, '')`
   - Input: "+52 123 456 7890"
   - Output: "521234567890"
4. Sistema construye URL: `whatsapp://send?phone=521234567890`
5. Sistema ejecuta `Linking.canOpenURL(url)`
6. Si soportado: Sistema abre WhatsApp
7. WhatsApp abre chat con el contacto
8. Usuario puede escribir mensaje

**Postcondiciones**:

- WhatsApp abierto con contacto
- App ELMEC en segundo plano

**Flujos Alternativos**:

- **5a. WhatsApp no instalado**: Alert "WhatsApp no está instalado"
- **3a. Número inválido**: Puede fallar silenciosamente en WhatsApp

---

### CU-DIR-06: Iniciar Chat Interno

**Actor**: Usuario

**Precondiciones**:

- Directorio cargado
- Usuario seleccionado existe
- Sistema de chat configurado

**Flujo Principal**:

1. Usuario toca botón [Chat] en PersonCard de "Ana García"
2. Sistema ejecuta `handleStartChat(person)`
3. Sistema llama `createChatRoom(person.id, "Ana García")`
4. Hook useChat verifica si existe sala con estos participantes
5. Si existe: retorna `roomId` existente
6. Si no existe:
   - Crea registro en tabla `chat_rooms`
   - participants: `[currentUser.id, person.id]`
   - metadata: `{participant_names: ["Usuario Actual", "Ana García"]}`
   - retorna nuevo `roomId`
7. Sistema ejecuta `router.push(`/chat/${roomId}`)`
8. Sistema navega a pantalla de chat
9. Sistema envía notificación demo: "Chat iniciado con Ana García"

**Postcondiciones**:

- Usuario en pantalla de chat
- Sala creada o reutilizada en BD
- Notificación toast mostrada

**Flujos Alternativos**:

- **6a. Error creando sala**: Alert "No se pudo iniciar el chat"

---

### CU-DIR-07: Crear Solicitud con Agente Pre-seleccionado

**Actor**: Usuario (Customer)

**Precondiciones**:

- Usuario es customer
- Agente seleccionado tiene `rol = 'agent'`

**Flujo Principal**:

1. Usuario visualiza agente "Carlos Rosales"
2. Usuario toca botón [Solicitud]
3. Sistema ejecuta `handleSendRequest(person)`
4. Sistema navega a `/(tabs)/requests` con params:
   ```typescript
   {
     pathname: '/(tabs)/requests',
     params: { selectedAgent: person.id.toString() }
   }
   ```
5. Pantalla Requests recibe param `selectedAgent`
6. Formulario de nueva solicitud abre con modal
7. Agente "Carlos Rosales" pre-seleccionado en dropdown

**Postcondiciones**:

- Usuario en pantalla Requests
- Modal de nueva solicitud abierto
- Campo agente pre-lleno

---

## ✅ Matriz de Pruebas

### Matriz de Pruebas Funcionales - Carga de Datos

| ID      | Caso de Prueba                 | Precondición                              | Pasos                   | Resultado Esperado                         | Prioridad | Estado |
| ------- | ------------------------------ | ----------------------------------------- | ----------------------- | ------------------------------------------ | --------- | ------ |
| DIR-F01 | Cargar directorio exitosamente | BD tiene usuarios activos                 | 1. Navegar a /directory | Lista de usuarios visible, loading=false   | Alta      | ⬜     |
| DIR-F02 | Filtrar usuario actual         | Usuario logged: id=123                    | 1. Cargar directorio    | Usuario 123 NO aparece en lista            | Alta      | ⬜     |
| DIR-F03 | Ordenar por nombre ASC         | BD tiene usuarios desordenados            | 1. Cargar directorio    | Usuarios ordenados A-Z por nombre          | Media     | ⬜     |
| DIR-F04 | Manejar directorio vacío       | BD sin usuarios activos (excepto current) | 1. Cargar directorio    | Estado vacío: "No hay personal disponible" | Media     | ⬜     |
| DIR-F05 | Manejar error de conexión      | BD no disponible                          | 1. Cargar directorio    | Error visible, botón "Reintentar"          | Alta      | ⬜     |
| DIR-F06 | Reintentar carga tras error    | Error previo                              | 1. Tocar "Reintentar"   | Nueva consulta a BD, loading visible       | Media     | ⬜     |

### Matriz de Pruebas Funcionales - Búsqueda

| ID      | Caso de Prueba             | Entrada                  | Resultado Esperado                                | Prioridad | Estado |
| ------- | -------------------------- | ------------------------ | ------------------------------------------------- | --------- | ------ |
| DIR-S01 | Buscar por nombre completo | "Carlos Rosales"         | Solo usuarios con nombre/apellido matching        | Alta      | ⬜     |
| DIR-S02 | Buscar por nombre parcial  | "Car"                    | Usuarios con "Car" en nombre: Carlos, Carla, etc. | Alta      | ⬜     |
| DIR-S03 | Buscar por email completo  | "c.rosales@elmec.com.mx" | Usuario con ese email exacto                      | Alta      | ⬜     |
| DIR-S04 | Buscar por email parcial   | "rosales"                | Usuarios con "rosales" en email                   | Media     | ⬜     |
| DIR-S05 | Buscar por empresa         | "ELMEC"                  | Todos usuarios de empresa ELMEC                   | Media     | ⬜     |
| DIR-S06 | Búsqueda case-insensitive  | "CARLOS" o "carlos"      | Ambos retornan mismo resultado                    | Alta      | ⬜     |
| DIR-S07 | Búsqueda sin resultados    | "XYZ999"                 | Estado vacío: "No se encontraron..."              | Media     | ⬜     |
| DIR-S08 | Limpiar búsqueda           | Escribir y borrar todo   | Mostrar lista completa de nuevo                   | Baja      | ⬜     |

### Matriz de Pruebas Funcionales - Filtros

| ID        | Caso de Prueba                 | Acción                           | Resultado Esperado                             | Prioridad | Estado |
| --------- | ------------------------------ | -------------------------------- | ---------------------------------------------- | --------- | ------ |
| DIR-FIL01 | Abrir panel de filtros         | Tocar botón [Filter]             | Chips de categoría y zona visibles             | Media     | ⬜     |
| DIR-FIL02 | Filtrar por categoría: Agentes | Seleccionar "Agentes de venta"   | Solo agentes visibles, chip activo azul        | Alta      | ⬜     |
| DIR-FIL03 | Filtrar por categoría: Soporte | Seleccionar "Soporte Técnico"    | Solo soporte visibles                          | Alta      | ⬜     |
| DIR-FIL04 | Filtrar por zona: Norte        | Seleccionar "Norte"              | Solo usuarios zona Norte                       | Alta      | ⬜     |
| DIR-FIL05 | Combinar filtros               | Categoría: Agentes + Zona: Norte | Solo agentes del Norte                         | Alta      | ⬜     |
| DIR-FIL06 | Resetear categoría             | Seleccionar "Todos"              | Todos usuarios visibles (respetando zona)      | Media     | ⬜     |
| DIR-FIL07 | Resetear zona                  | Seleccionar "Todas"              | Todos usuarios visibles (respetando categoría) | Media     | ⬜     |
| DIR-FIL08 | Búsqueda + filtros             | Buscar "Carlos" + Cat: Agentes   | Solo Carlos que son agentes                    | Alta      | ⬜     |

### Matriz de Pruebas Funcionales - Acciones de Contacto

| ID      | Caso de Prueba             | Acción                        | Resultado Esperado                                 | Plataforma  | Estado |
| ------- | -------------------------- | ----------------------------- | -------------------------------------------------- | ----------- | ------ |
| DIR-C01 | Llamada exitosa            | Tocar [Llamar]                | Dialer abierto con número                          | iOS/Android | ⬜     |
| DIR-C02 | Llamada no soportada       | Tocar [Llamar] en Web         | Alert "No se puede realizar la llamada"            | Web         | ⬜     |
| DIR-C03 | Email exitoso              | Tocar [Email]                 | Cliente email abierto con destinatario             | All         | ⬜     |
| DIR-C04 | WhatsApp con app instalada | Tocar [WhatsApp]              | WhatsApp abierto con contacto                      | iOS/Android | ⬜     |
| DIR-C05 | WhatsApp sin app           | Tocar [WhatsApp] sin WhatsApp | Alert "WhatsApp no está instalado"                 | iOS/Android | ⬜     |
| DIR-C06 | Chat - crear sala nueva    | Tocar [Chat], sin sala previa | Sala creada, navegación a /chat/{roomId}           | All         | ⬜     |
| DIR-C07 | Chat - reutilizar sala     | Tocar [Chat], sala existe     | Navegación a sala existente                        | All         | ⬜     |
| DIR-C08 | Solicitud con agente       | Tocar [Solicitud]             | Navegación a /requests con agente pre-seleccionado | All         | ⬜     |

### Matriz de Pruebas de Integración

| ID      | Componente A | Componente B     | Caso                | Resultado Esperado                       | Estado |
| ------- | ------------ | ---------------- | ------------------- | ---------------------------------------- | ------ |
| DIR-I01 | Directory    | Supabase users   | Consulta inicial    | Datos cargados correctamente             | ⬜     |
| DIR-I02 | Directory    | AuthContext      | Obtener currentUser | Usuario actual excluido de lista         | ⬜     |
| DIR-I03 | Directory    | useChat hook     | Crear sala          | Registro en chat_rooms, roomId retornado | ⬜     |
| DIR-I04 | Directory    | expo-router      | Navegación          | Transición correcta a pantallas          | ⬜     |
| DIR-I05 | Directory    | Linking API      | Llamada telefónica  | Dialer abierto (plataforma soportada)    | ⬜     |
| DIR-I06 | Directory    | useNotifications | Demo toast          | Notificación mostrada tras acción        | ⬜     |

### Matriz de Pruebas de UI/UX

| ID      | Elemento         | Criterio      | Verificación                             | Estado |
| ------- | ---------------- | ------------- | ---------------------------------------- | ------ |
| DIR-U01 | PersonCard       | Legibilidad   | Nombre visible en Inter-SemiBold 18px    | ⬜     |
| DIR-U02 | Search input     | Accesibilidad | Altura mínima 48px, área táctil adecuada | ⬜     |
| DIR-U03 | Badges categoría | Contraste     | Texto legible en fondo de color          | ⬜     |
| DIR-U04 | Online indicator | Visibilidad   | Círculo verde 8x8px visible              | ⬜     |
| DIR-U05 | Action buttons   | Touch target  | Mínimo 44x44px táctil                    | ⬜     |
| DIR-U06 | FlatList         | Performance   | Scroll fluido sin lag con 100+ items     | ⬜     |
| DIR-U07 | Filter chips     | Feedback      | Cambio visual inmediato al seleccionar   | ⬜     |
| DIR-U08 | Loading state    | UX            | Spinner centrado con mensaje             | ⬜     |
| DIR-U09 | Empty state      | Guidance      | Mensaje claro y accionable               | ⬜     |
| DIR-U10 | Error state      | Recovery      | Botón "Reintentar" visible y funcional   | ⬜     |

### Matriz de Pruebas de Performance

| ID      | Escenario               | Métrica                  | Valor Esperado     | Herramienta      | Estado |
| ------- | ----------------------- | ------------------------ | ------------------ | ---------------- | ------ |
| DIR-P01 | Carga inicial           | Tiempo hasta interactive | < 500ms            | React DevTools   | ⬜     |
| DIR-P02 | Búsqueda en tiempo real | Latencia por keystroke   | < 16ms (60fps)     | Performance API  | ⬜     |
| DIR-P03 | Aplicar filtros         | Tiempo de re-render      | < 100ms            | React DevTools   | ⬜     |
| DIR-P04 | Scroll en lista larga   | FPS                      | > 50fps constante  | Flipper/DevTools | ⬜     |
| DIR-P05 | Virtualización FlatList | Items renderizados       | <= windowSize (10) | Console.log      | ⬜     |
| DIR-P06 | Memory usage            | Heap size                | < 50MB incremento  | Memory Profiler  | ⬜     |

---

## 🐛 Problemas Conocidos y Limitaciones

### Limitaciones Actuales

1. **No hay Paginación**
   - ⚠️ Carga TODOS los usuarios activos en una sola query
   - Con 1000+ usuarios, puede causar lag
   - FlatList virtualiza, pero data inicial grande

2. **Búsqueda Solo Client-Side**
   - ⚠️ Filtrado ocurre en frontend sobre array completo
   - No usa Supabase full-text search
   - Limitado a campos específicos (nombre, email, empresa)

3. **Sin Actualización Realtime de Presencia**
   - ⚠️ `is_online` se carga al mount
   - No hay subscripción a cambios
   - Indicador puede estar desactualizado

4. **Linking APIs No Funcionan en Web**
   - ⚠️ `tel:`, `whatsapp://`, `mailto:` limitados en web
   - Mostrará alerts de error
   - No hay fallback para web

5. **Sin Caché de Datos**
   - Cada vez que se navega a Directory, se recarga desde BD
   - No persiste búsqueda/filtros al salir y volver
   - `personnel` se resetea

6. **PersonCard No es Memoizado Completamente**
   - Aunque usa `React.memo`, hay props que cambian
   - `onCall`, `onMessage` son nuevas funciones en cada render
   - Puede causar re-renders innecesarios

### Mejoras Recomendadas

#### 🔴 Prioridad Alta

**1. Implementar Paginación y Lazy Loading**

```typescript
// Cargar 20 usuarios a la vez
const PAGE_SIZE = 20;
const [page, setPage] = useState(0);

const loadMore = async () => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    .order('nombre');

  setPersonnel(prev => [...prev, ...data]);
  setPage(prev => prev + 1);
};

// En FlatList
<FlatList
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

**2. Implementar Búsqueda Server-Side**

```typescript
// Usar Supabase full-text search
const searchUsers = async (query: string) => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .or(`nombre.ilike.%${query}%,correo_electronico.ilike.%${query}%`)
    .limit(50);
};
```

**3. Suscripción Realtime a Presencia**

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('online-users')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `is_online=eq.true`,
      },
      payload => {
        // Actualizar is_online en personnel
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

#### 🟡 Prioridad Media

**4. Memoizar Callbacks**

```typescript
const handleCall = useCallback((phoneNumber: string) => {
  // ... lógica
}, []);

const handleWhatsApp = useCallback((phoneNumber: string) => {
  // ... lógica
}, []);

// Previene re-renders de PersonCard
```

**5. Agregar Caché con React Query**

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: personnel } = useQuery({
  queryKey: ['users', 'directory'],
  queryFn: loadPersonnel,
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

**6. Fallback para Web en Linking**

```typescript
const handleCall = (phone: string) => {
  if (Platform.OS === 'web') {
    // Copiar al clipboard
    Clipboard.setString(phone);
    Alert.alert('Número copiado', `${phone} copiado al portapapeles`);
  } else {
    Linking.openURL(`tel:${phone}`);
  }
};
```

#### 🟢 Prioridad Baja

7. **Persistir Filtros en AsyncStorage**
8. **Agregar Pull-to-Refresh**
9. **Implementar Skeleton Screens**
10. **Agregar Analytics de búsquedas populares**

---

## 📊 Métricas de Calidad

| Métrica                     | Valor Actual | Objetivo | Estado |
| --------------------------- | ------------ | -------- | ------ |
| Cobertura de Pruebas        | 0%           | 80%      | 🔴     |
| Consultas BD Optimizadas    | 1/1 (100%)   | 100%     | 🟢     |
| Tiempo de Carga (50 users)  | ~200ms       | < 500ms  | 🟢     |
| Tiempo de Carga (500 users) | ~1s          | < 1s     | 🟡     |
| FPS en Scroll               | ~55fps       | > 50fps  | 🟢     |
| Errores en Producción       | No medido    | < 0.1%   | ⚠️     |
| Accesibilidad Score         | No medido    | WCAG AA  | 🟡     |

---

## 📝 Notas para QA

### Checklist Completo de Pruebas Manuales

#### Carga Inicial

- [ ] Spinner visible al cargar
- [ ] Contador de personas actualizado
- [ ] Lista ordenada alfabéticamente
- [ ] Usuario actual NO aparece en lista
- [ ] Todos los campos de PersonCard visibles

#### Búsqueda

- [ ] Búsqueda por nombre funciona
- [ ] Búsqueda por apellido funciona
- [ ] Búsqueda por email funciona
- [ ] Búsqueda por empresa funciona
- [ ] Búsqueda case-insensitive
- [ ] Resultados se actualizan en tiempo real
- [ ] Sin resultados muestra estado vacío

#### Filtros

- [ ] Botón filtro abre/cierra panel
- [ ] Chips de categoría visibles
- [ ] Chips de zona visibles
- [ ] Selección de categoría filtra correctamente
- [ ] Selección de zona filtra correctamente
- [ ] Combinar filtros funciona
- [ ] Reset a "Todos"/"Todas" funciona

#### Acciones de Contacto

- [ ] [Llamar] abre dialer (móvil)
- [ ] [Llamar] muestra error (web)
- [ ] [WhatsApp] abre WhatsApp (móvil)
- [ ] [WhatsApp] muestra error si no está instalado
- [ ] [Email] abre cliente de correo
- [ ] [Chat] navega a pantalla de chat
- [ ] [Chat] crea sala nueva si no existe
- [ ] [Chat] reutiliza sala si existe
- [ ] [Solicitud] navega a requests
- [ ] [Solicitud] pre-selecciona agente

#### UI/UX

- [ ] PersonCards tienen sombra sutil
- [ ] Badges de categoría tienen colores correctos
- [ ] Indicador online (verde) visible
- [ ] Indicador offline (gris) visible
- [ ] Iconos de Lucide renderizan correctamente
- [ ] Spacing consistente (24px horizontal)
- [ ] Scroll fluido sin lag

#### Estados Especiales

- [ ] Error de conexión muestra mensaje + "Reintentar"
- [ ] "Reintentar" recarga datos
- [ ] Sin usuarios muestra estado vacío
- [ ] Sin resultados de búsqueda muestra estado vacío

### Datos de Prueba Recomendados

**Usuarios para Crear en BD**:

```json
[
  {
    "nombre": "Carlos",
    "apellido_paterno": "Rosales",
    "categoria": "Agentes de venta",
    "zona": "Norte",
    "correo_electronico": "c.rosales@elmec.com.mx",
    "celular": "+52 81 1234 5678",
    "is_online": true
  },
  {
    "nombre": "Ana",
    "apellido_paterno": "García",
    "categoria": "Servicio al Cliente",
    "zona": "Sur",
    "correo_electronico": "a.garcia@elmec.com.mx",
    "celular": "+52 33 8765 4321",
    "is_online": false
  },
  {
    "nombre": "Luis",
    "apellido_paterno": "Martínez",
    "categoria": "Soporte Técnico",
    "zona": "Centro",
    "correo_electronico": "l.martinez@elmec.com.mx",
    "celular": "+52 55 9876 5432",
    "is_online": true
  }
]
```

### Escenarios de Prueba Específicos

#### Escenario 1: Búsqueda + Filtros Combinados

1. Cargar directorio completo (50+ usuarios)
2. Buscar "Carlos" → Verificar resultados
3. Aplicar filtro Categoría: "Agentes de venta"
4. Verificar que solo Carlos agentes aparecen
5. Aplicar filtro Zona: "Norte"
6. Verificar intersección correcta

#### Escenario 2: Flujo Completo de Contacto

1. Buscar usuario "Ana García"
2. Tocar [Chat] → Verificar navegación
3. Volver a Directory
4. Tocar [Chat] nuevamente → Verificar misma sala
5. Tocar [Email] → Verificar apertura de mail
6. Tocar [Solicitud] → Verificar pre-selección

#### Escenario 3: Performance con Datos Masivos

1. Insertar 500 usuarios en BD
2. Cargar Directory
3. Medir tiempo de carga inicial
4. Hacer scroll rápido
5. Verificar FPS > 50
6. Buscar usuario en posición 450
7. Medir tiempo de búsqueda

---

## 🔗 Enlaces Relacionados

- [Módulo Inicio](./01-MODULO-INICIO.md)
- [Módulo Solicitudes](./03-MODULO-SOLICITUDES.md)
- [Módulo Chat](./04-MODULO-CHAT.md)
- [Módulo Perfil](./05-MODULO-PERFIL.md)
- [useChat Hook Documentation](../HOOKS/useChat.md)
- [Database Schema - users table](../DATABASE/schema.md#users)
- [Supabase Service API](../SERVICES/supabaseService.md)

---

**Última Actualización**: 2025-10-14
**Versión**: 1.0.0
**Autor**: Equipo ELMEC
**Revisado por**: QA Team
