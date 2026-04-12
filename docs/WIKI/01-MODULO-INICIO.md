# MÓDULO 1: INICIO (HOME)

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

El módulo Inicio es la página principal de la aplicación ELMEC. Sirve como dashboard central donde los usuarios pueden:

- Ver información de su perfil
- Acceder rápidamente a funciones principales
- Visualizar actividad reciente
- Consultar estadísticas personales

### Ubicación

**Archivo**: `/app/(tabs)/index.tsx`
**Ruta**: `/` (dentro de tabs)
**Layout Padre**: `app/(tabs)/_layout.tsx`

### Rol de Usuario

- ✅ Disponible para: **Todos los roles** (customer, agent, admin)
- 🔒 No requiere permisos especiales

---

## 🏗️ Arquitectura del Módulo

### Componentes Principales

```typescript
// Componente Principal
export default function Home() {
  // Estado y contexto
  const { user } = useAuth();
  const router = useRouter();

  // Configuración de acciones rápidas
  const quickActions = [...];

  // Datos de actividad reciente (hardcoded demo)
  const recentActivity = [...];

  // Funciones de utilidad
  const getStatusIcon = (status: string) => {...};
  const getStatusText = (status: string) => {...};

  return <ScrollView>...</ScrollView>
}
```

### Dependencias

| Dependencia              | Propósito                     | Tipo       |
| ------------------------ | ----------------------------- | ---------- |
| `react`                  | Framework base                | Core       |
| `react-native`           | Componentes UI nativos        | Core       |
| `expo-linear-gradient`   | Gradientes en header          | UI         |
| `expo-router`            | Navegación                    | Navigation |
| `@/contexts/AuthContext` | Datos del usuario autenticado | Context    |
| `lucide-react-native`    | Iconografía                   | UI         |

### Estructura Visual

```
┌─────────────────────────────┐
│   LINEAR GRADIENT HEADER    │
│   ┌───────────────────┐     │
│   │ Saludo + Nombre   │     │
│   │ Empresa           │     │
│   │       [Avatar]    │     │
│   └───────────────────┘     │
└─────────────────────────────┘
┌─────────────────────────────┐
│   ACCESOS RÁPIDOS           │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │Direct││Nueva ││Calc. ││
│  │orio  ││Solic.││      ││
│  └──────┘ └──────┘ └──────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│   ACTIVIDAD RECIENTE        │
│  ┌─────────────────────────┐│
│  │ [Icon] Solicitud...     ││
│  │        Con: Agente      ││
│  │        Estado | Tiempo  ││
│  └─────────────────────────┘│
└─────────────────────────────┘
┌─────────────────────────────┐
│   ESTADÍSTICAS              │
│  ┌────┐  ┌────┐  ┌────┐    │
│  │ 5  │  │ 2  │  │ 12 │    │
│  │Sol.│  │Proc│  │Cont│    │
│  └────┘  └────┘  └────┘    │
└─────────────────────────────┘
```

---

## ⚙️ Funciones y Variables

### Variables de Estado

| Variable         | Tipo                  | Valor Inicial     | Descripción                       |
| ---------------- | --------------------- | ----------------- | --------------------------------- |
| `user`           | `User \| null`        | Desde AuthContext | Usuario autenticado actual        |
| `quickActions`   | `Array<ActionConfig>` | Constante         | Configuración de acciones rápidas |
| `recentActivity` | `Array<ActivityItem>` | Constante demo    | Actividad reciente del usuario    |

### Funciones Principales

#### 1. **getStatusIcon(status: string)**

```typescript
Propósito: Retorna el componente de icono según el estado
Entrada: status (string) - Estado de la solicitud/actividad
Salida: JSX.Element - Componente icono de Lucide
Casos:
  - 'en_proceso' → Clock (naranja)
  - 'resuelto'/'completado' → CheckCircle (verde)
  - default → AlertCircle (rojo)
```

#### 2. **getStatusText(status: string)**

```typescript
Propósito: Convierte el código de estado a texto legible
Entrada: status (string) - Código de estado
Salida: string - Texto en español
Mapeo:
  - 'en_proceso' → 'En proceso'
  - 'resuelto' → 'Resuelto'
  - 'completado' → 'Completado'
  - default → 'Pendiente'
```

### Configuraciones

#### quickActions

