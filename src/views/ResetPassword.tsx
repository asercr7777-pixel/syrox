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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 bg-[#070a12]">
      <div
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(167,139,250,0.16), transparent 45%), radial-gradient(ellipse at 75% 80%, rgba(92,236,255,0.12), transparent 45%)',
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#a78bfa]/30 bg-gradient-to-b from-[#121725]/95 to-[#0b0e18]/98 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a78bfa]/35 bg-[#a78bfa]/15">
            <ShieldCheck className="text-[#a78bfa]" size={28} />
          </div>
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#5cecff] uppercase">
            SECURITY PROTOCOL
          </span>
          <h1 className="mt-1 font-display text-2xl font-black text-white">Reset your password</h1>
          <p className="mt-2 text-xs text-slate-400">Choose a new password for your STRYVEN account.</p>
        </div>

        {done ? (
          <button
            type="button"
            onClick={enter}
            className="w-full rounded-xl border border-[#a78bfa]/50 bg-gradient-to-r from-[#7544d8] to-[#3b5bdb] py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg"
          >
            Enter STRYVEN
          </button>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">
                New password
              </label>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-white/15 bg-[#070a12] py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-[#a78bfa]"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-white"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">
                Confirm password
              </label>
              <input
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#070a12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#a78bfa]"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat your password"
              />
            </div>

            {confirm && password !== confirm && <p className="text-xs text-rose-400">Passwords do not match.</p>}

            <button
              type="submit"
              disabled={!valid || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#a78bfa]/50 bg-gradient-to-r from-[#7544d8] to-[#3b5bdb] py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>Update password</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
