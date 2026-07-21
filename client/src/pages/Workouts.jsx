import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkouts } from '../context/WorkoutContext.jsx';
import { usePoseDetection } from '../hooks/usePoseDetection.js';
import { useAuth } from '../context/AuthContext.jsx';

const Workouts = () => {
  const { user } = useAuth();
  const {
    workouts,
    loading,
    sort,
    setSort,
    addWorkout,
    editWorkout,
    removeWorkout,
  } = useWorkouts();

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [exerciseName, setExerciseName] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [totalReps, setTotalReps] = useState('');
  const [accuracy, setAccuracy] = useState(100);
  const [calories, setCalories] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Weekly Planner State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Delete Confirm Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workoutIdToDelete, setWorkoutIdToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Active Workout Session states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Dynamic exercise selection and creation
  const [sessionExercises, setSessionExercises] = useState([
    { name: 'Squats', joint: 'knees', startState: 'UP' },
    { name: 'Push-ups', joint: 'elbows', startState: 'UP' },
    { name: 'Lunges', joint: 'knees', startState: 'UP' },
    { name: 'Bicep Curls', joint: 'elbows', startState: 'DOWN' },
    { name: 'Plank', joint: 'static', startState: 'HOLD' },
  ]);
  const [activeExerciseName, setActiveExerciseName] = useState('Squats');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customJoint, setCustomJoint] = useState('elbows');
  const [customStartState, setCustomStartState] = useState('UP');
  const [customError, setCustomError] = useState('');
  const voiceEnabled = user?.voiceFeedback !== false;

  const [sessionDuration, setSessionDuration] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Get current active exercise tracking config
  const currentExConfig =
    sessionExercises.find((e) => e.name === activeExerciseName) ||
    sessionExercises[0];

  // MediaPipe Pose detection hook (Generic configuration)
  const {
    fps: poseFps,
    error: poseError,
    reps: trackedReps,
    currentState: trackedState,
    currentRep: trackedRepProgress,
    formWarnings,
  } = usePoseDetection(
    videoRef,
    canvasRef,
    isSessionActive && !!stream,
    activeExerciseName,
    currentExConfig.joint,
    currentExConfig.startState,
    voiceEnabled
  );

  const displayError = cameraError || poseError;

  // Camera stream lifecycle
  useEffect(() => {
    let activeStream = null;

    const startCamera = async () => {
      if (!isSessionActive) return;
      setCameraLoading(true);
      setCameraError('');

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission denied. Please enable camera access in your browser settings to perform active sessions.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera device found on this system. Please connect a webcam to continue.');
        } else {
          setCameraError('Failed to access camera: ' + err.message);
        }
      } finally {
        setCameraLoading(false);
      }
    };

    if (isSessionActive) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isSessionActive]);

  // Bind stream to video ref when ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Active session stopwatch timer
  useEffect(() => {
    let interval = null;
    if (isSessionActive && stream) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, stream]);

  const formatSessionTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExitSession = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsSessionActive(false);
  };

  const handleFinishAndLog = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsSessionActive(false);

    setEditingId(null);
    setExerciseName(activeExerciseName);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[new Date().getDay()];
    setSelectedDay(currentDayName);
    
    const dayInfo = weekDays.find((wd) => wd.name === currentDayName) || weekDays[0];
    const targetDate = new Date(dayInfo.date);
    targetDate.setHours(9, 0, 0, 0);
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    setDate(targetDate.toISOString().slice(0, 16));
    
    const computedMins = Math.max(1, Math.ceil(sessionDuration / 60));
    setDuration(computedMins);
    setTotalReps(trackedReps);
    setAccuracy(92);
    setCalories(trackedReps * 4 || Math.round(sessionDuration * 0.12));
    
    setModalError('');
    setModalOpen(true);
  };

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    setCustomError('');

    const trimmedName = customName.trim();
    if (!trimmedName) {
      setCustomError('Exercise name is required');
      return;
    }

    const duplicate = sessionExercises.some(
      (ex) => ex.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setCustomError('An exercise with this name already exists');
      return;
    }

    const newEx = {
      name: trimmedName,
      joint: customJoint,
      startState: customStartState,
    };

    setSessionExercises((prev) => [...prev, newEx]);
    setActiveExerciseName(trimmedName);
    setCustomName('');
    setShowAddCustom(false);
  };

