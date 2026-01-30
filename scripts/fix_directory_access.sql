-- POLICY: Authenticated users can view all profiles in 'users' table
-- This allows the Directory to work properly (filtering is done in frontend/query).

-- 1. Enable RLS on users table (if not already enabled)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (optional, be careful)
-- DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."users";

-- 3. Create permissive read policy for authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON "public"."users"
FOR SELECT
TO authenticated
USING (true);

-- 4. Grant access to authenticated role
GRANT SELECT ON "public"."users" TO authenticated;
