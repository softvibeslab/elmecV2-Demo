# 📋 Configuración de Supabase Storage - PASO A PASO

## ✅ Estado Actual

- ✅ Bucket `request-files` **CREADO EXITOSAMENTE**
- ⚠️ Faltan configurar las políticas de seguridad

## 🔐 Configurar Políticas de Seguridad (IMPORTANTE)

### Paso 1: Acceder al Dashboard de Supabase

1. Abre tu navegador
2. Ve a: https://app.supabase.com
3. Inicia sesión
4. Selecciona tu proyecto

### Paso 2: Ir a Storage Policies

1. En el menú lateral, haz clic en **"Storage"**
2. Haz clic en **"Policies"** en la parte superior
3. Verás dos tablas: `buckets` y `objects`
4. Trabajaremos en la tabla **`objects`**

---

## 📝 POLÍTICA 1: Lectura Pública (Public Read Access)

**Esta política permite que cualquiera pueda ver/descargar los archivos**

### Pasos:

1. En la tabla **`objects`**, haz clic en **"New Policy"**
2. Selecciona **"Create a policy from scratch"** (o template "Public access")
3. Llena el formulario:

```
Policy Name: Public read access
```

4. En **"Allowed operation"**, selecciona: **SELECT** ✅

5. En **"Target roles"**, selecciona: **public**

6. En el campo **"USING expression"**, pega:

```sql
bucket_id = 'request-files'
```

7. Haz clic en **"Review"** y luego **"Save policy"**

✅ **Política 1 completada**

---

## 📝 POLÍTICA 2: Upload para Usuarios Autenticados

**Esta política permite que usuarios logueados puedan subir archivos**

### Pasos:

1. Haz clic en **"New Policy"** de nuevo
2. Selecciona **"Create a policy from scratch"**
3. Llena el formulario:

```
Policy Name: Authenticated users can upload
```

4. En **"Allowed operation"**, selecciona: **INSERT** ✅

5. En **"Target roles"**, selecciona: **authenticated**

6. En el campo **"WITH CHECK expression"**, pega:

```sql
bucket_id = 'request-files'
```

7. Haz clic en **"Review"** y luego **"Save policy"**

✅ **Política 2 completada**

---

## 📝 POLÍTICA 3: Actualizar Propios Archivos

**Esta política permite que usuarios actualicen solo sus propios archivos**

### Pasos:

1. Haz clic en **"New Policy"** de nuevo
2. Selecciona **"Create a policy from scratch"**
3. Llena el formulario:

```
Policy Name: Users can update own files
```

4. En **"Allowed operation"**, selecciona: **UPDATE** ✅

5. En **"Target roles"**, selecciona: **authenticated**

6. En el campo **"USING expression"**, pega:

```sql
bucket_id = 'request-files' AND auth.uid()::text = owner
```

7. En el campo **"WITH CHECK expression"**, pega:

```sql
bucket_id = 'request-files' AND auth.uid()::text = owner
```

8. Haz clic en **"Review"** y luego **"Save policy"**

✅ **Política 3 completada**

---

## 📝 POLÍTICA 4: Eliminar Propios Archivos

**Esta política permite que usuarios eliminen solo sus propios archivos**

### Pasos:

1. Haz clic en **"New Policy"** de nuevo
2. Selecciona **"Create a policy from scratch"**
3. Llena el formulario:

```
Policy Name: Users can delete own files
```

4. En **"Allowed operation"**, selecciona: **DELETE** ✅

5. En **"Target roles"**, selecciona: **authenticated**

6. En el campo **"USING expression"**, pega:

```sql
bucket_id = 'request-files' AND auth.uid()::text = owner
```

7. Haz clic en **"Review"** y luego **"Save policy"**

✅ **Política 4 completada**

---

## ✅ Verificación Final

Una vez creadas las 4 políticas, deberías ver:

```
storage.objects policies:

✅ Public read access          (SELECT)
✅ Authenticated users can upload  (INSERT)
✅ Users can update own files      (UPDATE)
✅ Users can delete own files      (DELETE)
```

## 🧪 Probar la Configuración

Después de configurar las políticas, ejecuta:

```bash
node scripts/check-storage-bucket.js
```

Deberías ver:

```
✅ El bucket 'request-files' EXISTE
✅ El bucket es accesible
✨ Todo está configurado correctamente!
```

---

## 🚀 Siguiente Paso

Una vez completada la configuración de Supabase:

```bash
npx expo start --clear
```

Y ¡listo! La funcionalidad de carga de archivos estará funcionando completamente.

---

## 📸 Capturas de Pantalla de Referencia

### Cómo se ve "New Policy":

```
┌─────────────────────────────────────┐
│  Policy name                        │
│  ┌───────────────────────────────┐  │
│  │ Public read access            │  │
│  └───────────────────────────────┘  │
│                                     │
│  Allowed operation                  │
│  ☐ SELECT  ☐ INSERT                │
│  ☐ UPDATE  ☐ DELETE                │
│                                     │
│  Target roles                       │
│  ○ public  ○ authenticated         │
│  ○ service_role  ○ anon            │
│                                     │
│  USING expression                   │
│  ┌───────────────────────────────┐  │
│  │ bucket_id = 'request-files'   │  │
│  └───────────────────────────────┘  │
│                                     │
│  WITH CHECK expression              │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Review ] [ Cancel ]              │
└─────────────────────────────────────┘
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué necesito estas políticas?

Supabase usa Row Level Security (RLS) para proteger los datos. Sin políticas, nadie puede acceder a los archivos, ni siquiera leerlos.

### ¿Puedo usar templates en lugar de crear desde cero?

Sí, puedes usar los templates de Supabase, pero asegúrate de modificar el `bucket_id` a `'request-files'`.

### ¿Qué pasa si me equivoco?

Puedes editar o eliminar políticas en cualquier momento desde el dashboard.

### ¿Cómo sé si funcionó?

Ejecuta `node scripts/check-storage-bucket.js` y intenta subir un archivo desde la app.

---

## 📞 Soporte

Si tienes problemas:

1. Revisa que las 4 políticas estén creadas
2. Verifica que el bucket sea público
3. Ejecuta el script de verificación
4. Revisa los logs en `npx expo start`
