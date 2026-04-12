# Especificación de Feature: Aprobación de Registro de Clientes

Esta feature implementa un flujo de seguridad donde todo nuevo cliente registrado entra en un estado de "Pendiente" y requiere la aprobación manual de un administrador de ELMEC antes de poder acceder a la plataforma.

---

## 📋 Casos de Uso

### 1. Registro de Nuevo Cliente

- **Actor**: Visitante / Prospecto de Cliente.
- **Acción**: Completa el formulario de registro.
- **Resultado**: El sistema crea el usuario con `status_aprobacion = 'pendiente'`. Se le muestra un mensaje informando que su cuenta está en revisión.

### 2. Intento de Login (Sin Aprobación)

- **Actor**: Cliente Pendiente.
- **Acción**: Intenta iniciar sesión con sus credenciales.
- **Resultado**: El sistema valida las credenciales pero bloquea el acceso con un mensaje: _"Tu cuenta aún no ha sido aprobada por el equipo de ELMEC. Te notificaremos por correo una vez activada."_

### 3. Gestión de Aprobaciones (Admin)

- **Actor**: Administrador de ELMEC.
- **Acción**: Accede al nuevo módulo "Gestión de Clientes" en el Dashboard.
- **Resultado**: Visualiza una lista de usuarios filtrada por estado y **zona geográfica** (Norte, Sur, Centro, Este, Oeste). Puede **Aprobar** o **Rechazar** con un solo clic.

### 4. Acceso Post-Aprobación

- **Actor**: Cliente Aprobado.
- **Acción**: Recibe notificación de activación e inicia sesión.
- **Resultado**: Acceso total a la plataforma (Solicitudes, Chat, Calculadoras).

---

## 🛠️ Flujo de Datos (Desarrollo)

1. **Base de Datos**:
   - Agregar columna `status_aprobacion` (enum: 'pendiente', 'aprobado', 'rechazado') a la tabla `users`.
   - Valor por defecto: `'pendiente'`.

2. **Backend / Auth**:
   - Modificar `AuthContext.tsx` -> `login`: Después de validar el password, verificar si el status es `'aprobado'`.
   - Modificar `AuthContext.tsx` -> `register`: Asegurar que el insert inicial incluya el status pendiente.

3. **Frontend (Admin)**:
   - Crear componente `UserApprovalManagement.tsx` con pestañas: "Pendientes", "Aprobados", "Rechazados".
   - **Filtrado por Zona**: Implementado un selector horizontal de zonas para segmentar la aprobación por región geográfica.
   - Botones de acción rápida: `Aprobar` (cambia status a aprobado y `activo` a true) y `Rechazar`.

4. **Notificaciones**:
   - Al aprobar, disparar una notificación de sistema al usuario informando de su activación.
