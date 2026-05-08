import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    console.log('Logout API called with token:', token ? 'yes' : 'no');

    // Validate token format and extract user info
    let userId = null;
    if (token && token.includes('.') && token.split('.').length === 2) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.userId;
        console.log('Logout user ID:', userId);
        
        // Token validation check
        if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
          console.log('Token already expired');
        }
      } catch (e) {
        console.log('Token parse failed for logout');
      }
    }

    // Create response that clears the token cookie
    // The custom token will be invalidated on the client side
    const response = NextResponse.json({ 
      message: 'Logged out successfully',
      destroyed: true
    });
    
    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ 
      message: 'Logged out',
      destroyed: true 
    });
  }
}