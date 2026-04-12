# Migración: Limpieza de Agentes Inválidos

## Descripción

Esta migración limpia datos inválidos de la tabla `users`:

1. Desactiva agentes inválidos: Ana García, Carlos Mendoza, Luis Ramírez
2. Limpia la palabra 'nulo' de todos los nombres de usuarios

## Archivo

- `20251021204653_cleanup_invalid_agents.sql`

## Cómo Ejecutar

### Opción 1: SQL Editor de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `20251021204653_cleanup_invalid_agents.sql`
5. Haz clic en **Run**

### Opción 2: Supabase CLI

```bash
# Asegúrate de estar conectado a tu proyecto
supabase link --project-ref tu-project-ref

# Ejecutar la migración
supabase db push
```

### Opción 3: Script Node.js

```bash
# Ejecutar el script de limpieza
npm run cleanup-agents
```

## Qué hace esta migración

### 1. Desactivar Agentes Inválidos

Los siguientes agentes serán marcados como `activo = false`:

- Ana García
- Carlos Mendoza
- Luis Ramírez

**Importante:**

- Los agentes NO se eliminan permanentemente para mantener el historial
- Las solicitudes asignadas a estos agentes se desasignan (agente_id = NULL)
- Puedes reactivarlos más tarde si es necesario

### 2. Limpiar Nombres con 'nulo'

La migración limpia todas las variantes de 'nulo' de:

- `nombre`
- `apellido_paterno`
- `apellido_materno`

Variantes que se limpian:

- nulo
- Nulo
- NULO
- null
- Null
- NULL

## Verificación

Después de ejecutar la migración, puedes verificar con estas queries:

```sql
-- Ver agentes desactivados
SELECT id, nombre, apellido_paterno, apellido_materno, correo_electronico, activo
FROM users
WHERE activo = false AND rol = 'agent';

-- Verificar que no queden nombres con 'nulo'
SELECT id, nombre, apellido_paterno, apellido_materno, correo_electronico
FROM users
WHERE nombre ~* 'nulo|null'
   OR apellido_paterno ~* 'nulo|null'
   OR apellido_materno ~* 'nulo|null';
```

## Rollback

Si necesitas revertir los cambios:

```sql
-- Reactivar agentes
UPDATE users
SET activo = true
WHERE (
  (nombre ILIKE '%Ana%' AND apellido_paterno ILIKE '%García%') OR
  (nombre ILIKE '%Carlos%' AND apellido_paterno ILIKE '%Mendoza%') OR
  (nombre ILIKE '%Luis%' AND apellido_paterno ILIKE '%Ramírez%')
) AND rol = 'agent';
```

**Nota:** No es posible revertir la limpieza de 'nulo' automáticamente.

## Estado

- ✅ Migración creada: 2025-10-21
- ⏳ Pendiente de ejecución en producción
- 📋 Parte del Sprint 2 - Tarea #13 y #14

## Notas Importantes

1. **Backup:** Se recomienda hacer un backup de la base de datos antes de ejecutar
2. **Producción:** Ejecutar primero en ambiente de desarrollo/staging
3. **Verificación:** Revisar los datos después de ejecutar
4. **Historial:** Los agentes desactivados se mantienen para el historial
