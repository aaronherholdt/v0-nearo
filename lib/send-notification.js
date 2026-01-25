// Backend notification center for Nearo MVP
// Firebase Admin SDK for sending push notifications
// Integrates with Next.js API routes and Supabase
//
// Setup Instructions:
// 1. Install dependencies: npm install firebase-admin
// 2. Set up Firebase project and get service account credentials
// 3. Set environment variables:
//    - FIREBASE_PROJECT_ID
//    - FIREBASE_PRIVATE_KEY (with \n replaced)
//    - FIREBASE_CLIENT_EMAIL
// 4. Create Supabase tables:
//    - user_notification_tokens (user_id, fcm_token, platform, updated_at, is_active)
//    - notifications (user_id, title, body, link, type, created_at, seen_at)
//
// Usage Examples:
// - Save token: POST /api/notifications/token with { token, platform }
// - Send notification: POST /api/notifications/send with { userId, title, body, data }
// - Match notifications: call onNewSmartMatch(supabaseClient, user1Id, user2Id, matchDetails)

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// For production, use environment variables or a secure service account path
let firebaseApp;

function loadServiceAccountFromEnv() {
  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  ];

  for (const value of candidates) {
    if (!value) continue;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn(
        'Failed to parse Firebase service account JSON from environment variable.',
        error
      );
    }
  }

  return null;
}

function loadServiceAccountFromFile() {
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(process.cwd(), 'service-account-key.json'),
    path.join(process.cwd(), 'firebase-service-account.json'),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    const resolvedPath = path.isAbsolute(candidate)
      ? candidate
      : path.join(process.cwd(), candidate);

    try {
      if (!fs.existsSync(resolvedPath)) {
        continue;
      }

      const fileContents = fs.readFileSync(resolvedPath, 'utf8');
      return JSON.parse(fileContents);
    } catch (error) {
      console.warn(
        `Failed to read Firebase service account file at ${resolvedPath}.`,
        error
      );
    }
  }

  return null;
}

function resolveServiceAccount() {
  const fromEnv = loadServiceAccountFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const fromFile = loadServiceAccountFromFile();
  if (fromFile) {
    return fromFile;
  }

  return null;
}

function initializeFirebase() {
  if (!firebaseApp) {
    try {
      // Try to initialize with environment variables first (recommended for production)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      } else {
        const serviceAccount = resolveServiceAccount();

        if (!serviceAccount) {
          throw new Error(
            "Firebase Admin credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, or provide FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_SERVICE_ACCOUNT_JSON."
          );
        }

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId:
            process.env.FIREBASE_PROJECT_ID ||
            serviceAccount.project_id ||
            serviceAccount.projectId,
        });
      }
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }
  return firebaseApp;
}

// Function to send notification to a specific user
async function sendMatchNotification(userToken, matchData) {
  initializeFirebase();

  const message = {
    notification: {
      title: '🎉 New Smart Match!',
      body: `You have a new match with ${matchData.matchName}!`
    },
    data: {
      matchId: matchData.matchId,
      matchName: matchData.matchName,
      type: 'match',
      url: `/families/${matchData.matchId}` // Updated to match your app's routing
    },
    token: userToken,

    // Platform-specific options
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        clickAction: 'OPEN_FAMILY',
        icon: 'ic_notification'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    webpush: {
      headers: {
        Urgency: 'high'
      },
      fcmOptions: {
        link: 'https://nearo.forum/families' // or a specific target per message
      },
      notification: {
        icon: '/Nearo.png', // Updated to use your app icon
        badge: '/Nearo.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent match notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending match notification:', error);
    return { success: false, error: error.message };
  }
}

// Function to send notification to multiple users
async function sendBulkNotifications(tokens, matchData) {
  initializeFirebase();

  const message = {
    notification: {
      title: '🎉 New Smart Match Available!',
      body: 'Check out your new match now!'
    },
    data: {
      type: 'new_match',
      url: '/families' // Updated to match your app's routing
    },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} notifications sent successfully`);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('Failed tokens:', failedTokens);
      // In a real app, you'd want to remove/update these tokens in your database
      return { ...response, failedTokens };
    }

    return response;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
}

// Generic notification function for different types
async function sendNotification(userToken, notificationData) {
  initializeFirebase();

  const { title, body, data = {}, icon = '/Nearo.png' } = notificationData;

  const message = {
    notification: {
      title,
      body
    },
    data: {
      ...data,
      timestamp: Date.now().toString()
    },
    token: userToken,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        icon: 'ic_notification'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    webpush: {
      headers: {
        Urgency: 'high'
      },
      fcmOptions: {
        link: 'https://nearo.forum/families' // or a specific target per message
      },
      notification: {
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
        requireInteraction: true
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

// Supabase integration functions for notification management

// Function to save FCM token to Supabase
async function saveNotificationToken(supabaseClient, userId, token, platform = 'web') {
  try {
    const { error } = await supabaseClient
      .from('user_notification_tokens')
      .upsert({
        user_id: userId,
        fcm_token: token,
        platform: platform,
        updated_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) throw error;
    console.log(`Token saved for user ${userId} on platform ${platform}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving notification token:', error);
    return { success: false, error: error.message };
  }
}

