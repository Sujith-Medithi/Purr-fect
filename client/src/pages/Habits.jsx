import { useState } from 'react';
import { useHabits } from '../context/HabitContext.jsx';

const getHabitIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('water') || lower.includes('drink') || lower.includes('hydrate')) return '💧';
  if (lower.includes('sleep') || lower.includes('bed') || lower.includes('rest')) return '😴';
  if (lower.includes('step') || lower.includes('walk') || lower.includes('run')) return '🚶';
  if (lower.includes('vit') || lower.includes('pill') || lower.includes('med')) return '💊';
  if (lower.includes('food') || lower.includes('diet') || lower.includes('eat') || lower.includes('sugar') || lower.includes('calories')) return '🥗';
  if (lower.includes('read') || lower.includes('learn') || lower.includes('book')) return '📚';
  if (lower.includes('stretch') || lower.includes('yoga') || lower.includes('flex')) return '🧘';
  return '🎯';
};

const Habits = () => {
  const { habits, loading, addHabit, editHabit, removeHabit, toggleHabit } = useHabits();

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [habitIdToDelete, setHabitIdToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Stats calculation
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.isCompletedToday).length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const activeStreaks = habits.filter((h) => (h.streak || 0) > 0).length;

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (habit) => {
    setEditingId(habit._id);
    setName(habit.name);
    setDescription(habit.description);
    setModalError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!name.trim()) {
      setModalError('Habit name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await editHabit(editingId, name.trim(), description.trim());
      } else {
        await addHabit(name.trim(), description.trim());
      }
      setModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Failed to save habit');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (id) => {
    setHabitIdToDelete(id);
    setDeleteError('');
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await removeHabit(habitIdToDelete);
      setDeleteConfirmOpen(false);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete habit');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleHabit(id);
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Habit Loops</h1>
          <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Track your daily consistency, milestones, and wellness habits.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6C63FF]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[#6C63FF]/35 hover:brightness-110 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Habit Loop
        </button>
      </div>

      {/* Stats Card Row */}
      {totalHabits > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</p>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {completionPercentage}<span className="text-lg font-bold text-slate-400">%</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-300 font-semibold">Of daily goals checked off</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Streaks</p>
              <p className="mt-3 text-3xl font-extrabold text-white">{activeStreaks}</p>
              <p className="mt-1.5 text-xs text-slate-300 font-semibold">Ongoing routines</p>
            </div>
            <span className="text-3xl" aria-hidden="true">🔥</span>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Best Streak</p>
              <p className="mt-3 text-3xl font-extrabold text-white">{bestStreak} <span className="text-lg font-bold text-slate-400">days</span></p>
              <p className="mt-1.5 text-xs text-slate-300 font-semibold">Your peak consistency</p>
            </div>
            <span className="text-3xl" aria-hidden="true">✨</span>
          </div>
        </div>
      )}

      {/* Main Habits List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl border border-white/5 skeleton-shimmer"></div>
          ))}
        </div>
      ) : totalHabits === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-12 text-center shadow-xl flex flex-col items-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20 mb-6 shadow-inner animate-pulse">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Track Daily Habits</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed font-medium">
            Forming small wellness habits builds fitness discipline. Add your first goal (e.g. hydration, active stretching, rest targets) to get started!
          </p>
          <button
            onClick={openAddModal}
            className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-8 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
          >
            Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {habits.map((habit) => (
            <div
              key={habit._id}
              className={`group flex items-start gap-4 rounded-2xl border p-5 transition-all duration-300 ${
                habit.isCompletedToday
                  ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/35'
                  : 'border-white/5 bg-[#14142B]/45 hover:border-[#6C63FF]/30'
              }`}
            >
              {/* Accessible Toggle Button */}
              <button
                onClick={() => handleToggle(habit._id)}
                aria-label={`Toggle completion for habit ${habit.name}`}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none ${
                  habit.isCompletedToday
                    ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/10'
                    : 'border-slate-500 hover:border-[#6C63FF]'
                }`}
              >
                {habit.isCompletedToday && (
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>

              {/* Title & description */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-bold truncate transition-colors ${
                  habit.isCompletedToday ? 'text-slate-500 line-through font-semibold' : 'text-slate-200'
                }`}>
                  {habit.name}
                </h3>
                {habit.description && (
                  <p className={`mt-1.5 text-xs font-semibold leading-relaxed line-clamp-2 ${
                    habit.isCompletedToday ? 'text-slate-600 line-through' : 'text-[#A5B4FC]'
                  }`}>
                    {habit.description}
                  </p>
                )}

                {/* Streak indicator */}
                <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/20 shadow-sm">
                  <span aria-hidden="true">🔥</span>
                  <span>{habit.streak || 0} Day Streak</span>
                </div>
              </div>

              {/* Edit/Delete Options */}
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => openEditModal(habit)}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-[#6C63FF] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
                  title="Edit Habit"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={() => openDeleteConfirm(habit._id)}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
                  title="Delete Habit"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal (Obsidian Glass) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#14142B] p-6 shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-extrabold text-white tracking-wide mb-5">
              {editingId ? 'Edit Habit Loop' : 'Add New Habit Loop'}
            </h2>

            {modalError && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-semibold">
                <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="habit-name-input" className="block text-sm font-semibold text-slate-200">
                  Habit Name
                </label>
                <input
                  id="habit-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hydrate (3L Water)"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="habit-desc-input" className="block text-sm font-semibold text-slate-200">
                  Description (Optional)
                </label>
                <textarea
                  id="habit-desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Keep water bottle full and set alerts"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#6C63FF]/20 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#14142B] p-6 shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-bold text-white tracking-wide mb-3 flex items-center gap-2.5">
              <svg className="h-6 w-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delete Habit?
            </h2>
            
            <p className="text-sm leading-relaxed text-slate-300 font-medium mb-5">
              Are you sure you want to delete this habit? This action cannot be undone.
            </p>

            {deleteError && (
              <div role="alert" className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300 font-semibold">
                <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habits;
