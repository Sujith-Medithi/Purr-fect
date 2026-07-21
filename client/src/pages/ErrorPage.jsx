import { Link } from 'react-router-dom';

const ErrorPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B14] px-4 text-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-[#6C63FF]/10 blur-3xl" aria-hidden="true"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#00D9FF]/10 blur-3xl" aria-hidden="true"></div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#14142B]/85 p-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
        {/* Glowing Indicator */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-6 shadow-lg shadow-red-500/5 border border-red-500/20">
          <svg className="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-8xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent tracking-tight mb-2 select-none">
          404
        </h1>
        <h2 className="text-xl font-bold text-white mb-3">
          Off the Training Path
        </h2>
        <p className="text-sm text-slate-300 font-semibold mb-8 leading-relaxed">
          The page you are trying to access doesn&apos;t exist or has been relocated. Let&apos;s get you back on track to crush your daily goals.
        </p>

        <Link
          to="/"
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#6C63FF] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6C63FF]/30 transition-all hover:bg-[#5B52EE] active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus:outline-none"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
