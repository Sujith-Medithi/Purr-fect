import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getLocalDateString,
} from '../services/habitService.js';

const HabitContext = createContext(null);

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};

export const HabitProvider = ({ children }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getHabits();
      setHabits(data.habits);
    } catch (err) {
      console.error('Fetch habits error:', err);
      setError(err.response?.data?.message || 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load habits when user logs in, reset when logged out
  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
    }
  }, [user, fetchHabits]);

  const addHabit = async (name, description) => {
    setError(null);
    try {
      const { data } = await createHabit({ name, description });
      setHabits((prev) => [...prev, data.habit]);
      return data.habit;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add habit';
      setError(msg);
      throw new Error(msg);
    }
  };

  const editHabit = async (id, name, description) => {
    setError(null);
    try {
      const { data } = await updateHabit(id, { name, description });
      setHabits((prev) =>
        prev.map((habit) => (habit._id === id ? data.habit : habit))
      );
      return data.habit;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to edit habit';
      setError(msg);
      throw new Error(msg);
    }
  };

  const removeHabit = async (id) => {
    setError(null);
    try {
      await deleteHabit(id);
      setHabits((prev) => prev.filter((habit) => habit._id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete habit';
      setError(msg);
      throw new Error(msg);
    }
  };

  const toggleHabit = async (id, date = getLocalDateString()) => {
    setError(null);
    try {
      const { data } = await toggleHabitCompletion(id, date);
      setHabits((prev) =>
        prev.map((habit) => (habit._id === id ? data.habit : habit))
      );
      return data.habit;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to toggle habit';
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        loading,
        error,
        fetchHabits,
        addHabit,
        editHabit,
        removeHabit,
        toggleHabit,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};
