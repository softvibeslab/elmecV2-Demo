# Plan de QA - ELMEC App

**Fecha de inicio:** 2025-10-21
**Documento fuente:** docs/QA/qa.pdf
**Assets de diseño:** assets/images/branding/

---

## Paleta de Colores Oficial

### Colores principales

- **Azul oscuro (Primary):** `#202B52` - Pantone 533 C
- **Azul medio:** `#335686` - Pantone 653 C
- **Azul claro:** `#95C3ED` - Pantone 283 C
- **Gris:** `#A8B5BD` - Cool Gray 5 C
- **Blanco:** `#FFFFFF`
- **Negro:** `#000000`

### Assets disponibles

- Logo ELMEC: `assets/images/branding/logo.png`
- Paleta de colores: `assets/images/branding/colores.jpg`
- Paleta de colores app: `assets/images/branding/coloresapp.jpg`

---

## Issues Identificados

### 🔴 Críticos - Problemas de Navegación

#### 1. Pantallas en Standby

- [ ] **Nueva Solicitud se queda en standby** (Página 1)
  - Archivo: Identificar componente de nueva solicitud
  - Acción: Investigar y corregir carga infinita

- [ ] **Sección de Chats se queda en standby** (Página 2)
  - Archivo: Componente de chats
  - Acción: Verificar carga de conversaciones

- [ ] **Botón Enviar en Nueva Solicitud se queda en standby** (Página 8)
  - Archivo: Formulario de solicitud
  - Acción: Revisar envío de datos y manejo de errores

#### 2. Botones sin Funcionalidad

- [ ] **Botón Charlar no muestra información** (Página 3)
  - Archivo: Componente de perfil/directorio
  - Acción: Implementar navegación a chat

- [ ] **Botones "Solicitud" y "Charlar" en perfil del vendedor no funcionan** (Página 4)
  - Archivo: Perfil de vendedor
  - Acción: Conectar botones con acciones correctas

- [ ] **Botón "..." en inicio no está activo para ver historial** (Página 11)
  - Archivo: Pantalla de inicio
  - Acción: Activar menú de opciones

#### 3. Configuración sin Datos

- [ ] **Configuración de cuenta no muestra/edita información** (Página 6)
  - Archivo: Settings/Configuración
  - Acción: Implementar formulario de edición

- [ ] **Ver solicitudes por estatus en perfil no tiene datos** (Página 5)
  - Archivo: Perfil de usuario
  - Acción: Implementar filtro de solicitudes por estatus

---

### 🟡 Medios - Limpieza de Datos

#### 4. Directorio de Contactos

- [ ] **Mostrar solo 15 contactos en lugar de 20** (Página 1)
  - Archivo: Lista de contactos/directorio
  - Acción: Ajustar query o filtro a 15

#### 5. Opciones en Nueva Solicitud

- [ ] **Actualizar Tipo de Solicitud:** Ventas, Soporte, Cotización, Rastreo de pedidos (Página 7)
  - Archivo: Formulario de solicitud / constants
  - Acción: Actualizar opciones del dropdown

- [ ] **Quitar "Medios de comunicación" de Prioridad** (Página 7)
  - Archivo: Formulario de solicitud
  - Acción: Remover opción del selector de prioridad

- [ ] **Quitar "asignación automática" de Agente destino** (Página 7)
  - Archivo: Formulario de solicitud
  - Acción: Remover opción del selector de agente

#### 6. Limpieza de Agentes

- [ ] **Eliminar agentes:** Ana García Morales, Carlos Mendoza Silva, Luis Ramírez Torres (Página 7)
  - Archivo: Base de datos / seeding
  - Acción: Eliminar de BD o filtrar en queries

- [ ] **Quitar palabra "nulo" de nombres de agentes** (Página 7, 9)
  - Archivo: Base de datos / componente de agentes
  - Acción: Limpiar datos o filtrar en display

---

### 🟢 Mejoras - Funcionalidades Nuevas

#### 7. Sistema de Fotos

- [ ] **Implementar fotos de vendedores** (Página 9)
  - Fuente: https://drive.google.com/drive/folders/1WOi5J9gcRSCnmIQoWVntFLR29HTwmcMX
  - Acción: Descargar fotos, agregar a assets, conectar con perfiles

#### 8. Elementos de Diseño

- [ ] **Agregar logo ELMEC en todas las pantallas** (Página 10)
  - Asset: `assets/images/branding/logo.png`
  - Ubicación: Superior derecha o izquierda
  - Acción: Crear componente Header con logo

- [ ] **Agregar elementos de diseño en pantalla principal** (Página 10)
  - Assets: LOGO_MFR.png, CAMIÓN2_MFR.png
  - Fuente: https://drive.google.com/drive/folders/1_4UMfLY7PuXYedITp1E3qTshK6IXXOVk
  - Acción: Descargar e integrar en pantalla de inicio

#### 9. Sincronización

- [ ] **Sincronizar conversaciones del dashboard con la app** (Página 12)
  - Archivo: API de chats / sincronización
  - Acción: Verificar que las conversaciones se muestren correctamente en ambas plataformas

---

## Priorización de Tareas

### Sprint 1: Problemas Críticos

1. Arreglar pantalla Nueva Solicitud en standby
2. Arreglar sección de Chats en standby
3. Arreglar botón Enviar en Nueva Solicitud
4. Arreglar botones Charlar y Solicitud en perfil

### Sprint 2: Limpieza de Datos

5. Corregir directorio a 15 contactos
6. Actualizar tipos de solicitud
7. Limpiar opciones de Prioridad y Agente destino
8. Eliminar agentes no válidos y palabra "nulo"

### Sprint 3: Mejoras y Diseño

9. Implementar configuración de cuenta
10. Implementar vista de solicitudes por estatus
11. Agregar logo ELMEC en todas las pantallas
12. Agregar elementos de diseño en pantalla principal
13. Implementar fotos de vendedores
14. Activar botón menú para historial

### Sprint 4: Sincronización

15. Sincronizar conversaciones dashboard con app

---

## Notas de Implementación

### Archivos clave a revisar

- `app/(tabs)/index.tsx` - Pantalla de inicio
- `app/(tabs)/requests.tsx` - Solicitudes
- `constants/commons.ts` - Constantes comunes
- Componentes de Chat, Directorio, Perfil

### Enlaces útiles

- **Fotos de vendedores:** https://drive.google.com/drive/folders/1WOi5J9gcRSCnmIQoWVntFLR29HTwmcMX
- **Elementos de diseño:** https://drive.google.com/drive/folders/1_4UMfLY7PuXYedITp1E3qTshK6IXXOVk

---

## Progreso

**Total de tareas:** 18
**Completadas:** 0
**En progreso:** 0
**Pendientes:** 18

**Última actualización:** 2025-10-21
