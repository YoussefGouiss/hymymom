import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, email, name, isGoogleUser } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      // Update existing user
      const updates = {
        is_google_user: true,
        email_verified: true
      };

      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ user: updated });
    }

    // Create new user (only use columns that exist in schema)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        name: name || 'Google User',
        password: '', // Satisfy NOT NULL constraint
        is_google_user: isGoogleUser || false,
        email_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      console.error('Full error details:', JSON.stringify(createError));
      return NextResponse.json({ error: createError.message, details: createError }, { status: 500 });
    }

    return NextResponse.json({ user: newUser });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}