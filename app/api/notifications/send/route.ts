// Next.js API route for sending notifications
// POST /api/notifications/send

export const runtime = 'nodejs';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
// CJS interop
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotificationToUser } = require('@/lib/send-notification');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { userId, title, body, data = {}, type = 'general' } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    // Send the notification
    const result = await sendNotificationToUser(supabase, userId, {
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
