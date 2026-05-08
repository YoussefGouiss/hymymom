# Quick Setup: Add Photo_URL to Families Table

## Step 1: Copy & Paste This SQL in Supabase

Go to your Supabase project → **SQL Editor** → paste this:

```sql
-- ====== ADD PHOTO_URL COLUMN ======
ALTER TABLE public.families ADD COLUMN photo_url TEXT;

-- ====== CREATE INDEX FOR PERFORMANCE ======
CREATE INDEX idx_families_photo_url ON families(photo_url) WHERE photo_url IS NOT NULL;
```

**That's it! Your database is ready.**

---

## Step 2: Create Storage Bucket (Do This Once)

In the same Supabase SQL Editor, paste this:

```sql
-- ====== CREATE STORAGE BUCKET ======
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-profiles', 'family-profiles', true)
ON CONFLICT DO NOTHING;
```

---

## Step 3: (Optional) Set RLS Policies

If you want strict security policies, paste this:

```sql
-- ====== RLS POLICIES FOR STORAGE ======

-- Allow public read
CREATE POLICY "Allow public read access to photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'family-profiles');

-- Allow authenticated users to upload
CREATE POLICY "Users can upload photos to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-profiles' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-profiles'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow users to update their own
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'family-profiles'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
```

---

## Testing: Verify the Column Exists

Run this query in Supabase SQL Editor:

```sql
-- View your updated families table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'families'
ORDER BY ordinal_position;
```

You should see `photo_url` with type `text` and `is_nullable` = `YES`.

---

## View Photos in Database

Run this query to see all families with their photos:

```sql
SELECT 
  id,
  mother_name,
  baby_name,
  photo_url,
  status,
  created_at
FROM families
WHERE photo_url IS NOT NULL
ORDER BY created_at DESC;
```

---

## If Something Goes Wrong: Revert

To remove the column (only if needed):

```sql
DROP INDEX IF EXISTS idx_families_photo_url;
ALTER TABLE public.families DROP COLUMN photo_url;
```

---

## Now Test in Your App

1. Go to your app's families page
2. Open a family profile
3. Click the photo area to upload an image
4. Check Supabase:
   - **Storage** tab → see the file in `family-profiles` folder
   - **SQL Editor** → run the query above to see the `photo_url` column populated

**Done! 🎉**
