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
      toast({ title: 'Reset failed', message: 'We could not update your password. Request a new reset link and try again.', type: 'error' });
      return;
    }
    setDone(true);
    toast({ title: 'Password updated', message: 'Your new password is active. You can enter SYROX now.', type: 'success' });
  };

  const enter = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    url.searchParams.set('view', 'dashboard');
    window.location.replace(url.toString());
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 bg-radial-fade opacity-60" />
      <div className="relative w-full max-w-md card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ember-500/30 bg-ember-500/10"><ShieldCheck className="text-ember-400" size={28} /></div>
          <h1 className="font-display text-2xl font-black text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-ink-400">Choose a new password for your SYROX account.</p>
        </div>
        {done ? (
          <button onClick={enter} className="btn-primary w-full py-3">Enter SYROX</button>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">New password</label><div className="relative mt-1"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-10 pr-10" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /><button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-400">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
            <div><label className="label">Confirm password</label><input className="input mt-1" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Repeat your password" /></div>
            {confirm && password !== confirm && <p className="text-xs text-danger-400">Passwords do not match.</p>}
            <button type="submit" disabled={!valid || loading} className="btn-primary w-full py-3 disabled:opacity-50">{loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Update password</button>
          </form>
        )}
      </div>
    </div>
  );
}
