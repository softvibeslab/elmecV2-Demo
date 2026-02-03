# 📱 ElmecV2 - Casos de Uso y Flujos de Usuario

Este documento detalla los actores, casos de uso y flujos principales de la aplicación ElmecV2.

> **💡 Dashboard Interactivo:** Para visualizar estos flujos de manera interactiva, abre el archivo `docs/flow_dashboard.html` en tu navegador.

---

## 👥 Actores y Roles

| Actor | Rol | Descripción |
| :--- | :--- | :--- |
| **Cliente** | Usuario | Personal industrial que reporta fallas, solicita cotizaciones o soporte. |
| **Agente** | Técnico | Experto que recibe solicitudes, diagnostica y resuelve problemas vía chat. |
| **Admin** | Supervisor | Gestiona usuarios, monitorea KPIs y supervisa tiempos de respuesta. |

---

## 🔄 Flujos Principales

### 1. 🚨 Ciclo de Reparación de Emergencia (Flujo Principal)
**Objetivo:** El cliente reporta una falla crítica y recibe atención inmediata.

1. **Inicio de Sesión:** El cliente accede a la app.
2. **Crear Solicitud:**
   - Título: "Error E404 en Torno CNC"
   - Prioridad: **Urgente**
   - Tipo: **Soporte**
3. **Sistema (Automático):**
   - Valida la información.
   - Crea el ticket en base de datos.
   - **Asigna Agente** automáticamente según zona/disponibilidad.
   - **Crea Sala de Chat** dedicada.
4. **Notificación:** El agente recibe alerta "Nueva solicitud asignada".

### 2. 🛠️ Respuesta y Resolución del Agente
**Objetivo:** El agente diagnostica y resuelve el problema reportado.

1. **Recepción:** Agente abre la notificación o lista de solicitudes.
2. **Análisis:**
   - Revisa el estado (Amarillo/Nuevo).
   - Lee descripción y ve fotos adjuntas.
3. **Interacción (Chat):**
   - Solicita pruebas adicionales (ej: "Foto del manómetro").
   - Cliente responde en tiempo real.
4. **En Proceso:** Agente cambia estado a **"En Proceso"** (Verde).
5. **Resolución:**
   - Problema solucionado.
   - Agente cambia estado a **"Resuelto"** (Azul).

### 3. 📊 Supervisión Administrativa
**Objetivo:** Asegurar calidad y tiempos de respuesta.

1. **Monitoreo:** Admin revisa el Dashboard Principal.
2. **Detección de Bloqueos:**
   - Identifica semáforos en **Rojo** (Solicitudes "Sin Atender" por > 3 días).
3. **Auditoría:**
   - Entra al detalle de la solicitud.
   - Revisa el historial del chat para ver por qué se detuvo.
4. **Acción:** Reasigna a otro agente o contacta al cliente directamente.

---

## 🚦 Lógica de Estados (Semáforo)

El sistema utiliza colores para indicar la urgencia:

- 🔴 **Rojo (Sin Atender):** Solicitud nueva > 3 días o En Proceso > 5 días sin cambios.
- 🟡 **Amarillo (Nuevo):** Solicitud recién creada.
- 🟢 **Verde (En Proceso):** Agente trabajando activamente.
- 🔵 **Azul (Resuelto):** Ciclo completado.

---

## 🧮 Herramientas Industriales
- **Calculadora de Barrenado:** RPM, Avance.
- **Calculadora de Fresado:** Velocidad de corte, Avance por diente.
