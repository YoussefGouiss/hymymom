# Photo Upload Feature Setup Guide

## 1. Database Migration

Run the following SQL in your Supabase SQL Editor to add the photo_url column to the families table:

```sql
-- Add photo_url column to families table
ALTER TABLE public.families 
ADD COLUMN photo_url TEXT;

-- Add index for faster lookups
CREATE INDEX idx_families_photo_url ON families(photo_url) 
WHERE photo_url IS NOT NULL;
```

## 2. Create Supabase Storage Bucket

1. Go to Supabase Dashboard
2. Navigate to Storage
3. Click "Create a new bucket"
4. Name it: `family-photos`
5. Set visibility to **Private**
6. Enable RLS (Row Level Security)

## 3. Configure Storage Bucket RLS Policies

Run the following SQL to set up RLS policies for the family-photos bucket:

```sql
-- Allow users to upload their own family photos
CREATE POLICY "Users can upload family photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'family-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own family photos
CREATE POLICY "Users can view family photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'family-photos');

-- Allow users to delete their own family photos
CREATE POLICY "Users can delete family photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'family-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. Environment Variables

Ensure these are in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 5. Features Implemented

- Photo upload for family profiles
- Photo compression before upload (max 2MB)
- Image validation (JPEG, PNG, WebP formats)
- Photo preview in forms and list views
- Photo deletion
- Fallback to initials avatar if no photo
- Responsive image display

## 6. API Endpoints

**Upload Photo:**
```
POST /api/families/[id]/photo
Content-Type: multipart/form-data

Form data:
- photo: File (image/jpeg, image/png, image/webp)
```

**Delete Photo:**
```
DELETE /api/families/[id]/photo
```

## 7. File Structure

New files created:
- `/src/utils/imageUtils.js` - Image compression and validation
- `/src/app/api/families/[id]/photo/route.js` - Photo upload/delete endpoints
