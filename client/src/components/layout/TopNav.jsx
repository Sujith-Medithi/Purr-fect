import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

const TopNav = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/workouts': return 'Workouts';
      case '/habits': return 'Habits';
      case '/progress': return 'Progress';
      case '/settings': return 'Settings';
      default: return 'AI Gym Trainer';
    }
  };
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation choice outcome (Header): ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/5 bg-[#0B0B14]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
      <div className="w-full max-w-[1440px] flex items-center justify-between">
        {/* Left: Menu toggle / retract chevron + page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>

          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">{getPageTitle()}</h2>
            <p className="hidden text-[11px] font-semibold text-indigo-300/85 tracking-wider sm:block uppercase">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Right: User area */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          
          {/* PWA Install Download Icon */}
          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="rounded-xl p-2.5 text-slate-300 transition-all duration-200 hover:bg-white/5 hover:text-[#00D9FF] focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus:outline-none cursor-pointer"
              title="Install App"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          )}

          {/* Notification bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2.5 text-slate-300 transition-all duration-200 hover:bg-white/5 hover:text-[#6C63FF] focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none cursor-pointer"
            title="Notifications"
            aria-expanded={showNotifications}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* Notification dot */}
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#6C63FF] ring-2 ring-[#0B0B14]"></span>
          </button>

          {/* Notifications Dropdown Panel (Premium glassmorphism) */}
          {showNotifications && (
            <div className="absolute right-12 top-12 w-80 rounded-2xl border border-white/10 bg-[#14142B]/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Notifications</h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-[#8F85FF] hover:text-[#B5AFFF] transition-colors focus-visible:underline focus:outline-none"
                >
                  Dismiss All
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 border border-white/5">
                  <span className="text-base mt-0.5" aria-hidden="true">🔔</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-100">Reminders Active</p>
                    <p className="text-[11px] leading-relaxed text-indigo-200 mt-1">Workout, hydration, and habit loops are configured.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 border border-white/5">
                  <span className="text-base mt-0.5" aria-hidden="true">🏋️‍♂️</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-100">Pose Models Cached</p>
                    <p className="text-[11px] leading-relaxed text-indigo-200 mt-1">MediaPipe trackers are stored for offline workouts.</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-center">
                <a
                  href="/settings"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-[#8F85FF] hover:text-[#B5AFFF] transition-colors focus-visible:underline focus:outline-none"
                >
                  Notification Preferences →
                </a>
              </div>
            </div>
          )}

          {/* User avatar + profile details */}
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#14142B]/60 px-3 py-1.5 shadow-inner">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#6C63FF] to-[#00D9FF] text-xs font-extrabold text-white shadow shadow-[#6C63FF]/30">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] font-semibold text-slate-400 leading-tight mt-0.5">{user?.email || ''}</p>
            </div>
            <button
              onClick={logout}
              className="ml-1.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
              title="Sign out"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
