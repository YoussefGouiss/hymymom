import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendVisitReminderEmail } from '@/lib/mail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 1. Verify Secret Key (for security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Define "Tomorrow"
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    console.log('Running Visit Reminders Cron for:', dateString);

    // 3. Fetch visits for tomorrow where notifications are enabled
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        location,
        families (mother_name),
        users (id, email, name, email_notifications_enabled)
      `)
      .eq('scheduled_date', dateString);

    if (error) throw error;

    const notificationsSent = [];
    const errors = [];

    // 4. Filter and Send
    for (const visit of (visits || [])) {
      const user = visit.users;
      if (user && user.email_notifications_enabled) {
        try {
          await sendVisitReminderEmail(
            user.email,
            user.name || 'Doula',
            visit.families?.mother_name || 'Client',
            visit.scheduled_time || 'Check Dashboard',
            visit.location
          );
          notificationsSent.push(visit.id);
        } catch (mailErr) {
          console.error(`Failed to send email for visit ${visit.id}:`, mailErr);
          errors.push({ visitId: visit.id, error: mailErr.message });
        }
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      processed: visits?.length || 0,
      sent: notificationsSent.length,
      errors
    });

  } catch (err) {
    console.error('Cron Reminders Error:', err);
    return NextResponse.json({ message: 'Internal Server Error', error: err.message }, { status: 500 });
  }
}
