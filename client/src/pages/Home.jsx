import { useAuth } from '../context/AuthContext.jsx';

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <main className="flex flex-1 items-center justify-center px-4 animate-fadeIn">
      <div className="text-center space-y-8">
        {/* Animated gradient heading */}
        <h1
          className="text-5xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-[#6C63FF] via-[#00D9FF] to-[#6C63FF] bg-clip-text text-transparent"
        >
          AI Gym Trainer
        </h1>

        <p className="text-lg text-slate-300 font-semibold max-w-md mx-auto">
          Your intelligent fitness companion — powered by AI.
        </p>

        {/* Welcome card */}
        {user && (
          <div className="inline-flex flex-col items-center gap-4.5 rounded-2xl border border-white/10 bg-[#14142B]/75 px-8 py-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00D9FF] text-base font-bold text-white shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Welcome back,</p>
                <p className="font-bold text-white text-base mt-0.5">{user.name}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-6 py-3 text-sm font-bold text-slate-300 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Status badge */}
        <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#14142B]/60 px-5 py-2 text-sm backdrop-blur-md shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
          </span>
          <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">System Live</span>
        </div>
      </div>
    </main>
  );
};

export default Home;
