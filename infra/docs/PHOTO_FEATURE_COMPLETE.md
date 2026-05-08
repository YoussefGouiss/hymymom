# Complete Setup Guide: Photo Upload Feature

## What Was Added

### 1. API Endpoint
- **File**: `src/app/api/families/[id]/upload-photo/route.js`
- **Features**:
  - POST: Upload family profile photo
  - DELETE: Remove family profile photo
  - File validation (type & size)
  - Automatic storage management
  - Database URL saving

### 2. Frontend Components
- **Family Detail Page**: `src/app/(protected)/families/[id]/page.js`
  - Photo upload UI in profile header
  - Delete photo button
  - Loading states and error messages
  
- **Family List Page**: `src/app/(protected)/families/page.js`
  - Display photos in the families table
  - Fallback to initials if no photo

### 3. Database Column
- **Table**: `families`
- **New Column**: `photo_url TEXT`
- **Purpose**: Store public URL to the photo

### 4. Supabase Storage Bucket
- **Name**: `family-profiles`
- **Access**: Public
- **File Organization**: `family-profiles/[user-id]/[family-id]-timestamp-random.ext`

---

## Database Migration SQL

**Copy and paste into Supabase SQL Editor:**

```sql
-- Add photo_url column to families table
ALTER TABLE public.families ADD COLUMN photo_url TEXT;

-- Create index for better query performance
CREATE INDEX idx_families_photo_url ON families(photo_url) WHERE photo_url IS NOT NULL;

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-profiles', 'family-profiles', true)
ON CONFLICT DO NOTHING;

-- Optional: Set storage policies (for security)
CREATE POLICY "Allow public read access to photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'family-profiles');

CREATE POLICY "Users can upload photos to their folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-profiles' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-profiles'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'family-profiles'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
```

---

## Step-by-Step Setup

### Step 1: Update Database

1. Log into your Supabase project
2. Go to **SQL Editor**
3. Create a new query
4. Copy the SQL migration code above
5. Run it
6. Verify success (no errors)

### Step 2: Create Storage Bucket

**Option A: Via Supabase Dashboard**
1. Go to **Storage** → **Buckets**
2. Click **Create bucket**
3. Name: `family-profiles`
4. Toggle **Make it public** ON
5. Create

**Option B: Via SQL (included in migration above)**

### Step 3: Environment Check

Verify your `.env.local` has these variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Test the Feature

1. Start your app: `npm run dev`
2. Navigate to a family profile
3. Click on the profile photo area (or "Add Photo" text)
4. Select a JPEG, PNG, WebP, or GIF image
5. Wait for upload to complete
6. Photo should appear immediately

### Step 5: Verify in Database

**Query 1: Check if column exists**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'families' AND column_name = 'photo_url';
```

**Query 2: View families with photos**
```sql
SELECT 
  id,
  mother_name,
  baby_name,
  photo_url,
  status
FROM families
WHERE photo_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Query 3: View storage files**
```sql
SELECT 
  id,
  name,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'family-profiles'
ORDER BY created_at DESC;
```

---

## How It Works

### Upload Flow

1. **User selects file** in UI
2. **Frontend validation**:
   - Check file type (JPEG, PNG, WebP, GIF)
   - Check file size (max 5MB)
3. **Upload to API**: `POST /api/families/[id]/upload-photo`
4. **API validation**:
   - Verify user owns the family
   - Validate file again
   - Check file size
5. **Upload to Supabase Storage**:
   - Create unique filename: `{familyId}-{timestamp}-{random}.{ext}`
   - Store in folder: `family-profiles/{userId}/`
6. **Save URL to Database**:
   - Get public URL from Supabase
   - Save to `families.photo_url`
7. **UI updates** automatically

### Delete Flow

1. **User clicks delete button**
2. **Confirmation dialog**
3. **Send DELETE request**: `DELETE /api/families/[id]/upload-photo`
4. **API deletes file** from Supabase Storage
5. **API removes URL** from database (sets to NULL)
6. **UI refreshes** to show initials again

---

## File Structure After Implementation

```
D:\hymymom postparum\hymymom-pro\
├── src/
│   ├── app/
│   │   ├── api/families/[id]/
│   │   │   ├── route.js (updated)
│   │   │   └── upload-photo/
│   │   │       └── route.js (NEW)
│   │   └── (protected)/families/
│   │       ├── page.js (updated)
│   │       └── [id]/page.js (updated)
├── PHOTO_URL_MIGRATION.md (NEW)
├── FAMILIES_SCHEMA.md (NEW)
└── PHOTO_UPLOAD_SETUP.md (NEW)
```

---

## API Endpoint Details

### POST /api/families/[id]/upload-photo

**Headers**:
```
x-user-id: {user_id} (automatically set by middleware)
```

**Body**: `FormData`
```
photo: File (JPEG, PNG, WebP, or GIF)
```

**Response (Success)**:
```json
{
  "success": true,
  "photoUrl": "https://your-project.supabase.co/storage/v1/object/public/family-profiles/user-id/family-id-timestamp-random.jpg"
}
```

**Response (Error)**:
```json
{
  "error": "File size must be less than 5MB"
}
```

### DELETE /api/families/[id]/upload-photo

**Headers**:
```
x-user-id: {user_id} (automatically set by middleware)
```

**Response (Success)**:
```json
{
  "success": true
}
```

---

## Troubleshooting

### Issue: "File size must be less than 5MB"
- Solution: Compress the image before uploading

### Issue: "Only image files are allowed"
- Solution: Make sure you're uploading JPEG, PNG, WebP, or GIF

### Issue: Photo not appearing in database
- Solution: Check that the `photo_url` column exists
  ```sql
  ALTER TABLE families ADD COLUMN photo_url TEXT;
  ```

### Issue: "Permission denied" error
- Solution: Check that the x-user-id header is being passed (middleware should do this automatically)

### Issue: Storage bucket not found
- Solution: Create the bucket via Supabase Dashboard → Storage → Create bucket → name it `family-profiles` and make it public

### Issue: Photo uploads but doesn't persist
- Solution: Verify storage bucket RLS policies are set correctly (see migration SQL above)

---

## Security Features

✅ **User Isolation**: Photos are organized by user ID in storage
✅ **Ownership Verification**: Only the family owner can upload/delete
✅ **File Validation**: Type and size checks on both frontend and backend
✅ **Automatic Cleanup**: Photos can be deleted anytime
✅ **Public URLs**: Photos are accessible to view but not modify/delete

---

## Performance Notes

- Photos are stored in Supabase Storage (separate from database)
- URLs are cached in the `families` table for fast retrieval
- Index on `photo_url` helps queries with filtering
- Public URLs are optimized for fast CDN delivery

---

## Need Help?

Check these files for reference:
- `src/app/api/families/[id]/upload-photo/route.js` - API logic
- `src/app/(protected)/families/[id]/page.js` - Upload UI (search for "handlePhotoUpload")
- `FAMILIES_SCHEMA.md` - Complete database schema
- `PHOTO_URL_MIGRATION.md` - Quick migration reference
