import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    to: '/workouts',
    label: 'Workouts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    to: '/habits',
    label: 'Habits',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Persistent Retract State for Desktop Sidebar
  const [isRetracted, setIsRetracted] = useState(() => {
    return localStorage.getItem('ai_gym_sidebar_retracted') === 'true';
  });

  const toggleRetract = () => {
    setIsRetracted((prev) => {
      const next = !prev;
      localStorage.setItem('ai_gym_sidebar_retracted', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation choice outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      {/* Mobile overlay with fade backdrop blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md transition-opacity duration-300 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Retractable Sidebar container */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full flex-col border-r border-white/5
          bg-[#0B0B14] shadow-2xl transition-all duration-300 ease-in-out select-none
          md:static md:translate-x-0 md:rounded-2xl md:border md:border-white/5
          ${isRetracted ? 'md:w-20' : 'md:w-64'}
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#00D9FF] shadow-md shadow-[#6C63FF]/30">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            {!isRetracted && (
              <span className="text-lg font-extrabold tracking-wider text-slate-100 uppercase animate-fadeIn">AI Gym</span>
            )}
          </div>

          {/* Retract Toggle Button (Desktop/Tablet) */}
          <button
            onClick={toggleRetract}
            className="hidden md:flex rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
            title={isRetracted ? 'Expand Sidebar' : 'Retract Sidebar'}
            aria-label={isRetracted ? 'Expand Sidebar' : 'Retract Sidebar'}
          >
            <svg
              className={`h-5 w-5 transform transition-transform duration-300 ${isRetracted ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 md:hidden focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              title={isRetracted ? item.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none ${
                  isRetracted ? 'justify-center px-0' : 'gap-3 px-3.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6C63FF]/20 via-[#6C63FF]/10 to-transparent text-white font-bold'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Absolute active left accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#6C63FF] to-[#00D9FF] shadow-md shadow-[#6C63FF]/50" />
                  )}

                  {/* Centered Icon Container */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'text-[#00D9FF]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Text Label (Expanded Mode Only) */}
                  {!isRetracted && (
                    <span className="truncate text-sm tracking-wide animate-fadeIn">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Install Application Callout */}
        {!isStandalone && (
          <div className="px-3 pb-3">
            <button
              onClick={handleInstallClick}
              title={isRetracted ? 'Install Trainer App' : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-bold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 transition-all duration-200 hover:bg-[#00D9FF]/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus:outline-none shadow-md ${
                isRetracted ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-3'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </span>
              {!isRetracted && <span className="truncate animate-fadeIn">Install Trainer App</span>}
            </button>
          </div>
        )}

        {/* Motivation Widget */}
        <div className="border-t border-white/5 p-3">
          {isRetracted ? (
            <div className="flex justify-center" title="Consistency beats intensity. Show up every day!">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C63FF]/10 to-[#00D9FF]/5 border border-white/5 text-base shadow-md">
                💪
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-[#6C63FF]/10 to-[#00D9FF]/5 border border-white/5 p-4 shadow-lg shadow-black/30 animate-fadeIn">
              <p className="text-[10px] font-bold tracking-wider text-[#6C63FF] uppercase">Consistency Key</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 font-medium">
                Consistency beats intensity. Show up every day! 💪
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* PWA Installation Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#14142B] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">📱</span> Install AI Gym Trainer
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Install AI Gym Trainer on your device for fast offline access, native performance, and a borderless full-screen experience.
            </p>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/5 bg-[#0B0B14] p-3.5 space-y-1">
                <p className="font-bold text-[#00D9FF]">💻 Chrome / Edge (Desktop)</p>
                <p className="text-slate-300 leading-relaxed">Click the install icon (📥) in the browser address bar at top right, or open 3 dots menu ➔ &quot;Install AI Gym Trainer&quot;.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0B0B14] p-3.5 space-y-1">
                <p className="font-bold text-green-400">📱 iPhone / iPad (Safari)</p>
                <p className="text-slate-300 leading-relaxed">Tap the Share button (square with up arrow) at bottom bar ➔ scroll down & tap &quot;Add to Home Screen&quot;.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0B0B14] p-3.5 space-y-1">
                <p className="font-bold text-[#6C63FF]">🤖 Android (Chrome)</p>
                <p className="text-slate-300 leading-relaxed">Tap the 3 dots menu at top right ➔ tap &quot;Install app&quot; or &quot;Add to Home screen&quot;.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-6 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
