import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerUser, loginUser, logoutUser, getMe, updateSettings as updateSettingsApi } from '../services/authService.js';
import { startReminderService, stopReminderService } from '../utils/notificationManager.js';

const AuthContext = createContext(null);

/**
 * Custom hook to consume auth context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth provider — wraps the entire app.
 * On mount, attempts to restore the session from the httpOnly cookie via /api/auth/me.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session
  const [error, setError] = useState(null);

  // Helper to apply user preferences to the DOM and local storage
  const applySettingsHelper = useCallback((userData) => {
    if (!userData) return;

    // Apply Theme
    const savedTheme = localStorage.getItem('theme') || userData.theme || 'modern-saas';
    const activeTheme = savedTheme === 'dark' ? 'modern-saas' : savedTheme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('theme', activeTheme);

    // Apply Notifications
    if (userData.notifications) {
      const { enabled, workout, water, sleep, habit } = userData.notifications;
      localStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
      localStorage.setItem('workoutReminderEnabled', workout ? 'true' : 'false');
      localStorage.setItem('waterReminderEnabled', water ? 'true' : 'false');
      localStorage.setItem('sleepReminderEnabled', sleep ? 'true' : 'false');
      localStorage.setItem('habitReminderEnabled', habit ? 'true' : 'false');

      startReminderService({ enabled, workout, water, sleep, habit });
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await getMe();
        setUser(data.user);
        applySettingsHelper(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [applySettingsHelper]);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await registerUser({ name, email, password });
      setUser(data.user);
      applySettingsHelper(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  }, [applySettingsHelper]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await loginUser({ email, password });
      setUser(data.user);
      applySettingsHelper(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  }, [applySettingsHelper]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Logout even if the API call fails
    } finally {
      setUser(null);
      setError(null);

      // Reset theme and stop reminders
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      localStorage.removeItem('notificationsEnabled');
      localStorage.removeItem('workoutReminderEnabled');
      localStorage.removeItem('waterReminderEnabled');
      localStorage.removeItem('sleepReminderEnabled');
      localStorage.removeItem('habitReminderEnabled');
      stopReminderService();
    }
  }, []);

  const updateSettings = useCallback(async (settingsData) => {
    setError(null);
    try {
      const { data } = await updateSettingsApi(settingsData);
      setUser(data.user);
      applySettingsHelper(data.user);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update settings';
      setError(message);
      throw new Error(message);
    }
  }, [applySettingsHelper]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateSettings,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
