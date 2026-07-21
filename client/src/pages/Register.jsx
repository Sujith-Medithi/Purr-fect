import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { register, user, error, clearError } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Sync context error
  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (form.name.length < 2) {
      setLocalError('Name must be at least 2 characters');
      return;
    }

    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16 overflow-hidden">
      {/* Ambient glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-[#6C63FF]/10 blur-[100px]" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-[#00D9FF]/5 blur-[100px]" aria-hidden="true" />

      <div className="w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Create <span className="bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] bg-clip-text text-transparent">Account</span>
          </h1>
          <p className="mt-3 text-sm text-[#A5B4FC] font-medium">
            Start your interactive workout journey today
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#14142B]/85 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Error display */}
          {localError && (
            <div 
              role="alert" 
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-medium"
            >
              <svg className="h-5 w-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name input field */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="block text-sm font-semibold text-slate-200">
                Full Name
              </label>
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
              />
            </div>

            {/* Email input field */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-sm font-semibold text-slate-200">
                Email Address
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
              />
            </div>

            {/* Password input field */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-sm font-semibold text-slate-200">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
              />
            </div>

            {/* Confirm Password input field */}
            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-slate-200">
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-white/10 bg-[#0B0B14] px-4 py-3 text-sm text-white placeholder-slate-500 transition-all duration-200 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D9FF] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#6C63FF]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#6C63FF]/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-slate-300 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#6C63FF] transition-colors hover:text-[#8F85FF] focus-visible:underline focus:outline-none"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
