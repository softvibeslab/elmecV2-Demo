# Flujos de Trabajo por Actor - ELMEC V2 Demo

Este documento detalla los flujos operativos para los dos actores principales del sistema: **Cliente** y **Agente**.

---

## 👤 Actor: Cliente (Customer)

El Cliente es el usuario final que utiliza la plataforma para gestionar sus requerimientos técnicos y comerciales con ELMEC.

### 1. Gestión de Solicitudes (CRM)

1. **Creación de Solicitud**: El cliente inicia un ticket detallando el problema o requerimiento.
   - Define: Título, Mensaje, Tipo de Servicio y Prioridad.
   - **Selección de Agente**: El sistema sugiere agentes basados en la zona geográfica del cliente.
   - **Adjuntos**: El cliente puede subir fotos de piezas, diagramas en PDF o audios explicando la situación.
2. **Seguimiento**: Consulta el estado en tiempo real (Nuevo, Asignado, En Proceso, Resuelto).
3. **Notificaciones**: Recibe alertas push/in-app ante cualquier cambio de estatus o mensaje nuevo.

### 2. Comunicación en Tiempo Real

1. **Chat Directo**: Una vez asignado un agente, se habilita un canal de comunicación 1:1.
2. **Intercambio Multimedia**: Envío de evidencias visuales o grabaciones de audio para agilizar el diagnóstico.
3. **Confirmación de Lectura**: El cliente ve si su mensaje ha sido entregado y leído (estilo WhatsApp).

### 3. Herramientas de Valor Agregado

1. **Calculadoras Industriales**: Acceso a las calculadoras de Barrenado y Fresado para cálculos técnicos rápidos en campo.
2. **Directorio**: Consulta de contactos clave dentro de ELMEC autorizados para su zona.

---

## 👷 Actor: Agente (Agent)

El Agente es el experto técnico de ELMEC responsable de la resolución de solicitudes y atención al cliente.

### 1. Gestión Operativa de Tickets

1. **Bandeja de Entrada Inteligente**:
   - Ve solicitudes asignadas directamente a su perfil.
   - Ve solicitudes "Sin Asignar" que corresponden a su zona geográfica asignada.
2. **Control de Estatus**: El agente actualiza el ciclo de vida del ticket (e.g., de 'Asignado' a 'En Proceso' al iniciar el diagnóstico).
3. **Filtros Avanzados**: Capacidad de filtrar por urgencia, cliente o estatus para priorizar la jornada laboral.

### 2. Comunicación y Colaboración

1. **Atención al Cliente**: Responde dudas y solicita más información a través del chat vinculado a la solicitud.
2. **Chats Internos**: Acceso a canales de comunicación exclusivos para personal de ELMEC (Agentes y Admins) para consultas internas.
3. **Gestión de Grupos**: Capacidad de crear chats grupales involucrando a otros especialistas o incluso al cliente para proyectos complejos.

### 3. Monitoreo y Proactividad

1. **Indicadores de Presencia**: Monitorea si el cliente está en línea para una comunicación síncrona.
2. **Historial de Interacciones**: Acceso al histórico de mensajes y archivos de la solicitud para mantener la continuidad del servicio.

---

## 🔑 Roles y Permisos (Resumen Técnico)

| Funcionalidad             |   Cliente   |     Agente     | Admin |
| :------------------------ | :---------: | :------------: | :---: |
| Crear Solicitudes         |     ✅      |       ❌       |  ❌   |
| Ver todas las solicitudes |     ❌      | ⚠️ (Solo zona) |  ✅   |
| Cambiar Estatus           |     ❌      |       ✅       |  ✅   |
| Chat con Clientes         | ✅ (Propio) |       ✅       |  ✅   |
| Chats Internos            |     ❌      |       ✅       |  ✅   |
| Configurar Usuarios       |     ❌      |       ❌       |  ✅   |

> **Nota**: El rol de **Admin** posee todas las capacidades del Agente, sumando la gestión global de usuarios, zonas y configuraciones del sistema.
