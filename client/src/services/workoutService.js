import api from './api.js';

/**
 * Retrieve all workout sessions for the authenticated user.
 * @param {string} sort - Sort order: 'asc' or 'desc' (default: 'desc')
 */
export const getWorkouts = (sort = 'desc') => {
  return api.get(`/workouts?sort=${sort}`);
};

/**
 * Create a new workout session record.
 * @param {{ exerciseName: string, date: string, duration: number, totalReps: number, accuracy: number, calories: number }} data
 */
export const createWorkout = (data) => {
  return api.post('/workouts', data);
};

/**
 * Update an existing workout session.
 * @param {string} id
 * @param {{ exerciseName: string, date: string, duration: number, totalReps: number, accuracy: number, calories: number }} data
 */
export const updateWorkout = (id, data) => {
  return api.put(`/workouts/${id}`, data);
};

/**
 * Delete a workout session record.
 * @param {string} id
 */
export const deleteWorkout = (id) => {
  return api.delete(`/workouts/${id}`);
};

/**
 * Get performance report details aggregated on the server.
 */
export const getWorkoutReport = () => {
  return api.get('/workouts/report');
};
