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
  Cloud, RotateCcw, Bell, Check, Sliders, WifiOff
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AVATARS = ['🐺', '😈', '👑', '🔥', '⚡', '🌑', '🗡️', '🛡️', '⚔️', '🐉', '👻', '🦅', '🦁', '🐍', '🦊', '🐲', '💀', '🤴', '🥷', '🧙'];
const NAME_COLORS = ['#f4c95d', '#a78bfa', '#5cecff', '#76f5bd', '#fb7185', '#38bdf8', '#fbbf24', '#ec4899'];
const BANNER_COLORS = ['#1e1b4b', '#0c4a6e', '#14532d', '#4c1d95', '#0f172a', '#7f1d1d', '#78350f', '#831843'];
const SITE_COLORS = ['#070a12', '#0b0e18', '#121725', '#160f2b', '#061923', '#091f19', '#190b10', '#161309'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
type BgType = 'default' | 'image' | 'video' | 'animated';
type SettingsTab = 'identity' | 'appearance' | 'preferences' | 'account';

const THEMES: { id: SiteTheme; label: string; detail: string; color: string }[] = [
  { id: 'void', label: 'Void', detail: 'Violet / obsidian', color: '#a78bfa' },
  { id: 'nexus', label: 'Nexus', detail: 'Cyan / deep space', color: '#5cecff' },
  { id: 'eclipse', label: 'Eclipse', detail: 'Amethyst / night', color: '#8b5cf6' },
  { id: 'titan', label: 'Titan', detail: 'Gold / stone', color: '#f4c95d' },
  { id: 'forge', label: 'Forge', detail: 'Ember / graphite', color: '#ff7a18' },
  { id: 'shogun', label: 'Shogun', detail: 'Crimson / lacquer', color: '#f43f5e' },
  { id: 'rogue', label: 'Rogue', detail: 'Emerald / forest', color: '#84cc16' },
  { id: 'overdrive', label: 'Overdrive', detail: 'Electric / steel', color: '#3b82f6' },
];

export function Settings() {
  const {
    state,
    cloudLoaded,
    updateProfile,
    setCustomBackground,
    setBackgroundVideo,
    setBackgroundType,
    setBackgroundBlur,
    setBackgroundDarken,
    setBackgroundBrightness,
    setSelectedBackground,
    toggleSound,
    updateNotifications,
    resetAll,
    saveToCloud,
    syncLeaderboard,
  } = useStore();
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
  const cloudConfigured = isSupabaseConfigured();
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
      toast({
        title: 'Invalid file type',
        message: kind === 'image' ? 'Use JPG, PNG, WebP, or GIF.' : 'Use MP4, WebM, or OGG.',
        type: 'error',
      });
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      if (user && cloudConfigured) {
        const { url, error } = await uploadBackground(user.id, file, kind);
        if (error || !url) throw new Error(error || 'Upload failed');
        if (!mounted.current) return;
        if (kind === 'image') setCustomBackground(url);
        else setBackgroundVideo(url);
        setBackgroundType(kind);
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Could not read selected file.'));
          reader.readAsDataURL(file);
        });
        if (!mounted.current) return;
        if (kind === 'image') setCustomBackground(dataUrl);
        else setBackgroundVideo(dataUrl);
        setBackgroundType(kind);
      }
      toast({ title: `${kind === 'image' ? 'Image' : 'Video'} background applied`, type: 'success' });
    } catch (error) {
      toast({
        title: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
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
      toast({
        title: 'Progress state reset',
        message: 'Your STRYVEN progression state has been reset.',
        type: 'success',
      });
    });
  };

  const syncCloudNow = async () => {
    if (!cloudConfigured) {
      toast({
        title: 'Offline local mode',
        message: 'Cloud synchronization requires Supabase configuration.',
        type: 'info',
      });
      return;
    }
    if (!user?.id) {
      toast({ title: 'No active account', message: 'Sign in before syncing cloud data.', type: 'error' });
      return;
    }
    if (!state || !('xp' in state)) {
      toast({
        title: 'Progress unavailable',
        message: 'Wait for your account data to finish loading, then try again.',
        type: 'error',
      });
      return;
    }
    setSyncingCloud(true);
    try {
      const saved = await saveToCloud(user.id);
      if (!saved) {
        throw new Error('Cloud storage did not confirm the save. Check your connection and account permissions.');
      }
      const leaderboardSaved = await syncLeaderboard();
      toast({
        title: 'Cloud data saved',
        message: leaderboardSaved
          ? 'Your STRYVEN progress and leaderboard profile are synced.'
          : 'Your STRYVEN progress is saved. Leaderboard sync was unavailable.',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Cloud sync failed',
        message: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    } finally {
      setSyncingCloud(false);
    }
  };

  const signOutNow = async () => {
    playSound('click');
    setSigningOut(true);
    try {
      await signOut();
      setLogoutOpen(false);
    } catch (error) {
      toast({
        title: 'Could not sign out',
        message: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    } finally {
      setSigningOut(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!cloudConfigured) {
      toast({
        title: 'Offline local mode',
        message: 'Password reset emails require Supabase cloud configuration.',
        type: 'info',
      });
      return;
    }
    if (!user?.email) {
      toast({
        title: 'Email unavailable',
        message: 'This account has no email address available for recovery.',
        type: 'error',
      });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/?view=auth&reset=1`,
      });
      if (error) throw error;
      toast({
        title: 'Password reset email sent',
        message: 'Check your inbox for a secure password reset link.',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Could not send reset email',
        message: error instanceof Error ? error.message : 'Please try again.',
        type: 'error',
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="sv-command sv-page-module sv-settings space-y-5 max-w-5xl mx-auto">
      <header className="sv-module-header rounded-2xl border border-[#a78bfa]/25 bg-gradient-to-r from-[#121725]/95 via-[#0b0e18]/95 to-[#070a12]/95 p-5 sm:p-6">
        <div>
          <p className="sv-eyebrow">
            <Sliders size={14} /> SYSTEM CONFIGURATION // SETTINGS
          </p>
          <h1 className="!text-2xl sm:!text-3xl !mt-1.5 !mb-1">System Control</h1>
          <p>Configure your Hunter identity, interface theme, background engine, audio, and account storage.</p>
        </div>
        <div className="sv-identity-rank flex items-center gap-3 rounded-xl border border-[#a78bfa]/30 bg-[#070a12]/80 px-4 py-2.5">
          <RankBadge rank={rank} size="sm" auraColor={aura?.color} />
          <div>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
              CURRENT RANK
            </span>
            <b style={{ color: rank.color }} className="text-sm font-bold">
              {rank.name}
            </b>
          </div>
        </div>
      </header>

      <nav
        aria-label="Settings sections"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-[#0b0e18]/90 p-1.5"
      >
        {[
          { id: 'identity', label: 'Hunter Identity', icon: UserIcon },
          { id: 'appearance', label: 'Themes & Visuals', icon: Palette },
          { id: 'preferences', label: 'Audio & Alerts', icon: Bell },
          { id: 'account', label: 'Account & Data', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as SettingsTab);
                playSound('click');
              }}
              className={`flex items-center justify-center sm:justify-start gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'border border-[#a78bfa]/45 bg-gradient-to-r from-[#7544d8]/85 to-[#2e58a8]/85 text-white shadow-lg shadow-[#7544d8]/20'
                  : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === 'identity' && (
        <section className="space-y-5">
          <div className="sv-surface space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]">
                <UserIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Hunter Codename &amp; Identity</h2>
                <p className="text-xs text-slate-400">
                  Personalize your hunter display name, insignia emblem, and profile accent colors.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="hunter-codename" className="block font-mono text-xs font-bold tracking-wider text-slate-300">
                HUNTER CODENAME
              </label>
              <input
                id="hunter-codename"
                className="w-full max-w-md rounded-xl border border-white/15 bg-[#070a12] px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[#a78bfa]"
                value={state.username}
                maxLength={20}
                placeholder="Hunter name"
                onChange={(e) => updateProfile({ username: e.target.value })}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim();
                  if (!trimmed) updateProfile({ username: 'Hunter' });
                  else if (trimmed !== e.target.value) updateProfile({ username: trimmed });
                }}
              />
              <span className="block text-[11px] text-slate-400">
                Up to 20 characters. Visible across your Command Center, Profile, and Leaderboard.
              </span>
            </div>

            <div className="space-y-3">
              <span className="block font-mono text-xs font-bold tracking-wider text-slate-300">
                HUNTER AVATAR EMBLEM
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5 max-w-2xl">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    aria-label={`Avatar ${avatar}`}
                    onClick={() => {
                      updateProfile({ avatar });
                      playSound('click');
                    }}
                    className={`flex h-11 items-center justify-center rounded-xl text-xl transition-all ${
                      state.avatar === avatar
                        ? 'scale-105 border-2 border-[#5cecff] bg-[#a78bfa]/25 shadow-md shadow-[#5cecff]/20'
                        : 'border border-white/10 bg-[#070a12]/80 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <span className="block font-mono text-xs font-bold tracking-wider text-slate-300">
                  NAME HIGHLIGHT COLOR
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {NAME_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Name color ${color}`}
                      onClick={() => updateProfile({ nameColor: color })}
                      style={{ background: color }}
                      className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                        state.nameColor === color ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block font-mono text-xs font-bold tracking-wider text-slate-300">
                  BANNER ACCENT COLOR
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {BANNER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Banner color ${color}`}
                      onClick={() => updateProfile({ bannerColor: color })}
                      style={{ background: color }}
                      className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                        state.bannerColor === color ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'appearance' && (
        <section className="space-y-5">
          <div className="sv-surface space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5cecff]/30 bg-[#5cecff]/10 text-[#5cecff]">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Hunter Interface Theme</h2>
                <p className="text-xs text-slate-400">Select the atmosphere and accent palette for your Hunter System console.</p>
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
                    className={`relative overflow-hidden rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-[#a78bfa] bg-[#a78bfa]/15 shadow-lg shadow-[#a78bfa]/15'
                        : 'border-white/10 bg-[#070a12]/70 hover:border-white/25 hover:bg-white/5'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="h-3.5 w-3.5 rounded-sm border border-white/25" style={{ background: theme.color }} />
                      {isSelected && <span className="font-mono text-[10px] font-bold text-[#5cecff]">ACTIVE</span>}
                    </div>
                    <b className="block text-sm font-bold text-white">{theme.label}</b>
                    <small className="mt-0.5 block text-[11px] text-slate-400">{theme.detail}</small>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-slate-300">CUSTOM BACKDROP COLOR</span>
                {customSiteColor && (
                  <button
                    type="button"
                    onClick={() => chooseTheme(state.theme)}
                    className="text-xs font-semibold text-[#5cecff] hover:underline"
                  >
                    Reset to theme default
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {SITE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Backdrop color ${color}`}
                    onClick={() => chooseSiteColor(color)}
                    style={{ background: color }}
                    className={`h-7 w-7 rounded-lg border-2 transition-transform ${
                      customSiteColor.toLowerCase() === color.toLowerCase()
                        ? 'scale-110 border-[#5cecff] shadow-md'
                        : 'border-white/20'
                    }`}
                  />
                ))}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-[#070a12] px-3 py-1.5 text-xs text-slate-300 hover:border-white/30">
                  <input
                    type="color"
                    aria-label="Pick custom backdrop color"
                    value={customSiteColor || '#070a12'}
                    onChange={(e) => chooseSiteColor(e.target.value)}
                    className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span>Picker</span>
                </label>
              </div>
            </div>
          </div>

          <div className="sv-surface space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]">
                <ImageIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Visual Background Engine</h2>
                <p className="text-xs text-slate-400">Configure animated presets, custom images, or looping video atmosphere.</p>
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
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#a78bfa] bg-[#a78bfa]/20 text-white shadow-md'
                        : 'border-white/10 bg-[#070a12]/70 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#070a12]/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">CUSTOM IMAGE BACKGROUND</span>
                  {state.customBackground && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomBackground(null);
                        setBackgroundType('default');
                      }}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:underline"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                {state.customBackground && (
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-black/50">
                    <img src={state.customBackground} alt="Custom background preview" className="h-24 w-full object-cover" />
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  JPG, PNG, WebP or GIF up to 10MB.{!cloudConfigured && ' Stored locally in offline mode.'}
                </p>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => imageRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                >
                  <Upload size={14} />
                  <span>{uploading ? 'Processing…' : state.customBackground ? 'Replace Image' : 'Select Image File'}</span>
                </button>
                <input ref={imageRef} hidden type="file" accept="image/*" onChange={(e) => handleUpload(e, 'image')} />
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-[#070a12]/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">CUSTOM VIDEO BACKGROUND</span>
                  {state.backgroundVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        setBackgroundVideo(null);
                        setBackgroundType('default');
                      }}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:underline"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
                {state.backgroundVideo && (
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-black/50">
                    <video src={state.backgroundVideo} muted loop playsInline autoPlay className="h-24 w-full object-cover" />
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  MP4, WebM or OGG up to 50MB.{!cloudConfigured && ' Stored locally in offline mode.'}
                </p>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => videoRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                >
                  <Upload size={14} />
                  <span>{uploading ? 'Processing…' : state.backgroundVideo ? 'Replace Video' : 'Select Video File'}</span>
                </button>
                <input ref={videoRef} hidden type="file" accept="video/*" onChange={(e) => handleUpload(e, 'video')} />
              </div>
            </div>

            <div className="space-y-3">
              <span className="block font-mono text-xs font-bold text-slate-300">SYSTEM ANIMATED PRESETS</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BACKGROUNDS.map((bg) => {
                  const isSelected = state.selectedBackgroundId === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => selectPreset(bg.id)}
                      style={{ background: bg.css }}
                      className={`relative flex h-16 flex-col justify-end overflow-hidden rounded-xl border p-2.5 text-left transition-all ${
                        isSelected ? 'scale-[1.02] border-[#5cecff] ring-2 ring-[#5cecff]/45' : 'border-white/15 hover:border-white/30'
                      }`}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-md">{bg.name}</span>
                      {isSelected && (
                        <span className="absolute right-2 top-2 text-xs font-bold text-[#5cecff]">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-[#070a12]/80 p-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Brightness</span>
                  <b>{state.backgroundBrightness}%</b>
                </div>
                <input
                  type="range"
                  aria-label="Background brightness"
                  min={20}
                  max={150}
                  value={state.backgroundBrightness}
                  onChange={(e) => setBackgroundBrightness(Number(e.target.value))}
                  className="w-full accent-[#a78bfa]"
                />
              </div>
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-[#070a12]/80 p-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Blur Effect</span>
                  <b>{state.backgroundBlur}px</b>
                </div>
                <input
                  type="range"
                  aria-label="Background blur"
                  min={0}
                  max={20}
                  value={state.backgroundBlur}
                  onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                  className="w-full accent-[#a78bfa]"
                />
              </div>
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-[#070a12]/80 p-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Dark Overlay</span>
                  <b>{state.backgroundDarken}%</b>
                </div>
                <input
                  type="range"
                  aria-label="Background dark overlay"
                  min={0}
                  max={90}
                  value={state.backgroundDarken}
                  onChange={(e) => setBackgroundDarken(Number(e.target.value))}
                  className="w-full accent-[#a78bfa]"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'preferences' && (
        <section className="space-y-5">
          <div className="sv-surface space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]">
                  {state.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">System Audio &amp; SFX</h2>
                  <p className="text-xs text-slate-400">
                    Acoustic confirmation chimes when completing missions, leveling up, and hitting timer milestones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                  state.soundEnabled
                    ? 'border-[#a78bfa] bg-[#a78bfa]/25 text-white shadow-lg shadow-[#a78bfa]/15'
                    : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                {state.soundEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>
          </div>

          <div className="sv-surface space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5cecff]/30 bg-[#5cecff]/10 text-[#5cecff]">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Hunter Routine Reminders</h2>
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
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isEnabled
                        ? 'border-[#a78bfa]/45 bg-[#a78bfa]/10'
                        : 'border-white/10 bg-[#070a12]/70 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-200">{item.label}</span>
                    <span
                      className={`rounded-md px-2.5 py-1 font-mono text-[10px] font-bold ${
                        isEnabled
                          ? 'border border-[#5cecff]/40 bg-[#5cecff]/15 text-[#5cecff]'
                          : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {isEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Preferences are saved immediately and synchronized with your account when cloud sync is active.
            </p>
          </div>
        </section>
      )}

      {activeTab === 'account' && (
        <section className="space-y-5">
          <div className="sv-surface space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#5cecff]/30 bg-[#5cecff]/10 text-[#5cecff]">
                {cloudConfigured ? <Cloud size={20} /> : <WifiOff size={20} className="text-[#f4c95d]" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Cloud Data &amp; Synchronization</h2>
                <p className="text-xs text-slate-400">
                  {cloudConfigured
                    ? 'Save your Hunter progression, workout records, and profile to Supabase Cloud.'
                    : 'Running in offline local mode. Cloud synchronization activates when Supabase keys are configured.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#070a12]/80 p-4">
              <div>
                <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CONNECTION STATUS
                </span>
                <b className="text-sm font-bold text-white">
                  {cloudConfigured && user
                    ? `Connected to Supabase Cloud (${user.email})`
                    : 'Offline Local Mode (Cloud sync unavailable)'}
                </b>
              </div>
              <button
                type="button"
                onClick={syncCloudNow}
                disabled={syncingCloud || !user || !cloudLoaded || !cloudConfigured}
                className="flex items-center gap-2 rounded-xl border border-[#5cecff]/40 bg-[#5cecff]/15 px-4 py-2.5 text-xs font-bold text-[#9ef4ff] transition hover:bg-[#5cecff]/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Cloud size={15} />
                <span>
                  {!cloudConfigured
                    ? 'Cloud Sync Unavailable'
                    : syncingCloud
                      ? 'Syncing to Cloud…'
                      : !cloudLoaded
                        ? 'Loading Cloud Data…'
                        : 'Sync Cloud Data Now'}
                </span>
              </button>
            </div>
          </div>

          <div className="sv-surface space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Hunter Security &amp; Credentials</h2>
                <p className="text-xs text-slate-400">Manage password recovery or sign out safely from this device.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#070a12]/80 p-4">
              <div>
                <b className="block text-xs font-bold text-white">Password Reset</b>
                <span className="text-[11px] text-slate-400">
                  {cloudConfigured
                    ? 'Sends a recovery verification link to your registered account email.'
                    : 'Password recovery emails require an active Supabase cloud session.'}
                </span>
              </div>
              <button
                type="button"
                disabled={sendingReset || !user?.email || !cloudConfigured}
                onClick={sendPasswordReset}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingReset ? 'Sending…' : 'Request Password Reset'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-500/25 bg-rose-950/20 p-4">
              <div>
                <b className="block text-xs font-bold text-rose-300">Sign Out of Session</b>
                <span className="text-[11px] text-rose-300/75">
                  {cloudConfigured
                    ? 'Your cloud progress remains securely stored in your Supabase account.'
                    : 'Ends the current local session on this device.'}
                </span>
              </div>
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setLogoutOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600/20 px-4 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-600/30"
              >
                <LogOut size={14} />
                <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
                <RotateCcw size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-rose-200">Reset System Progress</h2>
                <p className="text-xs text-rose-300/80">
                  Clear XP, mission history, and inventory to start fresh as Level 1. Saved workout database records are preserved.
                </p>
              </div>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600/20 px-4 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-600/30"
              >
                <RotateCcw size={14} />
                <span>Reset Progress State</span>
              </button>
            </div>
          </div>
        </section>
      )}

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
        onClose={() => {
          if (!signingOut) setLogoutOpen(false);
        }}
        onConfirm={() => {
          void signOutNow();
        }}
        title="Sign Out"
        message="You will be signed out of this device. Your saved progress will remain intact."
        confirmLabel={signingOut ? 'Signing out…' : 'Sign Out'}
        closeOnConfirm={false}
      />
    </div>
  );
}