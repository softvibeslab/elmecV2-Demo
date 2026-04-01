-- 🚀 SIMULACIÓN DE NOTIFICACIÓN ELMEC V2
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase

-- 1. Buscar un usuario válido (Cualquiera de la tabla users)
DO $$
DECLARE
    target_user_id UUID;
    target_user_name TEXT;
BEGIN
    -- Obtenemos el ID del primer usuario activo encontrado
    SELECT id, nombre INTO target_user_id, target_user_name 
    FROM public.users 
    WHERE activo = true 
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ No se encontraron usuarios activos en la tabla public.users';
    ELSE
        RAISE NOTICE '✅ Enviando notificación de prueba a: % (%)', target_user_name, target_user_id;

        -- 2. Insertar la notificación
        -- Esto disparará el Realtime de Supabase y la app la mostrará
        INSERT INTO public.notifications (
            user_id,
            title,
            body,
            type,
            priority,
            data,
            read
        ) VALUES (
            target_user_id,
            '🔔 Prueba de Sistema ELMEC',
            'Hola ' || target_user_name || ', esto es una notificación de prueba en tiempo real.',
            'info',
            'medium',
            '{"test": true, "source": "SQL Editor"}',
            false
        );

        RAISE NOTICE '🚀 Notificación insertada con éxito. Verifica tu app!';
    END IF;
END $$;