// Function to get user's FCM token from Supabase
async function getUserNotificationToken(supabaseClient, userId, platform = null) {
  try {
    let query = supabaseClient
      .from('user_notification_tokens')
      .select('fcm_token, platform')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    // Return the most recent token if multiple exist
    return data[0].fcm_token;
  } catch (error) {
    console.error('Error getting user notification token:', error);
    return null;
  }
}

// Function to send notification to a user by their user ID (looks up token automatically)
async function sendNotificationToUser(supabaseClient, userId, notificationData) {
  try {
    const token = await getUserNotificationToken(supabaseClient, userId);

    if (!token) {
      console.log(`No notification token found for user ${userId}`);
      return { success: false, error: 'No notification token found' };
    }

    return await sendNotification(token, notificationData);
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { success: false, error: error.message };
  }
}

// Function to call when a smart match occurs in your system
async function onNewSmartMatch(supabaseClient, user1Id, user2Id, matchDetails) {
  try {
    // Get user details for the match notification
    const { data: user1Data, error: user1Error } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user1Id)
      .single();

    const { data: user2Data, error: user2Error } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', user2Id)
      .single();

    if (user1Error || user2Error) {
      console.error('Error fetching user data for match notification:', user1Error || user2Error);
      return;
    }

    // Send notifications to both users
    const notifications = [
      sendNotificationToUser(supabaseClient, user1Id, {
        title: '🎉 New Smart Match!',
        body: `You have a new match with ${user2Data.name}!`,
        data: {
          type: 'match',
          matchId: matchDetails.id,
          matchName: user2Data.name,
          url: `/families/${matchDetails.id}`
        }
      }),
      sendNotificationToUser(supabaseClient, user2Id, {
        title: '🎉 New Smart Match!',
        body: `You have a new match with ${user1Data.name}!`,
        data: {
          type: 'match',
          matchId: matchDetails.id,
          matchName: user1Data.name,
          url: `/families/${matchDetails.id}`
        }
      })
    ];

    const results = await Promise.allSettled(notifications);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;

    console.log(`Match notifications: ${successful}/2 sent successfully`);

    // Also create in-app notifications
    await createInAppNotifications(supabaseClient, [
      {
        user_id: user1Id,
        title: 'New Smart Match!',
        body: `You have a new match with ${user2Data.name}`,
        link: `/families/${matchDetails.id}`,
        type: 'match'
      },
      {
        user_id: user2Id,
        title: 'New Smart Match!',
        body: `You have a new match with ${user1Data.name}`,
        link: `/families/${matchDetails.id}`,
        type: 'match'
      }
    ]);

  } catch (error) {
    console.error('Error sending match notifications:', error);
  }
}

// Function to create in-app notifications (complements push notifications)
async function createInAppNotifications(supabaseClient, notifications) {
  try {
    const { error } = await supabaseClient
      .from('notifications')
      .insert(notifications.map(n => ({
        ...n,
        created_at: new Date().toISOString()
      })));

    if (error) throw error;
    console.log(`Created ${notifications.length} in-app notifications`);
  } catch (error) {
    console.error('Error creating in-app notifications:', error);
  }
}

// Function to deactivate old tokens (call this periodically to clean up)
async function cleanupInactiveTokens(supabaseClient, daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await supabaseClient
      .from('user_notification_tokens')
      .update({ is_active: false })
      .lt('updated_at', cutoffDate.toISOString())
      .eq('is_active', true);

    if (error) throw error;
    console.log(`Cleaned up notification tokens older than ${daysOld} days`);
  } catch (error) {
    console.error('Error cleaning up inactive tokens:', error);
  }
}

module.exports = {
  initializeFirebase,
  sendMatchNotification,
  sendBulkNotifications,
  sendNotification,
  saveNotificationToken,
  getUserNotificationToken,
  sendNotificationToUser,
  onNewSmartMatch,
  createInAppNotifications,
  cleanupInactiveTokens
};
