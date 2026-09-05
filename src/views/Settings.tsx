import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { ConfirmModal } from '../components/ui/Modal';
import { BACKGROUNDS } from '../data/collections';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { Upload, Trash2, Volume2, VolumeX, Palette, User, Image as ImageIcon, Video, Sparkles, LogOut, Shield, Database, Info, Gamepad2, RotateCcw, Cloud, Check, Moon, Monitor, Sun } from 'lucide-react';

const AVATARS = ['🐺','😈','👑','🔥','⚡','🌑','🗡️','🛡️','⚔️','🐉','👻','🦅','🦁','🐍','🦊','🐲','💀','🤴','🥷','🧙'];
const NAME_COLORS = ['#fbbf24','#ff7a18','#a855f7','#06b6d4','#10b981','#f43f5e','#3b82f6','#ec4899'];
const BANNER_COLORS = ['#1e1b4b','#7f1d1d','#0c4a6e','#14532d','#78350f','#4c1d95','#0f172a','#831843'];
type BgType = 'default' | 'image' | 'video' | 'animated';

function Section({ icon: Icon, eyebrow, title, children }: { icon: typeof User; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25">
    <div className="border-b border-white/5 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-ember-500/20 bg-ember-500/10 text-ember-400"><Icon size={17} /></div><div><p className="text-[9px] font-bold uppercase tracking-[.25em] text-ember-400">{eyebrow}</p><h2 className="font-display text-lg font-bold uppercase">{title}</h2></div></div></div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>;
}

export function Settings() {
  const { state, updateProfile, setCustomBackground, setBackgroundVideo, setBackgroundType, setBackgroundBlur, setBackgroundDarken, setBackgroundBrightness, setSelectedBackground, toggleSound, resetAll, syncLeaderboard } = useStore();
  const { signOut, user } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, kind: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = kind === 'image' ? ['image/jpeg','image/png','image/webp','image/gif'] : ['video/mp4','video/webm','video/ogg'];
    const max = kind === 'image' ? 10 : 50;
    if (!allowed.includes(file.type)) { toast({ title: 'Invalid file type', message: kind === 'image' ? 'Use JPG, PNG, WebP or GIF.' : 'Use MP4, WebM or OGG.', type: 'error' }); event.target.value = ''; return; }
    if (file.size > max * 1024 * 1024) { toast({ title: 'File too large', message: `Maximum ${max}MB.`, type: 'error' }); event.target.value = ''; return; }
    setUploading(true);
    try {
      if (user && isSupabaseConfigured()) {
        const { url, error } = await uploadBackground(user.id, file, kind);
        if (error || !url) throw new Error(error || 'Upload failed');
        if (!mounted.current) return;
        kind === 'image' ? setCustomBackground(url) : setBackgroundVideo(url);
      } else {
        const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        if (!mounted.current) return;
        kind === 'image' ? setCustomBackground(url) : setBackgroundVideo(url);
      }
      setBackgroundType(kind);
      toast({ title: `${kind === 'image' ? 'Image' : 'Video'} background applied`, type: 'success' });
    } catch (error) { toast({ title: 'Upload failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' }); }
    finally { if (mounted.current) setUploading(false); event.target.value = ''; }
  };

  const preset = (id: string) => { const selected = state.selectedBackgroundId === id; setSelectedBackground(selected ? null : id); setBackgroundType(selected ? 'default' : 'animated'); setCustomBackground(null); setBackgroundVideo(null); };
  const setTheme = (theme: 'dark' | 'light' | 'system') => { updateProfile({ theme }); toast({ title: `${theme[0].toUpperCase()}${theme.slice(1)} theme selected`, type: 'success' }); };
  const signOutNow = async () => { playSound('click'); await signOut(); };

  return <div className="space-y-6 pb-8">
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-5 sm:p-8"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" /><div className="relative"><p className="text-[10px] font-bold uppercase tracking-[.3em] text-ember-400">SYSTEM // CONTROL PANEL</p><h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight sm:text-5xl">Settings</h1><p className="mt-3 max-w-2xl text-sm text-ink-400">Configure your identity, interface, audio, gameplay and data without touching your progression.</p></div></header>

    <Section icon={User} eyebrow="01 // Account" title="Hunter Identity">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]"><div className="space-y-4"><div><label className="label">Username</label><input className="input mt-1 w-full" value={state.username} maxLength={20} onChange={e => updateProfile({ username: e.target.value })} /></div><div><label className="label">Avatar</label><div className="mt-2 flex flex-wrap gap-2">{AVATARS.map(a => <button key={a} type="button" onClick={() => { updateProfile({ avatar: a }); playSound('click'); }} aria-label={`Avatar ${a}`} className={`grid h-10 w-10 place-items-center rounded-xl border text-xl transition ${state.avatar === a ? 'border-ember-500 bg-ember-500/20' : 'border-white/5 bg-ink-950/60 hover:border-white/15'}`}>{a}</button>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Name Color</label><div className="mt-2 flex flex-wrap gap-2">{NAME_COLORS.map(c => <button key={c} type="button" aria-label={`Name color ${c}`} onClick={() => updateProfile({ nameColor: c })} className={`h-8 w-8 rounded-lg ${state.nameColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''}`} style={{ background: c }} />)}</div></div><div><label className="label">Banner Color</label><div className="mt-2 flex flex-wrap gap-2">{BANNER_COLORS.map(c => <button key={c} type="button" aria-label={`Banner color ${c}`} onClick={() => updateProfile({ bannerColor: c })} className={`h-8 w-8 rounded-lg ${state.bannerColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''}`} style={{ background: c }} />)}</div></div></div></div><div className="hidden w-32 place-items-center rounded-2xl border border-white/5 bg-white/[.02] lg:grid"><div className="text-center"><div className="text-5xl">{state.avatar}</div><p className="mt-2 text-[9px] uppercase tracking-[.2em] text-ink-500">Active Hunter</p></div></div></div>
    </Section>

    <Section icon={Palette} eyebrow="02 // Appearance" title="Interface">
      <div className="space-y-5"><div><label className="label">Theme</label><div className="mt-2 grid grid-cols-3 gap-2">{([['dark','Dark',Moon],['light','Light',Sun],['system','System',Monitor]] as const).map(([id,label,Icon]) => <button key={id} type="button" onClick={() => setTheme(id)} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${state.theme === id ? 'border-ember-500/50 bg-ember-500/10 text-ember-400' : 'border-white/5 bg-ink-950/50 text-ink-400 hover:border-white/15'}`}><Icon size={16} />{label}</button>)}</div></div>
        <div><label className="label">Background Mode</label><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['default','Default',Moon],['image','Image',ImageIcon],['video','Video',Video],['animated','Animated',Sparkles]] as const).map(([id,label,Icon]) => <button key={id} type="button" onClick={() => setBackgroundType(id as BgType)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${state.backgroundType === id ? 'border-ember-500/50 bg-ember-500/10 text-ember-400' : 'border-white/5 bg-ink-950/50 text-ink-400'}`}><Icon size={17}/><span className="text-xs">{label}</span></button>)}</div></div>
        <div><label className="label">Background Presets</label><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">{BACKGROUNDS.map(bg => <button key={bg.id} type="button" onClick={() => preset(bg.id)} className={`relative aspect-video overflow-hidden rounded-xl border-2 ${state.selectedBackgroundId === bg.id ? 'border-ember-500' : 'border-white/5'}`} style={{ background: bg.css }}><span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px]">{bg.name}</span>{state.selectedBackgroundId === bg.id && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ember-500"><Check size={12}/></span>}</button>)}</div></div>
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => imageRef.current?.click()} disabled={uploading} className="btn-ghost"><Upload size={15}/> {uploading ? 'Uploading...' : 'Upload Image'}</button><button type="button" onClick={() => videoRef.current?.click()} disabled={uploading} className="btn-ghost"><Upload size={15}/> {uploading ? 'Uploading...' : 'Upload Video'}</button><input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => void handleUpload(e,'image')} className="hidden"/><input ref={videoRef} type="file" accept="video/mp4,video/webm,video/ogg" onChange={e => void handleUpload(e,'video')} className="hidden"/></div>
        {(state.customBackground || state.backgroundVideo) && <button type="button" onClick={() => { setCustomBackground(null); setBackgroundVideo(null); setBackgroundType('default'); }} className="btn-ghost w-full text-danger-400"><Trash2 size={15}/> Remove Custom Background</button>}
        <div className="grid gap-4 md:grid-cols-3"><Range label="Brightness" value={state.backgroundBrightness} min={20} max={150} onChange={setBackgroundBrightness} /><Range label="Blur" value={state.backgroundBlur} min={0} max={20} suffix="px" onChange={setBackgroundBlur} /><Range label="Dark Overlay" value={state.backgroundDarken} min={0} max={90} onChange={setBackgroundDarken} /></div>
      </div>
    </Section>

    <Section icon={Volume2} eyebrow="03 // Audio" title="Sound System">
      <button type="button" onClick={toggleSound} className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-ink-950/50 p-4 text-left hover:border-white/10"><span className="flex items-center gap-3">{state.soundEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}<span><strong className="block text-sm">Sound Effects</strong><small className="text-xs text-ink-500">Feedback for tasks, training and system events.</small></span></span><span className="chip">{state.soundEnabled ? 'ON' : 'OFF'}</span></button>
    </Section>

    <Section icon={Gamepad2} eyebrow="04 // Gameplay" title="Rules & Progression">
      <div className="grid gap-3 sm:grid-cols-3"><InfoCard label="Daily XP Cap" value="1,000 XP" /><InfoCard label="Progression" value="XP Only" /><InfoCard label="Daily Reset" value="Automatic" /></div><div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[.04] p-4 text-xs leading-5 text-ink-400">Your progression is saved automatically. Completing missions, training and story objectives contributes XP toward your rank.</div>
    </Section>

    <Section icon={Database} eyebrow="05 // Data" title="Cloud & Local Data">
      <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={async () => { await syncLeaderboard(); toast({ title: 'Cloud data synchronized', type: 'success' }); }} className="btn-ghost"><Cloud size={15}/> Sync Cloud</button><button type="button" onClick={() => setResetOpen(true)} className="btn-ghost text-danger-400"><RotateCcw size={15}/> Reset Progress</button></div><p className="mt-3 text-xs text-ink-600">Reset permanently removes your local progression and cannot be undone.</p>
    </Section>

    <Section icon={Shield} eyebrow="06 // Session" title="Account Session">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-ink-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{user?.email || 'Local Hunter'}</p><p className="mt-1 text-xs text-ink-500">Your current authenticated session.</p></div><button type="button" onClick={() => setLogoutOpen(true)} className="btn-ghost text-danger-400"><LogOut size={15}/> Sign Out</button></div>
    </Section>

    <Section icon={Info} eyebrow="07 // About" title="STRYVEN System">
      <div className="grid gap-3 sm:grid-cols-3"><InfoCard label="Version" value="STRYVEN // Core" /><InfoCard label="Architecture" value="Cloud Synced" /><InfoCard label="Status" value="Operational" /></div><p className="mt-4 text-center text-[10px] uppercase tracking-[.25em] text-ink-600">Built for discipline. Designed for progression.</p>
    </Section>

    <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => { resetAll(); setResetOpen(false); toast({ title: 'Progress reset', type: 'success' }); }} title="Reset All Progress" message="This permanently erases your progression and history. This cannot be undone." confirmLabel="Reset Everything" danger />
    <ConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={signOutNow} title="Sign Out" message="Your progress is saved to the cloud." confirmLabel="Sign Out" />
  </div>;
}

function Range({ label, value, min, max, suffix = '%', onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return <div className="rounded-xl border border-white/5 bg-ink-950/40 p-3"><div className="flex justify-between text-xs text-ink-400"><span>{label}</span><b className="font-mono text-ink-200">{value}{suffix}</b></div><input aria-label={label} type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="mt-2 w-full" /></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/5 bg-ink-950/40 p-4"><span className="block text-[9px] uppercase tracking-[.2em] text-ink-600">{label}</span><strong className="mt-1 block font-mono text-sm text-ink-200">{value}</strong></div>;
}
