/*
  # Funciones de PostgreSQL para Entrega Garantizada de Mensajes

  Este script incluye:
  1. Función send_message_guaranteed() - Envío atómico con deduplicación
  2. Función mark_message_delivered() - Marcar como entregado
  3. Función mark_messages_read() - Marcar como leído
  4. Función process_message_queue() - Procesar cola de mensajes pendientes
  5. Triggers para notificaciones en tiempo real
  6. Funciones de grupo (crear, agregar participantes, salir)

  Autor: Claude Code
  Fecha: 2024-12-11
*/

-- ============================================================================
-- 1. FUNCIÓN: ENVÍO GARANTIZADO DE MENSAJES CON DEDUPLICACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION send_message_guaranteed(
  p_chat_room_id UUID,
  p_sender_id UUID,
  p_sender_name TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'text',
  p_client_message_id TEXT DEFAULT NULL,
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_size INTEGER DEFAULT NULL,
  p_reply_to UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_existing_id UUID;
  v_result JSONB;
  v_participants UUID[];
  v_created_at TIMESTAMPTZ;
BEGIN
  -- 1. Verificar deduplicación por client_message_id
  IF p_client_message_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM messages
    WHERE client_message_id = p_client_message_id
      AND chat_room_id = p_chat_room_id
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      -- Mensaje ya existe, retornar el existente
      SELECT jsonb_build_object(
        'success', true,
        'message_id', id,
        'status', status,
        'duplicate', true,
        'created_at', created_at
      ) INTO v_result
      FROM messages WHERE id = v_existing_id;

      RETURN v_result;
    END IF;
  END IF;

  -- 2. Insertar mensaje con status 'sent'
  v_created_at := now();

  INSERT INTO messages (
    chat_room_id,
    sender_id,
    sender_name,
    message,
    type,
    client_message_id,
    file_url,
    file_name,
    file_size,
    reply_to,
    metadata,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_chat_room_id,
    p_sender_id,
    p_sender_name,
    p_message,
    p_type,
    p_client_message_id,
    p_file_url,
    p_file_name,
    p_file_size,
    p_reply_to,
    p_metadata,
    'sent',
    v_created_at,
    v_created_at
  )
  RETURNING id INTO v_message_id;

  -- 3. Obtener participantes del chat
  SELECT participants INTO v_participants
  FROM chat_rooms WHERE id = p_chat_room_id;

  -- 4. Crear recibos de entrega para todos los participantes (excepto el sender)
  INSERT INTO message_receipts (message_id, user_id, delivered_at)
  SELECT v_message_id, unnest(v_participants), NULL
  WHERE unnest(v_participants) != p_sender_id
  ON CONFLICT (message_id, user_id) DO NOTHING;

  -- 5. Agregar a la cola de mensajes para participantes offline
  INSERT INTO message_queue (user_id, message_id, chat_room_id, priority)
  SELECT
    u.id,
    v_message_id,
    p_chat_room_id,
    CASE
      WHEN p_type = 'text' THEN 1
      WHEN p_type = 'image' THEN 2
      ELSE 0
    END
  FROM unnest(v_participants) AS participant_id
  JOIN users u ON u.id = participant_id
  WHERE u.id != p_sender_id
    AND (u.is_online = false OR u.last_seen < now() - interval '5 minutes')
  ON CONFLICT (user_id, message_id) DO NOTHING;

  -- 6. Actualizar last_message en chat_room
  UPDATE chat_rooms
  SET
    last_message = jsonb_build_object(
      'id', v_message_id,
      'message', LEFT(p_message, 100),
      'type', p_type,
      'sender_id', p_sender_id,
      'sender_name', p_sender_name,
      'created_at', v_created_at
    ),
    updated_at = v_created_at
  WHERE id = p_chat_room_id;

  -- 7. Retornar resultado exitoso
  v_result := jsonb_build_object(
    'success', true,
    'message_id', v_message_id,
    'status', 'sent',
    'duplicate', false,
    'created_at', v_created_at
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- ============================================================================
-- 2. FUNCIÓN: MARCAR MENSAJE COMO ENTREGADO
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_message_delivered(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delivered_at TIMESTAMPTZ;
  v_all_delivered BOOLEAN;
BEGIN
  v_delivered_at := now();

  -- Actualizar recibo de entrega
  INSERT INTO message_receipts (message_id, user_id, delivered_at)
  VALUES (p_message_id, p_user_id, v_delivered_at)
  ON CONFLICT (message_id, user_id)
  DO UPDATE SET delivered_at = COALESCE(message_receipts.delivered_at, v_delivered_at);

  -- Verificar si todos los participantes recibieron el mensaje
  SELECT NOT EXISTS (
    SELECT 1 FROM message_receipts
    WHERE message_id = p_message_id AND delivered_at IS NULL
  ) INTO v_all_delivered;

  -- Si todos recibieron, actualizar status del mensaje a 'delivered'
  IF v_all_delivered THEN
    UPDATE messages
    SET status = 'delivered', delivered_at = v_delivered_at
    WHERE id = p_message_id AND status = 'sent';
  END IF;

  -- Eliminar de la cola de mensajes pendientes
  DELETE FROM message_queue
  WHERE message_id = p_message_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'delivered_at', v_delivered_at,
    'all_delivered', v_all_delivered
  );
END;
$$;

-- ============================================================================
-- 3. FUNCIÓN: MARCAR MENSAJES COMO LEÍDOS (BATCH)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_messages_read(
  p_chat_room_id UUID,
  p_user_id UUID,
  p_up_to_message_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_read_at TIMESTAMPTZ;
  v_count INTEGER;
  v_message_ids UUID[];
BEGIN
  v_read_at := now();

  -- Obtener IDs de mensajes a marcar como leídos
  IF p_up_to_message_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_message_ids
    FROM messages
    WHERE chat_room_id = p_chat_room_id
      AND sender_id != p_user_id
      AND created_at <= (SELECT created_at FROM messages WHERE id = p_up_to_message_id)
      AND id IN (
        SELECT message_id FROM message_receipts
        WHERE user_id = p_user_id AND read_at IS NULL
      );
  ELSE
    SELECT ARRAY_AGG(id) INTO v_message_ids
    FROM messages
    WHERE chat_room_id = p_chat_room_id
      AND sender_id != p_user_id
      AND id IN (
        SELECT message_id FROM message_receipts
        WHERE user_id = p_user_id AND read_at IS NULL
      );
  END IF;

  -- Actualizar recibos de lectura
  UPDATE message_receipts
  SET read_at = v_read_at
  WHERE user_id = p_user_id
    AND message_id = ANY(v_message_ids)
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Actualizar status de mensajes donde todos leyeron
  UPDATE messages m
  SET status = 'read'
  WHERE m.id = ANY(v_message_ids)
    AND m.status IN ('sent', 'delivered')
    AND NOT EXISTS (
      SELECT 1 FROM message_receipts mr
      WHERE mr.message_id = m.id AND mr.read_at IS NULL
    );

  RETURN jsonb_build_object(
    'success', true,
    'messages_read', v_count,
    'read_at', v_read_at
  );
END;
$$;

-- ============================================================================
-- 4. FUNCIÓN: PROCESAR COLA DE MENSAJES PENDIENTES
-- ============================================================================

CREATE OR REPLACE FUNCTION process_message_queue(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_messages JSONB;
  v_processed_ids UUID[];
BEGIN
  -- Obtener mensajes pendientes ordenados por prioridad
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'queue_id', mq.id,
        'message_id', m.id,
        'chat_room_id', m.chat_room_id,
        'sender_id', m.sender_id,
        'sender_name', m.sender_name,
        'message', m.message,
        'type', m.type,
        'file_url', m.file_url,
        'created_at', m.created_at,
        'metadata', m.metadata
      ) ORDER BY mq.priority DESC, mq.created_at ASC
    ),
    ARRAY_AGG(mq.id)
  INTO v_messages, v_processed_ids
  FROM message_queue mq
  JOIN messages m ON m.id = mq.message_id
  WHERE mq.user_id = p_user_id
    AND mq.processed_at IS NULL
  LIMIT p_limit;

  -- Marcar como procesados
  IF v_processed_ids IS NOT NULL THEN
    UPDATE message_queue
    SET processed_at = now()
    WHERE id = ANY(v_processed_ids);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'messages', COALESCE(v_messages, '[]'::jsonb),
    'count', COALESCE(array_length(v_processed_ids, 1), 0)
  );
END;
$$;

-- ============================================================================
-- 5. FUNCIÓN: CREAR GRUPO CON PARTICIPANTES
-- ============================================================================

CREATE OR REPLACE FUNCTION create_group_chat(
  p_name TEXT,
  p_creator_id UUID,
  p_participant_ids UUID[],
  p_description TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
  v_all_participants UUID[];
BEGIN
  -- Asegurar que el creador esté en la lista
  IF NOT p_creator_id = ANY(p_participant_ids) THEN
    v_all_participants := array_append(p_participant_ids, p_creator_id);
  ELSE
    v_all_participants := p_participant_ids;
  END IF;

  -- Validar mínimo de participantes
  IF array_length(v_all_participants, 1) < 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Un grupo necesita al menos 2 participantes'
    );
  END IF;

  -- Crear el chat room
  INSERT INTO chat_rooms (
    name,
    description,
    avatar_url,
    tipo,
    is_group,
    participants,
    admin_ids,
    created_by,
    metadata,
    is_active
  ) VALUES (
    p_name,
    p_description,
    p_avatar_url,
    'group',
    true,
    v_all_participants,
    ARRAY[p_creator_id],
    p_creator_id,
    p_metadata,
    true
  )
  RETURNING id INTO v_room_id;

  -- Crear registros de miembros
  INSERT INTO chat_room_members (chat_room_id, user_id, role, added_by)
  SELECT
    v_room_id,
    unnest(v_all_participants),
    CASE WHEN unnest(v_all_participants) = p_creator_id THEN 'admin' ELSE 'member' END,
    p_creator_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room_id,
    'participant_count', array_length(v_all_participants, 1)
  );
