let notificationIntervals = {};

/**
 * Request permission for desktop notification triggers.
 * @returns {Promise<boolean>} - True if permission is granted.
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

/**
 * Show a native browser notification pop-up.
 * @param {string} title
 * @param {string} body
 */
export const showNotification = (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
  };

  try {
    // Dispatch via Service Worker registration if available (better PWA practice)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
    new Notification(title, options);
  }
};

/**
 * Start background interval schedules for reminders.
 * @param {{ enabled: boolean, workout: boolean, water: boolean, sleep: boolean, habit: boolean }} prefs
 */
export const startReminderService = (prefs) => {
  // Clear any active loops to prevent double registrations
  stopReminderService();

  if (Notification.permission !== 'granted') return;

  const { enabled, workout, water, sleep, habit } = prefs;
  if (!enabled) return;

  // 1. Workout Reminder (every 2 minutes)
  if (workout) {
    notificationIntervals.workout = setInterval(() => {
      showNotification('AI Gym Trainer 🏋️‍♂️', 'Time for your workout! Keep your streak burning! 🔥');
    }, 120000);
  }

  // 2. Water Reminder (every 3 minutes)
  if (water) {
    notificationIntervals.water = setInterval(() => {
      showNotification('Stay Hydrated! 💧', 'Drink a glass of water to keep your body active and refreshed.');
    }, 180000);
  }

  // 3. Sleep Reminder (every 5 minutes)
  if (sleep) {
    notificationIntervals.sleep = setInterval(() => {
      showNotification('Sleep Reminder 😴', 'Time to wind down. Rest is essential for athletic recovery.');
    }, 300000);
  }

  // 4. Habit Reminder (every 4 minutes)
  if (habit) {
    notificationIntervals.habit = setInterval(() => {
      showNotification('Habit Tracker 🎯', 'Do not forget to complete your habits for today!');
    }, 240000);
  }
};

/**
 * Clear all running reminder interval loops.
 */
export const stopReminderService = () => {
  Object.keys(notificationIntervals).forEach((key) => {
    clearInterval(notificationIntervals[key]);
  });
  notificationIntervals = {};
};
