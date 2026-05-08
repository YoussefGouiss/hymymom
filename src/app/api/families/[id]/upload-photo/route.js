import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existingFamily, error: fetchError } = await supabase
      .from('families')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingFamily) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (existingFamily.user_id !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('photo');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files (JPEG, PNG, WebP, GIF) are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${id}-${timestamp}-${randomString}.${fileExtension}`;
    const filePath = `family-photos/${userId}/${fileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('family-profiles')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data } = supabase.storage
      .from('family-profiles')
      .getPublicUrl(filePath);

    const photoUrl = data.publicUrl;

    // Update family record with photo URL
    const { error: updateError } = await supabase
      .from('families')
      .update({ photo_url: photoUrl })
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update family record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, photoUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existingFamily, error: fetchError } = await supabase
      .from('families')
      .select('user_id, photo_url')
      .eq('id', id)
      .single();

    if (fetchError || !existingFamily) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (existingFamily.user_id !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete the file from storage if it exists
    if (existingFamily.photo_url) {
      try {
        const filePath = existingFamily.photo_url.split('/').slice(-3).join('/');
        await supabase.storage.from('family-profiles').remove([filePath]);
      } catch (e) {
        console.error('Error deleting photo from storage:', e);
        // Continue even if deletion fails
      }
    }

    // Update family record to remove photo URL
    const { error: updateError } = await supabase
      .from('families')
      .update({ photo_url: null })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