END;
$$;

-- ============================================================================
-- 6. FUNCIÓN: AGREGAR PARTICIPANTES A GRUPO
-- ============================================================================

CREATE OR REPLACE FUNCTION add_group_participants(
  p_room_id UUID,
  p_added_by UUID,
  p_new_participant_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_participants UUID[];
  v_is_admin BOOLEAN;
  v_added_count INTEGER := 0;
BEGIN
  -- Verificar que sea admin
  SELECT p_added_by = ANY(admin_ids), participants
  INTO v_is_admin, v_current_participants
  FROM chat_rooms
  WHERE id = p_room_id AND is_group = true;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solo los administradores pueden agregar participantes'
    );
  END IF;

  -- Agregar nuevos participantes
  FOREACH p_new_participant_ids SLICE 1 IN ARRAY p_new_participant_ids
  LOOP
    IF NOT p_new_participant_ids[1] = ANY(v_current_participants) THEN
      -- Agregar al array de participantes
      UPDATE chat_rooms
      SET participants = array_append(participants, p_new_participant_ids[1])
      WHERE id = p_room_id;

      -- Crear registro de miembro
      INSERT INTO chat_room_members (chat_room_id, user_id, role, added_by)
      VALUES (p_room_id, p_new_participant_ids[1], 'member', p_added_by)
      ON CONFLICT (chat_room_id, user_id) DO NOTHING;

      v_added_count := v_added_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'added_count', v_added_count
  );
