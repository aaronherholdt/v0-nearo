// Next.js API route for saving notification tokens
// POST /api/notifications/token

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
// CJS interop
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { saveNotificationToken } = require('@/lib/send-notification');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { token, platform = 'web' } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Save the token using our notification utility
    const result = await saveNotificationToken(supabase, user.id, token, platform);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving notification token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