```typescript
interface QuickAction {
  title: string;         // "Directorio"
  description: string;   // "Buscar personal"
  icon: LucideIcon;     // Users
  color: string;        // "#3b82f6"
  route: string;        // "/directory"
}

Acciones Disponibles:
1. Directorio (Users, azul, /directory)
2. Nueva Solicitud (FileText, verde, /requests)
3. Calculadora (Calculator, naranja, /calculator)
```

#### recentActivity (Demo Data)

```typescript
interface ActivityItem {
  id: string;
  type: 'solicitud' | 'contacto';
  title: string;
  status: string;
  time: string;    // Relativo: "2 horas", "1 día"
  agent: string;   // Nombre del agente
}

Datos Hardcoded: 3 items de ejemplo
```

---

## 🗄️ Base de Datos

### Tablas Consultadas

#### 1. **users** (Indirecta via AuthContext)

```sql
SELECT * FROM users WHERE id = :current_user_id
```

**Campos Utilizados**:

- `nombre`: string - Nombre para saludo
- `apellido_paterno`: string - Apellido para saludo
- `empresa`: string - Mostrado en header
- Avatar: Iniciales derivadas de nombre + apellido_paterno

### Relación UI ↔ Base de Datos

| Elemento UI       | Tabla   | Campo                             | Formato                       |
| ----------------- | ------- | --------------------------------- | ----------------------------- |
| "¡Hola!" + Nombre | `users` | `nombre + apellido_paterno`       | `{nombre} {apellido_paterno}` |
| Empresa           | `users` | `empresa`                         | `{empresa}`                   |
| Iniciales Avatar  | `users` | `nombre[0] + apellido_paterno[0]` | `{N}{A}`                      |

### Datos No Persistidos

⚠️ **IMPORTANTE**: Los siguientes datos son **HARDCODED** y no vienen de la base de datos:

1. **Actividad Reciente**
   - Fuente: Variable local `recentActivity`
   - Estado: Estático, no se actualiza desde BD
   - Datos: 3 items de ejemplo

2. **Estadísticas**
   - Fuente: Valores hardcoded en el JSX
   - No conecta con tabla `requests` ni otras
   - Valores fijos: 5, 2, 12

---

## 🔄 Flujo de Datos

### Diagrama de Flujo

```
┌─────────────────┐
│  AuthContext    │
│  (user)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Home Component │
│  - user.nombre  │
│  - user.empresa │
└────────┬────────┘
         │
         ├─────────► quickActions (Const) ───► Botones de Acceso
         │
         ├─────────► recentActivity (Demo) ──► Lista Actividad
         │
         └─────────► Statistics (Hardcoded) ─► Cards Estadísticas
```

### Flujo de Navegación

```
Home (index.tsx)
  │
  ├─ Click "Directorio" ──► router.push('/directory')
  │
  ├─ Click "Nueva Solicitud" ──► router.push('/requests')
  │
  └─ Click "Calculadora" ──► router.push('/calculator')
```

---

## 📖 Casos de Uso

### CU-01: Visualizar Dashboard al Iniciar Sesión

**Actor**: Usuario autenticado (cualquier rol)

**Precondiciones**:

- Usuario debe estar autenticado
- Sesión válida en AuthContext

**Flujo Principal**:

1. Usuario inicia sesión correctamente
2. Sistema redirige a `/` (Home)
3. Sistema obtiene datos del usuario desde AuthContext
4. Sistema muestra header con nombre y empresa
5. Sistema muestra avatar con iniciales
6. Sistema renderiza 3 accesos rápidos
7. Sistema muestra actividad reciente (3 items demo)
8. Sistema muestra estadísticas (valores estáticos)

**Postcondiciones**:

- Dashboard completamente visible
- Usuario puede navegar a otros módulos

---

### CU-02: Navegar a Módulo desde Acceso Rápido

**Actor**: Usuario autenticado

**Precondiciones**:

- Usuario en pantalla Home
- Módulo destino existe y es accesible

**Flujo Principal**:

1. Usuario toca un botón de acceso rápido
2. Sistema detecta el evento `onPress`
3. Sistema ejecuta `router.push(action.route)`
4. Sistema navega a la ruta especificada

**Variantes**:

- Directorio → `/directory`
- Nueva Solicitud → `/requests`
- Calculadora → `/calculator`

**Postcondiciones**:

