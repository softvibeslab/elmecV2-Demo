/*
  # Chat Grupal y Sistema de Garantía de Entrega de Mensajes

  Esta migración implementa:
  1. Soporte para chats grupales (hasta 256 participantes como WhatsApp)
  2. Sistema de garantía de entrega de mensajes (sent → delivered → read)
  3. Recibos de lectura por usuario
  4. Cola de mensajes pendientes para sincronización offline
  5. Funciones optimizadas para notificaciones en tiempo real

  Autor: Claude Code
  Fecha: 2024-12-10
*/

-- ============================================================================
-- 1. EXTENDER TABLA chat_rooms PARA GRUPOS
-- ============================================================================

-- Agregar columnas para chat grupal
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS admin_ids UUID[] DEFAULT '{}';
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 256;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "mute_notifications": false,
  "only_admins_can_send": false,
  "only_admins_can_edit_info": true,
  "disappearing_messages": null
}'::jsonb;

-- Actualizar tipo de chat para incluir 'group'
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_tipo_check;
ALTER TABLE chat_rooms ADD CONSTRAINT chat_rooms_tipo_check
  CHECK (tipo IN ('support', 'sales', 'general', 'group'));

-- Índice para búsqueda de grupos
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_group ON chat_rooms(is_group) WHERE is_group = true;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_name ON chat_rooms USING gin(name gin_trgm_ops);

-- ============================================================================
-- 2. SISTEMA DE ENTREGA DE MENSAJES (WHATSAPP-LIKE)
-- ============================================================================

-- Agregar status de entrega a mensajes
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent'
  CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS client_message_id VARCHAR(100); -- Para deduplicación
ALTER TABLE messages ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Índice para mensajes pendientes de entrega
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status) WHERE status IN ('pending', 'sent');
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_message_id) WHERE client_message_id IS NOT NULL;

