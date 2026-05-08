-- ================================================================
-- PHOTO UPLOAD FEATURE - DATABASE SETUP
-- ================================================================
-- Copy ALL of this and paste into: Supabase → SQL Editor → Run
-- ================================================================

-- Step 1: Add photo_url column to families table
ALTER TABLE public.families ADD COLUMN photo_url TEXT;

-- Step 2: Create performance index
CREATE INDEX idx_families_photo_url ON families(photo_url) WHERE photo_url IS NOT NULL;

-- Step 3: Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-profiles', 'family-profiles', true)
ON CONFLICT DO NOTHING;

-- ================================================================
-- OPTIONAL: Security policies for storage
-- ================================================================
-- Uncomment if you want strict RLS policies

-- Allow public read
-- CREATE POLICY "Allow public read access to photos"
-- ON storage.objects
-- FOR SELECT
-- USING (bucket_id = 'family-profiles');

-- Allow authenticated users to upload
-- CREATE POLICY "Users can upload photos to their folder"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = 'family-profiles' 
--   AND (auth.uid())::text = (storage.foldername(name))[1]
-- );

-- Allow users to delete their own photos
-- CREATE POLICY "Users can delete their own photos"
-- ON storage.objects
-- FOR DELETE
-- USING (
--   bucket_id = 'family-profiles'
--   AND (auth.uid())::text = (storage.foldername(name))[1]
-- );

-- Allow users to update their own photos
-- CREATE POLICY "Users can update their own photos"
-- ON storage.objects
-- FOR UPDATE
-- USING (
--   bucket_id = 'family-profiles'
--   AND (auth.uid())::text = (storage.foldername(name))[1]
-- );

-- ================================================================
-- VERIFICATION QUERIES (run these to confirm setup)
-- ================================================================

-- Check if photo_url column was added
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'families' AND column_name = 'photo_url';

-- Check if storage bucket exists
-- SELECT id, name, public FROM storage.buckets WHERE id = 'family-profiles';

-- View all families with photos (after uploading)
-- SELECT id, mother_name, baby_name, photo_url, status
-- FROM families WHERE photo_url IS NOT NULL;

-- View uploaded photo files in storage
-- SELECT name, created_at FROM storage.objects
-- WHERE bucket_id = 'family-profiles';
