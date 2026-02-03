-- ============================================
-- SCRIPT COMPLETO PARA ARREGLAR RLS DEL CHAT
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- OPCIÓN 1: DESHABILITAR RLS TEMPORALMENTE (recomendado para probar)
-- Descomenta las siguientes líneas si quieres probar sin RLS:
-- ALTER TABLE "public"."chat_rooms" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."chat_room_members" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."messages" DISABLE ROW LEVEL SECURITY;

-- OPCIÓN 2: CONFIGURAR RLS CORRECTAMENTE
-- Si no deshabilitaste RLS arriba, ejecuta TODO lo siguiente:

-- ========== CHAT_ROOMS ==========
ALTER TABLE IF EXISTS "public"."chat_rooms" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view their chat rooms" ON "public"."chat_rooms";
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON "public"."chat_rooms";
DROP POLICY IF EXISTS "Participants can update chat rooms" ON "public"."chat_rooms";
DROP POLICY IF EXISTS "Admins can delete chat rooms" ON "public"."chat_rooms";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."chat_rooms";

-- Política SELECT: usuarios pueden ver salas donde son participantes
CREATE POLICY "Users can view their chat rooms" ON "public"."chat_rooms"
FOR SELECT TO authenticated
USING (auth.uid() = ANY(participants));

-- Política INSERT: usuarios autenticados pueden crear salas donde son participantes
CREATE POLICY "Authenticated users can create chat rooms" ON "public"."chat_rooms"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = ANY(participants));

-- Política UPDATE: participantes pueden actualizar sus salas
CREATE POLICY "Participants can update chat rooms" ON "public"."chat_rooms"
FOR UPDATE TO authenticated
USING (auth.uid() = ANY(participants))
WITH CHECK (auth.uid() = ANY(participants));

-- Política DELETE: solo admins del chat pueden eliminar
CREATE POLICY "Admins can delete chat rooms" ON "public"."chat_rooms"
FOR DELETE TO authenticated
USING (admin_ids IS NOT NULL AND auth.uid() = ANY(admin_ids));

-- ========== CHAT_ROOM_MEMBERS ==========
ALTER TABLE IF EXISTS "public"."chat_room_members" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Participants can view members" ON "public"."chat_room_members";
DROP POLICY IF EXISTS "Participants can add members" ON "public"."chat_room_members";
DROP POLICY IF EXISTS "Participants can leave chat" ON "public"."chat_room_members";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."chat_room_members";

-- Política SELECT: participantes pueden ver miembros de sus salas
CREATE POLICY "Participants can view members" ON "public"."chat_room_members"
FOR SELECT TO authenticated
USING (
  chat_room_id IN (
    SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants)
  )
);

-- Política INSERT: participantes pueden añadir miembros
CREATE POLICY "Participants can add members" ON "public"."chat_room_members"
FOR INSERT TO authenticated
WITH CHECK (
  chat_room_id IN (
    SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants)
  )
);

-- Política UPDATE: participantes pueden actualizar miembros
CREATE POLICY "Participants can update members" ON "public"."chat_room_members"
FOR UPDATE TO authenticated
USING (
  chat_room_id IN (
    SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants)
  )
);

-- Política DELETE: usuarios pueden salir de chats
CREATE POLICY "Participants can leave chat" ON "public"."chat_room_members"
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR
  chat_room_id IN (
    SELECT id FROM chat_rooms WHERE auth.uid() = ANY(admin_ids)
  )
);

-- ========== MESSAGES ==========
ALTER TABLE IF EXISTS "public"."messages" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON "public"."messages";
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON "public"."messages";
DROP POLICY IF EXISTS "Users can update their own messages" ON "public"."messages";
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."messages";

-- Política SELECT: usuarios pueden ver mensajes de sus salas
CREATE POLICY "Users can view messages in their rooms" ON "public"."messages"
FOR SELECT TO authenticated
USING (
  chat_room_id IN (
    SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants)
  )
);

-- Política INSERT: usuarios pueden enviar mensajes a sus salas
CREATE POLICY "Users can send messages to their rooms" ON "public"."messages"
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  chat_room_id IN (
    SELECT id FROM chat_rooms WHERE auth.uid() = ANY(participants)
  )
);

-- Política UPDATE: usuarios pueden actualizar sus propios mensajes
CREATE POLICY "Users can update their own messages" ON "public"."messages"
FOR UPDATE TO authenticated
USING (sender_id = auth.uid());

-- ========== GRANTS ==========
GRANT ALL ON "public"."chat_rooms" TO authenticated;
GRANT ALL ON "public"."chat_room_members" TO authenticated;
GRANT ALL ON "public"."messages" TO authenticated;

-- ========== VERIFICACIÓN ==========
-- Después de ejecutar, verifica que las políticas estén activas:
-- SELECT * FROM pg_policies WHERE tablename IN ('chat_rooms', 'chat_room_members', 'messages');
