# Resumen Visual: Lógica de Solicitudes por Zona

**Referencia rápida para desarrolladores**

---

## 🎯 **VISIÓN GENERAL**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE SOLICITUDES                        │
└─────────────────────────────────────────────────────────────────┘

                           ┌──────────────┐
                           │  USUARIO     │
                           │  AUTENTICADO │
                           └──────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                ┌───▼────┐   ┌───▼────┐   ┌───▼────┐
                │CLIENTE │   │ AGENTE │   │ ADMIN  │
                └───┬────┘   └───┬────┘   └───┬────┘
                    │            │            │
                    │            │            │
                ▼   ▼        ▼   ▼        ▼   ▼
            SUS      │    ASIGNADAS      TODAS
            SOLIC    │  + SIN ASIGNAR  DEL SIS
            ITUDES   │    DE ZONA      TEMA
```

---

## 👤 **CLIENTE**

```
🔒 VISIBILIDAD: RESTRICTIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Cliente: Juan Pérez (juan@empresa.com)

  VE:
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #001                          │
  │ Título: Problema con máquina            │
  │ Estatus: En proceso                     │
  │ Agente: María López                     │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #002                          │
  │ Título: Cotización de refacciones       │
  │ Estatus: Nuevo                          │
  │ Agente: Sin asignar                     │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #003                          │
  │ Título: Falla en sistema                │
  │ Estatus: Resuelto                       │
  │ Agente: Carlos Ruiz                     │
  └─────────────────────────────────────────┘

  TOTAL: 3 solicitudes (SOLO SUS PROPIAS)

  SQL:
  WHERE usuario_id = 'juan_id'
```

---

## 👨‍💼 **AGENTE (CON ZONA)**

```
🔓 VISIBILIDAD: ASIGNADAS + SIN ASIGNAR DE ZONA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Agente: Pedro González (zona: NORTE)

  VE:
  ┌─────────────────────────────────────────┐
  │ GRUPO 1: ASIGNADAS (2)                  │
  ├─────────────────────────────────────────┤
  │ SOLICITUD #005                          │
  │ Cliente: Industrias Alpha               │
  │ Zona: NORTE ✅                          │
  │ Estatus: Asignado a mí                  │
  ├─────────────────────────────────────────┤
  │ SOLICITUD #008                          │
  │ Cliente: Manufacturas del Norte        │
  │ Zona: NORTE ✅                          │
  │ Estatus: En proceso                     │
  └─────────────────────────────────────────┘

  ┌─────────────────────────────────────────┐
  │ GRUPO 2: SIN ASIGNAR DE ZONA NORTE (4)  │
  ├─────────────────────────────────────────┤
  │ SOLICITUD #010                          │
  │ Cliente: Maquinaria Norte               │
  │ Zona: NORTE ✅                          │
  │ Estatus: Nuevo (PUEDE AUTO-ASIGNAR)     │
  ├─────────────────────────────────────────┤
  │ SOLICITUD #012                          │
  │ Cliente: Refacciones del Norte          │
  │ Zona: NORTE ✅                          │
  │ Estatus: Nuevo (PUEDE AUTO-ASIGNAR)     │
  ├─────────────────────────────────────────┤
  │ SOLICITUD #015                          │
  │ Cliente: Servicios Industriales Norte   │
  │ Zona: NORTE ✅                          │
  │ Estatus: Nuevo (PUEDE AUTO-ASIGNAR)     │
  ├─────────────────────────────────────────┤
  │ SOLICITUD #018                          │
  │ Cliente: Insumos Norte                  │
  │ Zona: NORTE ✅                          │
  │ Estatus: Nuevo (PUEDE AUTO-ASIGNAR)     │
  └─────────────────────────────────────────┘

  ❌ NO VE:
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #011                          │
  │ Cliente: Servicios Sur                  │
  │ Zona: SUR ❌ (DIFERENTE ZONA)           │
  │ Estatus: Nuevo                          │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #013                          │
  │ Cliente: Industrias Centro              │
  │ Zona: CENTRO ❌ (DIFERENTE ZONA)        │
  │ Estatus: Nuevo                          │
  └─────────────────────────────────────────┘

  TOTAL VISIBLE: 6 solicitudes (2 asignadas + 4 sin asignar NORTE)

  SQL:
  1. WHERE agente_id = 'pedro_id'
  2. WHERE agente_id IS NULL
     + FILTRO: usuario.zona = 'NORTE'
```

---

## 👨‍💼 **AGENTE (SIN ZONA)**

```
⚠️ VISIBILIDAD: SOLO ASIGNADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Agente: Luis Torres (zona: SIN DEFINIR)

  VE:
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #007                          │
  │ Cliente: (cualquiera)                   │
  │ Zona: (cualquiera)                      │
  │ Estatus: Asignado a mí                  │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ SOLICITUD #009                          │
  │ Cliente: (cualquiera)                   │
  │ Zona: (cualquiera)                      │
  │ Estatus: En proceso                     │
  └─────────────────────────────────────────┘

  ❌ NO VE:
  ┌─────────────────────────────────────────┐
  │ NINGUNA SOLICITUD SIN ASIGNAR           │
  │ (No tiene zona para filtrar)            │
  └─────────────────────────────────────────┘

  TOTAL VISIBLE: 2 solicitudes (SOLO ASIGNADAS)

  SQL:
  WHERE agente_id = 'luis_id'
