-- 📝 MIGRACIÓN: Sistema de Aprobación de Clientes
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear el tipo enum para el estado de aprobación
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
    END IF;
END $$;

-- 2. Agregar la columna a la tabla users (si no existe)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status_aprobacion approval_status DEFAULT 'pendiente';

-- 3. Actualizar usuarios existentes (asumiendo que los que ya están activos están aprobados)
UPDATE public.users 
SET status_aprobacion = 'aprobado' 
WHERE activo = true AND status_aprobacion = 'pendiente';

-- 4. Asegurar que 'activo' sea false por defecto para nuevos registros
ALTER TABLE public.users 
ALTER COLUMN activo SET DEFAULT false;

RAISE NOTICE '✅ Esquema de aprobación de clientes actualizado con éxito.';