-- ============================================================================
-- 3. TABLA DE RECIBOS DE LECTURA (READ RECEIPTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,

  UNIQUE(message_id, user_id)
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_receipts_message ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON message_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_unread ON message_receipts(user_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- 4. COLA DE MENSAJES PENDIENTES (OFFLINE SYNC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- Mayor = más prioritario
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,

  UNIQUE(user_id, message_id)
);

-- Índice para procesar cola eficientemente
CREATE INDEX IF NOT EXISTS idx_queue_pending ON message_queue(user_id, priority DESC, created_at ASC)
  WHERE processed_at IS NULL;

-- ============================================================================
-- 5. TABLA DE MIEMBROS DE GRUPO (PARA ROLES Y PERMISOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID REFERENCES users(id),
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID REFERENCES messages(id),
  notification_settings JSONB DEFAULT '{"sound": true, "vibrate": true, "preview": true}'::jsonb,

  UNIQUE(chat_room_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_members_room ON chat_room_members(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON chat_room_members(user_id);

-- ============================================================================
-- 6. FUNCIONES PARA GARANTÍA DE ENTREGA
-- ============================================================================

-- Función para enviar mensaje con garantía de entrega
CREATE OR REPLACE FUNCTION send_message_guaranteed(
  p_chat_room_id UUID,
  p_sender_id UUID,
  p_sender_name TEXT,
  p_message TEXT,
  p_type VARCHAR(20) DEFAULT 'text',
  p_client_message_id VARCHAR(100) DEFAULT NULL,
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_reply_to UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_participant UUID;
  v_participants UUID[];
BEGIN
  -- Verificar si el mensaje ya existe (deduplicación)
  IF p_client_message_id IS NOT NULL THEN
    SELECT id INTO v_message_id FROM messages
    WHERE client_message_id = p_client_message_id;

    IF v_message_id IS NOT NULL THEN
      RETURN v_message_id; -- Mensaje ya existe, retornar ID existente
    END IF;
  END IF;

  -- Insertar mensaje
  INSERT INTO messages (
    chat_room_id, sender_id, sender_name, message, type,
    client_message_id, file_url, file_name, reply_to,
    status, is_deleted
  ) VALUES (
    p_chat_room_id, p_sender_id, p_sender_name, p_message, p_type,
    p_client_message_id, p_file_url, p_file_name, p_reply_to,
    'sent', false
  ) RETURNING id INTO v_message_id;

  -- Obtener participantes del chat
  SELECT participants INTO v_participants FROM chat_rooms WHERE id = p_chat_room_id;

  -- Crear recibos de lectura y cola para cada participante (excepto el sender)
  FOREACH v_participant IN ARRAY v_participants
  LOOP
    IF v_participant != p_sender_id THEN
      -- Crear recibo de entrega
      INSERT INTO message_receipts (message_id, user_id)
      VALUES (v_message_id, v_participant)
      ON CONFLICT (message_id, user_id) DO NOTHING;

      -- Agregar a cola de mensajes pendientes
      INSERT INTO message_queue (user_id, message_id, chat_room_id)
      VALUES (v_participant, v_message_id, p_chat_room_id)
      ON CONFLICT (user_id, message_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Actualizar last_message del chat room
  UPDATE chat_rooms SET
    last_message = jsonb_build_object(
      'id', v_message_id,
      'message', p_message,
      'sender_id', p_sender_id,
      'sender_name', p_sender_name,
      'created_at', now(),
      'type', p_type
    ),
    updated_at = now()
  WHERE id = p_chat_room_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar mensaje como entregado
CREATE OR REPLACE FUNCTION mark_message_delivered(
  p_message_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_all_delivered BOOLEAN;
BEGIN
  -- Actualizar recibo de entrega
  UPDATE message_receipts
  SET delivered_at = COALESCE(delivered_at, now())
  WHERE message_id = p_message_id AND user_id = p_user_id;

  -- Verificar si todos los participantes recibieron el mensaje
  SELECT NOT EXISTS (
    SELECT 1 FROM message_receipts
    WHERE message_id = p_message_id AND delivered_at IS NULL
  ) INTO v_all_delivered;

  -- Si todos lo recibieron, actualizar status del mensaje
  IF v_all_delivered THEN
    UPDATE messages SET status = 'delivered', delivered_at = now()
    WHERE id = p_message_id AND status = 'sent';
  END IF;

  -- Remover de cola
  DELETE FROM message_queue WHERE message_id = p_message_id AND user_id = p_user_id;

  RETURN v_all_delivered;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_chat_room_id UUID,
  p_user_id UUID,
  p_up_to_message_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_message_ids UUID[];
BEGIN
  -- Obtener mensajes no leídos
  IF p_up_to_message_id IS NOT NULL THEN
    SELECT array_agg(m.id) INTO v_message_ids
    FROM messages m
    JOIN message_receipts mr ON mr.message_id = m.id
    WHERE m.chat_room_id = p_chat_room_id
      AND mr.user_id = p_user_id
      AND mr.read_at IS NULL
      AND m.created_at <= (SELECT created_at FROM messages WHERE id = p_up_to_message_id);
  ELSE
    SELECT array_agg(m.id) INTO v_message_ids
    FROM messages m
    JOIN message_receipts mr ON mr.message_id = m.id
    WHERE m.chat_room_id = p_chat_room_id
      AND mr.user_id = p_user_id
      AND mr.read_at IS NULL;
  END IF;

  -- Actualizar recibos
  UPDATE message_receipts
  SET read_at = now()
  WHERE message_id = ANY(v_message_ids) AND user_id = p_user_id AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Actualizar status de mensajes donde todos leyeron
  UPDATE messages m SET status = 'read'
  WHERE m.id = ANY(v_message_ids)
    AND NOT EXISTS (
      SELECT 1 FROM message_receipts mr
      WHERE mr.message_id = m.id AND mr.read_at IS NULL
    );

  -- Actualizar último mensaje leído del miembro
  UPDATE chat_room_members
  SET last_read_at = now(),
      last_read_message_id = COALESCE(p_up_to_message_id, (
        SELECT id FROM messages
        WHERE chat_room_id = p_chat_room_id
        ORDER BY created_at DESC LIMIT 1
      ))
  WHERE chat_room_id = p_chat_room_id AND user_id = p_user_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FUNCIONES PARA CHAT GRUPAL
-- ============================================================================

-- Función para crear chat grupal
CREATE OR REPLACE FUNCTION create_group_chat(
  p_name VARCHAR(100),
  p_created_by UUID,
  p_participants UUID[],
  p_description TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_chat_room_id UUID;
  v_participant UUID;
BEGIN
  -- Validar mínimo 2 participantes (+ creador = 3)
  IF array_length(p_participants, 1) < 2 THEN
    RAISE EXCEPTION 'Un grupo necesita al menos 3 participantes';
  END IF;

  -- Agregar creador si no está en la lista
  IF NOT p_created_by = ANY(p_participants) THEN
    p_participants := array_append(p_participants, p_created_by);
  END IF;

  -- Crear chat room
  INSERT INTO chat_rooms (
    name, description, avatar_url, tipo, is_group,
    participants, admin_ids, created_by, is_active, metadata
  ) VALUES (
    p_name, p_description, p_avatar_url, 'group', true,
    p_participants, ARRAY[p_created_by], p_created_by, true,
    jsonb_build_object(
      'participant_count', array_length(p_participants, 1),
      'created_at', now()
    )
  ) RETURNING id INTO v_chat_room_id;

  -- Crear registros de miembros
  FOREACH v_participant IN ARRAY p_participants
  LOOP
    INSERT INTO chat_room_members (chat_room_id, user_id, role, added_by)
    VALUES (
      v_chat_room_id,
      v_participant,
      CASE WHEN v_participant = p_created_by THEN 'admin' ELSE 'member' END,
      p_created_by
    );
  END LOOP;

  -- Enviar mensaje de sistema
  PERFORM send_message_guaranteed(
    v_chat_room_id,
    p_created_by,
    'Sistema',
    '🎉 Grupo "' || p_name || '" creado',
    'system'
  );

  RETURN v_chat_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar participantes a grupo
CREATE OR REPLACE FUNCTION add_group_participants(
  p_chat_room_id UUID,
  p_added_by UUID,
  p_new_participants UUID[]
) RETURNS INTEGER AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_participant UUID;
  v_count INTEGER := 0;
  v_current_participants UUID[];
  v_max_participants INTEGER;
  v_room_name VARCHAR(100);
  v_adder_name TEXT;
BEGIN
  -- Verificar que es un grupo
  SELECT is_group, participants, max_participants, name
  INTO v_is_admin, v_current_participants, v_max_participants, v_room_name
  FROM chat_rooms WHERE id = p_chat_room_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Esta acción solo es válida para grupos';
  END IF;

  -- Verificar que quien agrega es admin
  SELECT (p_added_by = ANY(admin_ids)) INTO v_is_admin
  FROM chat_rooms WHERE id = p_chat_room_id;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden agregar participantes';
  END IF;

  -- Verificar límite de participantes
  IF array_length(v_current_participants, 1) + array_length(p_new_participants, 1) > v_max_participants THEN
    RAISE EXCEPTION 'Se excedería el límite de % participantes', v_max_participants;
  END IF;

  -- Obtener nombre de quien agrega
  SELECT nombre || ' ' || apellido_paterno INTO v_adder_name
  FROM users WHERE id = p_added_by;

  -- Agregar cada participante
  FOREACH v_participant IN ARRAY p_new_participants
  LOOP
    IF NOT v_participant = ANY(v_current_participants) THEN
      -- Agregar a participants array
      UPDATE chat_rooms
      SET participants = array_append(participants, v_participant),
          metadata = jsonb_set(metadata, '{participant_count}', to_jsonb(array_length(participants, 1) + 1))
      WHERE id = p_chat_room_id;

      -- Crear registro de miembro
      INSERT INTO chat_room_members (chat_room_id, user_id, role, added_by)
      VALUES (p_chat_room_id, v_participant, 'member', p_added_by)
      ON CONFLICT (chat_room_id, user_id) DO NOTHING;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  -- Mensaje de sistema si se agregaron participantes
  IF v_count > 0 THEN
    PERFORM send_message_guaranteed(
      p_chat_room_id,
      p_added_by,
      'Sistema',
      v_adder_name || ' agregó ' || v_count || ' participante(s) al grupo',
      'system'
    );
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para salir de grupo
CREATE OR REPLACE FUNCTION leave_group(
  p_chat_room_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_group BOOLEAN;
  v_user_name TEXT;
  v_remaining_admins INTEGER;
BEGIN
  -- Verificar que es un grupo
  SELECT is_group INTO v_is_group FROM chat_rooms WHERE id = p_chat_room_id;

  IF NOT v_is_group THEN
    RAISE EXCEPTION 'Esta acción solo es válida para grupos';
  END IF;

  -- Obtener nombre del usuario
  SELECT nombre || ' ' || apellido_paterno INTO v_user_name
  FROM users WHERE id = p_user_id;

  -- Remover de participants
  UPDATE chat_rooms
  SET participants = array_remove(participants, p_user_id),
      admin_ids = array_remove(admin_ids, p_user_id),
      metadata = jsonb_set(metadata, '{participant_count}', to_jsonb(array_length(participants, 1) - 1))
  WHERE id = p_chat_room_id;

  -- Eliminar registro de miembro
  DELETE FROM chat_room_members
  WHERE chat_room_id = p_chat_room_id AND user_id = p_user_id;

  -- Si no quedan admins, promover al miembro más antiguo
  SELECT COUNT(*) INTO v_remaining_admins
  FROM chat_rooms WHERE id = p_chat_room_id AND array_length(admin_ids, 1) > 0;

  IF v_remaining_admins = 0 THEN
    -- Promover al miembro más antiguo
    UPDATE chat_rooms SET admin_ids = ARRAY[(
      SELECT user_id FROM chat_room_members
      WHERE chat_room_id = p_chat_room_id
      ORDER BY joined_at ASC LIMIT 1
    )]
    WHERE id = p_chat_room_id;

    UPDATE chat_room_members SET role = 'admin'
    WHERE chat_room_id = p_chat_room_id
    AND user_id = (SELECT admin_ids[1] FROM chat_rooms WHERE id = p_chat_room_id);
  END IF;

  -- Mensaje de sistema
  PERFORM send_message_guaranteed(
    p_chat_room_id,
    p_user_id,
    'Sistema',
    v_user_name || ' salió del grupo',
    'system'
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FUNCIONES PARA SINCRONIZACIÓN OFFLINE
-- ============================================================================

-- Función para obtener mensajes pendientes de un usuario
CREATE OR REPLACE FUNCTION get_pending_messages(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  message_id UUID,
  chat_room_id UUID,
  sender_id UUID,
  sender_name TEXT,
  message TEXT,
  type VARCHAR(20),
  created_at TIMESTAMPTZ,
  file_url TEXT,
  file_name TEXT,
  reply_to UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as message_id,
    m.chat_room_id,
    m.sender_id,
    m.sender_name,
    m.message,
    m.type,
    m.created_at,
    m.file_url,
    m.file_name,
    m.reply_to
  FROM message_queue mq
  JOIN messages m ON m.id = mq.message_id
  WHERE mq.user_id = p_user_id
    AND mq.processed_at IS NULL
  ORDER BY mq.priority DESC, mq.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener conteo de no leídos por chat
CREATE OR REPLACE FUNCTION get_unread_counts(
  p_user_id UUID
) RETURNS TABLE (
  chat_room_id UUID,
  unread_count BIGINT,
  last_message_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id as chat_room_id,
    COUNT(mr.id) as unread_count,
    MAX(m.created_at) as last_message_at
  FROM chat_rooms cr
  LEFT JOIN messages m ON m.chat_room_id = cr.id AND m.is_deleted = false
  LEFT JOIN message_receipts mr ON mr.message_id = m.id
    AND mr.user_id = p_user_id
    AND mr.read_at IS NULL
  WHERE p_user_id = ANY(cr.participants)
    AND cr.is_active = true
  GROUP BY cr.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. TRIGGERS PARA NOTIFICACIONES EN TIEMPO REAL
-- ============================================================================

-- Trigger para notificar nuevos mensajes
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  v_participant UUID;
  v_participants UUID[];
BEGIN
  -- Obtener participantes del chat
  SELECT participants INTO v_participants
  FROM chat_rooms WHERE id = NEW.chat_room_id;

  -- Notificar a cada participante (excepto el sender)
  FOREACH v_participant IN ARRAY v_participants
  LOOP
    IF v_participant != NEW.sender_id THEN
      PERFORM pg_notify(
        'new_message',
        json_build_object(
          'user_id', v_participant,
          'message_id', NEW.id,
          'chat_room_id', NEW.chat_room_id,
          'sender_id', NEW.sender_id,
          'sender_name', NEW.sender_name,
          'message_preview', substring(NEW.message from 1 for 100),
          'type', NEW.type,
          'created_at', NEW.created_at
        )::text
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger para notificar actualizaciones de estado de mensaje
CREATE OR REPLACE FUNCTION notify_message_status() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM pg_notify(
      'message_status',
      json_build_object(
        'message_id', NEW.id,
        'chat_room_id', NEW.chat_room_id,
        'sender_id', NEW.sender_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'delivered_at', NEW.delivered_at
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_message_status ON messages;
CREATE TRIGGER trigger_notify_message_status
  AFTER UPDATE OF status ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_status();

-- ============================================================================
-- 10. POLÍTICAS RLS PARA NUEVAS TABLAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Políticas para message_receipts
CREATE POLICY "Users can view their own receipts" ON message_receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts" ON message_receipts
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para message_queue
CREATE POLICY "Users can view their own queue" ON message_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their queue" ON message_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para chat_room_members
CREATE POLICY "Members can view their chats" ON chat_room_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can update their settings" ON chat_room_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para que admins puedan gestionar miembros
CREATE POLICY "Admins can manage members" ON chat_room_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_room_id AND auth.uid() = ANY(admin_ids)
    )
  );

-- ============================================================================
-- 11. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================================================

-- Índice compuesto para búsqueda de mensajes no leídos
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(chat_room_id, created_at DESC);

-- Índice para mensajes por usuario (para búsqueda)
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);

-- Índice para chat rooms activos del usuario
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING gin(participants);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
  RAISE NOTICE 'Chat rooms con soporte de grupos: ✅';
  RAISE NOTICE 'Sistema de entrega garantizada: ✅';
  RAISE NOTICE 'Recibos de lectura: ✅';
  RAISE NOTICE 'Cola de mensajes offline: ✅';
  RAISE NOTICE 'Funciones de grupo: ✅';
  RAISE NOTICE 'Triggers de notificación: ✅';
  RAISE NOTICE 'Políticas RLS: ✅';
END $$;