```

---

## 👨‍💻 **ADMIN**

```
🌐 VISIBILIDAD: TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Admin: Sistema

  VE:
  ┌─────────────────────────────────────────┐
  │ TODAS LAS SOLICITUDES DEL SISTEMA       │
  │ - De cualquier cliente                  │
  │ - De cualquier zona                      │
  │ - Con o sin agente asignado             │
  │ - Cualquier estatus                      │
  └─────────────────────────────────────────┘

  TOTAL VISIBLE: TODO (sin restricciones)

  SQL:
  (sin filtros)
  ORDER BY created_at DESC
```

---

## 🔄 **FLUJO DE AUTO-ASIGNACIÓN**

```
┌─────────────────────────────────────────────────────────────────┐
│                 AGENTE VE SOLICITUD SIN ASIGNAR                │
└─────────────────────────────────────────────────────────────────┘

  1. TOCA SOLICITUD
     ─────────────────
     Solicitud #010
     Cliente: Maquinaria Norte
     Zona: NORTE ✅
     Estatus: Nuevo
     [📝 ASIGNAR]  [💬 CHAT]

  2. SELECCIONA "ASIGNAR"
     ──────────────────────
     → Actualiza agente_id = 'pedro_id'
     → Cambia estatus a 'asignado'
     → Crea chat automático
     → Envía notificación al cliente

  3. RESULTADO
     ──────────
     ┌─────────────────────────────────────────┐
     │ SOLICITUD #010                          │
     │ Cliente: Maquinaria Norte               │
     │ Zona: NORTE ✅                          │
     │ Estatus: ASIGNADO A PEDRO GONZÁLEZ      │
     │ Chat: Creado automáticamente            │
     └─────────────────────────────────────────┘

  4. CAMBIO DE VISIBILIDAD
     ─────────────────────
     Antes: En "SIN ASIGNAR DE ZONA NORTE"
     Después: En "ASIGNADAS"
```

---

## 📊 **MATRIZ DE VISIBILIDAD**

| Rol          | Ve Sus Solicitudes | Ve Asignadas | Ve Sin Asignar | Ve Otras Zonas | Ve Todo |
|--------------|-------------------|--------------|----------------|----------------|---------|
| **Cliente**  | ✅ Solo propias   | ❌           | ❌             | ❌             | ❌      |
| **Agente c/ Zona** | ❌        | ✅ Sí        | ✅ Solo su zona | ❌             | ❌      |
| **Agente s/ Zona** | ❌        | ✅ Sí        | ❌             | ❌             | ❌      |
| **Admin**    | ✅               | ✅           | ✅             | ✅             | ✅      |

---

## 🎬 **EJEMPLO REAL**

```
ESCENARIO: 10 solicitudes en el sistema

┌──────────┬──────────┬────────┬──────────────┬─────────────┐
│ SOLICITUD│ CLIENTE  │ ZONA   │ AGENTE       │ ESTATUS      │
├──────────┼──────────┼────────┼──────────────┼─────────────┤
│ #001     │ Juan A.  │ NORTE  │ Pedro G.     │ En proceso   │
│ #002     │ María B. │ SUR    │ Sin asignar  │ Nuevo        │
│ #003     │ Carlos C.│ NORTE  │ Sin asignar  │ Nuevo        │
│ #004     │ Ana D.   │ CENTRO │ Luis T.      │ Asignado     │
│ #005     │ Pedro E. │ NORTE  │ Pedro G.     │ Resuelto     │
│ #006     │ Laura F. │ SUR    │ Sin asignar  │ Nuevo        │
│ #007     │ Miguel G.│ NORTE  │ Sin asignar  │ Nuevo        │
│ #008     │ Carmen H.│ CENTRO │ Sin asignar  │ Nuevo        │
│ #009     │ Rafael I.│ NORTE  │ Pedro G.     │ Asignado     │
│ #010     │ Elena J. │ SUR    │ Sin asignar  │ Nuevo        │
└──────────┴──────────┴────────┴──────────────┴─────────────┘

QUIÉN VE QUÉ:

👤 JUAN A. (CLIENTE)
  Ve: #001 (1 solicitud)

👨‍💼 PEDRO G. (AGENTE - ZONA: NORTE)
  Ve: #001, #003, #005, #007, #009 (5 solicitudes)
  - #001, #005, #009 = Asignadas a él
  - #003, #007 = Sin asignar de zona NORTE

👨‍💼 LUIS T. (AGENTE - SIN ZONA)
  Ve: #004 (1 solicitud)
  - #004 = Asignada a él

👨‍💻 ADMIN
  Ve: #001, #002, #003, #004, #005, #006, #007, #008, #009, #010
  (Todas: 10 solicitudes)
```

---

## 🚀 **OPTIMIZACIONES**

```
1. CONSULTAS PARALELAS
   ───────────────────
   Promise.all([
     queryAsignadas,      // 200ms
     querySinAsignar      // 250ms
   ])                    // Total: 250ms (no 450ms)

2. DEDUPLICACIÓN
   ──────────────
   Map con ID como clave
   → Elimina duplicados automáticamente

3. FILTRADO TEMPRANO
   ─────────────────
   if (user.zona) {
     querySinAsignar  // Solo si tiene zona
   }
```

---

## ⚡ **QUICK REFERENCE**

```typescript
// CLIENTE
.eq('usuario_id', user.id)

// AGENTE CON ZONA
Promise.all([
  .eq('agente_id', user.id),                     // Asignadas
  .is('agente_id', null)                         // Sin asignar
])
.filter(req => req.usuario?.zona === user.zona) // Filtrar zona

// AGENTE SIN ZONA
.eq('agente_id', user.id)                        // Solo asignadas

// ADMIN
// (sin filtros)
```

---

**Fin del Resumen Visual**
