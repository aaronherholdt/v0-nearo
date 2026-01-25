// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// IMPORTANT: Replace these values with your Firebase config from Step 1
firebase.initializeApp({
  apiKey: "AIzaSyCJyLqDuJdE0YeGYdK1NDll5VMVsegX7qg",
  authDomain: "nearo-meet.firebaseapp.com",
  projectId: "nearo-meet",
  storageBucket: "nearo-meet.firebasestorage.app",
  messagingSenderId: "168306599171",
  appId: "1:168306599171:web:619e977d000d6488b27536",
  measurementId: "G-GRMM71L2DT"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message:', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'New Smart Match!';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new match waiting for you!',
    icon: '/Nearo.png', // Your app icon
    badge: '/badge-7.png', // Small icon for mobile
    vibrate: [200, 100, 200], // Vibration pattern
    tag: 'smart-match', // Prevents duplicate notifications
    requireInteraction: true, // Keeps notification visible
    data: {
      url: payload.data?.url || '/' // Where to navigate on click
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