END;
$$;

-- ============================================================================
-- 7. FUNCIÓN: SALIR DE GRUPO
-- ============================================================================

CREATE OR REPLACE FUNCTION leave_group(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_admin_count INTEGER;
  v_participant_count INTEGER;
BEGIN
  -- Verificar si es admin y contar admins
  SELECT
    p_user_id = ANY(admin_ids),
    array_length(admin_ids, 1),
    array_length(participants, 1)
  INTO v_is_admin, v_admin_count, v_participant_count
  FROM chat_rooms
  WHERE id = p_room_id AND is_group = true;

  -- Si es el único admin, no puede salir (debe nombrar otro admin primero)
  IF v_is_admin AND v_admin_count = 1 AND v_participant_count > 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Debes nombrar otro administrador antes de salir'
    );
  END IF;

  -- Remover de participantes y admins
  UPDATE chat_rooms
  SET
    participants = array_remove(participants, p_user_id),
    admin_ids = array_remove(admin_ids, p_user_id)
  WHERE id = p_room_id;

  -- Eliminar registro de miembro
  DELETE FROM chat_room_members
  WHERE chat_room_id = p_room_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'left_group', true
  );
END;
$$;

-- ============================================================================
-- 8. TRIGGER: NOTIFICACIÓN EN TIEMPO REAL AL INSERTAR MENSAJE
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_participants UUID[];
  v_participant UUID;
  v_sender_name TEXT;
