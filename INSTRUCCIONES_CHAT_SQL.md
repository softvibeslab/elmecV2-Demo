# 📋 Instrucciones para Agregar Columnas a la Tabla Messages

## ⚠️ IMPORTANTE

Las columnas `reply_to`, `file_name`, `file_size`, `audio_duration`, `edited_at` y `read_by` NO existen actualmente en la tabla `messages` de Supabase.

Esto impide que funcionen las siguientes características del chat:

- ❌ **Responder a mensajes** (reply)
- ❌ **Enviar archivos con metadata** (nombre, tamaño)
- ❌ **Enviar notas de audio** con duración
- ❌ **Editar mensajes**
- ❌ **Tracking de mensajes leídos**

**Tiempo estimado:** 5 minutos

---

## 🎯 Objetivo

Agregar 6 columnas faltantes a la tabla `messages`:

1. **reply_to** - Para responder a mensajes específicos
2. **file_name** - Para almacenar nombre del archivo
3. **file_size** - Para almacenar tamaño en bytes
4. **audio_duration** - Para almacenar duración de audio en segundos
5. **edited_at** - Para rastrear cuándo se editó un mensaje
6. **read_by** - Para tracking de mensajes leídos

---

## 📝 Pasos a Seguir

### Paso 1: Acceder a Supabase Dashboard

1. Abre tu navegador
2. Ve a: **https://app.supabase.com**
3. Inicia sesión con tu cuenta
4. Selecciona tu proyecto

### Paso 2: Abrir SQL Editor

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Verás un editor de código SQL

### Paso 3: Copiar el Script SQL

Copia TODO el siguiente código:

```sql
-- ============================================
-- SCRIPT: Agregar columnas faltantes a messages
-- ============================================

-- 1. Agregar columna reply_to (para responder mensajes)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL;

-- 2. Agregar columnas para archivos adjuntos
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT NULL;

-- 3. Agregar columna para duración de audio
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS audio_duration INTEGER DEFAULT NULL;

-- 4. Agregar columna para rastrear ediciones
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP DEFAULT NULL;

-- 5. Agregar columna read_by (tracking de lectura)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '{}'::jsonb;

-- 6. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_messages_edited_at ON messages(edited_at DESC) WHERE edited_at IS NOT NULL;

-- 7. Agregar comentarios de documentación
COMMENT ON COLUMN messages.reply_to IS 'ID del mensaje al que se está respondiendo (reply)';
COMMENT ON COLUMN messages.file_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN messages.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN messages.audio_duration IS 'Duración del audio en segundos';
COMMENT ON COLUMN messages.edited_at IS 'Timestamp de la última edición del mensaje';
COMMENT ON COLUMN messages.read_by IS 'Objeto JSON con user_ids que leyeron el mensaje';

-- 8. Verificar que las columnas se agregaron
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name IN ('reply_to', 'file_name', 'file_size', 'audio_duration', 'edited_at', 'read_by')
ORDER BY column_name;
```

### Paso 4: Pegar y Ejecutar

1. **Pega** el código SQL en el editor
2. Haz clic en el botón **"Run"** (▶ o "Ejecutar")
3. Espera unos segundos...

### Paso 5: Verificar Resultado

Deberías ver un resultado como este:

```
column_name      | data_type      | is_nullable | column_default
-----------------|----------------|-------------|---------------
audio_duration   | integer        | YES         | NULL
edited_at        | timestamp      | YES         | NULL
file_name        | text           | YES         | NULL
file_size        | integer        | YES         | NULL
read_by          | jsonb          | YES         | '{}'::jsonb
reply_to         | uuid           | YES         | NULL

Query executed successfully
```

✅ **Si ves las 6 filas** = ¡TODO BIEN!

❌ **Si ves un error** = Copia el error y avísame

---

## 🧪 Verificar que Funciona

Después de ejecutar el SQL, regresa a la terminal y ejecuta:

```bash
node scripts/test-chat-module.js
```

**Resultado esperado:**

```
════════════════════════════════════════════════════════════
📊 REPORTE FINAL DE PRUEBAS - MÓDULO DE CHAT
════════════════════════════════════════════════════════════

Total de pruebas:      30+
✅ Pruebas exitosas:     28+
❌ Pruebas fallidas:     0-2

Tasa de éxito:         ~93%+

🎉 ¡LA MAYORÍA DE PRUEBAS DEL MÓDULO DE CHAT PASARON!
```

---

## 📊 ¿Qué Habilita Cada Columna?

| Columna            | Funcionalidad                      | Impacto                                |
| ------------------ | ---------------------------------- | -------------------------------------- |
| **reply_to**       | Responder a mensajes específicos   | 🔴 CRÍTICO - WhatsApp style replies    |
| **file_name**      | Mostrar nombre del archivo adjunto | 🔴 CRÍTICO - UX de archivos            |
| **file_size**      | Mostrar tamaño del archivo         | 🟡 ALTO - Info útil para usuario       |
| **audio_duration** | Mostrar duración de notas de voz   | 🔴 CRÍTICO - Experiencia de audio      |
| **edited_at**      | Indicador de mensaje editado       | 🟡 ALTO - Transparencia                |
| **read_by**        | Doble check azul (leído)           | 🟡 ALTO - WhatsApp style read receipts |

