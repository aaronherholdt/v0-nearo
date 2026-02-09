// Next.js API route for sending notifications
// POST /api/notifications/send

export const runtime = 'nodejs';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
// CJS interop
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotificationToUser } = require('@/lib/send-notification');

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data = {}, type = 'general' } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    const configuredSecret = process.env.NOTIFICATIONS_SECRET ?? '';
    const requestSecret = request.headers.get('x-notifications-secret') ?? '';
    const isServerAuthorized = Boolean(configuredSecret) && requestSecret === configuredSecret;

    const supabase = await createClient();
    let notificationClient = supabase;

    if (isServerAuthorized) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { error: 'Server notifications are not configured' },
          { status: 500 }
        );
      }
      notificationClient = createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    } else {
      // Require authenticated user and only allow sending to self
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (user.id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Send the notification
    const result = await sendNotificationToUser(notificationClient, userId, {
      title,
      body,
      data: {
        type,
        ...data
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
