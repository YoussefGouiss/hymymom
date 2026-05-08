import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit, getEmailIdentifier, clearRateLimit } from '@/utils/rateLimiter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, code } = await request.json();
    const normalizedEmail = email.toLowerCase();

    const emailId = getEmailIdentifier(normalizedEmail);
    const rateLimit = checkRateLimit(emailId, 10);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, verification_code, verification_expires_at, name')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'Invalid verification code' }, { status: 400 });
    }

    if (user.verification_code !== code) {
      return NextResponse.json({ message: 'Wrong code entered' }, { status: 400 });
    }

    const expiresAt = user.verification_expires_at?.endsWith('Z') 
      ? user.verification_expires_at 
      : user.verification_expires_at + 'Z';

    if (expiresAt && new Date() > new Date(expiresAt)) {
      return NextResponse.json({ message: 'Verification code has expired' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_code: null,
        verification_expires_at: null
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ message: 'Failed to verify email' }, { status: 500 });
    }

    clearRateLimit(emailId);

    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find(u => u.email === normalizedEmail);

    if (authUser) {
      await supabase.auth.admin.updateUserById(
        authUser.id,
        { email_confirm: true }
      ).catch(err => console.error('Auth confirm error:', err));
    }

    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: { 
        id: updatedUser?.id || user.id, 
        email: normalizedEmail, 
        name: updatedUser?.name || user.name, 
        email_verified: true 
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ message: 'Verification failed' }, { status: 500 });
  }
}