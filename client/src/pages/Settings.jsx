import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { requestNotificationPermission } from '../utils/notificationManager.js';

const THEMES = [
  {
    id: 'modern-saas',
    name: 'Modern SaaS',
    badge: 'Recommended',
    inspiredBy: 'Linear, Vercel, Stripe, Raycast',
    style: 'Minimal • Enterprise • Clean',
    colors: {
      bg: '#0F1117',
      surface: '#171A21',
      card: '#1C2028',
      primary: '#4F7CFF',
      success: '#22C55E',
      warning: '#F59E0B',
      text: '#F8FAFC',
    },
  },
  {
    id: 'apple-dark',
    name: 'Apple Dark',
    inspiredBy: 'Apple Fitness, Apple Music, iOS Settings',
    style: 'Elegant • Soft • Glass',
    colors: {
      bg: '#111315',
      surface: '#1A1C1F',
      card: '#202327',
      primary: '#5E8BFF',
      success: '#34C759',
      warning: '#FF9F0A',
      text: '#F5F5F7',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    inspiredBy: 'GitHub, VS Code, DevTools',
    style: 'Technical • Flat • Productivity',
    colors: {
      bg: '#0D1117',
      surface: '#161B22',
      card: '#1C2128',
      primary: '#58A6FF',
      success: '#3FB950',
      warning: '#D29922',
      text: '#E6EDF3',
    },
  },
  {
    id: 'notion-dark',
    name: 'Notion Dark',
    inspiredBy: 'Notion, Obsidian',
    style: 'Minimal • Reading Friendly',
    colors: {
      bg: '#191919',
      surface: '#202020',
      card: '#262626',
      primary: '#7C8CF8',
      success: '#4ADE80',
      warning: '#FBBF24',
      text: '#F1F1F1',
    },
  },
  {
    id: 'premium-fitness',
    name: 'Premium Fitness',
    inspiredBy: 'Whoop, Garmin Connect, Fitbit',
    style: 'Athletic • Energetic • Modern',
    colors: {
      bg: '#0D1016',
      surface: '#171C24',
      card: '#1E2430',
      primary: '#5B7FFF',
      success: '#33D17A',
      warning: '#FFB74D',
      text: '#F5F7FA',
    },
  },
];

const Settings = () => {
  const { user, updateSettings } = useAuth();
  
  // Local form states
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState(true);

  // Theme Engine State
  const [selectedTheme, setSelectedTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' ? 'modern-saas' : (saved || user?.theme || 'modern-saas');
  });

  const [dashboardBackground, setDashboardBackground] = useState('');
  const [uploadedBackground, setUploadedBackground] = useState('');
  
  // Notification states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [workoutReminder, setWorkoutReminder] = useState(true);
  const [waterReminder, setWaterReminder] = useState(true);
  const [sleepReminder, setSleepReminder] = useState(true);
  const [habitReminder, setHabitReminder] = useState(true);

  // Status states
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form states with user context when user object changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setHeight(user.height || 0);
      setWeight(user.weight || 0);
      setAge(user.age || 0);
      setVoiceFeedback(user.voiceFeedback !== false);

      const activeTheme = user.theme === 'dark' ? 'modern-saas' : (user.theme || 'modern-saas');
      setSelectedTheme(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);

      setDashboardBackground(user.dashboardBackground || '');
      if (user.dashboardBackground && user.dashboardBackground.startsWith('data:image/')) {
        setUploadedBackground(user.dashboardBackground);
      } else {
        setUploadedBackground('');
      }
      
      if (user.notifications) {
        setNotificationsEnabled(user.notifications.enabled !== false);
        setWorkoutReminder(user.notifications.workout !== false);
        setWaterReminder(user.notifications.water !== false);
        setSleepReminder(user.notifications.sleep !== false);
        setHabitReminder(user.notifications.habit !== false);
      }
    }
  }, [user]);

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('theme', themeId);
  };

  const handleGlobalToggle = async () => {
    const nextVal = !notificationsEnabled;
    if (nextVal) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotificationsEnabled(false);
        return;
      }
    }
    setNotificationsEnabled(nextVal);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDashboardBackground(reader.result);
      setUploadedBackground(reader.result);
      setSuccessMsg('Custom image selected as background preview!');
      setTimeout(() => setSuccessMsg(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        height: height === '' ? 0 : Number(height),
        weight: weight === '' ? 0 : Number(weight),
        age: age === '' ? 0 : Number(age),
        voiceFeedback,
        theme: selectedTheme,
        dashboardBackground,
        notifications: {
          enabled: notificationsEnabled,
          workout: workoutReminder,
          water: waterReminder,
          sleep: sleepReminder,
          habit: habitReminder,
        },
      };

      if (password.trim()) {
        payload.password = password;
      }

      await updateSettings(payload);
      setSuccessMsg('Settings saved successfully!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">System Settings</h1>
        <p className="mt-2 text-sm text-[#A5B4FC] font-semibold tracking-wide uppercase">Configure theme engines, biological variables, and notification preferences.</p>
      </div>

      {successMsg && (
        <div role="alert" className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300 font-semibold shadow-md">
          <div className="flex items-center gap-2.5">
            <svg className="h-5 w-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 font-semibold shadow-md">
          <div className="flex items-center gap-2.5">
            <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECTION: Theme Engine Selector (Full Width Card) */}
        <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
              <span className="text-xl" aria-hidden="true">🎨</span> Theme Architecture Engine
            </h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">5 Dark Palettes</span>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Select a professionally designed dark theme. Your selection updates the application instantly and persists across sessions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {THEMES.map((t) => {
              const isSelected = selectedTheme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-[#4F7CFF] bg-[#171A21] ring-2 ring-[#4F7CFF]/30 shadow-lg'
                      : 'border-white/10 bg-[#0B0B14]/40 hover:border-white/20 hover:bg-[#14142B]/50'
                  }`}
                  style={{ backgroundColor: t.colors.surface }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white">{t.name}</span>
                      {t.badge && (
                        <span className="rounded-full bg-[#4F7CFF]/20 px-2 py-0.5 text-[9px] font-bold text-[#4F7CFF] uppercase">
                          {t.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-normal">{t.style}</p>
                  </div>

                  {/* Swatches Row */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Colors</span>
                      {isSelected && (
                        <span className="text-xs text-[#4F7CFF] font-bold">✓ Active</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-md border border-white/10 shadow-xs" style={{ backgroundColor: t.colors.bg }} title="Background" />
                      <span className="h-4 w-4 rounded-md border border-white/10 shadow-xs" style={{ backgroundColor: t.colors.surface }} title="Surface" />
                      <span className="h-4 w-4 rounded-md border border-white/10 shadow-xs" style={{ backgroundColor: t.colors.card }} title="Card" />
                      <span className="h-4 w-4 rounded-md border border-white/10 shadow-xs" style={{ backgroundColor: t.colors.primary }} title="Primary Accent" />
                      <span className="h-4 w-4 rounded-md border border-white/10 shadow-xs" style={{ backgroundColor: t.colors.success }} title="Success" />
                      <span className="h-4 w-4 rounded-md border border-white/10 shadow-xs" style={{ backgroundColor: t.colors.warning }} title="Warning" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Card 1: User Profile */}
          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5 border-b border-white/5 pb-3">
              <svg className="h-5.5 w-5.5 text-[#6C63FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Profile
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="settings-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Display Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#0B0B14]/50 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-slate-400">Email address cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Security & Password */}
          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5 border-b border-white/5 pb-3">
              <svg className="h-5.5 w-5.5 text-[#00D9FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security & Credentials
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="settings-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">New Password</label>
                <input
                  id="settings-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="settings-confirm-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Confirm New Password</label>
                <input
                  id="settings-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Body Metrics */}
          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5 border-b border-white/5 pb-3">
              <svg className="h-5.5 w-5.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Physical Profile
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="settings-height" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Height (cm)</label>
                <input
                  id="settings-height"
                  type="number"
                  min="0"
                  max="300"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B14] px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="settings-weight" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Weight (kg)</label>
                <input
                  id="settings-weight"
                  type="number"
                  min="0"
                  max="500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B14] px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="settings-age" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Age</label>
                <input
                  id="settings-age"
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B14] px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Audio & Notifications */}
          <div className="rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5 border-b border-white/5 pb-3">
              <svg className="h-5.5 w-5.5 text-[#6C63FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 010 12.728" />
              </svg>
              Feedback & Reminders
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <p className="text-sm font-bold text-slate-200">Voice Assistant Audio 🔊</p>
                  <p className="text-xs text-slate-400 mt-0.5">Provides real-time verbal posture corrections during workouts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceFeedback(!voiceFeedback)}
                  aria-label="Toggle voice feedback"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] cursor-pointer ${
                    voiceFeedback ? 'bg-[#6C63FF]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                      voiceFeedback ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-200">Push Notifications 🔔</p>
                  <p className="text-xs text-slate-400 mt-0.5">Enable background web browser reminders.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGlobalToggle}
                  aria-label="Toggle all push notifications"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] cursor-pointer ${
                    notificationsEnabled ? 'bg-[#6C63FF]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                      notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 5: Dashboard Wallpaper Selector (Full Width) */}
          <div className="md:col-span-2 rounded-2xl border border-white/5 bg-[#14142B]/75 p-6 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5 border-b border-white/5 pb-3">
              <svg className="h-5.5 w-5.5 text-[#00D9FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Dashboard Wallpaper
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 font-semibold">
                Choose a high-definition workout wallpaper theme to decorate your custom dashboard workspace background.
              </p>

              {/* Preset selectors grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {/* Default none */}
                <button
                  type="button"
                  onClick={() => setDashboardBackground('')}
                  className={`relative flex flex-col items-center justify-center rounded-xl border p-4.5 min-h-[72px] transition-all duration-200 cursor-pointer overflow-hidden ${
                    dashboardBackground === ''
                      ? 'border-[#6C63FF] bg-[#6C63FF]/15 text-white font-extrabold shadow-md'
                      : 'border-white/10 bg-[#0B0B14]/40 text-slate-400 font-bold hover:border-white/20'
                  }`}
                >
                  <span className="text-xs tracking-wide">None (Default)</span>
                </button>

                {/* File Upload Trigger */}
                <label className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#0B0B14]/45 hover:bg-[#0B0B14]/75 p-3 min-h-[72px] transition-all duration-200 cursor-pointer overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    <svg className="h-5.5 w-5.5 text-slate-400 group-hover:text-[#6C63FF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-400 mt-1.5 group-hover:text-white uppercase tracking-wide">Upload Custom</span>
                  </div>
                </label>

                {/* Uploaded File preview thumbnail */}
                {uploadedBackground && (
                  <button
                    type="button"
                    onClick={() => setDashboardBackground(uploadedBackground)}
                    className={`relative h-[72px] rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      dashboardBackground === uploadedBackground
                        ? 'border-[#6C63FF] ring-2 ring-[#6C63FF]/30 scale-[0.98]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(${uploadedBackground})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white tracking-wide uppercase drop-shadow-sm">
                      Uploaded File
                    </span>
                  </button>
                )}

                {[
                  {
                    name: 'Gym Iron',
                    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800',
                  },
                  {
                    name: 'Neon Active',
                    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800',
                  },
                  {
                    name: 'Track Speed',
                    url: 'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=800',
                  },
                  {
                    name: 'Zen Balance',
                    url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800',
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setDashboardBackground(preset.url)}
                    className={`relative h-[72px] rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      dashboardBackground === preset.url
                        ? 'border-[#6C63FF] ring-2 ring-[#6C63FF]/30 scale-[0.98]'
                        : 'border-white/10 hover:border-white/25'
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(${preset.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white tracking-wide uppercase drop-shadow-sm">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom url text-input field */}
              <div className="pt-2 space-y-1.5">
                <label htmlFor="settings-url-bg" className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Custom Wallpaper Image URL</label>
                <div className="flex gap-2">
                  <input
                    id="settings-url-bg"
                    type="text"
                    value={dashboardBackground}
                    onChange={(e) => setDashboardBackground(e.target.value)}
                    placeholder="https://example.com/fitness-background.jpg"
                    className="flex-1 rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-[#6C63FF] focus:outline-none transition-all"
                  />
                  {dashboardBackground && (
                    <button
                      type="button"
                      onClick={() => setDashboardBackground('')}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 text-xs font-bold text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex justify-end pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#4F7CFF] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#4F7CFF]/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F7CFF] focus:outline-none"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Preferences...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
