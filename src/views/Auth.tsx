import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Shield, Sparkles, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['#f43f5e', '#f43f5e', '#f59e0b', '#eab308', '#10b981', '#10b981'];
  return { score, label: labels[score], color: colors[score] };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const strength = passwordStrength(password);
  const emailValid = email === '' || isValidEmail(email);
  const passwordsMatch = mode === 'login' || password === confirmPassword;
  const usernameValid = mode === 'login' || username.length >= 3;

  const canSubmit =
    isValidEmail(email) &&
    password.length >= 6 &&
    passwordsMatch &&
    usernameValid &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast({ title: 'Login failed', message: error, type: 'error' });
    } else {
      const { error } = await signUp(email, password, username);
      if (error) {
        toast({ title: 'Sign up failed', message: error, type: 'error' });
      } else {
        toast({ title: 'Welcome, Hunter!', message: 'Account created. You are now signed in.', type: 'success' });
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({ title: 'Google sign-in failed', message: error, type: 'error' });
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
    if (error) {
      toast({ title: 'Reset failed', message: error.message, type: 'error' });
    } else {
      setForgotSent(true);
      toast({ title: 'Reset link sent', message: 'Check your email for a reset link.', type: 'success' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-radial-fade opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-ember-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-shadow-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-ember-500/20 to-shadow-500/20 border border-ember-500/30 mb-4">
            <Shield className="text-ember-400" size={32} />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient-ember">Discipline System</h1>
          <p className="text-sm text-ink-300 mt-1">Arise, Hunter. Your awakening begins now.</p>
        </div>

        {/* Card */}
        <div className="card p-6 md:p-8">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-ink-950/60 rounded-xl border border-white/5 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === 'login' ? 'bg-ember-500/20 text-ember-400' : 'text-ink-300 hover:text-ink-100'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === 'signup' ? 'bg-ember-500/20 text-ember-400' : 'text-ink-300 hover:text-ink-100'
              }`}
            >
              Sign Up
            </button>
          </div>


          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-ghost w-full py-3 mb-4 text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <span className="text-base font-bold">G</span>}
            Continue with Google
          </button>

          <div className="relative mb-4 flex items-center">
            <div className="h-px flex-1 bg-white/10" />
            <span className="px-3 text-[10px] uppercase tracking-wider text-ink-400">or use email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Username</label>
                <div className="relative mt-1">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    className="input pl-10"
                    placeholder="ShadowHunter"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    autoComplete="username"
                  />
                </div>
                {username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-danger-400 mt-1">At least 3 characters</p>
                )}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative mt-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  className={`input pl-10 ${!emailValid ? 'border-danger-500/50' : ''}`}
                  placeholder="hunter@system.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {!emailValid && <p className="text-xs text-danger-400 mt-1">Invalid email address</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i < strength.score ? strength.color : 'rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative mt-1">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`input pl-10 ${!passwordsMatch ? 'border-danger-500/50' : ''}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {!passwordsMatch && <p className="text-xs text-danger-400 mt-1">Passwords do not match</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-ink-500 bg-ink-950 accent-ember-500"
                  />
                  <span className="text-xs text-ink-300">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotOpen(true); setForgotSent(false); }}
                  className="text-xs text-ember-400 hover:text-ember-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {mode === 'login' ? 'Enter the System' : 'Begin Awakening'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-5">
            {mode === 'login' ? "New to the System? " : 'Already awakened? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-ember-400 hover:text-ember-300 font-semibold"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-ink-500 mt-4">
          By continuing, you accept the System's terms of discipline.
        </p>
      </div>

      {/* Forgot password modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setForgotOpen(false)} />
          <div className="relative w-full max-w-sm card p-5 animate-slide-up">
            <h3 className="font-display text-lg font-bold mb-2">Reset Password</h3>
            {forgotSent ? (
              <p className="text-sm text-ink-200">A reset link has been sent to {forgotEmail} if an account exists.</p>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3">
                <p className="text-sm text-ink-300">Enter your email and we'll send you a reset link.</p>
                <input
                  type="email"
                  className="input"
                  placeholder="hunter@system.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setForgotOpen(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={!isValidEmail(forgotEmail)}>Send Link</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