- Usuario en la nueva pantalla
- Navigation stack actualizado

---

### CU-03: Consultar Actividad Reciente

**Actor**: Usuario

**Precondiciones**:

- Usuario en pantalla Home
- Datos de actividad reciente cargados

**Flujo Principal**:

1. Usuario hace scroll al scroll a sección "Actividad Reciente"
2. Sistema muestra lista de 3 items
3. Para cada item, sistema muestra:
   - Icono de estado (getStatusIcon)
   - Título de la actividad
   - Agente asignado
   - Estado traducido (getStatusText)
   - Tiempo relativo

**Nota**: Los datos son estáticos y no reflejan actividad real

---

## ✅ Matriz de Pruebas

### Matriz de Pruebas Funcionales

| ID    | Caso de Prueba                      | Entrada                               | Resultado Esperado                      | Prioridad | Estado |
| ----- | ----------------------------------- | ------------------------------------- | --------------------------------------- | --------- | ------ |
| HM-01 | Cargar dashboard con usuario válido | Usuario autenticado                   | Dashboard visible con datos del usuario | Alta      | ⬜     |
| HM-02 | Mostrar nombre completo en header   | user.nombre + user.apellido_paterno   | Nombre completo visible                 | Alta      | ⬜     |
| HM-03 | Mostrar empresa en header           | user.empresa                          | Empresa "ELMEC" visible                 | Media     | ⬜     |
| HM-04 | Generar iniciales en avatar         | Nombre: "Carlos", Apellido: "Mendoza" | Avatar muestra "CM"                     | Media     | ⬜     |
| HM-05 | Renderizar 3 accesos rápidos        | quickActions array                    | 3 botones visibles                      | Alta      | ⬜     |
| HM-06 | Navegar a Directorio                | Click en "Directorio"                 | Navegación a /directory                 | Alta      | ⬜     |
| HM-07 | Navegar a Nueva Solicitud           | Click en "Nueva Solicitud"            | Navegación a /requests                  | Alta      | ⬜     |
| HM-08 | Navegar a Calculadora               | Click en "Calculadora"                | Navegación a /calculator                | Alta      | ⬜     |
| HM-09 | Mostrar actividad reciente          | recentActivity data                   | 3 items de actividad                    | Media     | ⬜     |
| HM-10 | Mostrar iconos de estado correctos  | status: 'en_proceso'                  | Icono Clock naranja                     | Baja      | ⬜     |
| HM-11 | Traducir estados correctamente      | status: 'resuelto'                    | Texto "Resuelto"                        | Baja      | ⬜     |
| HM-12 | Mostrar estadísticas                | Valores hardcoded                     | 5, 2, 12 visibles                       | Baja      | ⬜     |
| HM-13 | Scroll en contenido largo           | Scroll gesture                        | Contenido desplazable                   | Media     | ⬜     |
| HM-14 | Gradient en header                  | Carga visual                          | Colores #1e40af a #3b82f6               | Baja      | ⬜     |

### Matriz de Pruebas de Integración

| ID     | Integración | Dependencia         | Caso de Prueba               | Estado |
| ------ | ----------- | ------------------- | ---------------------------- | ------ |
| HM-I01 | AuthContext | user object         | Datos de usuario disponibles | ⬜     |
| HM-I02 | Router      | expo-router         | Navegación funcional         | ⬜     |
| HM-I03 | Icons       | lucide-react-native | Iconos se renderizan         | ⬜     |

### Matriz de Pruebas de UI/UX

| ID     | Elemento        | Criterio      | Verificación                         | Estado |
| ------ | --------------- | ------------- | ------------------------------------ | ------ |
| HM-U01 | Header gradient | Visual appeal | Degradado azul visible y atractivo   | ⬜     |
| HM-U02 | Avatar          | Legibilidad   | Iniciales claras en fondo azul       | ⬜     |
| HM-U03 | Quick actions   | Accesibilidad | Botones táctiles > 44x44 px          | ⬜     |
| HM-U04 | Activity cards  | Contraste     | Texto legible en fondo blanco        | ⬜     |
| HM-U05 | Spacing         | Consistencia  | Padding 24px horizontal consistente  | ⬜     |
| HM-U06 | Typography      | Legibilidad   | Fuentes Inter con tamaños apropiados | ⬜     |

---

## 🐛 Problemas Conocidos y Limitaciones

