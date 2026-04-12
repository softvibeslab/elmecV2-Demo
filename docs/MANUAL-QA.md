# 🧪 MANUAL DE QA - ELMEC v2

**Versión:** 2.0.0
**Fecha:** Octubre 2025
**Audiencia:** QA Engineers, Testers
**Plataformas:** iOS, Android, Web

---

## 📑 Índice

1. [Introducción](#introducción)
2. [Configuración del Entorno de Pruebas](#configuración-del-entorno-de-pruebas)
3. [Casos de Prueba por Módulo](#casos-de-prueba-por-módulo)
4. [Flujos de Prueba End-to-End](#flujos-de-prueba-end-to-end)
5. [Pruebas de Regresión](#pruebas-de-regresión)
6. [Reporte de Bugs](#reporte-de-bugs)
7. [Checklist de QA](#checklist-de-qa)
8. [Herramientas y Scripts](#herramientas-y-scripts)

---

## 📘 Introducción

### Objetivo del Manual

Este manual proporciona guías detalladas para realizar pruebas de calidad (QA) en la aplicación ELMEC v2. Incluye casos de prueba, flujos completos, y procedimientos para reportar bugs.

### Tipos de Pruebas

✅ **Funcionales** - Verificar que cada función trabaje según lo esperado
✅ **UI/UX** - Validar interfaz y experiencia de usuario
✅ **Performance** - Medir tiempos de respuesta y rendimiento
✅ **Seguridad** - Verificar autenticación y permisos
✅ **Compatibilidad** - Probar en diferentes dispositivos
✅ **Regresión** - Asegurar que cambios no rompan funcionalidad existente

### Usuarios de Prueba

| Email                   | Password    | Rol      | Uso                       |
| ----------------------- | ----------- | -------- | ------------------------- |
| i.pineda@elmec.com.mx   | Admin123!   | Admin    | Pruebas de administración |
| j.gonzalez@elmec.com.mx | Agent123!   | Agent    | Pruebas de agente         |
| cliente@gmail.com       | Cliente123! | Customer | Pruebas de cliente        |

---

## ⚙️ Configuración del Entorno de Pruebas

### Requisitos Previos

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd elmecV2-Demo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Verificar configuración
cat .env | grep SUPABASE
```

### Iniciar Aplicación

```bash
# Iniciar en modo desarrollo
npm start

# Opciones:
# - Presiona 'a' para Android
# - Presiona 'i' para iOS
# - Presiona 'w' para Web
```

### Limpiar Datos de Prueba

```bash
# Script para resetear datos de prueba
node scripts/cleanup-test-data.js
```

### Verificar Estado del Sistema

```bash
# Ejecutar script de verificación
node scripts/test-requests-creation.js

# Salida esperada:
# ✅ Conexión a Supabase
# ✅ Usuario de prueba encontrado
# ✅ Solicitud creada
# ✅ Solicitud leída
# ✅ Solicitud eliminada
```

---

## 🧩 Casos de Prueba por Módulo

### 1. AUTENTICACIÓN

#### TC-AUTH-001: Login Exitoso

**Prioridad:** Alta
**Tipo:** Funcional

**Precondiciones:**

- Usuario registrado en el sistema
- App abierta en pantalla de login

**Pasos:**

1. Abrir la aplicación
2. Ingresar email: `cliente@gmail.com`
3. Ingresar password: `Cliente123!`
4. Tocar botón "Iniciar Sesión"

**Resultado Esperado:**

- ✅ Usuario redirigido a Dashboard
- ✅ Datos del usuario visibles en UI
- ✅ Tabs de navegación disponibles
- ✅ No hay errores en consola

**Criterios de Aceptación:**

- Login completa en < 3 segundos
- Token JWT guardado correctamente
- Sesión persiste al cerrar/abrir app

---

#### TC-AUTH-002: Login Fallido (Credenciales Incorrectas)

**Prioridad:** Alta
**Tipo:** Negativo

**Pasos:**

1. Abrir la aplicación
2. Ingresar email: `cliente@gmail.com`
3. Ingresar password incorrecta: `WrongPass123`
4. Tocar botón "Iniciar Sesión"

**Resultado Esperado:**

- ✅ Mensaje de error claro: "Credenciales incorrectas"
- ✅ Usuario permanece en pantalla de login
- ✅ Campos de input no se limpian (mantienen email)
- ✅ No hay crash de la app

---

#### TC-AUTH-003: Logout

**Prioridad:** Media
**Tipo:** Funcional

**Precondiciones:**

- Usuario autenticado

**Pasos:**

1. Navegar a Configuración
2. Tocar "Cerrar Sesión"
3. Confirmar en el diálogo

**Resultado Esperado:**

- ✅ Usuario redirigido a Login
- ✅ Token eliminado de storage
- ✅ No se pueden acceder tabs sin autenticación
- ✅ Datos sensibles limpiados de memoria

---

### 2. SOLICITUDES (REQUESTS)

#### TC-REQ-001: Crear Solicitud Exitosamente

**Prioridad:** Crítica
**Tipo:** Funcional

**Precondiciones:**

- Usuario autenticado como Customer
- En pantalla de Solicitudes

**Pasos:**

1. Tocar botón "+" (Crear nueva)
2. Ingresar título: "Solicitud de prueba QA"
3. Ingresar mensaje: "Esta es una solicitud de prueba para validar el sistema"
4. Seleccionar tipo: "Ventas"
5. Seleccionar prioridad: "Media"
6. (Opcional) Seleccionar agente
7. Tocar "Enviar Solicitud"

**Resultado Esperado:**

- ✅ Spinner visible durante proceso
- ✅ Alert de éxito: "Solicitud creada correctamente"
- ✅ Modal se cierra automáticamente
- ✅ Nueva solicitud visible en lista
- ✅ Solicitud muestra datos correctos
- ✅ Estado inicial: "Nuevo"
- ✅ Logs en consola muestran proceso completo

**Criterios de Aceptación:**

- Creación completa en < 5 segundos
- Solicitud guardada en BD
- Si hay agente asignado, recibe notificación

---

#### TC-REQ-002: Validación de Campos Requeridos

**Prioridad:** Alta
**Tipo:** Validación

**Pasos:**

1. Tocar botón "+" (Crear nueva)
2. Dejar título vacío
3. Dejar mensaje vacío
4. Tocar "Enviar Solicitud"

**Resultado Esperado:**

- ✅ Alert de error: "Por favor completa el título y mensaje"
- ✅ Modal NO se cierra
- ✅ No se crea solicitud en BD
- ✅ Focus en primer campo vacío

---

#### TC-REQ-003: Validación de Longitud de Título

**Prioridad:** Media
**Tipo:** Validación

**Test 1: Título muy corto**

1. Ingresar título: "Test" (4 caracteres)
2. Ingresar mensaje válido
3. Tocar "Enviar Solicitud"

**Resultado:** Alert "El título debe tener entre 5 y 200 caracteres"

**Test 2: Título muy largo**

1. Ingresar título de 201+ caracteres
2. Ingresar mensaje válido
3. Tocar "Enviar Solicitud"

**Resultado:** Alert "El título debe tener entre 5 y 200 caracteres"

---

#### TC-REQ-004: Ver Detalles de Solicitud

**Prioridad:** Alta
**Tipo:** Funcional

**Pasos:**

1. En lista de solicitudes, tocar una solicitud

**Resultado Esperado:**

- ✅ Muestra todos los datos:
  - Título
  - Mensaje completo
  - Estado actual
  - Prioridad
  - Fecha de creación
  - Agente asignado (si aplica)
- ✅ Botón "Charlar" visible
- ✅ Si es agente/admin: opciones para cambiar estado

---

#### TC-REQ-005: Actualizar Estado de Solicitud (Agente)

**Prioridad:** Alta
**Tipo:** Funcional

**Precondiciones:**

- Usuario autenticado como Agent
- Solicitud asignada al agente

**Pasos:**

1. Tocar solicitud asignada
2. Tocar en la solicitud para ver opciones
3. Seleccionar "En Proceso"

**Resultado Esperado:**

- ✅ Estado actualizado inmediatamente
- ✅ Color/icono de estado cambia
- ✅ Cliente recibe notificación
- ✅ `updated_at` actualizado en BD

---

#### TC-REQ-006: Filtrar Solicitudes

**Prioridad:** Media
**Tipo:** Funcional

**Pasos:**

1. En pantalla de Solicitudes
2. Usar barra de búsqueda
3. Ingresar texto: "soporte"

**Resultado Esperado:**

- ✅ Lista filtrada muestra solo solicitudes con "soporte" en título/mensaje
- ✅ Contador actualizado
- ✅ Filtrado en tiempo real

---

### 3. CHAT

#### TC-CHAT-001: Iniciar Chat desde Solicitud

**Prioridad:** Alta
**Tipo:** Funcional

**Precondiciones:**

- Solicitud con agente asignado

**Pasos:**

1. Abrir solicitud
2. Tocar botón "Charlar"

**Resultado Esperado:**

- ✅ Redirige a pantalla de chat
- ✅ Sala de chat creada/abierta
- ✅ Mensaje de bienvenida del sistema
- ✅ Input de mensaje habilitado
- ✅ Nombre del otro participante visible

---

#### TC-CHAT-002: Enviar Mensaje de Texto

**Prioridad:** Crítica
**Tipo:** Funcional

**Pasos:**

1. Estar en sala de chat
2. Escribir mensaje: "Hola, necesito ayuda"
3. Tocar botón de enviar

**Resultado Esperado:**

- ✅ Mensaje aparece inmediatamente (optimistic update)
- ✅ Checkmark de "enviado" después de confirmación
- ✅ Mensaje guardado en BD
- ✅ Otro usuario recibe mensaje en tiempo real
- ✅ Input se limpia después de enviar
- ✅ Scroll automático al último mensaje

**Tiempo esperado:** < 2 segundos

---

#### TC-CHAT-003: Recibir Mensaje en Tiempo Real

**Prioridad:** Crítica
**Tipo:** Realtime

**Precondiciones:**

- Dos dispositivos/sesiones abiertas
- Usuario A y Usuario B en misma sala

**Pasos:**

1. Usuario A envía mensaje: "Mensaje de prueba"
2. Observar en dispositivo de Usuario B

**Resultado Esperado:**

- ✅ Mensaje aparece automáticamente en Usuario B
- ✅ Sin necesidad de refrescar
- ✅ Notificación sonora/visual (si app en background)
- ✅ Badge de mensajes no leídos actualizado

**Latencia esperada:** < 1 segundo

---

#### TC-CHAT-004: Indicador de "Escribiendo..."

**Prioridad:** Baja
**Tipo:** UX

**Precondiciones:**

- Dos usuarios en misma sala

**Pasos:**

1. Usuario A empieza a escribir
2. Observar en dispositivo de Usuario B

**Resultado Esperado:**

- ✅ Texto "Usuario A está escribiendo..." visible
- ✅ Indicador desaparece cuando deja de escribir
- ✅ Indicador desaparece cuando envía mensaje

---

#### TC-CHAT-005: Validar Mensaje Vacío

**Prioridad:** Media
**Tipo:** Validación

**Pasos:**

1. Dejar input vacío
2. Tocar botón de enviar

**Resultado Esperado:**

- ✅ Botón de enviar deshabilitado
- ✅ O: Alert "El mensaje no puede estar vacío"
- ✅ No se crea mensaje en BD

---

### 4. NOTIFICACIONES

#### TC-NOTIF-001: Recibir Notificación de Nueva Solicitud

**Prioridad:** Alta
**Tipo:** Funcional

**Precondiciones:**

- Usuario autenticado como Agent

**Pasos:**

1. Otro usuario (Customer) crea solicitud y asigna a este agente
2. Observar tab de Notificaciones

**Resultado Esperado:**

- ✅ Badge de contador aumenta en tab
- ✅ Notificación visible en lista
- ✅ Título: "Nueva solicitud asignada"
- ✅ Cuerpo: Nombre de la solicitud
- ✅ Estado: No leída (destacada)
- ✅ Timestamp correcto

---

#### TC-NOTIF-002: Marcar Notificación como Leída

**Prioridad:** Media
**Tipo:** Funcional

**Pasos:**

1. Tocar notificación no leída

**Resultado Esperado:**

- ✅ Estado cambia a "leída"
- ✅ Estilo visual cambia (menos opaco)
- ✅ Badge de contador disminuye
- ✅ Campo `read_at` actualizado en BD

---

#### TC-NOTIF-003: Navegar desde Notificación

**Prioridad:** Media
**Tipo:** Funcional

**Pasos:**

1. Tocar notificación de tipo "request_update"

**Resultado Esperado:**

- ✅ Redirige a solicitud específica
- ✅ Solicitud se abre con datos correctos
- ✅ Notificación marcada como leída

---

### 5. CALCULADORA

#### TC-CALC-001: Operaciones Básicas

**Prioridad:** Media
**Tipo:** Funcional

**Test 1: Suma**

1. Ingresar: 5 + 3 =
2. Resultado esperado: 8

**Test 2: Resta**

1. Ingresar: 10 - 4 =
2. Resultado esperado: 6

**Test 3: Multiplicación**

1. Ingresar: 6 × 7 =
2. Resultado esperado: 42

**Test 4: División**

1. Ingresar: 15 ÷ 3 =
2. Resultado esperado: 5

---

#### TC-CALC-002: Guardar Sesión de Calculadora

**Prioridad:** Baja
**Tipo:** Funcional

**Pasos:**

1. Realizar varios cálculos
2. Tocar botón "Guardar"
3. Ingresar nombre: "Cotización Cliente X"
4. Confirmar

**Resultado Esperado:**

- ✅ Sesión guardada en BD
- ✅ Visible en lista de sesiones guardadas
- ✅ Puede recuperarse posteriormente

---

### 6. DIRECTORIO DE VENDEDORES

#### TC-DIR-001: Ver Lista de Vendedores

**Prioridad:** Media
**Tipo:** Funcional

**Pasos:**

1. Navegar a tab "Directorio"

**Resultado Esperado:**

- ✅ Lista de agentes visible
- ✅ Cada agente muestra:
  - Foto (o placeholder)
  - Nombre completo
  - Categoría
  - Zona
  - Indicador online/offline
- ✅ Lista ordenada alfabéticamente

---

#### TC-DIR-002: Filtrar por Zona

**Prioridad:** Media
**Tipo:** Funcional

**Pasos:**

1. Usar filtro de zona
2. Seleccionar "Norte"

**Resultado Esperado:**

- ✅ Lista filtrada muestra solo agentes de zona Norte
- ✅ Contador actualizado
- ✅ Filtro puede removerse

---

#### TC-DIR-003: Contactar Agente desde Directorio

**Prioridad:** Alta
**Tipo:** Funcional

**Pasos:**

1. Tocar agente en lista
2. Tocar botón "Chatear"

**Resultado Esperado:**

- ✅ Crea/abre sala de chat con agente
- ✅ Redirige a chat
- ✅ Listo para enviar mensaje

---

### 7. CONFIGURACIÓN

#### TC-SETT-001: Actualizar Perfil

**Prioridad:** Media
**Tipo:** Funcional

**Pasos:**

1. Ir a Configuración > Cuenta
2. Cambiar nombre: "Nuevo Nombre"
3. Cambiar teléfono: "+52 123 456 7890"
4. Tocar "Guardar"

**Resultado Esperado:**

- ✅ Datos actualizados en BD
- ✅ Cambios reflejados en UI
- ✅ Alert de éxito

---

## 🔄 Flujos de Prueba End-to-End

### E2E-001: Flujo Completo de Solicitud y Chat

**Duración estimada:** 10 minutos
**Roles necesarios:** Customer, Agent

**Escenario:**
Un cliente crea una solicitud urgente, se asigna a un agente, chatean para resolverla, y el agente cierra la solicitud.

**Pasos Detallados:**

**Como Cliente:**

1. Login con `cliente@gmail.com`
2. Ir a tab "Solicitudes"
3. Tocar "+" para crear nueva
4. Llenar formulario:
   - Título: "Equipo CNC con errores"
   - Mensaje: "El equipo CNC está mostrando error E404 constantemente"
   - Tipo: Soporte
   - Prioridad: Urgente
   - Agente: Seleccionar agente disponible
5. Tocar "Enviar Solicitud"
6. Verificar que aparece en lista
7. Tocar la solicitud recién creada
8. Tocar botón "Charlar"
9. Enviar mensaje: "Hola, necesito ayuda urgente con este equipo"
10. Esperar respuesta del agente

**Como Agente:** 11. Logout del cliente 12. Login con `j.gonzalez@elmec.com.mx` 13. Ir a tab "Notificaciones" 14. Verificar notificación de nueva solicitud 15. Tocar notificación (redirige a solicitud) 16. Verificar datos de solicitud 17. Tocar solicitud para cambiar estado a "En Proceso" 18. Tocar botón "Charlar" 19. Verificar mensaje del cliente 20. Responder: "Hola, ya estoy revisando el caso. ¿Desde cuándo presenta el error?" 21. Continuar conversación (2-3 mensajes más) 22. Volver a solicitud 23. Cambiar estado a "Resuelto"

**Como Cliente:** 24. Logout del agente 25. Login nuevamente como cliente 26. Verificar notificación de cambio de estado 27. Ver solicitud actualizada a "Resuelto" 28. Ver historial de chat completo

**Verificaciones:**

- ✅ Todos los estados se actualizan en tiempo real
- ✅ Notificaciones llegan correctamente
- ✅ Chat funciona bidireccionalmente
- ✅ Datos persisten entre sesiones
- ✅ No hay pérdida de mensajes

---

### E2E-002: Flujo de Registro y Primera Solicitud

**Duración estimada:** 5 minutos

**Pasos:**

1. Abrir app (primera vez)
2. Tocar "Registrarse"
3. Llenar formulario de registro
4. Confirmar email (si aplica)
5. Login con nuevas credenciales
6. Tour de bienvenida (si existe)
7. Crear primera solicitud
8. Explorar tabs principales
9. Cerrar sesión

**Verificaciones:**

- ✅ Usuario creado en BD
- ✅ Puede autenticarse
- ✅ Tiene rol correcto (customer)
- ✅ Puede crear solicitudes
- ✅ UI es intuitiva para nuevo usuario

---

## 🔁 Pruebas de Regresión

### Checklist de Regresión (Ejecutar antes de cada release)

#### Módulo: Autenticación

- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas
- [ ] Logout
- [ ] Persistencia de sesión
- [ ] Refresh de token automático

#### Módulo: Solicitudes

- [ ] Crear solicitud
- [ ] Ver lista de solicitudes
- [ ] Filtrar solicitudes
- [ ] Actualizar estado (agente)
- [ ] Ver detalles de solicitud
- [ ] Adjuntar archivos (si habilitado)

#### Módulo: Chat

- [ ] Crear sala de chat
- [ ] Enviar mensaje de texto
- [ ] Recibir mensaje en tiempo real
- [ ] Indicador de escribiendo
- [ ] Enviar imagen (si habilitado)
- [ ] Historial de mensajes

#### Módulo: Notificaciones

- [ ] Recibir notificación
- [ ] Marcar como leída
- [ ] Navegar desde notificación
- [ ] Badge de contador

#### Performance

- [ ] Tiempo de login < 3s
- [ ] Tiempo de carga de solicitudes < 2s
- [ ] Mensajes en realtime < 1s latencia
- [ ] App no consume > 200MB RAM

#### Compatibilidad

- [ ] Android 10+
- [ ] iOS 13+
- [ ] Orientación portrait
- [ ] Orientación landscape
- [ ] Tablets

---

## 🐛 Reporte de Bugs

### Template de Bug Report

```markdown
## BUG-XXX: [Título descriptivo]

**Prioridad:** [Crítica/Alta/Media/Baja]
**Severidad:** [Blocker/Major/Minor/Trivial]
**Estado:** [Nuevo/En Progreso/Resuelto/Cerrado]
**Reportado por:** [Nombre del tester]
**Fecha:** [YYYY-MM-DD]

### Entorno

- **Plataforma:** [iOS/Android/Web]
- **Versión de OS:** [14.5, Android 11, etc.]
- **Dispositivo:** [iPhone 12, Samsung Galaxy S21, etc.]
- **Versión de App:** [2.0.0]
- **Build:** [123]

### Descripción

[Descripción clara y concisa del bug]

### Pasos para Reproducir

1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### Resultado Esperado

[Qué debería pasar]

### Resultado Actual

[Qué está pasando]

### Evidencia

- Screenshots: [Adjuntar]
- Videos: [Adjuntar]
- Logs: [Adjuntar]

### Workaround

[Si existe alguna forma temporal de evitar el bug]

### Notas Adicionales

[Información extra relevante]
```

### Ejemplo de Bug Report

```markdown
## BUG-042: No se pueden enviar mensajes en chat después de 5 minutos

**Prioridad:** Alta
**Severidad:** Major
**Estado:** Nuevo
**Reportado por:** Juan Pérez
**Fecha:** 2025-10-22

### Entorno

- **Plataforma:** iOS
- **Versión de OS:** 16.5
- **Dispositivo:** iPhone 13
- **Versión de App:** 2.0.0
- **Build:** 125

### Descripción

Después de estar en una sala de chat por aproximadamente 5 minutos sin
enviar mensajes, el botón de enviar deja de funcionar. El mensaje se
escribe pero no se envía al tocar el botón.

### Pasos para Reproducir

1. Login como cliente
2. Abrir chat con agente
3. Enviar mensaje inicial
4. Esperar 5 minutos sin interactuar
5. Escribir nuevo mensaje
6. Tocar botón de enviar

### Resultado Esperado

El mensaje debe enviarse normalmente sin importar el tiempo transcurrido

### Resultado Actual

El botón no responde, el mensaje no se envía. En consola aparece error:
"Session expired"

### Evidencia

- Screenshot: [adjunto]
- Console log: "Error: JWT expired at..."

### Workaround

Cerrar y volver a abrir el chat. Esto refresca la sesión.

### Notas Adicionales

Posiblemente relacionado con el refresh automático de JWT token.
Verificar configuración de Supabase Auth.
```

---

## ✅ Checklist de QA

### Pre-Release Checklist

**Funcionalidad**

- [ ] Todos los casos de prueba críticos pasan
- [ ] Todos los casos de prueba de alta prioridad pasan
- [ ] Flujos E2E completos funcionan
- [ ] No hay bugs bloqueadores abiertos
- [ ] No hay bugs críticos abiertos

**Performance**

- [ ] Tiempos de respuesta dentro de SLA
- [ ] Uso de memoria aceptable
- [ ] No hay memory leaks
- [ ] Animaciones fluidas (60 FPS)

**UX/UI**

- [ ] Todas las pantallas siguen guía de diseño
- [ ] Textos sin errores ortográficos
- [ ] Imágenes cargando correctamente
- [ ] Navegación intuitiva
- [ ] Estados de loading visibles

**Seguridad**

- [ ] Autenticación funciona correctamente
- [ ] Permisos RLS validados
- [ ] Datos sensibles no expuestos en logs
- [ ] HTTPS en todas las conexiones

**Compatibilidad**

- [ ] Probado en iOS (versión mínima)
- [ ] Probado en Android (versión mínima)
- [ ] Probado en diferentes tamaños de pantalla
- [ ] Modo portrait funcional
- [ ] Modo landscape funcional (si aplica)

**Datos**

- [ ] Migraciones aplicadas correctamente
- [ ] Datos de prueba disponibles
- [ ] Backup de producción creado

**Documentación**

- [ ] Release notes actualizadas
- [ ] Changelog actualizado
- [ ] Known issues documentados
- [ ] Manual de usuario actualizado

---

## 🛠️ Herramientas y Scripts

### Script de Pruebas Automatizadas

```bash
# Ejecutar prueba de solicitudes
node scripts/test-requests-creation.js

# Ejecutar prueba de autenticación
node scripts/test-auth-flow.js

# Ejecutar suite completa
npm run test:e2e
```

### Herramientas Recomendadas

**Testing**

- Jest - Unit tests
- Detox - E2E tests para React Native
- Postman - API testing manual

**Debugging**

- React DevTools
- Flipper
- Chrome DevTools (para web)

**Monitoreo**

- Supabase Dashboard - DB queries
- Expo DevTools - Build/deploy

**Reportes**

- Jira / Linear - Bug tracking
- TestRail - Test case management
- Confluence - Documentación

---

## 📊 Métricas de QA

### KPIs a Monitorear

| Métrica                        | Target  | Crítico  |
| ------------------------------ | ------- | -------- |
| Test Coverage                  | > 80%   | < 60%    |
| Bugs encontrados en QA         | N/A     | N/A      |
| Bugs encontrados en producción | < 5/mes | > 20/mes |
| Tiempo promedio de fix         | < 48h   | > 7 días |
| Tests ejecutados               | 100%    | < 80%    |
| Tests que pasan                | > 95%   | < 85%    |

### Reporte Semanal de QA

```markdown
## Reporte QA - Semana XX/2025

### Resumen

- Tests ejecutados: 150
- Tests exitosos: 142 (94.7%)
- Tests fallidos: 8 (5.3%)
- Bugs nuevos: 12
- Bugs cerrados: 15
- Bugs abiertos: 23

### Bugs Críticos

- BUG-042: Chat no envía después de 5 min [EN PROGRESO]

### Bugs de Alta Prioridad

- BUG-043: Notificaciones no llegan en iOS [NUEVO]
- BUG-044: Solicitud no actualiza estado [RESUELTO]

### Áreas de Riesgo

- Módulo de chat presenta problemas de sesión
- Performance degradada con > 100 solicitudes

### Recomendaciones

- Agregar auto-refresh de sesión
- Implementar paginación en lista de solicitudes
```

---

## 📞 Contacto y Soporte

### Escalación de Issues

**Nivel 1:** Tester QA

- Ejecuta pruebas
- Reporta bugs
- Verifica fixes

**Nivel 2:** QA Lead

- Revisa reportes
- Prioriza bugs
- Coordina con desarrollo

**Nivel 3:** Desarrollo

- Fix de bugs
- Implementación de features
- Code reviews

**Nivel 4:** Arquitecto / CTO

- Decisiones técnicas
- Arquitectura
- Performance crítica

---

## 📚 Recursos Adicionales

### Documentación Relacionada

- [WIKI Completa](./WIKI-COMPLETA.md)
- [Manual Técnico](./MANUAL-TECNICO.md)
- [Matriz de Pruebas](./MATRIZ-PRUEBAS.md)

### Links Útiles

- Expo Docs: https://docs.expo.dev
- Supabase Docs: https://supabase.com/docs
- React Native Testing: https://reactnative.dev/docs/testing-overview

---

**Documento mantenido por:** Equipo de QA ELMEC
**Última actualización:** Octubre 2025
**Versión:** 1.0.0