BEGIN
  -- Obtener participantes del chat
  SELECT participants INTO v_participants
  FROM chat_rooms WHERE id = NEW.chat_room_id;

  -- Crear notificación para cada participante (excepto el sender)
  FOREACH v_participant IN ARRAY v_participants
  LOOP
    IF v_participant != NEW.sender_id THEN
      INSERT INTO notifications (user_id, title, body, type, priority, data)
      VALUES (
        v_participant,
        'Nuevo mensaje',
        CASE
          WHEN NEW.type = 'text' THEN LEFT(NEW.message, 50) || CASE WHEN LENGTH(NEW.message) > 50 THEN '...' ELSE '' END
          WHEN NEW.type = 'image' THEN '📷 Imagen'
          WHEN NEW.type = 'file' THEN '📎 Archivo'
          WHEN NEW.type = 'audio' THEN '🎵 Audio'
          ELSE NEW.message
        END,
        'new_message',
        'high',
        jsonb_build_object(
          'chat_room_id', NEW.chat_room_id,
          'message_id', NEW.id,
          'sender_id', NEW.sender_id,
          'sender_name', NEW.sender_name,
          'message_type', NEW.type
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.type != 'system')
  EXECUTE FUNCTION notify_new_message();

-- ============================================================================
-- 9. TRIGGER: NOTIFICACIÓN AL CAMBIAR STATUS DE SOLICITUD
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status_text TEXT;
BEGIN
  -- Solo notificar si cambió el estatus
  IF OLD.estatus IS DISTINCT FROM NEW.estatus THEN
    -- Mapear status a texto
    v_status_text := CASE NEW.estatus
      WHEN 'nuevo' THEN 'Nueva'
      WHEN 'asignado' THEN 'Asignada'
      WHEN 'en_proceso' THEN 'En Proceso'
      WHEN 'resuelto' THEN 'Resuelta'
      WHEN 'cancelado' THEN 'Cancelada'
      ELSE NEW.estatus
    END;

    -- Notificar al usuario que creó la solicitud
    IF NEW.usuario_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, priority, data)
      VALUES (
        NEW.usuario_id,
        'Solicitud actualizada',
        'Tu solicitud "' || LEFT(NEW.titulo, 30) || '" cambió a: ' || v_status_text,
        'request_update',
        'medium',
        jsonb_build_object(
          'request_id', NEW.id,
          'old_status', OLD.estatus,
          'new_status', NEW.estatus
        )
      );
    END IF;

    -- Si se asignó un agente, notificarlo
    IF NEW.agente_id IS NOT NULL AND OLD.agente_id IS DISTINCT FROM NEW.agente_id THEN
      INSERT INTO notifications (user_id, title, body, type, priority, data)
      VALUES (
        NEW.agente_id,
        'Nueva solicitud asignada',
        'Se te asignó la solicitud: "' || LEFT(NEW.titulo, 40) || '"',
        'assignment',
        'high',
        jsonb_build_object(
          'request_id', NEW.id,
          'titulo', NEW.titulo
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_notify_request_status ON requests;
CREATE TRIGGER trigger_notify_request_status
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_request_status_change();

-- ============================================================================
-- 10. FUNCIÓN: OBTENER MENSAJES NO LEÍDOS POR CHAT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_count_by_room(p_user_id UUID)
RETURNS TABLE(chat_room_id UUID, unread_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.chat_room_id,
    COUNT(*) as unread_count
  FROM message_receipts mr
  JOIN messages m ON m.id = mr.message_id
  WHERE mr.user_id = p_user_id
    AND mr.read_at IS NULL
    AND m.sender_id != p_user_id
  GROUP BY mr.chat_room_id;
END;
$$;

-- ============================================================================
-- 11. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_chat_sender ON messages(chat_room_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated ON chat_rooms(updated_at DESC);

-- ============================================================================
-- 12. HABILITAR REALTIME PARA TABLAS CRÍTICAS
-- ============================================================================

-- Asegurar que las tablas tengan realtime habilitado
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;

-- ============================================================================
-- PERMISOS: Dar acceso a las funciones
-- ============================================================================

GRANT EXECUTE ON FUNCTION send_message_guaranteed TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_delivered TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read TO authenticated;
GRANT EXECUTE ON FUNCTION process_message_queue TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_chat TO authenticated;
GRANT EXECUTE ON FUNCTION add_group_participants TO authenticated;
GRANT EXECUTE ON FUNCTION leave_group TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count_by_room TO authenticated;
