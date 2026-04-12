# Guía de Solución de Problemas - Carga de Archivos

## Problemas Comunes y Soluciones

### 1. No se puede adjuntar archivos o imágenes

#### Causa: Permisos no configurados

**Solución:**

1. Verifica que los plugins estén configurados en `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "La app necesita acceso a tus fotos...",
          "cameraPermission": "La app necesita acceso a tu cámara..."
        }
      ],
      [
        "expo-document-picker",
        {
          "iCloudContainerEnvironment": "Production"
        }
      ]
    ]
  }
}
```

2. **Para desarrollo con Expo Go:**
   - Los permisos se solicitan automáticamente al usar la funcionalidad
   - Si rechazaste los permisos, ve a Configuración → Expo Go → Permisos

3. **Para builds nativos:**
   - Ejecuta `npx expo prebuild --clean` después de modificar `app.json`
   - Rebuild la app: `npx expo run:android` o `npx expo run:ios`

### 2. Error: "Bucket 'request-files' no existe"

#### Causa: El bucket de Supabase no está creado

**Solución:**

1. Ve al dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Haz clic en **"New bucket"**
5. Configura el bucket:
   - **Name:** `request-files`
   - **Public:** ✅ Activado
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** Deja vacío o agrega: `image/*,application/pdf,text/*`

6. Configura las políticas de seguridad:

**Política 1: Lectura pública**

```sql
-- Nombre: Public read access
-- Operación: SELECT
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'request-files');
```

**Política 2: Upload para autenticados**

```sql
-- Nombre: Authenticated users can upload
-- Operación: INSERT
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-files');
```

**Política 3: Actualizar propios archivos**

```sql
-- Nombre: Users can update own files
-- Operación: UPDATE
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'request-files' AND auth.uid()::text = owner)
WITH CHECK (bucket_id = 'request-files' AND auth.uid()::text = owner);
```

**Política 4: Eliminar propios archivos**

```sql
-- Nombre: Users can delete own files
-- Operación: DELETE
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'request-files' AND auth.uid()::text = owner);
```

### 3. Error: "File too large" o "El archivo es muy grande"

#### Causa: El archivo excede el límite de 5MB

**Solución:**

1. Reduce el tamaño de la imagen antes de subirla
2. Para imágenes, el componente ya reduce la calidad a 0.8
3. Si necesitas archivos más grandes:
   - Modifica `maxSizeInMB` en `FileUploadComponent`
   - Ajusta el límite en Supabase Storage
   - Actualiza la validación en `utils/fileUpload.ts`:

```typescript
const maxSize = 10 * 1024 * 1024; // Cambiar a 10MB
```

### 4. La cámara no funciona

#### Causa: Plataforma web o permisos denegados

**Solución:**

1. El botón de cámara solo aparece en plataformas nativas (Android/iOS)
2. En web, usa el botón "Galería" para seleccionar archivos
3. Si estás en dispositivo nativo:
   - Verifica permisos en Configuración del dispositivo
   - Reinstala la app si es necesario

### 5. Los archivos no se ven en la solicitud

#### Causa: Error en el upload o problema de red

**Solución:**

1. Verifica la consola para errores:

```bash
# En Expo
npx expo start
# Revisa los logs en la terminal
```

2. Verifica que el archivo se subió a Supabase:
   - Ve a Storage → request-files en el dashboard
   - Busca archivos recientes

3. Verifica el campo `archivos` en la tabla `requests`:

```sql
SELECT id, titulo, archivos, metadata
FROM requests
WHERE id = 'tu-request-id';
```

### 6. Error: "No se pudo leer el archivo"

#### Causa: Problema con permisos del sistema de archivos

**Solución:**

1. **Android:**
   - Ve a Configuración → Apps → [Tu App] → Permisos
   - Activa "Almacenamiento" y "Cámara"

2. **iOS:**
   - Ve a Configuración → [Tu App] → Permisos
   - Activa "Fotos" y "Cámara"

3. Si persiste, limpia el cache:

```bash
npx expo start --clear
```

## Verificar que todo funciona

### Checklist:

- [ ] Los plugins están configurados en `app.json`
- [ ] El bucket `request-files` existe en Supabase
- [ ] Las políticas de seguridad están configuradas
- [ ] Los permisos están otorgados en el dispositivo
- [ ] La app puede seleccionar archivos/fotos
- [ ] La app puede tomar fotos (solo nativo)
- [ ] Los archivos se suben correctamente a Supabase
- [ ] Los archivos aparecen en la solicitud creada

## Testing

### Test Manual:

1. Abre la app
2. Ve a Solicitudes → Botón "+"
3. Llena el formulario
4. Haz clic en "Archivo" → Selecciona un PDF o documento
5. Haz clic en "Galería" → Selecciona una imagen
6. (Solo nativo) Haz clic en "Cámara" → Toma una foto
7. Verifica que los archivos aparecen en la lista
8. Envía la solicitud
9. Verifica que la solicitud muestra "📎 X archivos adjuntos"

### Comandos útiles:

```bash
# Limpiar cache y reconstruir
npx expo start --clear

# Rebuild nativo (después de cambios en app.json)
npx expo prebuild --clean
npx expo run:android
# o
npx expo run:ios

# Ver logs
npx expo start
# Presiona 'j' para abrir Chrome DevTools
```

## Contacto de Soporte

Si los problemas persisten después de seguir esta guía:

1. Revisa los logs de la consola
2. Verifica la configuración de Supabase
3. Contacta al equipo de desarrollo con:
   - Descripción del error
   - Logs de la consola
   - Plataforma (Android/iOS/Web)
   - Pasos para reproducir
