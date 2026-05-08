import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { translateErrorMessage } from '@/lib/errorTranslator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching families:', error);
      return NextResponse.json({ error: translateErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ families: data || [] });
  } catch (error) {
    console.error('API Error:', error);
    const message = translateErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    
    // Securely enforce user isolation
    payload.user_id = userId;

    const { data, error } = await supabase
      .from('families')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating family:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ family: data }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    const message = translateErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
