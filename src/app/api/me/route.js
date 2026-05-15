import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let userData = null;
    let userId = null;

    if (token.includes('.') && token.split('.').length === 2) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.userId && payload.exp > Math.floor(Date.now() / 1000)) {
          userId = payload.userId;
        }
      } catch (e) {
        console.log('Custom token parse failed');
      }
    }

    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        userData = data;
      }
    }

    if (!userData && token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        userData = data;
      }
    }

    if (!userData) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(userData);
  } catch (err) {
    console.error('Me GET error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    let userId = null;

    // 1. Try custom token
    if (token.includes('.') && token.split('.').length === 2) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.userId && payload.exp > Math.floor(Date.now() / 1000)) {
          userId = payload.userId;
        }
      } catch (e) {
        console.log('Custom token parse failed in PATCH');
      }
    }

    // 2. Try Supabase token
    if (!userId) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        if (data) userId = data.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Whitelist fields to update
    const allowedFields = ['name', 'bio', 'address', 'photo_url', 'email_notifications_enabled'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Update error in PATCH:', error);
      return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Me PATCH error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}