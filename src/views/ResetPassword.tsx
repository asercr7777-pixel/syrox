import { useState } from 'react';
import { Lock, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const valid = password.length >= 8 && password === confirm;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({
        title: 'Reset failed',
        message: 'We could not update your password. Request a new reset link and try again.',
        type: 'error',
      });
      return;
    }
    setDone(true);
    toast({
      title: 'Password updated',
      message: 'Your new password is active. You can enter STRYVEN now.',
      type: 'success',
    });
  };

  const enter = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    url.searchParams.set('view', 'dashboard');
    window.location.replace(url.toString());
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 bg-ink-950 text-ink-100">
      <div className="relative z-10 w-full max-w-md sv-surface p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ember-500/40 bg-ember-500/15">
            <ShieldCheck className="text-ember-400" size={28} />
          </div>
          <span className="eyebrow-label text-frost-400">Account Security</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-100">Reset your password</h1>
          <p className="mt-2 text-xs text-ink-400">Choose a new password for your STRYVEN account.</p>
        </div>

        {done ? (
          <button type="button" onClick={enter} className="btn-primary w-full uppercase tracking-wider text-xs font-bold">
            Enter STRYVEN
          </button>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="reset-password" className="eyebrow-label text-ink-300">
                New password
              </label>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="reset-password"
                  className="input pl-10 pr-11"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 hover:text-ink-100"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reset-confirm" className="eyebrow-label text-ink-300">
                Confirm password
              </label>
              <input
                id="reset-confirm"
                className="input mt-1.5"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat your password"
              />
            </div>

            {confirm && password !== confirm && <p className="text-xs text-danger-400">Passwords do not match.</p>}

            <button type="submit" disabled={!valid || loading} className="btn-primary w-full uppercase tracking-wider text-xs font-bold">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>Update password</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
