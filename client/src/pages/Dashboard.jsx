import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useHabits } from '../context/HabitContext.jsx';
import { useWorkouts } from '../context/WorkoutContext.jsx';

// ─── Mock Data for Workout & Activity ───────────────────

const recentActivity = [
  { action: 'Completed Upper Body workout', time: '2 hours ago', type: 'workout' },
  { action: 'Updated habit tracking logs', time: '5 hours ago', type: 'streak' },
  { action: 'Logged calorie target goals', time: 'Yesterday', type: 'nutrition' },
  { action: 'Checked off all daily goals', time: 'Yesterday', type: 'pr' },
  { action: 'Completed full flexibility routine', time: '2 days ago', type: 'workout' },
];

// ─── Helper Components ──────────────────────────────────

const activityIcons = {
  workout: (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/10">
      <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
      </svg>
    </div>
  ),
  streak: (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/10">
      <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    </div>
  ),
  nutrition: (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-400 border border-green-500/10">
      <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
      </svg>
    </div>
  ),
  pr: (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/10">
      <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768-.767-1.768-1.768 0-1.002.77-1.768 1.768-1.768h13.5c.996 0 1.768.766 1.768 1.768 0 1.001-.772 1.946-1.768 1.768m-13.5 0A44.676 44.676 0 0112 4.5c2.291 0 4.545.16 6.75.468M5.25 4.236V2.721" />
      </svg>
    </div>
  ),
};

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

const getMondayOfCurrentWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// ─── Dashboard Page ─────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const { habits, toggleHabit, loading: habitsLoading } = useHabits();
  const { workouts, editWorkout } = useWorkouts();

  const todayDayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);

  const currentWeekStart = useMemo(() => getMondayOfCurrentWeek(), []);
  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentWeekStart]);

  const isWorkoutCompletedThisWeek = useCallback((w) => {
    if (!w.completedDates || w.completedDates.length === 0) return false;
    return w.completedDates.some((dateStr) => {
      const compDate = new Date(dateStr);
      return compDate >= currentWeekStart && compDate <= currentWeekEnd;
    });
  }, [currentWeekStart, currentWeekEnd]);

  const todaysPlannedWorkouts = useMemo(() => {
    return workouts.filter((w) => (w.dayOfWeek || 'Monday') === todayDayName);
  }, [workouts, todayDayName]);

  const totalTodaysWorkouts = todaysPlannedWorkouts.length;
  const completedTodaysWorkouts = useMemo(() => {
    return todaysPlannedWorkouts.filter((w) => isWorkoutCompletedThisWeek(w)).length;
  }, [todaysPlannedWorkouts, isWorkoutCompletedThisWeek]);

  const todaysProgress = useMemo(() => {
    return totalTodaysWorkouts > 0 ? Math.round((completedTodaysWorkouts / totalTodaysWorkouts) * 100) : 0;
  }, [completedTodaysWorkouts, totalTodaysWorkouts]);
  
  const todaysCaloriesBurned = useMemo(() => {
    return todaysPlannedWorkouts
      .filter((w) => isWorkoutCompletedThisWeek(w))
      .reduce((sum, w) => sum + (w.calories || 0), 0);
  }, [todaysPlannedWorkouts, isWorkoutCompletedThisWeek]);

  const todaysTotalDuration = useMemo(() => {
    return todaysPlannedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  }, [todaysPlannedWorkouts]);

  const totalHabits = habits.length;
  const completedHabitsToday = habits.filter((h) => h.isCompletedToday).length;
  const habitCompletionPercentage = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  const handleHabitToggle = useCallback(async (id) => {
    try {
      await toggleHabit(id);
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  }, [toggleHabit]);

  const handleWorkoutToggle = useCallback(async (id) => {
    const workout = workouts.find((w) => w._id === id);
    if (!workout) return;

    const currentlyCompleted = isWorkoutCompletedThisWeek(workout);
    let updatedDates = workout.completedDates ? [...workout.completedDates] : [];

    if (currentlyCompleted) {
      updatedDates = updatedDates.filter((dateStr) => {
        const d = new Date(dateStr);
        return d < currentWeekStart || d > currentWeekEnd;
      });
    } else {
      updatedDates.push(new Date().toISOString());
    }

    try {
      await editWorkout(id, {
        ...workout,
        completedDates: updatedDates,
        completed: !currentlyCompleted,
      });
    } catch (err) {
      console.error('Failed to toggle workout completion:', err);
    }
  }, [workouts, isWorkoutCompletedThisWeek, editWorkout, currentWeekStart, currentWeekEnd]);

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Welcome back, <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] bg-clip-text text-transparent">{user?.name || 'Athlete'}</span> 👋
        </h1>
        <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Here&apos;s your training summary for today.</p>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Streak */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#14142B]/75 p-6 border border-white/5 shadow-xl transition-all duration-300 hover:border-orange-500/35 hover:shadow-orange-500/5">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-orange-500/5 transition-transform duration-500 group-hover:scale-125" aria-hidden="true"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Best Habit Streak</span>
              <span className="text-2xl" aria-hidden="true">🔥</span>
            </div>
            <p className="mt-4 text-4xl font-extrabold text-white">
              {bestStreak} <span className="text-sm font-semibold text-[#A5B4FC] uppercase">days</span>
            </p>
            <p className="mt-2 text-xs text-orange-400 font-bold">Keep it burning!</p>
          </div>
        </div>

        {/* Workout Progress */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#14142B]/75 p-6 border border-white/5 shadow-xl transition-all duration-300 hover:border-[#6C63FF]/35 hover:shadow-[#6C63FF]/5">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#6C63FF]/5 transition-transform duration-500 group-hover:scale-125" aria-hidden="true"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Workout Progress</span>
              <span className="text-2xl" aria-hidden="true">💪</span>
            </div>
            <p className="mt-4 text-4xl font-extrabold text-white">
              {todaysProgress}<span className="text-lg font-semibold text-[#A5B4FC]">%</span>
            </p>
            <p className="mt-2 text-xs text-[#6C63FF] font-bold">
              {completedTodaysWorkouts}/{totalTodaysWorkouts} completed
            </p>
          </div>
        </div>

        {/* Habit Completion */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#14142B]/75 p-6 border border-white/5 shadow-xl transition-all duration-300 hover:border-green-500/35 hover:shadow-green-500/5">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-green-500/5 transition-transform duration-500 group-hover:scale-125" aria-hidden="true"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Habit Completion</span>
              <span className="text-2xl" aria-hidden="true">✅</span>
            </div>
            <p className="mt-4 text-4xl font-extrabold text-white">
              {habitCompletionPercentage}<span className="text-lg font-semibold text-[#A5B4FC]">%</span>
            </p>
            <p className="mt-2 text-xs text-green-400 font-bold">
              {completedHabitsToday}/{totalHabits} completed
            </p>
          </div>
        </div>

        {/* Energy spent */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#14142B]/75 p-6 border border-white/5 shadow-xl transition-all duration-300 hover:border-[#00D9FF]/35 hover:shadow-[#00D9FF]/5">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#00D9FF]/5 transition-transform duration-500 group-hover:scale-125" aria-hidden="true"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Calories Burned</span>
              <span className="text-2xl" aria-hidden="true">⚡</span>
            </div>
            <p className="mt-4 text-4xl font-extrabold text-white">
              {todaysCaloriesBurned} <span className="text-sm font-semibold text-[#A5B4FC] uppercase">kcal</span>
            </p>
            <p className="mt-2 text-xs text-[#00D9FF] font-bold">Energy spent today</p>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Workout */}
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 lg:col-span-2 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Today&apos;s Schedule</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {totalTodaysWorkouts} planned · {todaysTotalDuration} min active
              </p>
            </div>
            
            {/* Progress Circular Dial */}
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
                <circle
                  cx="28" cy="28" r="24" fill="none" stroke="#6C63FF" strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - todaysProgress / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute text-xs font-extrabold text-[#6C63FF]">{todaysProgress}%</span>
            </div>
          </div>

          <div className="space-y-3">
            {totalTodaysWorkouts === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-xl">
                <span className="text-4xl mb-3" aria-hidden="true">🧘</span>
                <p className="text-sm text-slate-300 font-semibold mb-5">No workouts scheduled today. Time to recover!</p>
                <Link
                  to="/workouts"
                  className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Configure Workout Planner
                </Link>
              </div>
            ) : (
              todaysPlannedWorkouts.map((w) => (
                <div
                  key={w._id}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                    isWorkoutCompletedThisWeek(w)
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-white/5 bg-[#0B0B14]/40 hover:border-[#6C63FF]/30'
                  }`}
                >
                  {/* Custom Accessible Checkbox */}
                  <button
                    onClick={() => handleWorkoutToggle(w._id)}
                    aria-label={`Mark ${w.exerciseName} as ${isWorkoutCompletedThisWeek(w) ? 'incomplete' : 'complete'}`}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none ${
                      isWorkoutCompletedThisWeek(w)
                        ? 'border-green-500 bg-green-500'
                        : 'border-slate-500 hover:border-[#6C63FF]'
                    }`}
                  >
                    {isWorkoutCompletedThisWeek(w) && (
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <p className={`text-sm font-semibold transition-all ${isWorkoutCompletedThisWeek(w) ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {w.exerciseName}
                    </p>
                  </div>

                  <span className={`text-xs font-mono font-bold ${isWorkoutCompletedThisWeek(w) ? 'text-slate-600' : 'text-indigo-200'}`}>
                    {w.duration}m · {w.totalReps} reps
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Habits */}
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 flex flex-col shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-wide">Daily Habits</h3>
            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400">
              {completedHabitsToday}/{totalHabits}
            </span>
          </div>

          {habitsLoading ? (
            <div className="space-y-3 flex-1 flex flex-col justify-center py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 rounded-xl skeleton-shimmer"></div>
              ))}
            </div>
          ) : totalHabits === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/10 rounded-xl">
              <span className="text-4xl mb-3" aria-hidden="true">🎯</span>
              <p className="text-sm text-slate-300 font-semibold mb-5">No habits tracked today.</p>
              <Link
                to="/habits"
                className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Setup Habits Tracker
              </Link>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {habits.map((habit) => (
                <button
                  key={habit._id}
                  onClick={() => handleHabitToggle(habit._id)}
                  aria-label={`Toggle habit ${habit.name}`}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none ${
                    habit.isCompletedToday
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-white/5 bg-[#0B0B14]/40 hover:border-[#6C63FF]/20'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{getHabitIcon(habit.name)}</span>
                  <span className={`flex-1 text-sm font-semibold ${habit.isCompletedToday ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {habit.name}
                  </span>
                  {habit.isCompletedToday ? (
                    <svg className="h-5 w-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <div className="h-5 w-5 rounded-lg border-2 border-slate-500 shrink-0"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Row ─── */}
      <div className="w-full">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-bold text-white tracking-wide">Activity Logs</h3>

          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-1 border-b border-white/5 last:border-0 last:pb-0">
                {activityIcons[item.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{item.action}</p>
                  <p className="text-xs font-bold text-indigo-300/85 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
