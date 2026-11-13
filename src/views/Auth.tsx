import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { cleanSupabaseUrl } from '../lib/progression';
import { toast } from '../components/ui/Toast';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Shield, Sparkles, Loader2, WifiOff, X } from 'lucide-react';

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
  const [googleEnabled, setGoogleEnabled] = useState(false);
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

  useEffect(() => {
    if (!cloudReady) {
      setGoogleEnabled(false);
      return;
    }
    const baseUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
    if (!baseUrl || !anonKey) return;

    const controller = new AbortController();
    fetch(`${baseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { external?: { google?: boolean } } | null) => {
        setGoogleEnabled(Boolean(data?.external?.google));
      })
      .catch(() => {
        setGoogleEnabled(false);
      });
    return () => controller.abort();
  }, [cloudReady]);

  useEffect(() => {
    if (!forgotOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setForgotOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [forgotOpen]);

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
          toast({ title: 'Welcome to STRYVEN', message: 'Account created successfully.', type: 'success' });
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
    if (loading || oauthLoading || !googleEnabled) return;
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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 bg-ink-950 text-ink-100">
      <div className="relative z-10 w-full max-w-md py-4">
        <div className="mb-6 text-center">
          <div className="mb-3.5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-ember-500/40 bg-ember-500/15 shadow-lg">
            <Shield className="text-ember-400" size={28} />
          </div>
          <span className="eyebrow-label block text-frost-400">Personal Hunter Operating System</span>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-[0.14em] text-ink-100">STRYVEN</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-ink-400">
            Track daily execution, structured training, and long-term progression.
          </p>
        </div>

        <div className="sv-surface p-5 sm:p-7">
          {!cloudReady && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-2.5 text-xs text-gold-400">
              <WifiOff size={15} className="mt-0.5 shrink-0" />
              <span>Offline Local Mode active — progress is saved locally in this browser.</span>
            </div>
          )}

          <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-ink-950/90 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFormError(null);
              }}
              className={`min-h-[44px] rounded-lg text-xs font-bold tracking-wider uppercase transition ${
                mode === 'login' ? 'btn-primary !min-h-[40px]' : 'text-ink-400 hover:text-ink-100'
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
              className={`min-h-[44px] rounded-lg text-xs font-bold tracking-wider uppercase transition ${
                mode === 'signup' ? 'btn-primary !min-h-[40px]' : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div role="alert" className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-3.5 py-2.5 text-xs text-danger-400">
                {formError}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-username" className="eyebrow-label text-ink-300">
                  Hunter Codename
                </label>
                <div className="relative mt-1.5">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="auth-username"
                    className="input pl-10"
                    placeholder="ShadowHunter"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    autoComplete="username"
                  />
                </div>
                {username.length > 0 && username.trim().length < 3 && (
                  <p className="mt-1 text-xs text-danger-400">At least 3 characters</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="eyebrow-label text-ink-300">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="auth-email"
                  type="email"
                  className={`input pl-10 ${!emailValid ? '!border-danger-500/70' : ''}`}
                  placeholder="hunter@system.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError(null);
                  }}
                  autoComplete="email"
                />
              </div>
              {!emailValid && <p className="mt-1 text-xs text-danger-400">Invalid email address</p>}
            </div>

            <div>
              <label htmlFor="auth-password" className="eyebrow-label text-ink-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="auth-password"
                  type={showPw ? 'text' : 'password'}
                  className="input pl-10 pr-11"
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 hover:text-ink-100"
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
                <label htmlFor="auth-confirm-password" className="eyebrow-label text-ink-300">
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="auth-confirm-password"
                    type={showPw ? 'text' : 'password'}
                    className={`input pl-10 ${!passwordsMatch ? '!border-danger-500/70' : ''}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {!passwordsMatch && <p className="mt-1 text-xs text-danger-400">Passwords do not match</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-ink-950 accent-ember-500"
                  />
                  <span className="text-xs text-ink-300">Remember session</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotSent(false);
                  }}
                  className="min-h-[44px] text-xs font-semibold text-frost-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={!canSubmit} className="btn-primary w-full uppercase tracking-wider text-xs font-bold">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              <span>{mode === 'login' ? 'Enter STRYVEN' : 'Create Account'}</span>
            </button>
          </form>

          {cloudReady && googleEnabled && (
            <>
              <div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                <span className="h-px flex-1 bg-white/10" />
                <span>OR</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={loading || oauthLoading}
                className="btn-ghost w-full text-xs"
              >
                {oauthLoading ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} className="text-frost-400" />}
                <span>Continue with Google</span>
              </button>
            </>
          )}

          <p className="mt-5 text-center text-xs text-ink-400">
            {mode === 'login' ? 'New to STRYVEN? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setFormError(null);
              }}
              className="font-semibold text-ember-400 hover:underline min-h-[44px] inline-flex items-center"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
        </div>

        <p className="mt-4 px-2 text-center font-mono text-[10px] text-ink-500">
          Your activity, training logs, and settings stay bound to your account.
        </p>
      </div>

      {forgotOpen && (
        <div role="dialog" aria-modal="true" aria-label="Reset password" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setForgotOpen(false)} />
          <div className="relative w-full max-w-sm sv-surface p-5 sm:p-6">
            <button
              type="button"
              aria-label="Close reset dialog"
              onClick={() => setForgotOpen(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 hover:bg-white/5 hover:text-ink-100"
            >
              <X size={18} />
            </button>
            <span className="eyebrow-label text-frost-400">Account Recovery</span>
            <h3 className="mt-1 mb-2 font-display text-lg font-bold text-ink-100">Reset Password</h3>
            {forgotSent ? (
              <div className="space-y-4">
                <p className="text-sm text-ink-300">
                  A reset link has been sent to <strong className="text-ink-100">{forgotEmail}</strong> if an account exists.
                </p>
                <button type="button" onClick={() => setForgotOpen(false)} className="btn-ghost w-full">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-3.5">
                <p className="text-xs leading-5 text-ink-400">
                  {cloudReady
                    ? "Enter your email and we'll send you a password reset link."
                    : 'Password recovery links are unavailable in offline local mode.'}
                </p>
                <input
                  type="email"
                  className="input"
                  placeholder="hunter@system.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setForgotOpen(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
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
