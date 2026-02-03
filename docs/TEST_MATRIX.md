# 🧪 Matriz de Pruebas - ElmecV2

Este documento define la matriz de pruebas para validar la funcionalidad crítica de la aplicación ElmecV2.

> **📊 Dashboard de Ejecución:** Para ejecutar estas pruebas de manera interactiva, utiliza `docs/test_dashboard.html`.

---

## 1. 🔐 Autenticación y Seguridad

| ID | Caso de Prueba | Pre-condición | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Login Exitoso (Cliente) | App abierta, sin sesión | 1. Ingresar `cliente@gmail.com`<br>2. Ingresar password<br>3. Tap "Ingresar" | Acceso concedido, redirigido a Home de Cliente. |
| **AUTH-02** | Login Fallido (Credenciales) | App abierta | 1. Ingresar email válido<br>2. Ingresar password erróneo | Mensaje de error "Credenciales inválidas". |
| **AUTH-03** | Persistencia de Sesión | Usuario logueado | 1. Cerrar app completamente<br>2. Reabrir app | Usuario ingresa directo sin login. |
| **AUTH-04** | Logout | Usuario logueado | 1. Ir a Perfil<br>2. Tap "Cerrar Sesión" | Redirigido a pantalla de Login. |

## 2. 📝 Gestión de Solicitudes (Cliente)

| ID | Caso de Prueba | Pre-condición | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Crear Solicitud Simple | Logueado como Cliente | 1. Tap "Nueva Solicitud"<br>2. Llenar Título y Mensaje<br>3. Enviar | Solicitud creada, aparece en lista con estado "Nuevo". |
| **REQ-02** | Creación con Archivos | Logueado como Cliente | 1. Tap "Nueva Solicitud"<br>2. Adjuntar imagen < 5MB<br>3. Enviar | Solicitud creada, imagen visible en detalles. |
| **REQ-03** | Validación de Campos | Pantalla Nueva Solicitud | 1. Dejar título vacío<br>2. Tap "Enviar" | Alerta "El título es obligatorio". |
| **REQ-04** | Visualización de Estados | Solicitud activa | 1. Ver lista de solicitudes | Indicador de color correcto (Amarillo=Nuevo, Verde=Proceso). |

## 3. 🛠️ Operaciones de Agente

| ID | Caso de Prueba | Pre-condición | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **AGT-01** | Recepción de Solicitud | Agente Logueado | 1. Cliente crea solicitud asignada<br>2. Observar dispositivo agente | Notificación Push recibida. Solicitud aparece en lista. |
| **AGT-02** | Cambio de Estado | En detalle de Solicitud | 1. Tap en selector de estado<br>2. Seleccionar "En Proceso" | Estado cambia a Verde. Cliente ve cambio en tiempo real. |
| **AGT-03** | Chat: Envío Mensaje | En sala de chat | 1. Escribir mensaje<br>2. Tap Enviar | Mensaje aparece en el hilo. Receptor lo ve inmediatamente. |
| **AGT-04** | Cerrar Solicitud | Solicitud "En Proceso" | 1. Cambiar estado a "Resuelto" | Solicitud pasa a histórico/cerradas. Color Azul. |

## 4. 🧮 Herramientas y Utilidades

| ID | Caso de Prueba | Pre-condición | Pasos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **TOOL-01** | Calc. Barrenado | Pantalla Calculadora | 1. Ingresar Diámetro y VC<br>2. Tap "Calcular" | Resultado de RPM correcto según fórmula. |
| **TOOL-02** | Directorio - Búsqueda | Pantalla Directorio | 1. Escribir nombre existente<br>2. Buscar | Lista filtrada mostrando solo coincidencias. |
