import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Shield, Sparkles, Loader2, WifiOff } from 'lucide-react';

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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const cloudReady = isSupabaseConfigured();
  const strength = passwordStrength(password);
  const emailValid = email === '' || isValidEmail(email);
  const passwordsMatch = mode === 'login' || password === confirmPassword;
  const usernameValid = mode === 'login' || username.trim().length >= 3;
  const canSubmit = isValidEmail(email) && password.length >= 6 && passwordsMatch && usernameValid && !loading && !oauthLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      setFormError(null);
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setFormError(error);
          toast({ title: 'Login failed', message: error, type: 'error' });
        }
      } else {
        const { error, needsEmailConfirmation } = await signUp(email.trim(), password, username.trim());
        if (error) {
          setFormError(error);
          toast({ title: 'Sign up failed', message: error, type: 'error' });
        } else if (needsEmailConfirmation) {
          toast({
            title: 'Confirm your email',
            message: 'Your account was created. Check your inbox to confirm your email before signing in.',
            type: 'success',
          });
        } else {
          toast({ title: 'Welcome to STRYVEN!', message: 'Account created successfully.', type: 'success' });
        }
      }
    } catch (error) {
      toast({
        title: mode === 'login' ? 'Login failed' : 'Sign up failed',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading || oauthLoading) return;
    setOauthLoading(true);
    setFormError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setFormError(error);
        toast({ title: 'Google sign-in failed', message: error, type: 'error' });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not start Google sign-in.';
      setFormError(msg);
      toast({ title: 'Google sign-in failed', message: msg, type: 'error' });
    } finally {
      setOauthLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail) || forgotSending) return;
    if (!cloudReady) {
      toast({
        title: 'Offline mode active',
        message: 'Password reset emails require Supabase cloud configuration.',
        type: 'info',
      });
      return;
    }
    setForgotSending(true);
    try {
      const redirectTo = `${window.location.origin}/?view=auth&reset=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), { redirectTo });
      if (error) toast({ title: 'Reset failed', message: error.message, type: 'error' });
      else {
        setForgotSent(true);
        toast({ title: 'Reset link sent', message: 'Check your email for a reset link.', type: 'success' });
      }
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-3 sm:p-4 bg-[#070a12]">
      <div
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          background:
            'radial-gradient(ellipse at 25% 15%, rgba(167,139,250,0.16), transparent 45%), radial-gradient(ellipse at 80% 85%, rgba(92,236,255,0.12), transparent 45%)',
        }}
      />
      <div className="relative w-full max-w-md py-4 sm:py-6">
        <div className="mb-6 text-center sm:mb-7">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a78bfa]/40 bg-gradient-to-br from-[#a78bfa]/20 to-[#5cecff]/10 shadow-[0_0_32px_rgba(167,139,250,0.22)] sm:mb-4 sm:h-16 sm:w-16">
            <Shield className="text-[#a78bfa]" size={30} />
          </div>
          <span className="block font-mono text-[10px] font-bold tracking-[0.22em] text-[#5cecff] uppercase">
            SYSTEM ACCESS // GATE 01
          </span>
          <h1 className="mt-1 font-display text-3xl font-black tracking-[0.14em] text-[#eef2ff]">STRYVEN</h1>
          <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">Arise, Hunter. Your awakening begins now.</p>
        </div>

        <div className="rounded-2xl border border-[#a78bfa]/25 bg-gradient-to-b from-[#121725]/95 to-[#0b0e18]/98 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          {!cloudReady && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#f4c95d]/30 bg-[#f4c95d]/10 px-3.5 py-2.5 text-xs text-[#fde68a]">
              <WifiOff size={15} className="mt-0.5 shrink-0 text-[#f4c95d]" />
              <span>Offline Local Mode active — progress is saved locally in this browser.</span>
            </div>
          )}

          <div className="mb-5 flex gap-1.5 rounded-xl border border-white/10 bg-[#070a12]/80 p-1 sm:mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFormError(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold tracking-wider uppercase transition ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#7544d8] to-[#3b5bdb] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setFormError(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold tracking-wider uppercase transition ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#7544d8] to-[#3b5bdb] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div role="alert" className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                {formError}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Hunter Codename
                </label>
                <div className="relative mt-1.5">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-white/15 bg-[#070a12] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#a78bfa]"
                    placeholder="ShadowHunter"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    autoComplete="username"
                  />
                </div>
                {username.length > 0 && username.trim().length < 3 && (
                  <p className="mt-1 text-xs text-rose-400">At least 3 characters</p>
                )}
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">Email</label>
              <div className="relative mt-1.5">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className={`w-full rounded-xl border bg-[#070a12] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#a78bfa] ${
                    !emailValid ? 'border-rose-500/60' : 'border-white/15'
                  }`}
                  placeholder="hunter@system.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError(null);
                  }}
                  autoComplete="email"
                />
              </div>
              {!emailValid && <p className="mt-1 text-xs text-rose-400">Invalid email address</p>}
            </div>

            <div>
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full rounded-xl border border-white/15 bg-[#070a12] py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#a78bfa]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError(null);
                  }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-white"
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
                  <p className="mt-1 text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`w-full rounded-xl border bg-[#070a12] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#a78bfa] ${
                      !passwordsMatch ? 'border-rose-500/60' : 'border-white/15'
                    }`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {!passwordsMatch && <p className="mt-1 text-xs text-rose-400">Passwords do not match</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-[#070a12] accent-[#a78bfa]"
                  />
                  <span className="text-xs text-slate-300">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotSent(false);
                  }}
                  className="text-xs font-semibold text-[#5cecff] hover:text-[#9ef4ff]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#a78bfa]/50 bg-gradient-to-r from-[#7544d8] via-[#5338b8] to-[#2e58a8] py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#7544d8]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              <span>{mode === 'login' ? 'Enter STRYVEN' : 'Begin Awakening'}</span>
            </button>
          </form>

          {cloudReady && (
            <>
              <div className="my-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                <span>OR</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={loading || oauthLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-[#070a12]/90 py-2.5 text-xs font-bold text-slate-200 transition hover:border-[#5cecff]/45 hover:bg-white/5 disabled:opacity-50"
              >
                {oauthLoading ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} className="text-[#5cecff]" />}
                <span>Continue with Google</span>
              </button>
            </>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            {mode === 'login' ? 'New to STRYVEN? ' : 'Already awakened? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setFormError(null);
              }}
              className="font-semibold text-[#a78bfa] hover:text-[#c4b5fd]"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
        </div>

        <p className="mt-4 px-2 text-center font-mono text-[10px] text-slate-500">
          By continuing, you accept the System&apos;s terms of discipline.
        </p>
      </div>

      {forgotOpen && (
        <div role="dialog" aria-modal="true" aria-label="Reset password" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setForgotOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#a78bfa]/30 bg-gradient-to-b from-[#121725] to-[#0b0e18] p-5 shadow-2xl">
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#5cecff] uppercase">ACCOUNT RECOVERY</span>
            <h3 className="mt-1 mb-2 font-display text-lg font-bold text-white">Reset Password</h3>
            {forgotSent ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  A reset link has been sent to <strong className="text-white">{forgotEmail}</strong> if an account exists.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3.5">
                <p className="text-xs leading-5 text-slate-400">
                  {cloudReady
                    ? "Enter your email and we'll send you a password reset link."
                    : 'Password recovery links are unavailable in offline local mode.'}
                </p>
                <input
                  type="email"
                  className="w-full rounded-xl border border-white/15 bg-[#070a12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#a78bfa]"
                  placeholder="hunter@system.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl border border-[#a78bfa]/50 bg-gradient-to-r from-[#7544d8] to-[#3b5bdb] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                    disabled={!isValidEmail(forgotEmail) || forgotSending || !cloudReady}
                  >
                    {forgotSending ? 'Sending…' : 'Send Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
