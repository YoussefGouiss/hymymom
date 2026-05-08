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
    const normalizedEmail = email.toLowerCase();

    const emailId = getEmailIdentifier(normalizedEmail);
    const rateLimit = checkRateLimit(emailId, 3);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email_verified')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 });
    }

    if (user.email_verified) {
      return NextResponse.json({ message: 'Email already verified' }, { status: 400 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        verification_code: otp,
        verification_expires_at: expiresAt
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ message: 'Failed to update code' }, { status: 500 });
    }

    try {
      await sendVerificationEmail(normalizedEmail, user.name, otp);
    } catch (mailError) {
      console.error('Mail error:', mailError);
      return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'New verification code sent.',
    });
  } catch (err) {
    console.error('Resend error:', err);
    return NextResponse.json({ message: 'Failed to resend code' }, { status: 500 });
  }
}