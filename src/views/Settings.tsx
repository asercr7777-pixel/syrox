import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { ConfirmModal } from '../components/ui/Modal';
import { BACKGROUNDS, AURAS } from '../data/collections';
import type { SiteTheme } from '../store/types';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import {
  Upload, Trash2, Volume2, VolumeX, Palette, User as UserIcon,
  Image as ImageIcon, Video, Sparkles, LogOut, Shield,
  Cloud, RotateCcw, Bell, Check, Sliders
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { uploadBackground } from '../lib/backgroundUpload';
import { supabase } from '../lib/supabase';

const AVATARS = ['🐺','😈','👑','🔥','⚡','🌑','🗡️','🛡️','⚔️','🐉','👻','🦅','🦁','🐍','🦊','🐲','💀','🤴','🥷','🧙'];
const NAME_COLORS = ['#fbbf24','#ff7a18','#a855f7','#06b6d4','#10b981','#f43f5e','#3b82f6','#ec4899'];
const BANNER_COLORS = ['#1e1b4b','#7f1d1d','#0c4a6e','#14532d','#78350f','#4c1d95','#0f172a','#831843'];
const SITE_COLORS = ['#050505','#0b1220','#111827','#1e1033','#190b0b','#092019','#1a1407','#101010'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4','video/webm','video/ogg'];
type BgType = 'default' | 'image' | 'video' | 'animated';
type SettingsTab = 'identity' | 'appearance' | 'preferences' | 'account';

const THEMES: { id: SiteTheme; label: string; detail: string; color: string }[] = [
  { id: 'forge', label: 'Forge', detail: 'Ember / graphite', color: '#ff7a18' },
  { id: 'void', label: 'Void', detail: 'Violet / abyss', color: '#8b5cf6' },
  { id: 'nexus', label: 'Nexus', detail: 'Cyan / deep space', color: '#06b6d4' },
  { id: 'shogun', label: 'Shogun', detail: 'Crimson / black', color: '#f43f5e' },
  { id: 'titan', label: 'Titan', detail: 'Gold / stone', color: '#eab308' },
  { id: 'rogue', label: 'Rogue', detail: 'Lime / forest', color: '#84cc16' },
  { id: 'eclipse', label: 'Eclipse', detail: 'Purple / night', color: '#a855f7' },
  { id: 'overdrive', label: 'Overdrive', detail: 'Electric / steel', color: '#3b82f6' },
];

export function Settings() {
  const { state, cloudLoaded, updateProfile, setCustomBackground, setBackgroundVideo, setBackgroundType, setBackgroundBlur, setBackgroundDarken, setBackgroundBrightness, setSelectedBackground, toggleSound, updateNotifications, resetAll, saveToCloud, syncLeaderboard } = useStore();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [customSiteColor, setCustomSiteColor] = useState(() => localStorage.getItem('stryven-custom-bg-color') || '');
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const onBackgroundChange = () => setCustomSiteColor(localStorage.getItem('stryven-custom-bg-color') || '');
    window.addEventListener('stryven-background-change', onBackgroundChange);
    window.addEventListener('storage', onBackgroundChange);
    return () => {
      window.removeEventListener('stryven-background-change', onBackgroundChange);
      window.removeEventListener('storage', onBackgroundChange);
    };
  }, []);

  const chooseTheme = (theme: SiteTheme) => {
    updateProfile({ theme });
    localStorage.removeItem('stryven-custom-bg-color');
    setCustomSiteColor('');
    window.dispatchEvent(new Event('stryven-background-change'));
    playSound('click');
  };

  const chooseSiteColor = (color: string) => {
    localStorage.setItem('stryven-custom-bg-color', color);
    setCustomSiteColor(color);
    window.dispatchEvent(new Event('stryven-background-change'));
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const max = kind === 'image' ? 10 : 50;
    const allowed = kind === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
    if (file.size > max * 1024 * 1024) {
      toast({ title: 'File too large', message: `Maximum ${max}MB.`, type: 'error' });
      event.target.value = '';
      return;
    }
    if (!allowed.includes(file.type)) {
      toast({ title: 'Invalid file type', message: kind === 'image' ? 'Use JPG, PNG, WebP, or GIF.' : 'Use MP4, WebM, or OGG.', type: 'error' });
      event.target.value = '';
      return;
    }
    setUploading(true);
    try {
      if (user) {
        const { url, error } = await uploadBackground(user.id, file, kind);
        if (error || !url) throw new Error(error || 'Upload failed');
        if (!mounted.current) return;
        if (kind === 'image') setCustomBackground(url); else setBackgroundVideo(url);
        setBackgroundType(kind);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (!mounted.current) return;
          if (kind === 'image') setCustomBackground(reader.result as string); else setBackgroundVideo(reader.result as string);
          setBackgroundType(kind);
        };
        reader.readAsDataURL(file);
      }
      toast({ title: `${kind === 'image' ? 'Image' : 'Video'} background applied`, type: 'success' });
    } catch (error) {
      toast({ title: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error', type: 'error' });
    } finally {
      if (mounted.current) setUploading(false);
      event.target.value = '';
    }
  };

  const selectPreset = (id: string) => {
    const selected = state.selectedBackgroundId === id;
    setSelectedBackground(selected ? null : id);
    setBackgroundType(selected ? 'default' : 'animated');
    setCustomBackground(null);
    setBackgroundVideo(null);
  };

  const handleResetProgress = () => {
    setResetOpen(false);
    window.requestAnimationFrame(() => {
      resetAll();
      toast({ title: 'Progress state reset', message: 'Your STRYVEN progression state has been reset.', type: 'success' });
    });
  };

  const syncCloudNow = async () => {
    if (!user?.id) { toast({ title: 'No active account', message: 'Sign in before syncing cloud data.', type: 'error' }); return; }
    if (!state || !('xp' in state)) { toast({ title: 'Progress unavailable', message: 'Wait for your account data to finish loading, then try again.', type: 'error' }); return; }
    setSyncingCloud(true);
    try {
      const saved = await saveToCloud(user.id);
      if (!saved) throw new Error('Cloud storage did not confirm the save. Check your connection and account permissions.');
      const leaderboardSaved = await syncLeaderboard();
      toast({
        title: 'Cloud data saved',
        message: leaderboardSaved ? 'Your STRYVEN progress and leaderboard profile are synced.' : 'Your STRYVEN progress is saved. Leaderboard sync was unavailable.',
        type: 'success'
      });
    } catch (error) {
      toast({ title: 'Cloud sync failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally { setSyncingCloud(false); }
  };

  const signOutNow = async () => {
    playSound('click');
    setSigningOut(true);
    try {
      await signOut();
      setLogoutOpen(false);
    } catch (error) {
      toast({ title: 'Could not sign out', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally { setSigningOut(false); }
  };

  const sendPasswordReset = async () => {
    if (!user?.email) { toast({ title: 'Email unavailable', message: 'This account has no email address available for recovery.', type: 'error' }); return; }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/?view=auth&reset=1` });
      if (error) throw error;
      toast({ title: 'Password reset email sent', message: 'Check your inbox for a secure password reset link.', type: 'success' });
    } catch (error) {
      toast({ title: 'Could not send reset email', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally { setSendingReset(false); }
  };

  return (
    <div className="sv-settings space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-ink-900/60 to-ink-950/80 border border-purple-500/20 backdrop-blur-xl">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">SYSTEM CONFIGURATION // SETTINGS</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">System Control</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Configure your Hunter identity, visual atmosphere, preferences and cloud sync.</p>
        </div>
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10">
          <RankBadge rank={rank} size="sm" auraColor={aura?.color} />
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">CURRENT RANK</span>
            <b style={{ color: rank.color }} className="text-sm font-bold">{rank.name}</b>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10">
        {[
          { id: 'identity', label: 'Hunter Identity', icon: UserIcon },
          { id: 'appearance', label: 'Interface & Atmosphere', icon: Palette },
          { id: 'preferences', label: 'Audio & Alerts', icon: Bell },
          { id: 'account', label: 'Account & Data', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id as SettingsTab); playSound('click'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 border border-purple-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HUNTER IDENTITY */}
      {activeTab === 'identity' && (
        <section className="space-y-5 animate-fade-in">
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><UserIcon size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-white">Hunter Codename & Identity</h2>
                <p className="text-xs text-slate-400">Personalize your hunter display name, insignia avatar, and UI accent colors.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold tracking-wider text-slate-300 block">HUNTER CODENAME</label>
              <input
                className="w-full max-w-md px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-medium focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm"
                value={state.username}
                maxLength={20}
                placeholder="Hunter name"
                onChange={(e) => updateProfile({ username: e.target.value })}
              />
              <span className="text-[11px] text-slate-500 block">Max 20 characters. Visible on your Hunter profile and leaderboard.</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono font-bold tracking-wider text-slate-300 block">HUNTER AVATAR EMBLEM</label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-w-2xl">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    aria-label={`Avatar ${avatar}`}
                    onClick={() => { updateProfile({ avatar }); playSound('click'); }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      state.avatar === avatar
                        ? 'bg-purple-600/30 border-2 border-purple-400 scale-105 shadow-md shadow-purple-900/50'
                        : 'bg-black/40 border border-white/10 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold tracking-wider text-slate-300 block">NAME HIGHLIGHT COLOR</label>
                <div className="flex flex-wrap gap-2.5">
                  {NAME_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Name color ${color}`}
                      onClick={() => updateProfile({ nameColor: color })}
                      style={{ background: color }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        state.nameColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono font-bold tracking-wider text-slate-300 block">BANNER THEME COLOR</label>
                <div className="flex flex-wrap gap-2.5">
                  {BANNER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Banner color ${color}`}
                      onClick={() => updateProfile({ bannerColor: color })}
                      style={{ background: color }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        state.bannerColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: INTERFACE & ATMOSPHERE */}
      {activeTab === 'appearance' && (
        <section className="space-y-5 animate-fade-in">
          {/* Theme selection */}
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Palette size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-white">Hunter Interface Theme</h2>
                <p className="text-xs text-slate-400">Select the visual aesthetic for your Hunter System console.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map((theme) => {
                const isSelected = state.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => chooseTheme(theme.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-900/30'
                        : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ background: theme.color }} />
                      {isSelected && <span className="text-[10px] font-mono font-bold text-purple-400">ACTIVE</span>}
                    </div>
                    <b className="text-sm font-bold text-white block">{theme.label}</b>
                    <small className="text-[11px] text-slate-400 block mt-0.5">{theme.detail}</small>
                  </button>
                );
              })}
            </div>

            {/* Custom site color */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">CUSTOM BACKDROP COLOR</span>
                {customSiteColor && (
                  <button type="button" onClick={() => chooseTheme(state.theme)} className="text-xs text-cyan-400 hover:underline">
                    Reset to theme default
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {SITE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => chooseSiteColor(color)}
                    style={{ background: color }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                      customSiteColor.toLowerCase() === color.toLowerCase() ? 'border-cyan-400 scale-110 shadow-md' : 'border-white/20'
                    }`}
                  />
                ))}
                <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-slate-300 hover:border-white/30">
                  <input type="color" value={customSiteColor || '#080808'} onChange={(e) => chooseSiteColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
                  <span>Picker</span>
                </label>
              </div>
            </div>
          </div>

          {/* Background system */}
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><ImageIcon size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-white">Visual Background Engine</h2>
                <p className="text-xs text-slate-400">Configure animated presets, custom images, or video atmosphere.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                { id: 'default', label: 'Default', icon: Sparkles },
                { id: 'image', label: 'Custom Image', icon: ImageIcon },
                { id: 'video', label: 'Custom Video', icon: Video },
                { id: 'animated', label: 'Animated Presets', icon: Sliders },
              ] as { id: BgType; label: string; icon: typeof Sparkles }[]).map((opt) => {
                const Icon = opt.icon;
                const isSelected = state.backgroundType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBackgroundType(opt.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 text-white shadow-md'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom media upload boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">CUSTOM IMAGE BACKGROUND</span>
                  {state.customBackground && (
                    <button type="button" onClick={() => { setCustomBackground(null); setBackgroundType('default'); }} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">JPG, PNG, WebP or GIF up to 10MB.</p>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => imageRef.current?.click()}
                  className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition"
                >
                  <Upload size={14} />
                  <span>{uploading ? 'Uploading…' : state.customBackground ? 'Replace Image' : 'Select Image File'}</span>
                </button>
                <input ref={imageRef} hidden type="file" accept="image/*" onChange={(e) => handleUpload(e, 'image')} />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">CUSTOM VIDEO BACKGROUND</span>
                  {state.backgroundVideo && (
                    <button type="button" onClick={() => { setBackgroundVideo(null); setBackgroundType('default'); }} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">MP4, WebM or OGG up to 50MB.</p>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => videoRef.current?.click()}
                  className="w-full py-2 px-3 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition"
                >
                  <Upload size={14} />
                  <span>{uploading ? 'Uploading…' : state.backgroundVideo ? 'Replace Video' : 'Select Video File'}</span>
                </button>
                <input ref={videoRef} hidden type="file" accept="video/*" onChange={(e) => handleUpload(e, 'video')} />
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 block">SYSTEM ANIMATED PRESETS</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BACKGROUNDS.map((bg) => {
                  const isSelected = state.selectedBackgroundId === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => selectPreset(bg.id)}
                      style={{ background: bg.css }}
                      className={`h-16 rounded-xl p-2.5 border text-left flex flex-col justify-end transition-all relative overflow-hidden ${
                        isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-[1.02]' : 'border-white/15 hover:border-white/30'
                      }`}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-md">{bg.name}</span>
                      {isSelected && <span className="absolute top-2 right-2 text-cyan-300 text-xs font-bold"><Check size={14} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300"><span>Brightness</span><b>{state.backgroundBrightness}%</b></div>
                <input type="range" min={20} max={150} value={state.backgroundBrightness} onChange={(e) => setBackgroundBrightness(Number(e.target.value))} className="w-full accent-purple-500" />
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300"><span>Blur Effect</span><b>{state.backgroundBlur}px</b></div>
                <input type="range" min={0} max={20} value={state.backgroundBlur} onChange={(e) => setBackgroundBlur(Number(e.target.value))} className="w-full accent-purple-500" />
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300"><span>Dark Overlay</span><b>{state.backgroundDarken}%</b></div>
                <input type="range" min={0} max={90} value={state.backgroundDarken} onChange={(e) => setBackgroundDarken(Number(e.target.value))} className="w-full accent-purple-500" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: PREFERENCES & SOUND */}
      {activeTab === 'preferences' && (
        <section className="space-y-5 animate-fade-in">
          {/* Audio toggle */}
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {state.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">System Audio & SFX</h2>
                  <p className="text-xs text-slate-400">Play acoustic confirmation chimes when completing missions, leveling up, and timer milestones.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  state.soundEnabled
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {state.soundEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>
          </div>

          {/* Reminder notifications */}
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Bell size={20} /></div>
              <div>
                <h2 className="text-base font-bold text-white">Hunter Routine Preferences</h2>
                <p className="text-xs text-slate-400">Enable or disable alerts for your daily protocols.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { id: 'workout', label: 'Workout Protocol Reminders' },
                { id: 'tasks', label: 'Daily Mission Reminders' },
                { id: 'water', label: 'Hydration Reminders' },
                { id: 'reading', label: 'Reading Protocol Reminders' },
                { id: 'sleep', label: 'Rest & Sleep Cycle' },
                { id: 'prayer', label: 'Spiritual Discipline / Prayer' },
              ] as const).map((item) => {
                const isEnabled = state.notifications[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateNotifications({ [item.id]: !isEnabled })}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isEnabled ? 'bg-purple-950/20 border-purple-500/40' : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-200">{item.label}</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md ${
                      isEnabled ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-slate-500'
                    }`}>
                      {isEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">Preferences are synced with your Hunter profile and preserved in cloud storage.</p>
          </div>
        </section>
      )}

      {/* TAB 4: ACCOUNT & CLOUD STORAGE */}
      {activeTab === 'account' && (
        <section className="space-y-5 animate-fade-in">
          {/* Cloud sync status */}
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Cloud size={20} /></div>
              <div>
                <h2 className="text-base font-bold text-white">Cloud Data & Synchronisation</h2>
                <p className="text-xs text-slate-400">Save your Hunter progression, workout records, and inventory to your Supabase account.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">CLOUD CONNECTION</span>
                <b className="text-sm text-white font-bold">{user ? `Signed in as ${user.email}` : 'Local Offline Hunter Mode'}</b>
              </div>
              <button
                type="button"
                onClick={syncCloudNow}
                disabled={syncingCloud || !user || !cloudLoaded}
                className="px-4 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
              >
                <Cloud size={15} />
                <span>{syncingCloud ? 'Syncing to Cloud…' : !cloudLoaded ? 'Loading Cloud Data…' : 'Sync Cloud Data Now'}</span>
              </button>
            </div>
          </div>

          {/* Account session */}
          <div className="p-6 rounded-2xl bg-ink-900/60 border border-white/10 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Shield size={20} /></div>
              <div>
                <h2 className="text-base font-bold text-white">Hunter Security & Credentials</h2>
                <p className="text-xs text-slate-400">Manage your credentials, password recovery, or sign out safely.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <div>
                <b className="text-xs font-bold text-white block">Password Reset</b>
                <span className="text-[11px] text-slate-400">Sends a recovery verification link to your registered account email.</span>
              </div>
              <button
                type="button"
                disabled={sendingReset || !user?.email}
                onClick={sendPasswordReset}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
              >
                {sendingReset ? 'Sending…' : 'Request Password Reset'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-red-950/20 border border-red-500/20">
              <div>
                <b className="text-xs font-bold text-red-300 block">Sign Out of Session</b>
                <span className="text-[11px] text-red-400/80">Your cloud progress remains securely stored in your Supabase account.</span>
              </div>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setLogoutOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-xs font-bold text-red-300 hover:bg-red-600/30 transition flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* Reset progress */}
          <div className="p-6 rounded-2xl bg-red-950/15 border border-red-500/25 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><RotateCcw size={20} /></div>
              <div>
                <h2 className="text-base font-bold text-red-200">Reset System Progress</h2>
                <p className="text-xs text-red-300/80">Clear XP, mission history, and inventory to start fresh as Level 1. Workout database records are preserved.</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-xs font-bold text-red-300 hover:bg-red-600/30 transition flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Reset Progress State</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetProgress}
        title="Reset Progress State"
        message="This resets your XP, missions, rank progression, inventory, story progress and profile preferences. Your account and saved training records in the workout database are not deleted."
        confirmLabel="Reset Progress"
        danger
      />
      <ConfirmModal
        open={logoutOpen}
        onClose={() => { if (!signingOut) setLogoutOpen(false); }}
        onConfirm={() => { void signOutNow(); }}
        title="Sign Out"
        message="You will be signed out of this device. Your saved cloud progress will remain in your account."
        confirmLabel={signingOut ? 'Signing out…' : 'Sign Out'}
        closeOnConfirm={false}
      />
    </div>
  );
}