# Documentación: Contador de Mensajes Sin Leer

**Fecha**: 2025-02-03
**Versión**: 1.0.0
**Archivos**: `contexts/ChatContext.tsx`, `app/(tabs)/_layout.tsx`

---

## 📋 **Tabla de Contenidos**

1. [Descripción General](#descripción-general)
2. [Lógica del Contador](#lógica-del-contador)
3. [Flujo de Datos](#flujo-de-datos)
4. [Implementación Técnica](#implementación-técnica)
5. [Casos de Uso](#casos-de-uso)
6. [Validación](#validación)
7. [Problemas Resueltos](#problemas-resueltos)

---

## 🎯 **Descripción General**

El contador de mensajes sin leer muestra en la barra de navegación (tab bar) un badge rojo con el número de mensajes que el usuario no ha leído. Este contador es crítico para la UX de chat, permitiendo a los usuarios identificar rápidamente cuando tienen mensajes pendientes.

### **Ubicación en la UI**

```
┌──────────────────────────────────────────────────────────┐
│  BARRA INFERIOR (TAB BAR)                               │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  🏠 INI  │ 👥 DIR  │ 📄 SOL  │ 💬 CHAT │ 🔢 CALC   │
│  CIO     │  ECTORIO │ ICITUDES │   3      │ ULADORA    │
│          │          │          │   🔴     │            │
└──────────┴──────────┴──────────┴──────────┴────────────┘
                                      ↑
                                Badge rojo con contador
```

---

## 🧮 **Lógica del Contador**

### **Código Original (CON BUG)**

```typescript
// ❌ VERSIÓN ANTERIOR - CONTABA MENSAJES DE TODAS LAS SALAS
const getUnreadCount = (): number => {
  return Object.values(messages).reduce((total, roomMessages) => {
    return (
      total +
      roomMessages.filter(msg => msg.sender_id !== user?.id && !msg.isRead)
        .length
    );
  }, 0);
};
```

**Problema**:

- Contaba mensajes de TODAS las salas en el estado `messages`
- No verificaba si el usuario era participante de cada sala
- Podía contar mensajes de chats donde el usuario no tenía acceso

---

### **Código Corregido (SIN BUG)**

```typescript
// ✅ VERSIÓN CORREGIDA - VERIFICA PARTICIPACIÓN
const getUnreadCount = (): number => {
  if (!user) return 0;

  return Object.entries(messages).reduce((total, [roomId, roomMessages]) => {
    // Paso 1: Verificar que el usuario es participante de esta sala
    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.participants?.includes(user.id)) {
      // El usuario no es participante de este chat, no contar mensajes
      return total;
    }

    // Paso 2: Contar mensajes no leídos de otros usuarios
    const unreadCount = roomMessages.filter(
      msg => msg.sender_id !== user.id && !msg.isRead
    ).length;

    return total + unreadCount;
  }, 0);
};
```

**Mejoras**:

1. ✅ Verifica que la sala existe en `chatRooms`
2. ✅ Verifica que el usuario está en `room.participants`
3. ✅ Solo cuenta mensajes donde el usuario es participante
4. ✅ Solo cuenta mensajes de otros usuarios (`sender_id !== user.id`)
5. ✅ Solo cuenta mensajes no leídos (`!msg.isRead`)

---

## 🔄 **Flujo de Datos**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL CONTADOR                           │
└─────────────────────────────────────────────────────────────────┘

  Estado Global (ChatContext)
  ───────────────────────────────
  messages: {
    "room_1": [
      { id: "msg_1", sender_id: "user_A", isRead: false },
      { id: "msg_2", sender_id: "user_B", isRead: false },
      { id: "msg_3", sender_id: "user_C", isRead: true }
    ],
    "room_2": [
      { id: "msg_4", sender_id: "user_D", isRead: false }
    ],
    "room_3": [  // Sala donde usuario NO participa
      { id: "msg_5", sender_id: "user_E", isRead: false }
    ]
  }

  chatRooms: [
    { id: "room_1", participants: ["user_B", "user_A", "user_C"] },
    { id: "room_2", participants: ["user_B", "user_D"] }
    // room_3 NO está en chatRooms del usuario
  ]

  Usuario logueado: user_B
  ────────────────────────

  getUnreadCount()
  │
  ├─ Itera sobre cada roomId en messages
  │
  ├─ room_1:
  │  │ ✓ room_1 existe en chatRooms
  │  │ ✓ user_B está en participants
  │  │
  │  └─ Cuenta mensajes:
  │     ├─ msg_1: sender_id="user_A", !isRead → ✓ CUENTA (1)
  │     ├─ msg_2: sender_id="user_B", !isRead → ✗ NO CUENTA (es del usuario)
  │     └─ msg_3: sender_id="user_C", isRead → ✗ YA LEÍDO
  │
  │  Subtotal room_1: 1 mensaje
  │
  ├─ room_2:
  │  │ ✓ room_2 existe en chatRooms
  │  │ ✓ user_B está en participants
  │  │
  │  └─ Cuenta mensajes:
  │     └─ msg_4: sender_id="user_D", !isRead → ✓ CUENTA (1)
  │
  │  Subtotal room_2: 1 mensaje
  │
  └─ room_3:
     │ ✗ room_3 NO existe en chatRooms del usuario
     │
     └─ NO CUENTA MENSAJES (0)

  ────────────────────────────────
  TOTAL: 2 mensajes sin leer
```

---

## 🔧 **Implementación Técnica**

### **Archivo**: `contexts/ChatContext.tsx`

**Función**: `getUnreadCount()`
**Líneas**: 1114-1132

### **Estructura de Datos**

```typescript
interface ChatMessage extends Message {
  id: string;
  sender_id: string; // ID del usuario que envió
  isRead: boolean; // Si el usuario actual lo leyó
  message: string;
  created_at: string;
}

interface ChatRoom {
  id: string;
  participants: string[]; // Array de IDs de usuarios participantes
  tipo: 'general' | 'support' | 'group';
  is_active: boolean;
}
```

### **Algoritmo de Conteo**

```
ALGORITMO getUnreadCount()
──────────────────────────

ENTRADA:
  - user: Usuario actual
  - messages: Dict<roomId, ChatMessage[]>
  - chatRooms: ChatRoom[]

SALIDA:
  - number: Total de mensajes sin leer

PASOS:

1. Si no hay usuario logueado → retornar 0

2. Para cada (roomId, roomMessages) en messages:

   a. Buscar la sala en chatRooms por ID
   b. Si la sala NO existe → SKIP (no contar)
   c. Si user.id NO está en participants → SKIP (no contar)

   d. Filtrar roomMessages:
      - Sender diferente al usuario
      - Y mensaje no leído (!isRead)

   e. Agregar conteo parcial al total

3. Retornar total

COMPLEJIDAD:
  - Tiempo: O(n × m)
    n = número de salas
    m = promedio de mensajes por sala

  - Espacio: O(1)
    Solo usa variables temporales
```

---

## 📱 **UI Implementation**

### **Archivo**: `app/(tabs)/_layout.tsx`

**Líneas**: 78-94

```typescript
<Tabs.Screen
  name="chat"
  options={{
    title: 'Chat',
    tabBarIcon: ({ size, color }) => (
      <View style={styles.chatIconContainer}>
        <MessageCircle size={size} color={color} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </View>
    ),
  }}
/>
```

### **Estilos del Badge**

```typescript
badge: {
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: '#ef4444',  // Rojo
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 4,
},
badgeText: {
  color: '#ffffff',  // Blanco
  fontSize: 10,
  fontFamily: 'Inter-Bold',
},
```

### **Comportamiento Visual**

| Estado               | Badge Visible | Número Mostrado |
| -------------------- | ------------- | --------------- |
| 0 mensajes no leídos | ❌ Oculto     | -               |
| 1-99 mensajes        | ✅ Visible    | Número exacto   |
| 100+ mensajes        | ✅ Visible    | "99+"           |

---

## 🧪 **Casos de Uso**

### **Caso 1: Usuario Sin Mensajes**

```
ESCENARIO:
  Usuario: Juan Pérez
  Estado: Sin mensajes nuevos

RESULTADO ESPERADO:
  ✅ Badge NO visible
  ✅ getUnreadCount() retorna 0

VALIDACIÓN:
  messages = {}
  chatRooms = []
  → count = 0
```

---

### **Caso 2: Mensaje Propio No Leído**

```
ESCENARIO:
  Usuario: Juan Pérez
  Mensaje: "Hola" enviado por Juan (no leído por nadie más)

RESULTADO ESPERADO:
  ✅ Badge NO visible
  ✅ No cuenta sus propios mensajes

VALIDACIÓN:
  messages = {
    "room_1": [
      { sender_id: "juan_id", isRead: false }
    ]
  }
  chatRooms = [{ id: "room_1", participants: ["juan_id"] }]
  → count = 0 (sender_id === juan_id)
```

---

### **Caso 3: Mensaje de Otro Usuario**

```
ESCENARIO:
  Usuario: Juan Pérez
  Mensaje: "Hola" de María (no leído por Juan)

RESULTADO ESPERADO:
  ✅ Badge visible con "1"
  ✅ getUnreadCount() retorna 1

VALIDACIÓN:
  messages = {
    "room_1": [
      { sender_id: "maria_id", isRead: false }
    ]
  }
  chatRooms = [{ id: "room_1", participants: ["juan_id", "maria_id"] }]
  → count = 1
```

---

### **Caso 4: Mensaje Ya Leído**

```
ESCENARIO:
  Usuario: Juan Pérez
  Mensaje: "Hola" de María (ya leído por Juan)

RESULTADO ESPERADO:
  ✅ Badge NO visible
  ✅ Mensajes leídos no cuentan

VALIDACIÓN:
  messages = {
    "room_1": [
      { sender_id: "maria_id", isRead: true }
    ]
  }
  chatRooms = [{ id: "room_1", participants: ["juan_id", "maria_id"] }]
  → count = 0 (isRead === true)
```

---

### **Caso 5: Mensaje de Sala No Participante**

```
ESCENARIO:
  Usuario: Juan Pérez
  Mensaje: "Hola" en sala donde Juan NO participa

RESULTADO ESPERADO:
  ✅ Badge NO visible
  ✅ No cuenta mensajes de salas ajenas

VALIDACIÓN:
  messages = {
    "room_3": [
      { sender_id: "carlos_id", isRead: false }
    ]
  }
  chatRooms = [
    { id: "room_1", participants: ["juan_id", "maria_id"] }
    // room_3 NO está
  ]
  → count = 0 (room_3 no encontrada en chatRooms)
```

---

### **Caso 6: Múltiples Salas**

```
ESCENARIO:
  Usuario: Juan Pérez
  Sala 1: 2 mensajes de María (no leídos)
  Sala 2: 1 mensaje de Carlos (no leído)
  Sala 3: 3 mensajes de Ana (no leídos)
  Sala 4: 5 mensajes de Pedro (no leídos) - Juan NO participa

RESULTADO ESPERADO:
  ✅ Badge visible con "6"
  ✅ Solo cuenta salas donde participa

VALIDACIÓN:
  messages = {
    "room_1": [
      { sender_id: "maria_id", isRead: false },
      { sender_id: "maria_id", isRead: false }
    ],
    "room_2": [
      { sender_id: "carlos_id", isRead: false }
    ],
    "room_3": [
      { sender_id: "ana_id", isRead: false },
      { sender_id: "ana_id", isRead: false },
      { sender_id: "ana_id", isRead: false }
    ],
    "room_4": [
      { sender_id: "pedro_id", isRead: false },
      ... (5 mensajes)
    ]
  }
  chatRooms = [
    { id: "room_1", participants: ["juan_id", "maria_id"] },
    { id: "room_2", participants: ["juan_id", "carlos_id"] },
    { id: "room_3", participants: ["juan_id", "ana_id"] }
    // room_4 NO está
  ]
  → count = 2 + 1 + 3 = 6
```

---

### **Caso 7: Más de 99 Mensajes**

```
ESCENARIO:
  Usuario: Juan Pérez
  150 mensajes sin leer de diferentes usuarios

RESULTADO ESPERADO:
  ✅ Badge visible con "99+"
  ✅ UI formatea número grande

VALIDACIÓN:
  getUnreadCount() → 150
  UI muestra → "99+"
```

---

## ✅ **Validación**

### **Prueba Manual**

**Pasos**:

1. Iniciar sesión como usuario A
2. Enviar mensaje a usuario B desde otra cuenta
3. Verificar que usuario B vea badge con "1"
4. Usuario B abre el chat
5. Badge debería desaparecer

### **Prueba Automatizada (Futura)**

```typescript
describe('getUnreadCount', () => {
  it('debe retornar 0 si no hay usuario', () => {
    const count = getUnreadCount();
    expect(count).toBe(0);
  });

  it('debe contar solo mensajes de salas del usuario', () => {
    const user = { id: 'user_1' };
    const messages = {
      room_1: [{ sender_id: 'user_2', isRead: false }],
      room_2: [{ sender_id: 'user_3', isRead: false }],
    };
    const chatRooms = [{ id: 'room_1', participants: ['user_1', 'user_2'] }];

    const count = getUnreadCount();
    expect(count).toBe(1); // Solo room_1
  });

  it('no debe contar mensajes propios', () => {
    const user = { id: 'user_1' };
    const messages = {
      room_1: [{ sender_id: 'user_1', isRead: false }],
    };
    const chatRooms = [{ id: 'room_1', participants: ['user_1'] }];

    const count = getUnreadCount();
    expect(count).toBe(0);
  });
});
```

---

## 🐛 **Problemas Resueltos**

### **Bug Original: Contador Incoherente**

**Síntoma**:

- El contador mostraba números incorrectos
- Contaba mensajes de chats ajenos
- Usuarios reportaban "números raros"

**Causa Raíz**:

```typescript
// ❌ No verificaba participación del usuario
const getUnreadCount = (): number => {
  return Object.values(messages).reduce((total, roomMessages) => {
    return (
      total +
      roomMessages.filter(msg => msg.sender_id !== user?.id && !msg.isRead)
        .length
    );
  }, 0);
};
```

**Problema**:

- `Object.values(messages)` retorna TODOS los mensajes en caché
- Incluye salas donde el usuario no es participante
- Posible fuga de información entre usuarios

**Solución Implementada**:

```typescript
// ✅ Verifica participación antes de contar
const getUnreadCount = (): number => {
  if (!user) return 0;

  return Object.entries(messages).reduce((total, [roomId, roomMessages]) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (!room || !room.participants?.includes(user.id)) {
      return total; // Skip si no es participante
    }

    const unreadCount = roomMessages.filter(
      msg => msg.sender_id !== user.id && !msg.isRead
    ).length;

    return total + unreadCount;
  }, 0);
};
```

---

## 🔒 **Seguridad**

### **Prevención de Fuga de Información**

**Antes**:

```
messages = {
  "room_privado_A_B": [...],  // Solo A y B
  "room_privado_C_D": [...]   // Solo C y D
}

Usuario A veía:
  - Sus mensajes ✅
  - Mensajes de C y D ❌ (BUG)
```

**Después**:

```
chatRooms del usuario A = ["room_privado_A_B"]

Usuario A solo ve:
  - Mensajes de room_privado_A_B ✅
  - Mensajes de room_privado_C_D ❌ (filtrado correctamente)
```

---

## 📈 **Métricas de Performance**

### **Complejidad Temporal**

| Escenario              | Complejidad | Tiempo Estimado |
| ---------------------- | ----------- | --------------- |
| 1 sala, 10 mensajes    | O(10)       | <1ms            |
| 5 salas, 50 mensajes   | O(50)       | <2ms            |
| 10 salas, 500 mensajes | O(500)      | <5ms            |

### **Optimizaciones**

1. **Early return**:

   ```typescript
   if (!user) return 0; // Evita procesamiento
   ```

2. **Skip rooms**:

   ```typescript
   if (!room || !room.participants?.includes(user.id)) {
     return total; // No procesa mensajes de esta sala
   }
   ```

3. **Efficient filter**:
   ```typescript
   .filter(msg => msg.sender_id !== user.id && !msg.isRead)
   // Una sola pasada, O(n)
   ```

---

## 🚀 **Mejoras Futuras**

1. **Memoización**:

   ```typescript
   const unreadCount = useMemo(
     () => getUnreadCount(),
     [messages, chatRooms, user]
   );
   ```

2. **Contador por sala**:

   ```typescript
   getRoomUnreadCount(roomId: string): number
   // Ya implementado (líneas 1134-1138)
   ```

3. **Indicadores visuales adicionales**:
   - Punto azul en cada chat de la lista
   - Contador en el nombre del chat
   - Preview del último mensaje

4. **Sincronización con servidor**:
   - Marcar como leído al abrir chat
   - Sincronizar `isRead` con backend
   - Confirmación de lectura (read receipts)

---

## 📝 **Notas de Implementación**

1. **Por qué `Object.entries` en lugar de `Object.values`**:
   - Necesitamos el `roomId` para buscar en `chatRooms`
   - `Object.values([k, v])` nos da ambos

2. **Por qué verificar `room.participants`**:
   - Evita contar mensajes de salas ajenas
   - Previene fugas de información
   - Seguridad por defecto

3. **Por qué `sender_id !== user.id`**:
   - Los usuarios no deben ver sus propios mensajes como no leídos
   - Solo importa lo que otros envían

---

## 🧪 **Testing Checklist**

- [ ] Contador inicia en 0
- [ ] Badge aparece con 1 mensaje
- [ ] Badge desaparece al leer mensajes
- [ ] No cuenta mensajes propios
- [ ] No cuenta mensajes de salas ajenas
- [ ] Muestra "99+" para >100 mensajes
- [ ] Se actualiza en tiempo real
- [ ] Funciona con múltiples salas
- [ ] Funciona con grupos
- [ ] Funciona tras logout/login

---

**Fin de Documentación**