### Limitaciones Actuales

1. **Actividad Reciente NO es Dinámica**
   - ⚠️ Los datos son hardcoded en el componente
   - No se consulta la tabla `requests`
   - No refleja actividad real del usuario

2. **Estadísticas NO son Reales**
   - ⚠️ Valores fijos: 5, 2, 12
   - No hay consultas a base de datos
   - No reflejan estado actual del usuario

3. **Sin Actualización en Tiempo Real**
   - No hay subscripciones a cambios
   - No se actualiza al volver de otras pantallas

4. **Sin Estado de Carga**
   - No hay spinner mientras carga user data
   - Asume que AuthContext ya tiene datos

### Mejoras Recomendadas

#### 🔴 Prioridad Alta

1. **Conectar Actividad Reciente con BD**

   ```typescript
   // Reemplazar recentActivity hardcoded por:
   const [recentActivity, setRecentActivity] = useState([]);

   useEffect(() => {
     loadRecentActivity();
   }, [user]);

   const loadRecentActivity = async () => {
     const { data } = await supabase
       .from('requests')
       .select('*')
       .eq('usuario_id', user.id)
       .order('updated_at', { desc: true })
       .limit(3);
     setRecentActivity(data);
   };
   ```

2. **Conectar Estadísticas con BD**

   ```typescript
   // Agregar queries para estadísticas reales
   const [stats, setStats] = useState({ total: 0, inProgress: 0, contacts: 0 });

   useEffect(() => {
     loadStats();
   }, [user]);
   ```

#### 🟡 Prioridad Media

3. **Agregar Pull-to-Refresh**
4. **Agregar Skeleton Screens para carga**
5. **Implementar subscripciones Realtime para updates**

#### 🟢 Prioridad Baja

6. **Agregar animaciones de entrada**
7. **Permitir personalización de accesos rápidos**
8. **Agregar modo oscuro**

---

## 📊 Métricas de Calidad

| Métrica              | Valor Actual    | Objetivo | Estado |
| -------------------- | --------------- | -------- | ------ |
| Cobertura de Pruebas | 0%              | 80%      | 🔴     |
| Datos Dinámicos      | 20% (solo user) | 100%     | 🔴     |
| Tiempo de Carga      | < 100ms         | < 200ms  | 🟢     |
| Accesibilidad        | No medido       | WCAG AA  | 🟡     |
| Performance Score    | No medido       | > 90     | 🟡     |

---

## 📝 Notas para QA

### Checklist de Pruebas Manuales

- [ ] Verificar saludo personalizado con nombre del usuario
- [ ] Verificar que empresa se muestra correctamente
- [ ] Verificar que avatar muestra iniciales correctas
- [ ] Verificar que los 3 accesos rápidos son clickeables
- [ ] Verificar navegación a Directorio
- [ ] Verificar navegación a Nueva Solicitud
- [ ] Verificar navegación a Calculadora
- [ ] Verificar que actividad reciente muestra 3 items
- [ ] Verificar iconos de estado (Clock, CheckCircle, AlertCircle)
- [ ] Verificar traducciones de estados
- [ ] Verificar estadísticas muestran valores
- [ ] Verificar scroll funciona correctamente
- [ ] Verificar diseño responsive (diferentes tamaños)
- [ ] Verificar gradient en header

### Datos de Prueba

**Usuario de Prueba**:

```json
{
  "nombre": "Carlos",
  "apellido_paterno": "Rosales",
  "apellido_materno": "García",
  "empresa": "ELMEC",
  "correo_electronico": "c.rosales@elmec.com.mx"
}
```

**Credenciales**:

- Email: `c.rosales@elmec.com.mx`
- Password: `abc321`

---

## 🔗 Enlaces Relacionados

- [Módulo Directorio](./02-MODULO-DIRECTORIO.md)
- [Módulo Solicitudes](./03-MODULO-SOLICITUDES.md)
- [Módulo Chat](./04-MODULO-CHAT.md)
- [Módulo Perfil](./05-MODULO-PERFIL.md)
- [AuthContext Documentation](../CONTEXTS/AuthContext.md)
- [Database Schema](../DATABASE/schema.md)

---

**Última Actualización**: 2025-10-14
**Versión**: 1.0.0
**Autor**: Equipo ELMEC
**Revisado por**: QA Team
