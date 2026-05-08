import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    delete payload.user_id;

    // Simple: use the id directly
    const { data: existingFamily, error: fetchError } = await supabase
      .from('families')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingFamily) {
      return NextResponse.json({ error: 'Family not found. It may have been deleted.' }, { status: 404 });
    }

    if (String(existingFamily.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('families')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ family: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingFamily, error: fetchError } = await supabase
      .from('families')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingFamily) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (String(existingFamily.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
