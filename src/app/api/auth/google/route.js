import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const origin = new URL(request.url).origin;
    
    // Use PKCE flow - code exchange instead of hash tokens
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        scopes: 'email profile openid',
        // Enable PKCE for more reliable code exchange
        skipBrowserRedirect: false,
      }
    });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    console.error('OAuth error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}