import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateImage, generateFileName, getStoragePath } from '@/utils/imageUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/families/[id]/photo
 * Upload a profile photo for a family
 */
export async function POST(request, { params }) {
  try {
    const { id: familyId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify family ownership
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('user_id')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (String(family.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const photoFile = formData.get('photo');

    if (!photoFile) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Validate image
    const validation = validateImage(photoFile);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload directly without server-side compression
    const fileName = generateFileName(familyId, photoFile.name);
    const storagePath = getStoragePath(userId, familyId, fileName);

    // Convert file to buffer for upload
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    console.log('Uploading to bucket: family-profiles, path:', storagePath, 'size:', buffer.length);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('family-profiles')
      .upload(storagePath, buffer, {
        contentType: photoFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo: ' + uploadError.message },
        { status: 500 }
      );
    }
    
    console.log('Upload success:', uploadData);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('family-profiles')
      .getPublicUrl(storagePath);

    const photoUrl = publicUrlData.publicUrl;

    // Update family record with photo URL
    const { data: updatedFamily, error: updateError } = await supabase
      .from('families')
      .update({ photo_url: photoUrl })
      .eq('id', familyId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save photo reference' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        family: updatedFamily,
        photoUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during upload' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/families/[id]/photo
 * Delete the profile photo for a family
 */
export async function DELETE(request, { params }) {
  try {
    const { id: familyId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify family ownership
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('user_id, photo_url')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (String(family.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // If there's a photo URL, delete the file from storage
    if (family.photo_url) {
      try {
        // Extract file path from URL
        const urlParts = family.photo_url.split('/');
        const bucketName = urlParts[urlParts.length - 3];
        const filePath = urlParts.slice(-2).join('/');

        if (bucketName === 'family-profiles' || bucketName === 'family-photos') {
          await supabase.storage
            .from('family-profiles')
            .remove([filePath]);
        }
      } catch (pathError) {
        console.error('Error parsing photo URL:', pathError);
        // Continue anyway - we'll still clear the database reference
      }
    }

    // Clear photo_url from family record
    const { data: updatedFamily, error: updateError } = await supabase
      .from('families')
      .update({ photo_url: null })
      .eq('id', familyId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove photo' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        family: updatedFamily,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during deletion' },
      { status: 500 }
    );
  }
}
