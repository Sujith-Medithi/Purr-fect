import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  getWorkouts,
  createWorkout as apiCreateWorkout,
  updateWorkout as apiUpdateWorkout,
  deleteWorkout as apiDeleteWorkout,
  getWorkoutReport,
} from '../services/workoutService.js';

const WorkoutContext = createContext(null);

export const useWorkouts = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkouts must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('desc'); // 'asc' or 'desc' by date
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!user) return;
    setReportLoading(true);
    try {
      const { data } = await getWorkoutReport();
      setReport(data.report);
    } catch (err) {
      console.error('Fetch report error:', err);
    } finally {
      setReportLoading(false);
    }
  }, [user]);

  const fetchWorkouts = useCallback(async (currentSort = sort) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getWorkouts(currentSort);
      setWorkouts(data.workouts);
    } catch (err) {
      console.error('Fetch workouts error:', err);
      setError(err.response?.data?.message || 'Failed to fetch workouts');
    } finally {
      setLoading(false);
    }
  }, [user, sort]);

  // Load workouts when user logs in or sort order changes, clear on logout
  useEffect(() => {
    if (user) {
      fetchWorkouts(sort);
      fetchReport();
    } else {
      setWorkouts([]);
      setReport(null);
    }
  }, [user, sort, fetchWorkouts, fetchReport]);

  const addWorkout = async (workoutData) => {
    setError(null);
    try {
      const { data } = await apiCreateWorkout(workoutData);
      await fetchWorkouts(sort);
      await fetchReport();
      return data.workout;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add workout session';
      setError(msg);
      throw new Error(msg);
    }
  };

  const editWorkout = async (id, workoutData) => {
    setError(null);
    try {
      const { data } = await apiUpdateWorkout(id, workoutData);
      await fetchWorkouts(sort);
      await fetchReport();
      return data.workout;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update workout session';
      setError(msg);
      throw new Error(msg);
    }
  };

  const removeWorkout = async (id) => {
    setError(null);
    try {
      await apiDeleteWorkout(id);
      setWorkouts((prev) => prev.filter((w) => w._id !== id));
      await fetchReport();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete workout session';
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        loading,
        error,
        sort,
        setSort,
        fetchWorkouts,
        addWorkout,
        editWorkout,
        removeWorkout,
        report,
        reportLoading,
        fetchReport,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
