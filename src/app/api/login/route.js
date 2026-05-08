import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit, getEmailIdentifier } from '@/utils/rateLimiter';
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
    const { email, password, googleToken } = await request.json();
    
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const emailId = getEmailIdentifier(normalizedEmail);
    const rateLimit = checkRateLimit(emailId, 10);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    console.log('Login attempt:', normalizedEmail, 'Type:', googleToken ? 'Google' : 'Password');

    // Check if user exists in custom DB
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error('DB error:', userError);
    }

    // GOOGLE LOGIN
    if (googleToken) {
      const { data: { user: googleUser }, error: googleError } = await supabase.auth.getUser(googleToken);
      
      if (googleError || !googleUser) {
        return NextResponse.json({ message: 'Invalid Google token' }, { status: 401 });
      }

      if (googleUser.email.toLowerCase() !== normalizedEmail) {
        return NextResponse.json({ message: 'Email mismatch' }, { status: 401 });
      }

      // If user exists in DB, update provider info
      if (existingUser) {
        if (!existingUser.is_google_user) {
          await supabase
            .from('users')
            .update({ 
              is_google_user: true, 
              email_verified: true,
              email_verified_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);
        }
        
        const customToken = generateCustomToken(existingUser.id, normalizedEmail);
        
        return NextResponse.json({
          token: customToken,
          user: { ...existingUser, is_google_user: true, email_verified: true },
        });
      }

      // Create new user from Google
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || 'Google User',
          password: '', // Satisfy NOT NULL constraint
          is_google_user: true,
          email_verified: true,
          email_verified_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
      }

      const customToken = generateCustomToken(newUser.id, normalizedEmail);
      
      return NextResponse.json({
        token: customToken,
        user: newUser,
      });
    }

    // EMAIL/PASSWORD LOGIN
    if (!existingUser) {
      return NextResponse.json({ message: 'Wrong email or password' }, { status: 401 });
    }

    if (existingUser.password !== password) {
      return NextResponse.json({ message: 'Wrong email or password' }, { status: 401 });
    }

    if (!existingUser.email_verified && !existingUser.email_verified_at) {
      return NextResponse.json({ 
        message: 'Please verify your email first', 
        requires_verification: true 
      }, { status: 403 });
    }

    const customToken = generateCustomToken(existingUser.id, normalizedEmail);

    console.log('Login successful for:', normalizedEmail);

    return NextResponse.json({
      token: customToken,
      user: existingUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}