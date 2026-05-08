import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/mail';
import crypto from 'crypto';
import { checkRateLimit, getEmailIdentifier } from '@/utils/rateLimiter';
import { hashOTP } from '@/utils/crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    const emailId = getEmailIdentifier(email);
    const rateLimit = checkRateLimit(emailId, 5);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const normalizedEmail = email.toLowerCase();

    console.log('Checking existing user for:', normalizedEmail);

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email_verified, email_verified_at, name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    console.log('Existing user:', existingUser, fetchError);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
    }

    if (existingUser && (existingUser.email_verified === true || existingUser.email_verified_at)) {
      return NextResponse.json({ message: 'This email is already registered. Please sign in.' }, { status: 400 });
    }

    let userId;
    console.log('Creating auth user for:', normalizedEmail);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false, 
      user_metadata: { full_name: name }
    });

    console.log('Auth result:', authData, authError);

    if (authError) {
      console.log('Auth error:', authError.message);
      if (authError.message.toLowerCase().includes('already registered')) {
        const { data: authUserData } = await supabase.auth.admin.getUserByEmail(normalizedEmail);
        const authUser = authUserData?.user;
        userId = authUser?.id;
        
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, { password });
        }
      }
      
      if (!userId) {
        return NextResponse.json({ message: 'Auth error: ' + authError.message }, { status: 400 });
      }
    } else {
      userId = authData?.user?.id;
    }

    if (!userId) {
      return NextResponse.json({ message: 'Failed to create auth user - no user ID' }, { status: 400 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log('Inserting/updating users table for:', normalizedEmail);

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name, 
          password, 
          verification_code: otp,
          verification_expires_at: expiresAt
        })
        .eq('id', existingUser.id);
      
      console.log('Update result:', updateError);
      
      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ message: 'Update error: ' + updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ 
          name, 
          email: normalizedEmail, 
          password, 
          verification_code: otp,
          verification_expires_at: expiresAt
        });
      
      console.log('Insert result:', insertError);
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ message: 'Insert error: ' + insertError.message }, { status: 500 });
      }
    }

    console.log('Sending email to:', normalizedEmail);
    try {
      await sendVerificationEmail(normalizedEmail, name, otp);
      console.log('Email sent successfully');
    } catch (mailError) {
      console.error('Mail error:', mailError);
    }

    return NextResponse.json({
      message: 'Verification code sent to your email.',
      requires_verification: true,
      user: { id: userId, email: normalizedEmail }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}