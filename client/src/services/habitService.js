import api from './api.js';

// Helper to get local date string YYYY-MM-DD
export const getLocalDateString = () => {
  return new Date().toLocaleDateString('sv').substring(0, 10);
};

/**
 * Retrieve all habits for the authenticated user.
 */
export const getHabits = () => {
  const today = getLocalDateString();
  return api.get(`/habits?today=${today}`);
};

/**
 * Create a new habit.
 * @param {{ name: string, description: string }} data
 */
export const createHabit = (data) => {
  return api.post('/habits', data);
};

/**
 * Update an existing habit.
 * @param {string} id
 * @param {{ name: string, description: string }} data
 */
export const updateHabit = (id, data) => {
  const today = getLocalDateString();
  return api.put(`/habits/${id}?today=${today}`, data);
};

/**
 * Delete a habit.
 * @param {string} id
 */
export const deleteHabit = (id) => {
  return api.delete(`/habits/${id}`);
};

/**
 * Toggle completion status of a habit.
 * @param {string} id
 * @param {string} date - Local date string YYYY-MM-DD
 */
export const toggleHabitCompletion = (id, date) => {
  const today = getLocalDateString();
  return api.post(`/habits/${id}/toggle?today=${today}`, { date });
};
