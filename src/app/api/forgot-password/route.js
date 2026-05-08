import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/mail';
import crypto from 'crypto';
import { checkRateLimit, getEmailIdentifier } from '@/utils/rateLimiter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailId = getEmailIdentifier(normalizedEmail);
    const rateLimit = checkRateLimit(emailId, 3);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      console.error('User lookup error:', userError);
    }

    if (!userData) {
      return NextResponse.json({ message: 'If that email exists, a reset code has been sent.' });
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_code: resetCode,
        verification_expires_at: expiresAt
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
    }

    try {
      await sendVerificationEmail(normalizedEmail, userData.name, resetCode, 'password');
    } catch (mailError) {
      console.error('Mail error:', mailError);
    }

    return NextResponse.json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ message: 'If that email exists, a reset code has been sent.' });
  }
}