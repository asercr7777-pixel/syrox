import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { BACKGROUNDS, FRAMES, AURAS } from '../data/collections';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import {
  Upload, Trash2, Volume2, VolumeX, Bell, Palette, User as UserIcon,
  Image as ImageIcon, Video, Sparkles, LogOut, Sun, Moon, Shield, Eye, Lock
} from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { uploadBackground } from '../lib/backgroundUpload';

const AVATARS = ['🐺', '😈', '👑', '🔥', '⚡', '🌑', '🗡️', '🛡️', '⚔️', '🐉', '👻', '🦅', '🦁', '🐍', '🦊', '🐲', '💀', '🤴', '🥷', '🧙'];
const NAME_COLORS = ['#fbbf24', '#ff7a18', '#a855f7', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6', '#ec4899'];
const BANNER_COLORS = ['#1e1b4b', '#7f1d1d', '#0c4a6e', '#14532d', '#78350f', '#4c1d95', '#0f172a', '#831843'];

type BgType = 'default' | 'image' | 'video' | 'animated';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export function Settings() {
  const {
    state, updateProfile, setCustomBackground, setBackgroundVideo, setBackgroundType,
    setBackgroundBlur, setBackgroundDarken, setBackgroundBrightness, setSelectedBackground,
    toggleSound, updateNotifications, resetAll, syncLeaderboard,
  } = useStore();
  const { signOut, user } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;
  const frame = state.equipped.frame ? FRAMES.find((f) => f.id === state.equipped.frame) : null;

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', message: 'Max 10MB for images.', type: 'error' });
      e.target.value = '';
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', message: 'Allowed: JPG, PNG, WebP, GIF.', type: 'error' });
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      if (user) {
        const { url, error } = await uploadBackground(user.id, file, 'image');
        if (error || !url) throw new Error(error || 'Upload failed');
        setCustomBackground(url);
        setBackgroundType('image');
        toast({ title: 'Image background applied', type: 'success' });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setCustomBackground(reader.result as string);
          setBackgroundType('image');
          toast({ title: 'Image background applied', type: 'success' });
        };
        reader.onerror = () => toast({ title: 'Failed to read file', type: 'error' });
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Upload failed', message: msg, type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large', message: 'Max 50MB for videos.', type: 'error' });
      e.target.value = '';
      return;
    }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', message: 'Allowed: MP4, WebM, OGG.', type: 'error' });
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      if (user) {
        const { url, error } = await uploadBackground(user.id, file, 'video');
        if (error || !url) throw new Error(error || 'Upload failed');
        setBackgroundVideo(url);
        setBackgroundType('video');
        toast({ title: 'Video background applied', type: 'success' });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setBackgroundVideo(reader.result as string);
          setBackgroundType('video');
          toast({ title: 'Video background applied', type: 'success' });
        };
        reader.onerror = () => toast({ title: 'Failed to read file', type: 'error' });
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Upload failed', message: msg, type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSignOut = async () => {
    playSound('click');
    await signOut();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-sm text-ink-300">Customize your hunter and the application</p>
      </div>

      {/* Account */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <UserIcon size={18} /> Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input mt-1" value={state.username} onChange={(e) => updateProfile({ username: e.target.value })} maxLength={20} />
          </div>
          <div>
            <label className="label">Avatar</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => { updateProfile({ avatar: a }); playSound('click'); }}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${
                    state.avatar === a ? 'bg-ember-500/30 border-2 border-ember-500' : 'bg-ink-950/60 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Name Color</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {NAME_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateProfile({ nameColor: c })}
                  className={`w-8 h-8 rounded-lg transition ${state.nameColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Banner Color</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {BANNER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateProfile({ bannerColor: c })}
                  className={`w-8 h-8 rounded-lg transition ${state.bannerColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance & Theme */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Palette size={18} /> Appearance
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5">
            <span className="flex items-center gap-2">
              <Sun size={18} className="text-ember-400" />
              <span className="font-medium">Theme</span>
            </span>
            <span className="chip bg-ink-800 text-ink-200 capitalize">{state.theme}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5">
            <span className="flex items-center gap-2">
              <Eye size={18} className="text-frost-400" />
              <span className="font-medium">Current Rank</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: rank.color }}>{rank.name}</span>
              <RankBadge rank={rank} size="sm" auraColor={aura?.color} />
            </div>
          </div>
        </div>
      </div>

      {/* Background Customization */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <ImageIcon size={18} /> Background
        </h2>
        <div className="space-y-4">
          {/* Background type selector */}
          <div>
            <label className="label">Background Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {([
                { id: 'default' as BgType, label: 'Default', icon: Moon },
                { id: 'image' as BgType, label: 'Image', icon: ImageIcon },
                { id: 'video' as BgType, label: 'Video', icon: Video },
                { id: 'animated' as BgType, label: 'Animated', icon: Sparkles },
              ]).map((opt) => {
                const Icon = opt.icon;
                const active = state.backgroundType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setBackgroundType(opt.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition ${
                      active
                        ? 'bg-ember-500/20 border-ember-500/50 text-ember-400'
                        : 'bg-ink-950/60 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload image */}
          {(state.backgroundType === 'image' || state.backgroundType === 'default') && (
            <div>
              <label className="label">Upload Image Background</label>
              <div className="flex gap-2 mt-2">
                <button onClick={() => imageRef.current?.click()} disabled={uploading} className="btn-ghost flex-1">
                  <Upload size={16} className={uploading ? 'animate-spin' : ''} /> {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                {state.customBackground && (
                  <button onClick={() => { setCustomBackground(null); setBackgroundType('default'); }} className="btn-ghost text-danger-400">
                    <Trash2 size={16} />
                  </button>
                )}
                <input ref={imageRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </div>
              <p className="text-xs text-ink-400 mt-1">Max 10MB. JPG, PNG, or WebP.</p>
            </div>
          )}

          {/* Upload video */}
          {(state.backgroundType === 'video' || state.backgroundType === 'default') && (
            <div>
              <label className="label">Upload Video Background</label>
              <div className="flex gap-2 mt-2">
                <button onClick={() => videoRef.current?.click()} disabled={uploading} className="btn-ghost flex-1">
                  <Upload size={16} className={uploading ? 'animate-spin' : ''} /> {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                {state.backgroundVideo && (
                  <button onClick={() => { setBackgroundVideo(null); setBackgroundType('default'); }} className="btn-ghost text-danger-400">
                    <Trash2 size={16} />
                  </button>
                )}
                <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
              </div>
              <p className="text-xs text-ink-400 mt-1">Max 50MB. MP4, WebM. Autoplay muted, looped.</p>
            </div>
          )}

          {/* Animated presets */}
          <div>
            <label className="label">Animated Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {BACKGROUNDS.map((bg) => {
                const owned = state.inventory.some((i) => i.id === bg.id && i.type === 'background');
                const selected = state.selectedBackgroundId === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => {
                      if (!owned) {
                        toast({ title: 'Not owned', message: 'Unlock this from the Marketplace.', type: 'error' });
                        return;
                      }
                      setSelectedBackground(selected ? null : bg.id);
                      setBackgroundType(selected ? 'default' : 'animated');
                      setCustomBackground(null);
                      setBackgroundVideo(null);
                    }}
                    className={`aspect-video rounded-lg border-2 relative overflow-hidden transition ${
                      selected ? 'border-ember-500' : 'border-white/5'
                    }`}
                    style={{ background: bg.css }}
                  >
                    <span className="absolute bottom-1 left-1.5 text-xs font-medium bg-black/50 px-1.5 py-0.5 rounded">
                      {bg.name}
                    </span>
                    {!owned && <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs">🔒</span>}
                    {selected && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ember-500 flex items-center justify-center text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div>
              <label className="label">Brightness: {state.backgroundBrightness}%</label>
              <input type="range" min={20} max={150} value={state.backgroundBrightness} onChange={(e) => setBackgroundBrightness(Number(e.target.value))} className="w-full mt-2" />
            </div>
            <div>
              <label className="label">Blur: {state.backgroundBlur}px</label>
              <input type="range" min={0} max={20} value={state.backgroundBlur} onChange={(e) => setBackgroundBlur(Number(e.target.value))} className="w-full mt-2" />
            </div>
            <div>
              <label className="label">Dark Overlay: {state.backgroundDarken}%</label>
              <input type="range" min={0} max={90} value={state.backgroundDarken} onChange={(e) => setBackgroundDarken(Number(e.target.value))} className="w-full mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Bell size={18} /> Notifications
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(state.notifications) as (keyof typeof state.notifications)[]).map((k) => (
            <button
              key={k}
              onClick={() => updateNotifications({ [k]: !state.notifications[k] })}
              className="flex items-center justify-between p-2 rounded-lg bg-ink-900/60 border border-white/5 hover:bg-white/5"
            >
              <span className="text-sm capitalize">{k}</span>
              <span className={`w-9 h-5 rounded-full relative transition ${state.notifications[k] ? 'bg-ember-500' : 'bg-ink-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${state.notifications[k] ? 'left-4' : 'left-0.5'}`} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sounds */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Volume2 size={18} /> Sounds
        </h2>
        <button onClick={toggleSound} className="w-full flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5 hover:bg-white/5">
          <span className="flex items-center gap-2">
            {state.soundEnabled ? <Volume2 size={18} className="text-ember-400" /> : <VolumeX size={18} className="text-ink-400" />}
            <span className="font-medium">Sound Effects</span>
          </span>
          <span className={`chip ${state.soundEnabled ? 'bg-emerald2-500/15 text-emerald2-400' : 'bg-ink-800 text-ink-400'}`}>
            {state.soundEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Privacy & Data */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Shield size={18} /> Privacy & Data
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => syncLeaderboard()} className="btn-ghost text-sm">
            <Upload size={14} /> Sync to Cloud
          </button>
          <button onClick={() => setResetOpen(true)} className="btn-danger text-sm">
            <Trash2 size={14} /> Reset All Data
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <LogOut size={18} /> Session
        </h2>
        <button onClick={() => setLogoutOpen(true)} className="btn-ghost w-full text-danger-400">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetAll();
          toast({ title: 'All data reset', type: 'success' });
        }}
        title="Reset All Data"
        message="This will permanently erase all your progress, tasks, items, and history. This cannot be undone."
        confirmLabel="Reset Everything"
        danger
      />

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="You will be returned to the login screen. Your progress is saved to the cloud."
        confirmLabel="Sign Out"
      />
    </div>
  );
}