---

## ❓ Preguntas Frecuentes

### ¿Por qué necesito hacer esto?

El código de la app (`ChatContext.tsx` y `[roomId].tsx`) espera que estas columnas existan para:

- **Responder mensajes**: `ChatContext.tsx:380` usa `reply_to`
- **Archivos adjuntos**: `[roomId].tsx:439-440` usa `file_name` y `file_size`
- **Audio**: `[roomId].tsx:530` usa `audio_duration`
- **Editar**: `ChatContext.tsx:803` usa `edited_at`
- **Tracking lectura**: `ChatContext.tsx:709` usa `read_by`

Sin estas columnas, esas funcionalidades fallarán con errores de BD.

### ¿Es seguro ejecutar este script?

✅ **SÍ**, el script es seguro porque:

- Usa `IF NOT EXISTS` - no hace nada si las columnas ya existen
- Solo AGREGA columnas, no modifica ni elimina datos existentes
- Agrega foreign keys con `ON DELETE SET NULL` para integridad
- Crea índices para mejorar el performance
- Usa defaults seguros (NULL, empty JSON)

### ¿Qué pasa con los mensajes existentes?

✅ **Nada cambia** en los mensajes existentes:

- Los mensajes existentes tendrán `NULL` en las nuevas columnas
- Esto es normal y correcto
- Los nuevos mensajes podrán usar las columnas

### ¿Qué es el campo `read_by`?

`read_by` es un objeto JSON que rastrea qué usuarios han leído cada mensaje:

```json
{
  "user-id-1": true,
  "user-id-2": true
}
```

Esto permite implementar el "doble check azul" de WhatsApp.

### ¿Puedo revertir los cambios?

⚠️ **Sí, pero no es necesario**. Si por alguna razón quisieras remover las columnas:

```sql
ALTER TABLE messages
  DROP COLUMN IF EXISTS reply_to,
  DROP COLUMN IF EXISTS file_name,
  DROP COLUMN IF EXISTS file_size,
  DROP COLUMN IF EXISTS audio_duration,
  DROP COLUMN IF EXISTS edited_at,
  DROP COLUMN IF EXISTS read_by;
```

Pero NO hay razón para hacer esto, ya que el código las necesita.

---

## 🔧 Verificar Tabla users (Columna foto)

**NOTA**: El script de pruebas también detectó que la columna `foto` no existe en la tabla `users`.

Si ves este error al listar mensajes:

```
column users_1.foto does not exist
```

Ejecuta también este SQL:

```sql
-- Agregar columna foto a users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS foto TEXT DEFAULT NULL;

COMMENT ON COLUMN users.foto IS 'URL pública de la foto de perfil del usuario';
```

---

## 🚀 Funcionalidades que se Habilitarán

Una vez ejecutado el SQL, tu módulo de chat tendrá:

### ✅ Características Principales

- 💬 **Mensajes de texto** con emojis ilimitados
- 📷 **Imágenes** desde galería o cámara
- 📎 **Archivos** de cualquier tipo
- 🎤 **Notas de voz** con grabación y duración
- 🔄 **Responder** a mensajes específicos (like WhatsApp)
- ✏️ **Editar** mensajes enviados (con indicador)
- 🗑️ **Eliminar** mensajes (soft delete)
- ✅ **Read receipts** (doble check)
- ⚡ **Realtime** con Supabase subscriptions
- 👥 **Typing indicators** con Presence

### 🎯 Experiencia WhatsApp-like

- ✅ Respuestas citadas con preview
- ✅ Emojis integrados (6 categorías)
- ✅ Indicador de "escribiendo..."
- ✅ Mensajes con timestamps
- ✅ Indicador de editado
- ✅ Estados de mensaje (enviado, entregado, leído)

---

## 🐛 Troubleshooting

### Error: "permission denied for table messages"

**Solución**: Estás usando la ANON_KEY en lugar de SERVICE_ROLE_KEY.

En tu archivo `.env`:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Error: "relation 'messages' does not exist"

**Solución**: La tabla messages no existe. Necesitas crearla primero.

Revisa la documentación del esquema o crea la tabla base.

### Error: "Realtime TIMED_OUT"

**Solución**: Supabase Realtime está deshabilitado o tiene problemas.

1. Ve a Supabase Dashboard → Database → Replication
2. Asegúrate de que la tabla `messages` está en la lista
3. Habilita Realtime para `messages`

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún error al ejecutar el SQL:

1. **Copia el mensaje de error completo**
2. **Toma una captura de pantalla**
3. **Avísame** y te ayudo a resolverlo

---

**¿Todo listo?**

👉 **Ve a Supabase Dashboard y ejecuta el SQL** 👈

Una vez hecho, avísame y verificamos que todo funcionó correctamente.

---

**Archivo SQL:** `scripts/add-missing-chat-columns.sql`
**Script de verificación:** `scripts/check-messages-schema.js`
**Script de pruebas:** `scripts/test-chat-module.js`
