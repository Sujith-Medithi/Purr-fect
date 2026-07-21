import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';
import { startReminderService } from './utils/notificationManager.js';

function App() {
  // Bootstrap notification reminder background loops on mount
  useEffect(() => {
    const enabled = localStorage.getItem('notificationsEnabled') !== 'false';
    const workout = localStorage.getItem('workoutReminderEnabled') !== 'false';
    const water = localStorage.getItem('waterReminderEnabled') !== 'false';
    const sleep = localStorage.getItem('sleepReminderEnabled') !== 'false';
    const habit = localStorage.getItem('habitReminderEnabled') !== 'false';

    startReminderService({ enabled, workout, water, sleep, habit });
  }, []);

  return <AppRoutes />;
}

export default App;
