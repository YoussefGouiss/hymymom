import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit, getEmailIdentifier } from '@/utils/rateLimiter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();
    
    if (!email || !code || !newPassword) {
      return NextResponse.json({ message: 'Email, code, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailId = getEmailIdentifier(normalizedEmail);
    const rateLimit = checkRateLimit(emailId, 10);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, verification_code, verification_expires_at')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ message: 'Invalid reset code' }, { status: 400 });
    }

    if (userData.verification_code !== code) {
      return NextResponse.json({ message: 'Invalid reset code' }, { status: 400 });
    }

    const expiresAt = userData.verification_expires_at?.endsWith('Z') 
      ? userData.verification_expires_at 
      : userData.verification_expires_at + 'Z';

    if (new Date() > new Date(expiresAt)) {
      return NextResponse.json({ message: 'Reset code has expired. Please request a new one.' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: newPassword,
        verification_code: null,
        verification_expires_at: null
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ message: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ message: 'Failed to reset password' }, { status: 500 });
  }
}