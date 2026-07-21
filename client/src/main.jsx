import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { HabitProvider } from './context/HabitContext.jsx';
import { WorkoutProvider } from './context/WorkoutContext.jsx';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <HabitProvider>
          <WorkoutProvider>
            <App />
          </WorkoutProvider>
        </HabitProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
