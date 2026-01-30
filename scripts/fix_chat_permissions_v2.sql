-- Fix permissions for Chat Rooms and Members (RLS)

-- 1. Enable RLS on chat_rooms and chat_room_members (if not enabled)
ALTER TABLE IF EXISTS "public"."chat_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."chat_room_members" ENABLE ROW LEVEL SECURITY;

-- 2. Allow participants to UPDATE chat_rooms (e.g. adding members, changing name to group)
-- This policy allows updating if the user is in the participants array OR is an admin of the room
DROP POLICY IF EXISTS "Participants can update chat rooms" ON "public"."chat_rooms";
CREATE POLICY "Participants can update chat rooms"
ON "public"."chat_rooms"
FOR UPDATE
TO authenticated
USING (
  auth.uid() = ANY(participants)
  OR
  (admin_ids IS NOT NULL AND auth.uid() = ANY(admin_ids))
)
WITH CHECK (
  auth.uid() = ANY(participants)
  OR
  (admin_ids IS NOT NULL AND auth.uid() = ANY(admin_ids))
);

-- 3. Allow participants to INSERT new members into chat_room_members
-- This policy allows adding members if the user is already a participant in the room
DROP POLICY IF EXISTS "Participants can add members" ON "public"."chat_room_members";
CREATE POLICY "Participants can add members"
ON "public"."chat_room_members"
FOR INSERT
TO authenticated
WITH CHECK (
  chat_room_id IN (
    SELECT id FROM chat_rooms
    WHERE auth.uid() = ANY(participants)
  )
);

-- 4. Allow participants to VIEW chat_room_members
DROP POLICY IF EXISTS "Participants can view members" ON "public"."chat_room_members";
CREATE POLICY "Participants can view members"
ON "public"."chat_room_members"
FOR SELECT
TO authenticated
USING (
  chat_room_id IN (
    SELECT id FROM chat_rooms
    WHERE auth.uid() = ANY(participants)
  )
);

-- 5. Grant permissions to authenticated role just in case
GRANT ALL ON "public"."chat_rooms" TO authenticated;
GRANT ALL ON "public"."chat_room_members" TO authenticated;
