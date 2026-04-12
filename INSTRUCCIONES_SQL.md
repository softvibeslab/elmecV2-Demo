# 📋 Instrucciones para Agregar Columnas a la Tabla Requests

## ⚠️ IMPORTANTE

Las columnas `archivos`, `feedback` y `rating` NO existen actualmente en la tabla `requests` de Supabase.
Esto impide que funcione la carga de archivos y el sistema de feedback.

**Tiempo estimado:** 5 minutos

---

## 🎯 Objetivo

Agregar 3 columnas faltantes a la tabla `requests`:

1. **archivos** - Para almacenar URLs de archivos adjuntos
2. **feedback** - Para guardar comentarios del usuario
3. **rating** - Para guardar calificación (1-5 estrellas)

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
-- SCRIPT: Agregar columnas faltantes a requests
-- ============================================

-- 1. Agregar columna para archivos adjuntos
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS archivos TEXT[] DEFAULT NULL;

-- 2. Agregar columnas para feedback del usuario
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT NULL;

-- 3. Agregar constraint para validar rating (1-5)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_rating_range'
  ) THEN
    ALTER TABLE requests
      ADD CONSTRAINT check_rating_range
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
END $$;

-- 4. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_requests_rating ON requests(rating);
CREATE INDEX IF NOT EXISTS idx_requests_usuario_id ON requests(usuario_id);
CREATE INDEX IF NOT EXISTS idx_requests_agente_id ON requests(agente_id);
CREATE INDEX IF NOT EXISTS idx_requests_estatus ON requests(estatus);
CREATE INDEX IF NOT EXISTS idx_requests_prioridad ON requests(prioridad);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- 5. Agregar comentarios de documentación
COMMENT ON COLUMN requests.archivos IS 'Array de URLs públicas de archivos adjuntos desde Supabase Storage';
COMMENT ON COLUMN requests.feedback IS 'Comentarios del usuario sobre la resolución de la solicitud';
COMMENT ON COLUMN requests.rating IS 'Calificación de 1 a 5 estrellas sobre la resolución';

-- 6. Verificar que las columnas se agregaron
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN ('archivos', 'feedback', 'rating')
ORDER BY column_name;
```

### Paso 4: Pegar y Ejecutar

1. **Pega** el código SQL en el editor
2. Haz clic en el botón **"Run"** (▶ o "Ejecutar")
3. Espera unos segundos...

### Paso 5: Verificar Resultado

Deberías ver un resultado como este:

```
column_name | data_type      | is_nullable | column_default
------------|----------------|-------------|---------------
archivos    | ARRAY          | YES         | NULL
feedback    | text           | YES         | NULL
rating      | integer        | YES         | NULL

Query executed successfully
```

✅ **Si ves las 3 filas** = ¡TODO BIEN!

❌ **Si ves un error** = Copia el error y avísame

---

## 🧪 Verificar que Funciona

Después de ejecutar el SQL, regresa a la terminal y ejecuta:

```bash
node scripts/test-requests-crud.js
```

**Resultado esperado:**

```
════════════════════════════════════════════════════════════
📊 REPORTE FINAL DE PRUEBAS - MÓDULO DE SOLICITUDES
════════════════════════════════════════════════════════════

Total de pruebas:      14
✅ Pruebas exitosas:     14
❌ Pruebas fallidas:     0

Tasa de éxito:         100.0%

════════════════════════════════════════════════════════════
🎉 ¡TODAS LAS PRUEBAS DEL MÓDULO DE SOLICITUDES PASARON!
════════════════════════════════════════════════════════════
```

---

## 📸 Capturas de Referencia

### SQL Editor en Supabase

```
┌─────────────────────────────────────────┐
│  SQL Editor                             │
├─────────────────────────────────────────┤
│                                         │
│  1  ALTER TABLE requests                │
│  2    ADD COLUMN IF NOT EXISTS ...      │
│  3                                      │
│  ...                                    │
│                                         │
│  [▶ Run]  [Save]  [Format]             │
└─────────────────────────────────────────┘
```

### Resultado Exitoso

```
┌─────────────────────────────────────────┐
│  Results                                │
├─────────────────────────────────────────┤
│  column_name | data_type  | ...        │
│  ------------|------------|---         │
│  archivos    | ARRAY      | ...        │
│  feedback    | text       | ...        │
│  rating      | integer    | ...        │
│                                         │
│  ✅ Query executed successfully         │
│  ⏱️ 0.3s                                │
└─────────────────────────────────────────┘
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué necesito hacer esto?

El código de la app (`app/(tabs)/requests.tsx`) espera que estas columnas existan para:

- Guardar URLs de archivos adjuntos (líneas 344-353)
- Mostrar archivos adjuntos (líneas 827-835)
- Guardar feedback y rating (líneas 838-848)

Sin estas columnas, esas funcionalidades no funcionarán.

### ¿Es seguro ejecutar este script?

✅ **SÍ**, el script es seguro porque:

- Usa `IF NOT EXISTS` - no hace nada si las columnas ya existen
- Solo AGREGA columnas, no modifica ni elimina datos existentes
- Agrega constraints válidos para proteger la integridad de datos
- Crea índices para mejorar el performance

### ¿Qué pasa con los datos existentes?

✅ **Nada cambia** en los datos existentes:

- Las solicitudes existentes tendrán `NULL` en las nuevas columnas
- Esto es normal y correcto
- Las nuevas solicitudes podrán usar las columnas

### ¿Puedo revertir los cambios?

⚠️ **Sí, pero no es necesario**. Si por alguna razón quisieras remover las columnas:

```sql
ALTER TABLE requests
  DROP COLUMN IF EXISTS archivos,
  DROP COLUMN IF EXISTS feedback,
  DROP COLUMN IF EXISTS rating;
```

Pero NO hay razón para hacer esto, ya que el código las necesita.

---

## 🚀 Siguiente Paso

Una vez ejecutado el SQL exitosamente:

```bash
# 1. Verificar con tests
node scripts/test-requests-crud.js

# 2. Iniciar la app
npx expo start --clear

# 3. Probar funcionalidad:
# - Crear solicitud
# - Adjuntar archivos
# - Ver archivos en la solicitud
# - ¡Todo debería funcionar!
```

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
