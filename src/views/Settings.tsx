import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { ConfirmModal } from '../components/ui/Modal';
import { BACKGROUNDS, AURAS } from '../data/collections';
import { getRankByXp } from '../data/ranks';
import { RankBadge } from '../components/ui/RankBadge';
import { Upload, Trash2, Volume2, VolumeX, Palette, User as UserIcon, Image as ImageIcon, Video, Sparkles, LogOut, Moon, Shield, Eye } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { playSound } from '../lib/sound';
import { uploadBackground } from '../lib/backgroundUpload';

const AVATARS = ['🐺','😈','👑','🔥','⚡','🌑','🗡️','🛡️','⚔️','🐉','👻','🦅','🦁','🐍','🦊','🐲','💀','🤴','🥷','🧙'];
const NAME_COLORS = ['#fbbf24','#ff7a18','#a855f7','#06b6d4','#10b981','#f43f5e','#3b82f6','#ec4899'];
const BANNER_COLORS = ['#1e1b4b','#7f1d1d','#0c4a6e','#14532d','#78350f','#4c1d95','#0f172a','#831843'];
type BgType = 'default' | 'image' | 'video' | 'animated';
const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4','video/webm','video/ogg'];

export function Settings() {
  const { state, updateProfile, setCustomBackground, setBackgroundVideo, setBackgroundType, setBackgroundBlur, setBackgroundDarken, setBackgroundBrightness, setSelectedBackground, toggleSound, resetAll, syncLeaderboard } = useStore();
  const { signOut, user } = useAuth();
  const [resetOpen,setResetOpen]=useState(false); const [logoutOpen,setLogoutOpen]=useState(false); const [uploading,setUploading]=useState(false);
  const imageRef=useRef<HTMLInputElement>(null); const videoRef=useRef<HTMLInputElement>(null); const mounted=useRef(true);
  useEffect(()=>()=>{mounted.current=false},[]);
  const rank=getRankByXp(state.xp); const aura=state.equipped.aura ? AURAS.find(a=>a.id===state.equipped.aura) : null;

  const handleUpload=async(e:React.ChangeEvent<HTMLInputElement>,kind:'image'|'video')=>{
    const file=e.target.files?.[0]; if(!file)return;
    const max=kind==='image'?10:50;
    const allowed=kind==='image'?ALLOWED_IMAGE_TYPES:ALLOWED_VIDEO_TYPES;
    if(file.size>max*1024*1024){toast({title:'File too large',message:`Maximum ${max}MB.`,type:'error'});e.target.value='';return;}
    if(!allowed.includes(file.type)){toast({title:'Invalid file type',message:kind==='image'?'Use JPG, PNG, WebP, or GIF.':'Use MP4, WebM, or OGG.',type:'error'});e.target.value='';return;}
    setUploading(true);
    try{
      if(user){const {url,error}=await uploadBackground(user.id,file,kind);if(error||!url)throw new Error(error||'Upload failed');if(!mounted.current)return;kind==='image'?setCustomBackground(url):setBackgroundVideo(url);setBackgroundType(kind);}
      else{const reader=new FileReader();reader.onload=()=>{if(!mounted.current)return;kind==='image'?setCustomBackground(reader.result as string):setBackgroundVideo(reader.result as string);setBackgroundType(kind)};reader.readAsDataURL(file);}
      toast({title:`${kind==='image'?'Image':'Video'} background applied`,type:'success'});
    }catch(err){toast({title:'Upload failed',message:err instanceof Error?err.message:'Unknown error',type:'error'});}finally{if(mounted.current)setUploading(false);e.target.value='';}
  };
  const preset=(id:string)=>{const selected=state.selectedBackgroundId===id;setSelectedBackground(selected?null:id);setBackgroundType(selected?'default':'animated');setCustomBackground(null);setBackgroundVideo(null);};
  const signOutNow=async()=>{playSound('click');await signOut();};

  return <div className="space-y-6">
    <header><h1 className="section-title">Settings</h1><p className="text-sm text-ink-300">Tune your hunter, visuals, audio, and data.</p></header>
    <section className="card p-5"><h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><UserIcon size={18}/> Account</h2><div className="space-y-4">
      <div><label className="label">Username</label><input className="input mt-1" value={state.username} maxLength={20} onChange={e=>updateProfile({username:e.target.value})}/></div>
      <div><label className="label">Avatar</label><div className="flex flex-wrap gap-2 mt-2">{AVATARS.map(a=><button key={a} onClick={()=>{updateProfile({avatar:a});playSound('click')}} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border ${state.avatar===a?'bg-ember-500/30 border-ember-500':'bg-ink-950/60 border-white/5'}`}>{a}</button>)}</div></div>
      <div><label className="label">Name Color</label><div className="flex flex-wrap gap-2 mt-2">{NAME_COLORS.map(c=><button key={c} aria-label={`Name color ${c}`} onClick={()=>updateProfile({nameColor:c})} className={`w-8 h-8 rounded-lg ${state.nameColor===c?'ring-2 ring-white ring-offset-2 ring-offset-ink-900':''}`} style={{background:c}}/>)}</div></div>
      <div><label className="label">Banner Color</label><div className="flex flex-wrap gap-2 mt-2">{BANNER_COLORS.map(c=><button key={c} aria-label={`Banner color ${c}`} onClick={()=>updateProfile({bannerColor:c})} className={`w-8 h-8 rounded-lg ${state.bannerColor===c?'ring-2 ring-white ring-offset-2 ring-offset-ink-900':''}`} style={{background:c}}/>)}</div></div>
    </div></section>
    <section className="card p-5"><h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Palette size={18}/> Appearance</h2><div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5"><span className="flex items-center gap-2"><Moon size={18}/><span>Theme</span></span><span className="chip bg-ink-800 text-ink-200 capitalize">{state.theme}</span></div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5"><span className="flex items-center gap-2"><Eye size={18}/><span>Current Rank</span></span><div className="flex items-center gap-2"><span className="text-sm" style={{color:rank.color}}>{rank.name}</span><RankBadge rank={rank} size="sm" auraColor={aura?.color}/></div></div>
    </div></section>
    <section className="card p-5"><h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon size={18}/> Background</h2><div className="space-y-4">
      <div><label className="label">Background Type</label><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">{([{id:'default',label:'Default',icon:Moon},{id:'image',label:'Image',icon:ImageIcon},{id:'video',label:'Video',icon:Video},{id:'animated',label:'Animated',icon:Sparkles}] as const).map(o=>{const I=o.icon;return <button key={o.id} onClick={()=>setBackgroundType(o.id)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${state.backgroundType===o.id?'bg-ember-500/20 border-ember-500/50 text-ember-400':'bg-ink-950/60 border-white/5'}`}><I size={18}/><span className="text-xs font-medium">{o.label}</span></button>})}</div></div>
      <div><label className="label">Upload Image</label><div className="flex gap-2 mt-2"><button onClick={()=>imageRef.current?.click()} disabled={uploading} className="btn-ghost flex-1"><Upload size={16}/> {uploading?'Uploading...':'Choose Image'}</button>{state.customBackground&&<button onClick={()=>{setCustomBackground(null);setBackgroundType('default')}} className="btn-ghost text-danger-400"><Trash2 size={16}/></button>}<input ref={imageRef} type="file" accept="image/*" onChange={e=>handleUpload(e,'image')} className="hidden"/></div><p className="text-xs text-ink-400 mt-1">Max 10MB.</p></div>
      <div><label className="label">Upload Video</label><div className="flex gap-2 mt-2"><button onClick={()=>videoRef.current?.click()} disabled={uploading} className="btn-ghost flex-1"><Upload size={16}/> {uploading?'Uploading...':'Choose Video'}</button>{state.backgroundVideo&&<button onClick={()=>{setBackgroundVideo(null);setBackgroundType('default')}} className="btn-ghost text-danger-400"><Trash2 size={16}/></button>}<input ref={videoRef} type="file" accept="video/*" onChange={e=>handleUpload(e,'video')} className="hidden"/></div><p className="text-xs text-ink-400 mt-1">Max 50MB.</p></div>
      <div><label className="label">Animated Presets</label><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-2">{BACKGROUNDS.map(bg=>{const selected=state.selectedBackgroundId===bg.id;return <button key={bg.id} onClick={()=>preset(bg.id)} className={`aspect-video rounded-lg border-2 relative overflow-hidden ${selected?'border-ember-500':'border-white/5'}`} style={{background:bg.css}}><span className="absolute bottom-1 left-1.5 text-xs font-medium bg-black/50 px-1.5 py-0.5 rounded">{bg.name}</span>{selected&&<span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ember-500 flex items-center justify-center text-xs">✓</span>}</button>})}</div></div>
      <div className="space-y-3"><label className="label">Visual Controls</label><div><label className="text-xs text-ink-300">Brightness: {state.backgroundBrightness}%</label><input aria-label="Background brightness" type="range" min={20} max={150} value={state.backgroundBrightness} onChange={e=>setBackgroundBrightness(Number(e.target.value))} className="w-full"/></div><div><label className="text-xs text-ink-300">Blur: {state.backgroundBlur}px</label><input aria-label="Background blur" type="range" min={0} max={20} value={state.backgroundBlur} onChange={e=>setBackgroundBlur(Number(e.target.value))} className="w-full"/></div><div><label className="text-xs text-ink-300">Dark Overlay: {state.backgroundDarken}%</label><input aria-label="Background overlay" type="range" min={0} max={90} value={state.backgroundDarken} onChange={e=>setBackgroundDarken(Number(e.target.value))} className="w-full"/></div></div>
    </div></section>
    <section className="card p-5"><h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Volume2 size={18}/> Audio</h2><button onClick={toggleSound} className="w-full flex items-center justify-between p-3 rounded-xl bg-ink-950/40 border border-white/5"><span className="flex items-center gap-2">{state.soundEnabled?<Volume2 size={18}/>:<VolumeX size={18}/>} Sound Effects</span><span className="chip">{state.soundEnabled?'ON':'OFF'}</span></button></section>
    <section className="card p-5"><h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Shield size={18}/> Data</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><button onClick={()=>syncLeaderboard()} className="btn-ghost text-sm"><Upload size={14}/> Sync Cloud</button><button onClick={()=>setResetOpen(true)} className="btn-danger text-sm"><Trash2 size={14}/> Reset Data</button></div></section>
    <section className="card p-5"><h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><LogOut size={18}/> Session</h2><button onClick={()=>setLogoutOpen(true)} className="btn-ghost w-full text-danger-400"><LogOut size={16}/> Sign Out</button></section>
    <ConfirmModal open={resetOpen} onClose={()=>setResetOpen(false)} onConfirm={()=>{resetAll();setResetOpen(false);toast({title:'All data reset',type:'success'})}} title="Reset All Data" message="This permanently erases your progress and history. This cannot be undone." confirmLabel="Reset Everything" danger/>
    <ConfirmModal open={logoutOpen} onClose={()=>setLogoutOpen(false)} onConfirm={signOutNow} title="Sign Out" message="Your progress is saved to the cloud." confirmLabel="Sign Out"/>
  </div>;
}
