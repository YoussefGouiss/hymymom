import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateCustomToken(userId, email) {
  const payload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    iat: Math.floor(Date.now() / 1000)
  };
  const secret = process.env.OTP_ENCRYPTION_KEY || 'dev-secret-key-change-in-prod';
  const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  return signature + '.' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const supabaseToken = authHeader?.replace('Bearer ', '');
    
    if (!supabaseToken) {
      console.error('Auth callback: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Validate the Supabase token
    const { data, error: authError } = await supabase.auth.getUser(supabaseToken);
    const user = data?.user;
    
    if (authError || !user) {
      console.error('Token validation error:', authError);
      return NextResponse.json({ error: 'Invalid token', details: authError?.message }, { status: 401 });
    }

    const body = await request.json();
    const { userId, email, name } = body;
    const normalizedEmail = (email || user.email).toLowerCase();

    console.log('Creating/updating user:', normalizedEmail);

    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (findError) {
      console.error('Database lookup error:', findError);
      return NextResponse.json({ error: 'Database lookup failed', details: findError.message }, { status: 500 });
    }

    let finalUser;

    if (existingUser) {
      // Update existing user
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ 
          is_google_user: true, 
          email_verified: true,
          email_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update user error:', updateError);
        return NextResponse.json({ error: 'Failed to update user', details: updateError.message }, { status: 500 });
      }

      finalUser = updated;
      console.log('Updated existing user:', finalUser.email);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          name: name || user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
          password: '', // Add empty password to satisfy NOT NULL constraint if present
          is_google_user: true,
          email_verified: true,
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return NextResponse.json({ error: 'Failed to create user', details: createError.message }, { status: 500 });
      }

      finalUser = newUser;
      console.log('Created new user:', finalUser.email);
    }

    if (!finalUser) {
      console.error('Final user is null after operations');
      return NextResponse.json({ error: 'Internal server error: User record missing' }, { status: 500 });
    }

    // Generate custom token
    const customToken = generateCustomToken(finalUser.id, finalUser.email);

    return NextResponse.json({
      token: customToken,
      user: finalUser
    });
  } catch (err) {
    console.error('OAuth callback internal error:', err);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}