// Helper to get Monday of a week relative to today and weekOffset - Declared outside to avoid recreation
const getMonday = (d, offset = 0) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekDays = (offset = 0) => {
  const monday = getMonday(new Date(), offset);
  const days = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    days.push({
      name: dayNames[i],
      date: dayDate,
    });
  }
  return days;
};

// Inside component logic:
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const startOfWeekDate = useMemo(() => weekDays[0].date, [weekDays]);
  const endOfWeekDate = useMemo(() => weekDays[6].date, [weekDays]);

  const formatWeekRange = useCallback(() => {
    const startStr = startOfWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endOfWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [startOfWeekDate, endOfWeekDate]);

  const isWorkoutCompletedInDisplayedWeek = useCallback((w) => {
    if (!w.completedDates || w.completedDates.length === 0) return false;
    const start = new Date(startOfWeekDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endOfWeekDate);
    end.setHours(23, 59, 59, 999);
    return w.completedDates.some((dateStr) => {
      const compDate = new Date(dateStr);
      return compDate >= start && compDate <= end;
    });
  }, [startOfWeekDate, endOfWeekDate]);

  const groupedWorkouts = useMemo(() => {
    const groups = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    workouts.forEach((w) => {
      const dayName = w.dayOfWeek || 'Monday';
      if (groups[dayName]) {
        groups[dayName].push(w);
      }
    });
    return groups;
  }, [workouts]);

  // Weekly Stats
  const totalSessions = useMemo(() => workouts.length, [workouts]);
  const totalCalories = useMemo(() => {
    return workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  }, [workouts]);
  const totalDuration = useMemo(() => {
    return workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  }, [workouts]);
  const completedSessions = useMemo(() => {
    return workouts.filter((w) => isWorkoutCompletedInDisplayedWeek(w)).length;
  }, [workouts, isWorkoutCompletedInDisplayedWeek]);
  const completionRate = useMemo(() => {
    return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  }, [totalSessions, completedSessions]);

  const handleToggleCompleted = useCallback(async (workout) => {
    const currentlyCompleted = isWorkoutCompletedInDisplayedWeek(workout);
    const dayInfo = weekDays.find((wd) => wd.name === (workout.dayOfWeek || 'Monday')) || weekDays[0];
    const targetDate = new Date(dayInfo.date);
    targetDate.setHours(9, 0, 0, 0);

    const start = new Date(startOfWeekDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endOfWeekDate);
    end.setHours(23, 59, 59, 999);

    let updatedDates = workout.completedDates ? [...workout.completedDates] : [];

    if (currentlyCompleted) {
      updatedDates = updatedDates.filter((dateStr) => {
        const d = new Date(dateStr);
        return d < start || d > end;
      });
    } else {
      updatedDates.push(targetDate.toISOString());
    }

    try {
      await editWorkout(workout._id, {
        ...workout,
        completedDates: updatedDates,
        completed: !currentlyCompleted,
      });
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  }, [weekDays, startOfWeekDate, endOfWeekDate, isWorkoutCompletedInDisplayedWeek, editWorkout]);

  const openAddModal = useCallback((defaultDay = 'Monday') => {
    setEditingId(null);
    setExerciseName('');
    setSelectedDay(defaultDay);

    const dayInfo = weekDays.find((wd) => wd.name === defaultDay) || weekDays[0];
    const targetDate = new Date(dayInfo.date);
    targetDate.setHours(9, 0, 0, 0);
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    setDate(targetDate.toISOString().slice(0, 16));

    setDuration('');
    setTotalReps('');
    setAccuracy(100);
    setCalories('');
    setModalError('');
    setModalOpen(true);
  }, [weekDays]);

  const openEditModal = useCallback((workout) => {
    setEditingId(workout._id);
    setExerciseName(workout.exerciseName);

    const dayName = workout.dayOfWeek || 'Monday';
    setSelectedDay(dayName);

    const d = new Date(workout.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setDate(d.toISOString().slice(0, 16));
    setDuration(workout.duration);
    setTotalReps(workout.totalReps);
    setAccuracy(workout.accuracy || 100);
    setCalories(workout.calories || 0);
    setModalError('');
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setModalError('');

    if (!exerciseName.trim()) {
      setModalError('Exercise name is required');
      return;
    }
    if (!duration || Number(duration) <= 0) {
      setModalError('Please enter a valid duration in minutes');
      return;
    }
    if (totalReps === '' || Number(totalReps) < 0) {
      setModalError('Please enter a valid reps count');
      return;
    }

    setSubmitting(true);

    const finalReps = Number(totalReps);
    const finalDuration = Number(duration);
    const computedCalories = calories ? Number(calories) : (finalReps * 4 || finalDuration * 5);

    const dayInfo = weekDays.find((wd) => wd.name === selectedDay) || weekDays[0];
    const targetDate = new Date(dayInfo.date);
    targetDate.setHours(9, 0, 0, 0);

    const origWorkout = editingId ? workouts.find((w) => w._id === editingId) : null;
    const isCompleted = origWorkout ? origWorkout.completed : false;
    const origCompletedDates = origWorkout ? (origWorkout.completedDates || []) : [];

    const workoutData = {
      exerciseName: exerciseName.trim(),
      date: targetDate.toISOString(),
      duration: finalDuration,
      totalReps: finalReps,
      accuracy: accuracy ? Number(accuracy) : 100,
      calories: computedCalories,
      completed: isCompleted,
      dayOfWeek: selectedDay,
      completedDates: origCompletedDates,
    };

    try {
      if (editingId) {
        await editWorkout(editingId, workoutData);
      } else {
        await addWorkout(workoutData);
      }
      setModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Failed to save workout session');
    } finally {
      setSubmitting(false);
    }
  }, [exerciseName, duration, totalReps, calories, selectedDay, weekDays, editingId, workouts, accuracy, editWorkout, addWorkout]);

  const openDeleteConfirm = (id) => {
    setWorkoutIdToDelete(id);
    setDeleteError('');
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await removeWorkout(workoutIdToDelete);
      setDeleteConfirmOpen(false);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete workout session');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = () => {
    setSort(sort === 'desc' ? 'asc' : 'desc');
  };

  // Helper formatting for list view
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSessionActive) {
    return (
      <div className="space-y-6 animate-fadeIn pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Active Workout Session</h1>
            <p className="mt-1 text-sm text-slate-300 font-medium">Align yourself in front of the camera and begin.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExitSession}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-white/5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
            >
              Exit Session
            </button>
            <button
              onClick={handleFinishAndLog}
              disabled={cameraLoading || !!displayError}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/35 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
            >
              Finish & Log
            </button>
          </div>
        </div>

        {/* Workout Workspace grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Live Camera View Column */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B14] flex items-center justify-center shadow-2xl shadow-black/45">
              {cameraLoading && (
                <div className="flex flex-col items-center gap-4 z-10">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#6C63FF]"></div>
                  <p className="text-sm text-slate-300 font-semibold">Accessing webcam feed...</p>
                </div>
              )}

              {displayError ? (
                <div className="flex flex-col items-center max-w-md p-6 text-center gap-4 z-10">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#E2E8F0]">Webcam Connection Failed</h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    {displayError}
                  </p>
                  <button
                    onClick={() => {
                      setIsSessionActive(false);
                      setTimeout(() => setIsSessionActive(true), 100);
                    }}
                    className="mt-2 rounded-lg bg-[#25253D] px-5 py-2 text-xs font-semibold text-[#E2E8F0] hover:bg-[#323252] transition-colors"
                  >
                    Retry Access
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover scale-x-[-1] ${stream ? 'block' : 'hidden'}`}
                  />
                  
                  <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${stream ? 'block' : 'hidden'}`}
                  />
                  
                  {stream && (
                    <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none select-none bg-gradient-to-t from-black/40 via-transparent to-black/25">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-md border border-[#25253D]">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                            </span>
                            <span className="text-xs font-mono uppercase tracking-wider text-red-400">Live</span>
                          </div>
                          <span className="text-xs font-mono text-[#00D9FF] border-l border-[#25253D] pl-2">{poseFps} FPS</span>
                        </div>

                        <div className="rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-md border border-[#25253D]">
                          <span className="text-xs font-mono text-[#00D9FF]">{formatSessionTime(sessionDuration)}</span>
                        </div>
                      </div>

                      {/* ─── POSTURE WARNINGS BANNER ─── */}
                      {formWarnings && formWarnings.length > 0 && (
                        <div className="flex flex-col gap-2 items-start px-1">
                          {formWarnings.map((w, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-md border text-xs font-semibold transition-all duration-300 ${
                                w.severity === 'error'
                                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              }`}
                            >
                              <span className="text-base">{w.severity === 'error' ? '🚫' : '⚠️'}</span>
                              <span>{w.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-black/60 p-3 backdrop-blur-md border border-[#25253D]">
                          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">
                            {activeExerciseName === 'Plank' ? 'Hold Time' : 'Total Reps'}
                          </p>
                          <p className="text-lg font-mono font-bold text-[#E2E8F0] mt-0.5">
                            {activeExerciseName === 'Plank' ? `${trackedReps}s` : trackedReps}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black/60 p-3 backdrop-blur-md border border-[#25253D]">
                          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">State</p>
                          <p className={`text-lg font-mono font-bold mt-0.5 ${trackedState === 'UP' ? 'text-green-400' : 'text-orange-400'}`}>
                            {trackedState}
                          </p>
                        </div>
                        <div className="rounded-xl bg-black/60 p-3 backdrop-blur-md border border-[#25253D]">
                          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Current Rep</p>
                          <p className="text-lg font-mono font-bold text-[#00D9FF] mt-0.5">
                            {trackedRepProgress}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#25253D] bg-[#1A1A2E]/80 p-5 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-[#E2E8F0] mb-4">Session Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Exercise Tracker</label>
                  <select
                    value={activeExerciseName}
                    onChange={(e) => setActiveExerciseName(e.target.value)}
                    className="w-full rounded-lg border border-[#25253D] bg-[#0F0F1A] px-3.5 py-2.5 text-sm text-[#E2E8F0] outline-none focus:border-[#6C63FF]"
                  >
                    {sessionExercises.map((ex) => (
                      <option key={ex.name} value={ex.name}>
                        {ex.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCustom(!showAddCustom);
                      setCustomError('');
                    }}
                    className="mt-2.5 text-xs font-semibold text-[#6C63FF] hover:text-[#5B52E5] transition-colors"
                  >
                    {showAddCustom ? '✕ Close Form' : '+ Custom Exercise'}
                  </button>

                  <div className="flex items-center justify-between border-t border-[#25253D] mt-4 pt-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#94A3B8]">Voice Feedback</span>
                      <span className="text-xs">{voiceEnabled ? '🔊' : '🔇'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        voiceEnabled ? 'bg-[#6C63FF]' : 'bg-[#25253D]'
                      }`}
                    >
                      <span className="sr-only">Toggle Voice Feedback</span>
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          voiceEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {showAddCustom && (
                    <form
                      onSubmit={handleAddCustomExercise}
                      className="mt-4 space-y-3.5 border-t border-[#25253D] pt-4"
                    >
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                          Exercise Name
                        </label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Tricep Pushdowns"
                          className="w-full rounded-lg border border-[#25253D] bg-[#0F0F1A] px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-[#6C63FF]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                            Joint to Track
                          </label>
                          <select
                            value={customJoint}
                            onChange={(e) => setCustomJoint(e.target.value)}
                            className="w-full rounded-lg border border-[#25253D] bg-[#0F0F1A] px-2 py-2 text-xs text-[#E2E8F0] outline-none focus:border-[#6C63FF]"
                          >
                            <option value="elbows">Elbows (Arms)</option>
                            <option value="knees">Knees (Legs)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                            Start Position
                          </label>
                          <select
                            value={customStartState}
                            onChange={(e) => setCustomStartState(e.target.value)}
                            className="w-full rounded-lg border border-[#25253D] bg-[#0F0F1A] px-2 py-2 text-xs text-[#E2E8F0] outline-none focus:border-[#6C63FF]"
                          >
                            <option value="UP">Extended / UP</option>
                            <option value="DOWN">Flexed / DOWN</option>
                          </select>
                        </div>
                      </div>

                      {customError && (
                        <p className="text-[10px] text-red-400 font-semibold">{customError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full rounded-lg bg-[#6C63FF]/15 border border-[#6C63FF]/30 py-2 text-xs font-semibold text-[#6C63FF] hover:bg-[#6C63FF]/25 transition-colors"
                      >
                        Add & Track
                      </button>
                    </form>
                  )}
                </div>

                <div className="border-t border-[#25253D] pt-4">
                  <div className="rounded-xl bg-[#6C63FF]/5 border border-[#6C63FF]/15 p-4 text-xs leading-relaxed text-[#94A3B8]">
                    <span className="font-semibold text-[#6C63FF] uppercase block mb-1">Interactive Guidance</span>
                    Align your body within the camera frame. The tracker counts repetitions and form deviations in real time using your device webcam.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#25253D] bg-[#1A1A2E]/80 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-[#E2E8F0] mb-3">Form Tips for {activeExerciseName}</h3>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">✓</span> Maintain neutral spine and neck alignment.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">✓</span> Engage core muscles during the full range of motion.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6C63FF]">✓</span> Move under control without bouncing or using momentum.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Weekly Workout Planner</h1>
          <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Plan and coordinate your active routines for the week.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Week Selector */}
          <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#14142B]/60 p-1.5 shadow-inner">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
              title="Previous Week"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-xs font-bold px-2.5 text-slate-200 select-none whitespace-nowrap tracking-wide">
              {formatWeekRange()}
            </span>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
              title="Next Week"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setIsSessionActive(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#6C63FF]/20 bg-[#6C63FF]/10 px-5 py-3 text-sm font-bold text-[#8F85FF] hover:bg-[#6C63FF]/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Camera Tracker
          </button>
          <button
            onClick={() => openAddModal('Monday')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6C63FF]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[#6C63FF]/35 hover:brightness-110 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Plan Workout
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Planned Routines</p>
          <p className="mt-3 text-3xl font-extrabold text-white">{totalSessions}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-300">{completedSessions} completed</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Weekly Progress</p>
          <p className="mt-3 text-3xl font-extrabold text-green-400">
            {completionRate}<span className="text-lg font-bold text-slate-400">%</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-green-400">Target accuracy</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Estimated Duration</p>
          <p className="mt-3 text-3xl font-extrabold text-orange-400">
            {totalDuration} <span className="text-lg font-bold text-slate-400">min</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-orange-400">Active workout time</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-5 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Energy Output</p>
          <p className="mt-3 text-3xl font-extrabold text-[#00D9FF]">
            {totalCalories} <span className="text-lg font-bold text-slate-400">kcal</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#00D9FF]">Estimated active burn</p>
        </div>
      </div>

      {/* Main Weekly Planner Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="h-64 rounded-2xl border border-white/5 skeleton-shimmer"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
          {weekDays.map((day) => {
            const dayWorkouts = groupedWorkouts[day.name] || [];
            const isToday = new Date().toDateString() === day.date.toDateString();

            return (
              <div
                key={day.name}
                className={`rounded-2xl border p-4 flex flex-col min-h-[280px] transition-all duration-300 ${
                  isToday
                    ? 'border-[#6C63FF] bg-[#14142B] ring-2 ring-[#6C63FF]/30 shadow-2xl shadow-[#6C63FF]/5'
                    : 'border-white/5 bg-[#14142B]/45 hover:bg-[#14142B]/70'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3.5">
                  <div>
                    <h4 className={`text-sm font-bold ${isToday ? 'text-[#6C63FF] scale-105' : 'text-slate-100'}`}>
                      {day.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => openAddModal(day.name)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-[#6C63FF] transition-colors focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none cursor-pointer"
                    title={`Add workout to ${day.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                {/* Workout List */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] pr-0.5">
                  {dayWorkouts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center border border-dashed border-white/5 rounded-xl bg-[#0B0B14]/20">
                      <span className="text-xl opacity-35 mb-1" aria-hidden="true">🧘</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rest Day</p>
                    </div>
                  ) : (
                    dayWorkouts.map((w) => (
                      <div
                        key={w._id}
                        className={`group flex items-start gap-2.5 rounded-xl border p-2.5 transition-all duration-200 ${
                          isWorkoutCompletedInDisplayedWeek(w)
                            ? 'border-green-500/10 bg-green-500/5'
                            : 'border-white/5 bg-[#0B0B14]/40 hover:border-[#6C63FF]/30'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleCompleted(w)}
                          aria-label={`Toggle completion for ${w.exerciseName}`}
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 mt-0.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none ${
                            isWorkoutCompletedInDisplayedWeek(w)
                              ? 'border-green-500 bg-green-500'
                              : 'border-slate-500 hover:border-[#6C63FF]'
                          }`}
                        >
                          {isWorkoutCompletedInDisplayedWeek(w) && (
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>

                        {/* Info & Actions */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate transition-colors ${isWorkoutCompletedInDisplayedWeek(w) ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {w.exerciseName}
                          </p>
                          <p className={`text-[10px] font-medium ${isWorkoutCompletedInDisplayedWeek(w) ? 'text-slate-600' : 'text-[#A5B4FC]'} mt-0.5`}>
                            {w.duration}m · {w.totalReps}r
                          </p>
                          
                          {/* Actions on Hover */}
                          <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(w)}
                              className="text-[9px] font-bold text-slate-400 hover:text-[#6C63FF] hover:underline cursor-pointer focus-visible:opacity-100 focus:outline-none"
                            >
                              Edit
                            </button>
                            <span className="text-white/10 text-[9px]" aria-hidden="true">•</span>
                            <button
                              onClick={() => openDeleteConfirm(w._id)}
                              className="text-[9px] font-bold text-slate-400 hover:text-red-400 hover:underline cursor-pointer focus-visible:opacity-100 focus:outline-none"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal (Glowing Glass Panel) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#14142B] p-6 shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-extrabold text-white tracking-wide mb-5">
              {editingId ? 'Edit Planned Workout' : 'Plan Weekly Workout'}
            </h2>

            {modalError && (
              <div 
                role="alert" 
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-semibold"
              >
                <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="modal-ex-name" className="block text-sm font-semibold text-slate-200">
                  Exercise Name
                </label>
                <input
                  id="modal-ex-name"
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setFormErrorOrClear ? setFormErrorOrClear(e) : setExerciseName(e.target.value)}
                  placeholder="e.g. Bench Press"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-day-select" className="block text-sm font-semibold text-slate-200">
                  Target Day
                </label>
                <select
                  id="modal-day-select"
                  value={selectedDay}
                  onChange={(e) => {
                    const newDay = e.target.value;
                    setSelectedDay(newDay);
                    
                    const dayInfo = weekDays.find(wd => wd.name === newDay) || weekDays[0];
                    const targetDate = new Date(dayInfo.date);
                    targetDate.setHours(9, 0, 0, 0);
                    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
                    setDate(targetDate.toISOString().slice(0, 16));
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 transition-all"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-duration" className="block text-sm font-semibold text-slate-200">
                    Duration (min)
                  </label>
                  <input
                    id="modal-duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 45"
                    min="1"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-reps" className="block text-sm font-semibold text-slate-200">
                    Total Reps
                  </label>
                  <input
                    id="modal-reps"
                    type="number"
                    value={totalReps}
                    onChange={(e) => setTotalReps(e.target.value)}
                    placeholder="e.g. 32"
                    min="0"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-calories" className="block text-sm font-semibold text-slate-200">
                    Calories (optional)
                  </label>
                  <input
                    id="modal-calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Estimated if blank"
                    min="0"
                    className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none"
                  />
                </div>
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
                  {submitting ? 'Saving...' : 'Save Routine'}
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
              Delete Workout?
            </h2>
            
            <p className="text-sm leading-relaxed text-slate-300 font-medium mb-5">
              Are you sure you want to delete this workout session? This action cannot be undone.
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

export default Workouts;
