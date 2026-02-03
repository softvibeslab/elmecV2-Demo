-- Storage RLS Policies for request-files bucket
-- Run this in Supabase SQL Editor or via CLI

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Policy 1: Public Read Access - Anyone can view files
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-files');

-- Policy 2: Authenticated Upload - Logged in users can upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-files'
  AND auth.role() = 'authenticated'
);

-- Policy 3: Owner Update - Users can update files in their folder
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'request-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Owner Delete - Users can delete files in their folder
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'request-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
