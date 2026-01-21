/*
  # Automatización de Semáforo de Solicitudes

  Este script implementa la automatización del sistema de semáforo:
  - NUEVO → SIN ATENDER: si pasan más de 3 días sin ser atendida
  - EN PROCESO/ASIGNADO → SIN ATENDER: si pasan más de 5 días sin resolverse

  Incluye:
  1. Función para verificar y actualizar estados
  2. Trigger para crear notificaciones automáticas
  3. Función para ejecutar periódicamente (via cron o llamada manual)

  Fecha: 2026-01-20
*/

-- ============================================================================
-- 1. FUNCIÓN PARA VERIFICAR Y ACTUALIZAR ESTADOS VENCIDOS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_request_expiration()
RETURNS TABLE (
  request_id UUID,
  old_status TEXT,
  new_status TEXT,
  reason TEXT
) AS $$
DECLARE
  v_request RECORD;
  v_days_since_creation INTEGER;
  v_days_since_update INTEGER;
BEGIN
  -- Recorrer todas las solicitudes activas que no están terminadas
  FOR v_request IN
    SELECT r.id, r.estatus, r.created_at, r.updated_at, r.usuario_id, r.agente_id
    FROM requests r
    WHERE r.estatus NOT IN ('resuelto', 'cerrado', 'sin_atender')
  LOOP
    v_days_since_creation := EXTRACT(DAY FROM (NOW() - v_request.created_at));
    v_days_since_update := EXTRACT(DAY FROM (NOW() - v_request.updated_at));

    -- Verificar si solicitud nueva ha pasado más de 3 días
    IF v_request.estatus = 'nuevo' AND v_days_since_creation > 3 THEN
      -- Actualizar estado
      UPDATE requests
      SET estatus = 'sin_atender',
          updated_at = NOW()
      WHERE id = v_request.id;

      -- Crear notificación para el usuario
      INSERT INTO notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
      VALUES (
        v_request.usuario_id,
        'Solicitud sin atender',
        'Tu solicitud ha pasado más de 3 días sin ser atendida. Nos comunicaremos contigo pronto.',
        'warning',
        v_request.id,
        'request'
      );

      -- Si hay agente asignado, notificar también
      IF v_request.agente_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
        VALUES (
          v_request.agente_id,
          '⚠️ Solicitud vencida',
          'Una solicitud nueva ha pasado más de 3 días sin ser atendida. Requiere atención inmediata.',
          'urgent',
          v_request.id,
          'request'
        );
      END IF;

      RETURN QUERY SELECT v_request.id, v_request.estatus, 'sin_atender'::TEXT,
                          'Solicitud nueva sin atender por más de 3 días'::TEXT;

    -- Verificar si solicitud en proceso ha pasado más de 5 días
    ELSIF v_request.estatus IN ('asignado', 'en_proceso') AND v_days_since_update > 5 THEN
      -- Actualizar estado
      UPDATE requests
      SET estatus = 'sin_atender',
          updated_at = NOW()
      WHERE id = v_request.id;

      -- Crear notificación para el usuario
      INSERT INTO notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
      VALUES (
        v_request.usuario_id,
        'Solicitud sin resolver',
        'Tu solicitud ha pasado más de 5 días en proceso sin ser resuelta. Estamos revisando el caso.',
        'warning',
        v_request.id,
        'request'
      );

      -- Notificar al agente asignado
      IF v_request.agente_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, titulo, mensaje, tipo, referencia_id, referencia_tipo)
        VALUES (
          v_request.agente_id,
          '⚠️ Solicitud vencida',
          'Una solicitud en proceso ha pasado más de 5 días sin resolverse. Requiere atención inmediata.',
          'urgent',
          v_request.id,
          'request'
        );
      END IF;

      RETURN QUERY SELECT v_request.id, v_request.estatus, 'sin_atender'::TEXT,
                          'Solicitud en proceso sin resolver por más de 5 días'::TEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FUNCIÓN WRAPPER PARA LLAMAR DESDE LA APLICACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION run_status_check()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_count INTEGER;
BEGIN
  -- Ejecutar verificación
  WITH updated_requests AS (
    SELECT * FROM check_request_expiration()
  )
  SELECT
    json_build_object(
      'success', true,
      'checked_at', NOW(),
      'updated_count', (SELECT COUNT(*) FROM updated_requests),
      'updated_requests', (SELECT json_agg(row_to_json(updated_requests)) FROM updated_requests)
    ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON FUNCTION check_request_expiration() IS
'Verifica solicitudes vencidas y las marca como sin_atender, creando notificaciones automáticas.
- Solicitudes nuevas: 3 días máximo
- Solicitudes en proceso: 5 días máximo';

COMMENT ON FUNCTION run_status_check() IS
'Wrapper para ejecutar la verificación de estados desde la aplicación o cron job.
Retorna un JSON con el resultado de la operación.';

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN:
--
-- Para ejecutar esta verificación periódicamente, puedes:
--
-- 1. Usar pg_cron (si está habilitado en Supabase):
--    SELECT cron.schedule('check-requests', '0 */6 * * *', 'SELECT run_status_check()');
--    (Ejecuta cada 6 horas)
--
-- 2. Llamar desde la aplicación al iniciar:
--    const { data } = await supabase.rpc('run_status_check');
--
-- 3. Configurar un Edge Function que se ejecute periódicamente
-- ============================================================================
