import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { ConfirmModal } from '../components/ui/Modal';
import { BACKGROUNDS, AURAS } from '../data/collections';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { Upload, Trash2, Volume2, VolumeX, Palette, User as UserIcon, Image as ImageIcon, Video, Sparkles, LogOut, Moon, Shield, Eye, Cloud, RotateCcw } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { uploadBackground } from '../lib/backgroundUpload';

const AVATARS = ['🐺','😈','👑','🔥','⚡','🌑','🗡️','🛡️','⚔️','🐉','👻','🦅','🦁','🐍','🦊','🐲','💀','🤴','🥷','🧙'];
const NAME_COLORS = ['#fbbf24','#ff7a18','#a855f7','#06b6d4','#10b981','#f43f5e','#3b82f6','#ec4899'];
const BANNER_COLORS = ['#1e1b4b','#7f1d1d','#0c4a6e','#14532d','#78350f','#4c1d95','#0f172a','#831843'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4','video/webm','video/ogg'];
type BgType = 'default' | 'image' | 'video' | 'animated';

export function Settings() {
  const { state, updateProfile, setCustomBackground, setBackgroundVideo, setBackgroundType, setBackgroundBlur, setBackgroundDarken, setBackgroundBrightness, setSelectedBackground, toggleSound, resetAll, syncLeaderboard } = useStore();
  const { signOut, user } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const rank = getRankByXp(state.xp);
  const aura = state.equipped.aura ? AURAS.find((a) => a.id === state.equipped.aura) : null;

  useEffect(() => () => { mounted.current = false; }, []);

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

  const signOutNow = async () => { playSound('click'); await signOut(); };

  return (
    <div className="sv-settings">
      <header className="sv-settings__header">
        <div><span className="sv-settings__eyebrow">SYSTEM CONTROL</span><h1>Settings</h1><p>Configure your hunter, visual identity, background and audio.</p></div>
        <div className="sv-settings__rank"><RankBadge rank={rank} size="sm" auraColor={aura?.color} /><div><span>CURRENT RANK</span><b style={{ color: rank.color }}>{rank.name}</b></div></div>
      </header>

      <div className="sv-settings__grid">
        <section className="sv-settings-card sv-settings-card--wide">
          <div className="sv-settings-card__head"><div className="sv-settings-icon"><UserIcon size={18} /></div><div><span>PROFILE</span><h2>Hunter Identity</h2></div></div>
          <div className="sv-settings-fields">
            <label><span>Username</span><input className="sv-settings-input" value={state.username} maxLength={20} onChange={(e) => updateProfile({ username: e.target.value })} /></label>
            <div><span className="sv-settings-label">Avatar</span><div className="sv-avatar-grid">{AVATARS.map((avatar) => <button key={avatar} aria-label={`Avatar ${avatar}`} className={state.avatar === avatar ? 'is-selected' : ''} onClick={() => { updateProfile({ avatar }); playSound('click'); }}>{avatar}</button>)}</div></div>
            <div><span className="sv-settings-label">Name Color</span><div className="sv-color-row">{NAME_COLORS.map((color) => <button key={color} aria-label={`Name color ${color}`} className={state.nameColor === color ? 'is-selected' : ''} style={{ background: color }} onClick={() => updateProfile({ nameColor: color })} />)}</div></div>
            <div><span className="sv-settings-label">Banner Color</span><div className="sv-color-row">{BANNER_COLORS.map((color) => <button key={color} aria-label={`Banner color ${color}`} className={state.bannerColor === color ? 'is-selected' : ''} style={{ background: color }} onClick={() => updateProfile({ bannerColor: color })} />)}</div></div>
          </div>
        </section>

        <section className="sv-settings-card">
          <div className="sv-settings-card__head"><div className="sv-settings-icon"><Palette size={18} /></div><div><span>APPEARANCE</span><h2>Interface</h2></div></div>
          <div className="sv-settings-list">
            <div className="sv-setting-row"><div><Moon size={16} /><span>Theme</span></div><strong>{state.theme}</strong></div>
            <div className="sv-setting-row"><div><Eye size={16} /><span>Current Rank</span></div><strong style={{ color: rank.color }}>{rank.name}</strong></div>
          </div>
        </section>

        <section className="sv-settings-card sv-settings-card--wide">
          <div className="sv-settings-card__head"><div className="sv-settings-icon"><ImageIcon size={18} /></div><div><span>VISUAL SYSTEM</span><h2>Background</h2></div></div>
          <div className="sv-settings-block"><span className="sv-settings-label">Background Type</span><div className="sv-bg-types">{([{ id: 'default', label: 'Default', icon: Moon }, { id: 'image', label: 'Image', icon: ImageIcon }, { id: 'video', label: 'Video', icon: Video }, { id: 'animated', label: 'Animated', icon: Sparkles }] as { id: BgType; label: string; icon: typeof Moon }[]).map((option) => { const Icon = option.icon; return <button key={option.id} className={state.backgroundType === option.id ? 'is-selected' : ''} onClick={() => setBackgroundType(option.id)}><Icon size={17} /><span>{option.label}</span></button>; })}</div></div>
          <div className="sv-upload-grid">
            <div className="sv-upload-box"><div><span>IMAGE</span><b>Custom Image</b><small>JPG, PNG, WebP or GIF · 10MB</small></div><div className="sv-upload-actions"><button className="sv-secondary" disabled={uploading} onClick={() => imageRef.current?.click()}><Upload size={15} />{uploading ? 'Uploading' : 'Choose'}</button>{state.customBackground && <button className="sv-icon-danger" onClick={() => { setCustomBackground(null); setBackgroundType('default'); }} aria-label="Remove image"><Trash2 size={15} /></button>}</div><input ref={imageRef} hidden type="file" accept="image/*" onChange={(e) => handleUpload(e, 'image')} /></div>
            <div className="sv-upload-box"><div><span>VIDEO</span><b>Custom Video</b><small>MP4, WebM or OGG · 50MB</small></div><div className="sv-upload-actions"><button className="sv-secondary" disabled={uploading} onClick={() => videoRef.current?.click()}><Upload size={15} />{uploading ? 'Uploading' : 'Choose'}</button>{state.backgroundVideo && <button className="sv-icon-danger" onClick={() => { setBackgroundVideo(null); setBackgroundType('default'); }} aria-label="Remove video"><Trash2 size={15} /></button>}</div><input ref={videoRef} hidden type="file" accept="video/*" onChange={(e) => handleUpload(e, 'video')} /></div>
          </div>
          <div className="sv-settings-block"><span className="sv-settings-label">Animated Presets</span><div className="sv-preset-grid">{BACKGROUNDS.map((bg) => { const selected = state.selectedBackgroundId === bg.id; return <button key={bg.id} className={selected ? 'is-selected' : ''} onClick={() => selectPreset(bg.id)} style={{ background: bg.css }}><span>{bg.name}</span>{selected && <b>✓</b>}</button>; })}</div></div>
          <div className="sv-controls"><div><span>Brightness <b>{state.backgroundBrightness}%</b></span><input aria-label="Background brightness" type="range" min={20} max={150} value={state.backgroundBrightness} onChange={(e) => setBackgroundBrightness(Number(e.target.value))} /></div><div><span>Blur <b>{state.backgroundBlur}px</b></span><input aria-label="Background blur" type="range" min={0} max={20} value={state.backgroundBlur} onChange={(e) => setBackgroundBlur(Number(e.target.value))} /></div><div><span>Dark Overlay <b>{state.backgroundDarken}%</b></span><input aria-label="Background overlay" type="range" min={0} max={90} value={state.backgroundDarken} onChange={(e) => setBackgroundDarken(Number(e.target.value))} /></div></div>
        </section>

        <section className="sv-settings-card">
          <div className="sv-settings-card__head"><div className="sv-settings-icon"><Volume2 size={18} /></div><div><span>AUDIO</span><h2>Sound</h2></div></div>
          <button className="sv-toggle-row" onClick={toggleSound}><span>{state.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound Effects</span><b className={state.soundEnabled ? 'on' : ''}>{state.soundEnabled ? 'ON' : 'OFF'}</b></button>
        </section>

        <section className="sv-settings-card">
          <div className="sv-settings-card__head"><div className="sv-settings-icon"><Shield size={18} /></div><div><span>DATA</span><h2>Cloud & Storage</h2></div></div>
          <div className="sv-action-grid"><button className="sv-secondary" onClick={() => syncLeaderboard()}><Cloud size={15} /> Sync Cloud</button><button className="sv-danger" onClick={() => setResetOpen(true)}><RotateCcw size={15} /> Reset Data</button></div>
        </section>

        <section className="sv-settings-card sv-settings-card--wide sv-settings-card--danger">
          <div className="sv-settings-card__head"><div className="sv-settings-icon"><LogOut size={18} /></div><div><span>SESSION</span><h2>Account Session</h2></div></div>
          <div className="sv-session-row"><div><b>Sign out of STRYVEN</b><span>Your cloud progress remains saved.</span></div><button className="sv-danger" onClick={() => setLogoutOpen(true)}><LogOut size={15} /> Sign Out</button></div>
        </section>
      </div>

      <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => { resetAll(); setResetOpen(false); toast({ title: 'All data reset', type: 'success' }); }} title="Reset All Data" message="This permanently erases your progress and history. This cannot be undone." confirmLabel="Reset Everything" danger />
      <ConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} onConfirm={signOutNow} title="Sign Out" message="Your progress is saved to the cloud." confirmLabel="Sign Out" />
    </div>
  );
}
