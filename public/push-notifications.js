// Initialize Firebase (replace with your config from Step 1)
const firebaseConfig = {
  apiKey: "AIzaSyCJyLqDuJdE0YeGYdK1NDll5VMVsegX7qg",
  authDomain: "nearo-meet.firebaseapp.com",
  projectId: "nearo-meet",
  storageBucket: "nearo-meet.firebasestorage.app",
  messagingSenderId: "168306599171",
  appId: "1:168306599171:web:619e977d000d6488b27536",
  measurementId: "G-GRMM71L2DT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Main notification setup function
async function setupPushNotifications() {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered');

    // Request notification permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted');

      // Get FCM token
      const token = await messaging.getToken({
        vapidKey: window.NEARO_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token:', token);

        // Send this token to your server
        await saveTokenToServer(token);

        // Show success message to user
        showNotificationStatus('✅ Notifications enabled! You\'ll receive alerts for new matches.');
      }
    } else {
      showNotificationStatus('❌ Please enable notifications to receive match alerts');
    }

  } catch (error) {
    console.error('Error setting up notifications:', error);
    showNotificationStatus('⚠️ Could not enable notifications. Please try again.');
  }
}

// Save token to your server
async function saveTokenToServer(token) {
  // Send the token to your backend
  // This is where you'll store it in your database
  try {
    const response = await fetch('/api/notifications/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: detectPlatform()
      })
    });

    if (response.ok) {
      console.log('Token saved to server');
      localStorage.setItem('fcm_token', token);
    }
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

// Detect platform (iOS/Android/Desktop)
function detectPlatform() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else {
    return 'desktop';
  }
}

// Show notification status to user
function showNotificationStatus(message) {
  // Create or update status element
  let statusEl = document.getElementById('notification-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'notification-status';
    statusEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 300px;
    `;
    document.body.appendChild(statusEl);
  }

  statusEl.textContent = message;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 5000);
}

// Handle foreground messages
messaging.onMessage((payload) => {
  console.log('Message received in foreground:', payload);

  // Show custom in-app notification
  showInAppNotification(
    payload.notification.title,
    payload.notification.body,
    payload.data?.url
  );
});

// Show custom in-app notification
function showInAppNotification(title, body, url) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 350px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    cursor: pointer;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="flex: 1;">
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${title}</h4>
        <p style="margin: 0; color: #666; font-size: 14px;">${body}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()"
              style="background: none; border: none; font-size: 20px; cursor: pointer; margin-left: 10px;">
        ✕
      </button>
    </div>
  `;

  // Navigate on click
  if (url) {
    notification.onclick = () => {
      window.location.href = url;
    };
  }

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    notification.remove();
  }, 10000);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Expose the setup function globally (so you can call it from any button)
window.setupPushNotifications = setupPushNotifications;
