---
description: Plan de implementación para conectar Actividad Reciente y visualizar Adjuntos
---

# Plan Estructurado: Actividad Reciente y Visor de Adjuntos

Este plan detalla los pasos para dinamizar el widget de "Actividad Reciente" en el Home y habilitar la visualización de archivos adjuntos en el detalle de las solicitudes.

## 1. Conectar Widget "Actividad Reciente" (Home)

**Objetivo:** Reemplazar los datos estáticos (`recentActivity`) en `app/(tabs)/index.tsx` por datos reales obtenidos de Supabase.

### 1.1. Modificaciones en `app/(tabs)/index.tsx`
- **Imports:** Importar `supabase`, `useFocusEffect` (opcional, o `useEffect`), y tipos necesarios.
- **Estado:** Crear estados para `recentRequests` y `loading`.
- **Lógica de Fetch (`loadRecentActivity`):**
    - Consultar tabla `requests` con un `JOIN` para obtener nombre del agente/usuario.
    - Filtrar por rol:
        - Si es **cliente**: `usuario_id = user.id`.
        - Si es **agente/admin**: `agente_id = user.id` (o mostrar las no asignadas de su zona si se desea proactividad).
    - Ordenar por `updated_at` descendente.
    - Limitar a 5 items.
- **Renderizado:**
    - Mapear `recentRequests` en lugar de la variable estática.
    - Mostrar indicador de carga (`ActivityIndicator`) si es necesario.
    - Manejar estado vacío (mostrar mensaje "No hay actividad reciente").
    - Formatear fecha relativa (hace X horas/días).

## 2. Implementar Visor de Adjuntos (Detalle de Solicitud)

**Objetivo:** Permitir que los usuarios abran y visualicen las imágenes y documentos PDF adjuntos en las solicitudes.

### 2.1. Análisis Exisente en `app/(tabs)/requests.tsx`
- Revisar cómo se guardan los adjuntos en la base de datos (array de strings: URLs).
- Revisar cómo se renderizan actualmente (parece que hay chips o lista, pero no interactivos).

### 2.2. Implementación de Visualización
- **Componente `ImageViewer`:** Reutilizar el componente `components/ImageViewer.tsx` que ya se usa en Chat.
- **Manejo de PDFs/Docs:**
    - Para documentos no imagen, usar `Linking.openURL(url)` para abrir en el navegador/visor del sistema operativo.
- **Acciones:**
    - Al hacer tap en un adjunto:
        - Si es imagen -> Abrir modal `ImageViewer` con la imagen seleccionada.
        - Si es otro archivo -> Ejecutar `Linking.openURL`.

### 2.3. Modificaciones en `app/(tabs)/requests.tsx`
- Importar `ImageViewer` y `Linking`.
- Añadir estado para el visor de imágenes (`viewerVisible`, `currentImageIndex`, `imagesList`).
- Modificar el renderizado de la lista de adjuntos (`attachments array`) para que sean `TouchableOpacity`.
- Implementar función `handleAttachmentPress(url)`.

## 3. Pasos de Ejecución

1. **Home Dinámico:**
   - Editar `app/(tabs)/index.tsx`.
   - Implementar `loadRecentActivity`.
   - Probar carga de datos.

2. **Visor de Adjuntos:**
   - Editar `app/(tabs)/requests.tsx`.
   - Integrar `ImageViewer`.
   - Implementar lógica de apertura de PDFs.
   - Probar con adjuntos reales.

3. **Validación:**
   - Verificar que el Home muestra las últimas solicitudes creadas/editadas.
   - Verificar que al tocar una imagen en solicitud se abre en pantalla completa.
   - Verificar que al tocar un PDF se abre el navegador.
