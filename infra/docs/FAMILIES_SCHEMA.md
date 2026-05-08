# Families Table Schema & Photo URL Migration

## Current Families Table Structure

```sql
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mother_name VARCHAR(100) NOT NULL,
  partner_name VARCHAR(100),
  baby_name VARCHAR(100),
  birth_date DATE,
  delivery_type TEXT CHECK (delivery_type IN ('Vaginal', 'C-Section', 'VBAC', 'Pending')),
  feeding_plan TEXT CHECK (feeding_plan IN ('Breastfeeding', 'Formula', 'Pumping', 'Mixed')),
  services_needed TEXT, -- comma-separated list
  total_package_amount NUMERIC(10, 2) CHECK (total_package_amount >= 0),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'GRADUATED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_families_user_id ON families(user_id);
CREATE INDEX idx_families_status ON families(status);
```

## Migration: Add Photo URL Column

### Option 1: Add Simple Photo URL Column (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Add photo_url column to families table
ALTER TABLE public.families ADD COLUMN photo_url TEXT;

-- Optional: Add an index for faster queries if filtering by photo_url
CREATE INDEX idx_families_photo_url ON families(photo_url) WHERE photo_url IS NOT NULL;
```

### Option 2: Add Photo URL with Comment

```sql
-- Add photo_url column with description
ALTER TABLE public.families 
ADD COLUMN photo_url TEXT COMMENT 'Public URL to the family profile photo stored in Supabase Storage';
```

### Option 3: Add Photo URL with Default

```sql
-- Add photo_url column with comment
ALTER TABLE public.families 
ADD COLUMN photo_url TEXT DEFAULT NULL;

-- Add index for queries
CREATE INDEX idx_families_photo_url ON families(photo_url) WHERE photo_url IS NOT NULL;
```

## Updated Families Table (After Migration)

```sql
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mother_name VARCHAR(100) NOT NULL,
  partner_name VARCHAR(100),
  baby_name VARCHAR(100),
  birth_date DATE,
  delivery_type TEXT CHECK (delivery_type IN ('Vaginal', 'C-Section', 'VBAC', 'Pending')),
  feeding_plan TEXT CHECK (feeding_plan IN ('Breastfeeding', 'Formula', 'Pumping', 'Mixed')),
  services_needed TEXT, -- comma-separated list
  total_package_amount NUMERIC(10, 2) CHECK (total_package_amount >= 0),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'GRADUATED')),
  photo_url TEXT, -- NEW: Public URL to family profile photo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_families_user_id ON families(user_id);
CREATE INDEX idx_families_status ON families(status);
CREATE INDEX idx_families_photo_url ON families(photo_url) WHERE photo_url IS NOT NULL;
```

## Supabase Storage Setup

### Create Storage Bucket

Run in Supabase SQL Editor or use the Supabase Dashboard:

```sql
-- Create the storage bucket for family profiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-profiles', 'family-profiles', true);
```

Or use the Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Click **Create bucket**
3. Name: `family-profiles`
4. Make it **Public** (check the box)
5. Create

### Set RLS Policies for Storage

Run these in the Supabase SQL Editor:

```sql
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload photos to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-profiles' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow public to read photos (since URLs are public)
CREATE POLICY "Allow public read access to photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'family-profiles');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-profiles'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'family-profiles'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
```

## How Photo URLs Are Stored

Example photo_url format:
```
https://your-project.supabase.co/storage/v1/object/public/family-profiles/user-id-here/family-id-timestamp-random.jpg
```

The API route (`/api/families/[id]/upload-photo`) handles:
- File validation (type & size)
- Unique filename generation
- Upload to storage
- Public URL retrieval
- Saving URL to database

## Testing the Setup

1. Upload a photo for a family in the UI
2. Check the Supabase Dashboard > **Storage** > **family-profiles** to see the files
3. Check the Supabase Dashboard > **SQL Editor** and run:
   ```sql
   SELECT id, mother_name, photo_url FROM families WHERE photo_url IS NOT NULL LIMIT 5;
   ```
4. You should see the photo_url values in the results

## Reverting (If Needed)

To remove the photo_url column:

```sql
-- Drop the index first
DROP INDEX IF EXISTS idx_families_photo_url;

-- Remove the column
ALTER TABLE public.families DROP COLUMN photo_url;
```

## Notes

- The `photo_url` column stores the public URL, not the file itself
- Actual files are stored in Supabase Storage bucket
- Photos are organized in user folders for security
- Each photo has a unique timestamp-based filename to prevent conflicts
- File size limit: 5MB (enforced by API)
- Supported formats: JPEG, PNG, WebP, GIF
