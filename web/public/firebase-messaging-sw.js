/**
 * HASIVU Platform - Firebase Messaging Service Worker
 * Handles background push notifications for delivery confirmations
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'hasivu-platform.firebaseapp.com',
  projectId: 'hasivu-platform',
  storageBucket: 'hasivu-platform.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456789',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  console.log('Background message received:', payload);

  const { notification, data } = payload;

  // Customize notification based on data type
  let notificationTitle = notification?.title || 'HASIVU Platform';
  const notificationOptions = {
    body: notification?.body || 'You have a new notification',
    icon: '/icons/hasivu-logo-192.png',
    badge: '/icons/badge-72.png',
    tag: data?.type || 'general',
    data,
    requireInteraction: true,
    actions: [],
  };

  // Customize for delivery notifications
  if (data?.type === 'delivery_verification') {
    notificationTitle = '🍽️ Meal Delivered!';
    notificationOptions.body = `${data.studentName}'s meal has been delivered at ${data.location}`;
    notificationOptions.icon = '/icons/meal-delivered-192.png';
    notificationOptions.tag = `delivery-${data.verificationId}`;
    notificationOptions.actions = [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-24.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ];
  }

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);

  const { notification, action } = event;
  const { data } = notification;

  // Close notification
  notification.close();

  // Handle different actions
  if (action === 'dismiss') {
    return;
  }

  // Determine URL to open
  let urlToOpen = '/dashboard';

  if (data?.type === 'delivery_verification' && data?.orderId) {
    urlToOpen = `/tracking/orders/${data.orderId}`;
  } else if (data?.orderId) {
    urlToOpen = `/orders/${data.orderId}`;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification: {
              type: data?.type || 'generic',
              data,
            },
          });
          return;
        }
      }

      // Open new window
      return clients.openWindow(self.location.origin + urlToOpen);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);

  const { data } = event.notification;

  // Track notification close analytics
  if (data?.type === 'delivery_verification') {
    // Could send analytics data here
    console.log('Delivery notification dismissed', data);
  }
});

// Service worker install event
self.addEventListener('install', event => {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting();
});

// Service worker activate event
self.addEventListener('activate', event => {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle push events (fallback)
self.addEventListener('push', event => {
  console.log('Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);

    // Show notification if not handled by Firebase messaging
    if (!data.notification && data.data?.type === 'delivery_verification') {
      const notificationOptions = {
        body: `${data.data.studentName}'s meal has been delivered`,
        icon: '/icons/meal-delivered-192.png',
        badge: '/icons/badge-72.png',
        tag: `delivery-${data.data.verificationId}`,
        data: data.data,
        requireInteraction: true,
      };

      event.waitUntil(
        self.registration.showNotification('🍽️ Meal Delivered!', notificationOptions)
      );
    }
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service worker error:', event);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service worker unhandled rejection:', event);
});
