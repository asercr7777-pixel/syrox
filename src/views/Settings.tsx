import { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  Bell,
  Check,
  Cloud,
  Download,
  Image as ImageIcon,
  Lock,
  LogOut,
  Palette,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  Video,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { usePWA } from '../hooks/usePWA';
import { ConfirmModal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { RankBadge } from '../components/ui/RankBadge';
import { BACKGROUNDS, AURAS } from '../data/collections';
import { getRankByXp } from '../data/ranks';
import type { SiteTheme } from '../store/types';
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
type SettingsSection =
  | 'appearance'
  | 'personalization'
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'accessibility'
  | 'application';

const THEMES: { id: SiteTheme; label: string; detail: string; color: string }[] = [
  { id: 'void', label: 'Void', detail: 'Violet / obsidian', color: '#a78bfa' },
  { id: 'nexus', label: 'Nexus', detail: 'Cyan / deep space', color: '#5cecff' },
  { id: 'eclipse', label: 'Eclipse', detail: 'Amethyst / night', color: '#8b5cf6' },
  { id: 'titan', label: 'Titan', detail: 'Gold / stone', color: '#f4c95d' },
  { id: 'forge', label: 'Forge', detail: 'Ember / graphite', color: '#ff7a18' },
  { id: 'shogun', label: 'Shogun', detail: 'Crimson / lacquer', color: '#f43f5e' },
  { id: 'rogue', label: 'Rogue', detail: 'Emerald / forest', color: '#10b981' },
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
    updateAccessibility,
    updatePrivacy,
    resetAll,
    saveToCloud,
    syncLeaderboard,
  } = useStore();
  const { signOut, user } = useAuth();
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  const [section, setSection] = useState<SettingsSection>('appearance');
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [customSiteColor, setCustomSiteColor] = useState(() => localStorage.getItem('stryven-custom-bg-color') || '');

  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  const cloudConfigured = isSupabaseConfigured();
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;
  const a11y = state.accessibility ?? { reducedMotion: false, highContrast: false, compactDensity: false };
  const privacy = state.privacy ?? { showOnLeaderboard: true };

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

  const syncCloudNow = async () => {
    if (!cloudConfigured) {
      toast({ title: 'Offline local mode', message: 'Cloud sync requires Supabase configuration.', type: 'info' });
      return;
    }
    if (!user?.id) {
      toast({ title: 'No active account', message: 'Sign in before syncing cloud data.', type: 'error' });
      return;
    }
    setSyncingCloud(true);
    try {
      const saved = await saveToCloud(user.id);
      if (!saved) throw new Error('Cloud storage did not confirm the save.');
      const leaderboardSaved = await syncLeaderboard();
      toast({
        title: 'Cloud data saved',
        message: leaderboardSaved
          ? 'Your STRYVEN progress is synchronized.'
          : 'Progress saved. Leaderboard visibility is either disabled or unavailable.',
        type: 'success',
      });
    } catch (error) {
      toast({ title: 'Cloud sync failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally {
      setSyncingCloud(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!cloudConfigured || !user?.email) {
      toast({ title: 'Unavailable', message: 'Password reset emails require an active Supabase email session.', type: 'info' });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/?view=auth&reset=1`,
      });
      if (error) throw error;
      toast({ title: 'Password reset email sent', message: 'Check your inbox for the reset link.', type: 'success' });
    } catch (error) {
      toast({ title: 'Could not send reset email', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally {
      setSendingReset(false);
    }
  };

  const signOutNow = async () => {
    playSound('click');
    setSigningOut(true);
    try {
      await signOut();
      setLogoutOpen(false);
    } catch (error) {
      toast({ title: 'Could not sign out', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally {
      setSigningOut(false);
    }
  };

  const handleResetProgress = () => {
    setResetOpen(false);
    window.requestAnimationFrame(() => {
      resetAll();
      toast({ title: 'Progress state reset', message: 'Your STRYVEN progression state has been reset.', type: 'success' });
    });
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        reg?.active?.postMessage({ type: 'CLEAR_CACHE' });
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast({ title: 'Offline cache cleared', message: 'Reloading STRYVEN cleanly…', type: 'success' });
      window.setTimeout(() => window.location.reload(), 600);
    } catch {
      toast({ title: 'Cache clear failed', message: 'Try refreshing the browser manually.', type: 'error' });
      setClearingCache(false);
    }
  };

  const navTabs: { id: SettingsSection; label: string; icon: typeof Palette }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'personalization', label: 'Personalization', icon: UserIcon },
    { id: 'account', label: 'Account', icon: Cloud },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'application', label: 'App & Data', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Control"
        title="Settings"
        description="Configure interface themes, background engine, personalization, cloud synchronization, accessibility, and application storage."
        right={
          <div className="sv-surface px-4 py-2 flex items-center gap-3">
            <RankBadge rank={rank} size="sm" auraColor={aura?.color} />
            <div>
              <span className="eyebrow-label block">Rank</span>
              <strong className="text-xs font-bold" style={{ color: rank.color }}>
                {rank.name}
              </strong>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Settings Navigation Rail */}
        <nav aria-label="Settings categories" className="lg:col-span-3 sv-surface p-2 flex lg:flex-col gap-1 overflow-x-auto">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  playSound('click');
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 min-h-[44px] text-xs font-bold whitespace-nowrap transition ${
                  active ? 'btn-primary !justify-start' : 'text-ink-400 hover:bg-white/5 hover:text-ink-100'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Panel Body */}
        <div className="lg:col-span-9 space-y-5">
          {section === 'appearance' && (
            <>
              <section className="sv-surface p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-100">Interface Theme</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Select the atmosphere and accent palette across all 7 pages.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {THEMES.map((theme) => {
                    const selected = state.theme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => chooseTheme(theme.id)}
                        className={`rounded-xl border p-3.5 text-left transition min-h-[82px] ${
                          selected ? 'border-ember-400 bg-ember-500/15' : 'border-white/10 bg-ink-950/60 hover:border-white/25'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="h-3.5 w-3.5 rounded-sm border border-white/25" style={{ background: theme.color }} />
                          {selected && <span className="font-mono text-[10px] font-bold text-frost-400">ACTIVE</span>}
                        </div>
                        <b className="block text-sm font-bold text-ink-100">{theme.label}</b>
                        <small className="mt-0.5 block text-[11px] text-ink-400">{theme.detail}</small>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow-label text-ink-300">Custom Backdrop Tint</span>
                    {customSiteColor && (
                      <button type="button" onClick={() => chooseTheme(state.theme)} className="text-xs font-semibold text-frost-400 hover:underline">
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
                        className={`h-8 w-8 rounded-lg border-2 transition ${
                          customSiteColor.toLowerCase() === color.toLowerCase() ? 'scale-110 border-frost-400' : 'border-white/20'
                        }`}
                      />
                    ))}
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-ink-950 px-3 min-h-[38px] text-xs text-ink-300">
                      <input
                        type="color"
                        aria-label="Pick custom backdrop color"
                        value={customSiteColor || '#070a12'}
                        onChange={(e) => chooseSiteColor(e.target.value)}
                        className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span>Custom</span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="sv-surface p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-100">Visual Background Engine</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Configure animated presets, custom images, or looping video backdrop.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'default', label: 'Default', icon: Sparkles },
                      { id: 'image', label: 'Custom Image', icon: ImageIcon },
                      { id: 'video', label: 'Custom Video', icon: Video },
                      { id: 'animated', label: 'Animated Presets', icon: Sliders },
                    ] as { id: BgType; label: string; icon: typeof Sparkles }[]
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const selected = state.backgroundType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBackgroundType(opt.id)}
                        className={`btn-ghost text-xs ${selected ? '!border-ember-400 !bg-ember-500/20 text-ink-100' : ''}`}
                      >
                        <Icon size={14} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-soft p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow-label text-ink-300">Custom Image</span>
                      {state.customBackground && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomBackground(null);
                            setBackgroundType('default');
                          }}
                          className="flex items-center gap-1 text-xs text-danger-400 hover:underline"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                    {state.customBackground && (
                      <img src={state.customBackground} alt="Custom background preview" className="h-24 w-full rounded-lg object-cover border border-white/10" />
                    )}
                    <button type="button" disabled={uploading} onClick={() => imageRef.current?.click()} className="btn-ghost w-full text-xs">
                      <Upload size={14} />
                      <span>{uploading ? 'Processing…' : state.customBackground ? 'Replace Image' : 'Select Image (max 10MB)'}</span>
                    </button>
                    <input ref={imageRef} hidden type="file" accept="image/*" onChange={(e) => handleUpload(e, 'image')} />
                  </div>

                  <div className="glass-soft p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow-label text-ink-300">Custom Video</span>
                      {state.backgroundVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            setBackgroundVideo(null);
                            setBackgroundType('default');
                          }}
                          className="flex items-center gap-1 text-xs text-danger-400 hover:underline"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                    {state.backgroundVideo && (
                      <video src={state.backgroundVideo} muted loop playsInline autoPlay className="h-24 w-full rounded-lg object-cover border border-white/10" />
                    )}
                    <button type="button" disabled={uploading} onClick={() => videoRef.current?.click()} className="btn-ghost w-full text-xs">
                      <Upload size={14} />
                      <span>{uploading ? 'Processing…' : state.backgroundVideo ? 'Replace Video' : 'Select Video (max 50MB)'}</span>
                    </button>
                    <input ref={videoRef} hidden type="file" accept="video/*" onChange={(e) => handleUpload(e, 'video')} />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="eyebrow-label block text-ink-300">Atmosphere Presets</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {BACKGROUNDS.map((bg) => {
                      const selected = state.selectedBackgroundId === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => selectPreset(bg.id)}
                          style={{ background: bg.css }}
                          className={`relative flex h-16 flex-col justify-end rounded-xl border p-2.5 text-left transition ${
                            selected ? 'border-frost-400 ring-2 ring-frost-400/40' : 'border-white/15 hover:border-white/30'
                          }`}
                        >
                          <span className="text-xs font-bold text-white drop-shadow">{bg.name}</span>
                          {selected && <Check size={14} className="absolute right-2 top-2 text-frost-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <SliderBox label="Brightness" value={`${state.backgroundBrightness}%`} min={20} max={150} current={state.backgroundBrightness} onChange={setBackgroundBrightness} />
                  <SliderBox label="Blur" value={`${state.backgroundBlur}px`} min={0} max={20} current={state.backgroundBlur} onChange={setBackgroundBlur} />
                  <SliderBox label="Dark Overlay" value={`${state.backgroundDarken}%`} min={0} max={90} current={state.backgroundDarken} onChange={setBackgroundDarken} />
                </div>
              </section>
            </>
          )}

          {section === 'personalization' && (
            <section className="sv-surface p-5 sm:p-6 space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-100">Hunter Personalization</h2>
                <p className="text-xs text-ink-400 mt-0.5">Customize your Hunter codename, emblem, and profile accent colors.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="hunter-codename" className="eyebrow-label text-ink-300 block">
                  Hunter Codename
                </label>
                <input
                  id="hunter-codename"
                  className="input max-w-md"
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
              </div>

              <div className="space-y-2.5">
                <span className="eyebrow-label block text-ink-300">Avatar Emblem</span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-w-2xl">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      aria-label={`Avatar ${avatar}`}
                      onClick={() => {
                        updateProfile({ avatar });
                        playSound('click');
                      }}
                      className={`flex h-11 items-center justify-center rounded-xl text-xl transition ${
                        state.avatar === avatar
                          ? 'border-2 border-frost-400 bg-ember-500/20'
                          : 'border border-white/10 bg-ink-950/70 hover:border-white/30'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <span className="eyebrow-label block text-ink-300">Name Highlight Color</span>
                  <div className="flex flex-wrap gap-2.5">
                    {NAME_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Name color ${color}`}
                        onClick={() => updateProfile({ nameColor: color })}
                        style={{ background: color }}
                        className={`h-9 w-9 rounded-lg border-2 transition ${state.nameColor === color ? 'scale-110 border-white' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <span className="eyebrow-label block text-ink-300">Banner Accent Color</span>
                  <div className="flex flex-wrap gap-2.5">
                    {BANNER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Banner color ${color}`}
                        onClick={() => updateProfile({ bannerColor: color })}
                        style={{ background: color }}
                        className={`h-9 w-9 rounded-lg border-2 transition ${state.bannerColor === color ? 'scale-110 border-white' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {section === 'account' && (
            <section className="sv-surface p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-frost-500/30 bg-frost-500/10 text-frost-400">
                  {cloudConfigured ? <Cloud size={20} /> : <WifiOff size={20} className="text-gold-400" />}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-100">Account &amp; Cloud Sync</h2>
                  <p className="text-xs text-ink-400">
                    {cloudConfigured
                      ? 'Synchronize your Hunter state, quests, and workout logs with Supabase Cloud.'
                      : 'Running in offline local browser mode.'}
                  </p>
                </div>
              </div>

              <div className="glass-soft p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="eyebrow-label block">Connection Status</span>
                  <strong className="mt-1 block text-sm text-ink-100">
                    {cloudConfigured && user ? `Connected (${user.email})` : 'Offline Local Mode'}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={syncCloudNow}
                  disabled={syncingCloud || !user || !cloudLoaded || !cloudConfigured}
                  className="btn-primary text-xs"
                >
                  <Cloud size={15} />
                  <span>{!cloudConfigured ? 'Cloud Unavailable' : syncingCloud ? 'Syncing…' : 'Sync Cloud Data Now'}</span>
                </button>
              </div>
            </section>
          )}

          {section === 'privacy' && (
            <section className="sv-surface p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ember-500/30 bg-ember-500/10 text-ember-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-100">Privacy &amp; Security</h2>
                  <p className="text-xs text-ink-400">Manage leaderboard visibility, password recovery, and active session controls.</p>
                </div>
              </div>

              <ToggleRow
                label="Public Leaderboard Sync"
                description="Allow your codename, rank, and XP summary to sync to the Supabase leaderboard table."
                enabled={privacy.showOnLeaderboard}
                onToggle={() => updatePrivacy({ showOnLeaderboard: !privacy.showOnLeaderboard })}
              />

              <div className="glass-soft p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <strong className="block text-xs font-bold text-ink-100">Password Recovery</strong>
                  <span className="text-xs text-ink-400">
                    {cloudConfigured ? 'Send a password reset link to your registered email.' : 'Requires Supabase cloud configuration.'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={sendingReset || !user?.email || !cloudConfigured}
                  onClick={sendPasswordReset}
                  className="btn-ghost text-xs"
                >
                  {sendingReset ? 'Sending…' : 'Request Password Reset'}
                </button>
              </div>

              <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <strong className="block text-xs font-bold text-danger-400">Sign Out</strong>
                  <span className="text-xs text-ink-300">End your current session on this device. Saved data remains intact.</span>
                </div>
                <button type="button" disabled={signingOut} onClick={() => setLogoutOpen(true)} className="btn-danger text-xs">
                  <LogOut size={14} />
                  <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                </button>
              </div>
            </section>
          )}

          {section === 'notifications' && (
            <section className="sv-surface p-5 sm:p-6 space-y-5">
              <div className="glass-soft p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-500/15 text-ember-400">
                    {state.soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink-100">System Audio &amp; SFX</h2>
                    <p className="text-xs text-ink-400">Chimes when confirming quests, finishing workouts, and leveling up.</p>
                  </div>
                </div>
                <button type="button" onClick={toggleSound} className={state.soundEnabled ? 'btn-primary text-xs' : 'btn-ghost text-xs'}>
                  {state.soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-ink-100">Routine Reminder Preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'workout', label: 'Workout Reminders' },
                      { id: 'tasks', label: 'Daily Quest Reminders' },
                      { id: 'water', label: 'Hydration Reminders' },
                      { id: 'reading', label: 'Reading Reminders' },
                      { id: 'sleep', label: 'Rest & Sleep Schedule' },
                      { id: 'prayer', label: 'Spiritual Practice' },
                    ] as const
                  ).map((item) => {
                    const isEnabled = state.notifications[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateNotifications({ [item.id]: !isEnabled })}
                        className={`flex items-center justify-between rounded-xl border px-3.5 min-h-[48px] text-left transition ${
                          isEnabled ? 'border-ember-500/45 bg-ember-500/12' : 'border-white/10 bg-ink-950/60 hover:border-white/25'
                        }`}
                      >
                        <span className="text-xs font-medium text-ink-200">{item.label}</span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-md ${
                            isEnabled ? 'bg-frost-500/15 text-frost-400 border border-frost-500/35' : 'bg-white/5 text-ink-500'
                          }`}
                        >
                          {isEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {section === 'accessibility' && (
            <section className="sv-surface p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-100">Accessibility Controls</h2>
                <p className="text-xs text-ink-400 mt-0.5">Adjust motion, contrast, and spacing density immediately across STRYVEN.</p>
              </div>
              <ToggleRow
                label="Reduced Motion"
                description="Minimizes animations and transitions across all pages."
                enabled={a11y.reducedMotion}
                onToggle={() => updateAccessibility({ reducedMotion: !a11y.reducedMotion })}
              />
              <ToggleRow
                label="High Contrast Mode"
                description="Boosts card borders and foreground text contrast for maximum legibility."
                enabled={a11y.highContrast}
                onToggle={() => updateAccessibility({ highContrast: !a11y.highContrast })}
              />
              <ToggleRow
                label="Compact Density"
                description="Reduces card padding to display more information per screen."
                enabled={a11y.compactDensity}
                onToggle={() => updateAccessibility({ compactDensity: !a11y.compactDensity })}
              />
            </section>
          )}

          {section === 'application' && (
            <section className="space-y-5">
              <div className="sv-surface p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-100">Application &amp; PWA</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Version 2.1.0 · Manage offline cache and home-screen installation.</p>
                </div>

                <div className="glass-soft p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <strong className="block text-xs font-bold text-ink-100">Installable App Status</strong>
                    <span className="text-xs text-ink-400">
                      {isInstalled ? 'Installed as standalone PWA' : isInstallable ? 'Ready to install on this device' : 'Use browser menu to install'}
                    </span>
                  </div>
                  {isInstallable && !isInstalled && (
                    <button type="button" onClick={() => void promptInstall()} className="btn-primary text-xs">
                      <Download size={14} />
                      <span>Install STRYVEN</span>
                    </button>
                  )}
                </div>

                <div className="glass-soft p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <strong className="block text-xs font-bold text-ink-100">Offline Service Worker Cache</strong>
                    <span className="text-xs text-ink-400">Clears cached shell assets and reloads fresh files without touching user data.</span>
                  </div>
                  <button type="button" disabled={clearingCache} onClick={() => void handleClearCache()} className="btn-ghost text-xs">
                    <RefreshCw size={14} className={clearingCache ? 'animate-spin' : ''} />
                    <span>{clearingCache ? 'Clearing…' : 'Clear Cache & Reload'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-danger-500/35 bg-danger-500/10 p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-danger-500/30 bg-danger-500/15 text-danger-400">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-danger-400">Reset Progress State</h2>
                    <p className="text-xs text-ink-300">
                      Clear XP, quest history, and unlocked items back to Level 1. Saved workout database records are preserved.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setResetOpen(true)} className="btn-danger text-xs">
                  <RotateCcw size={14} />
                  <span>Reset Progress State</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetProgress}
        title="Reset Progress State"
        message="This resets your XP, quests, rank progression, and unlocked honors. Your account and saved training records in the workout database are preserved."
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
        message="You will be signed out of this device. Your saved progress remains intact."
        confirmLabel={signingOut ? 'Signing out…' : 'Sign Out'}
        closeOnConfirm={false}
      />
    </div>
  );
}

function SliderBox({
  label,
  value,
  min,
  max,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="glass-soft p-3.5 space-y-2">
      <div className="flex justify-between text-xs text-ink-300">
        <span>{label}</span>
        <strong className="font-mono tabular-nums text-ink-100">{value}</strong>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass-soft p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <strong className="block text-xs font-bold text-ink-100">{label}</strong>
        <span className="text-xs text-ink-400">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={enabled ? 'btn-primary !min-h-[40px] px-4 text-xs' : 'btn-ghost !min-h-[40px] px-4 text-xs'}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}