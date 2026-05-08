import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify-email', '/contact', '/waitlist', '/terms', '/privacy', '/auth/callback', '/forgot-password', '/reset-password', '/api/auth', '/api/login', '/api/register', '/api/verify-email', '/api/resend-verification', '/api/logout', '/api/forgot-password', '/api/reset-password', '/api/auth/google', '/api/auth/google/callback', '/api/auth/google/create-user', '/api/auth/google/callback'];
const ADMIN_ROUTES = ['/admin', '/settings/users'];

async function validateUserInDB(authUser) {
  if (!authUser || !authUser.id) {
    return { valid: false, reason: 'no_auth_user' };
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('Database lookup error:', error);
    return { valid: false, reason: 'db_error' };
  }

  if (!userData) {
    console.log('User exists in Supabase Auth but not in users table:', authUser.id);
    return { valid: false, reason: 'user_not_found' };
  }

  return { valid: true, user: userData };
}

async function getSession(request) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    if (token.includes('.') && token.split('.').length === 2) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId && payload.exp > Math.floor(Date.now() / 1000)) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.userId)
            .maybeSingle();
          
          if (userData) {
            return { user: userData, token };
          }
        }
      } catch (e) {
        console.log('Custom token parse failed, trying Supabase auth');
      }
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    const dbValidation = await validateUserInDB(user);
    
    if (!dbValidation.valid) {
      await supabase.auth.signOut();
      return null;
    }

    return { user: dbValidation.user, token };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (!session.user.email_verified && !session.user.is_google_user) {
    const verifyUrl = new URL('/verify-email', request.url);
    verifyUrl.searchParams.set('email', session.user.email);
    return NextResponse.redirect(verifyUrl);
  }

  if (isAdminRoute(pathname) && session.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to request headers so they are available in API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.user?.id || '');
  requestHeaders.set('x-user-role', session.user?.role || 'user');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Also keep them in response headers for client-side visibility if needed
  response.headers.set('x-user-id', session.user?.id || '');
  response.headers.set('x-user-role', session.user?.role || 'user');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};

export default proxy;