import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Award, CalendarDays, CheckCircle2, Clock3, Crown, Dumbbell, ImageUp, Shield, Target, Trophy, Upload, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { getRankByXp, getNextRank } from '../data/ranks';
import { AURAS, TITLES, WEAPONS } from '../data/collections';
import { XpBar } from '../components/ui/XpBar';
import { UserAvatar } from '../components/ui/UserAvatar';
import { uploadBackground } from '../lib/backgroundUpload';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

const formatDuration = (seconds:number) => {
  const safe=Math.max(0,Math.floor(seconds));
  const hours=Math.floor(safe/3600);
  const minutes=Math.floor((safe%3600)/60);
  return hours ? hours+'h '+minutes+'m' : minutes+'m';
};

export function Profile() {
  const { state, updateProfile } = useStore();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading,setUploading]=useState(false);
  const rank=getRankByXp(state.xp);
  const nextRank=getNextRank(state.xp);
  const completedMissions=state.history.reduce((sum,day)=>sum+Object.values(day.coreCompleted).filter(Boolean).length+Object.values(day.customCompleted).filter(Boolean).length,0);
  const completedDays=state.history.filter(day=>day.allMainDone).length;
  const disciplineAverage=state.history.length ? Math.round(state.history.reduce((sum,day)=>sum+day.disciplineScore,0)/state.history.length) : null;
  const equippedTitle=TITLES.find(item=>item.id===state.equipped.title);
  const equippedAura=AURAS.find(item=>item.id===state.equipped.aura);
  const equippedWeapon=WEAPONS.find(item=>item.id===state.equipped.weapon);
  const recentRecord=useMemo(()=>[...state.history].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7),[state.history]);

  const handleUpload=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0]; if(!file)return;
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>2*1024*1024){
      toast({title:'Invalid profile image',message:'Use JPG, PNG, WebP or GIF up to 2MB.',type:'error'});event.target.value='';return;
    }
    setUploading(true);
    try{
      if(user&&isSupabaseConfigured()){
        const result=await uploadBackground(user.id,file,'image');
        if(result.error||!result.url)throw new Error(result.error||'Upload failed');
        // Avatar URL is stored in the account state, not in an untrusted client-only field.
        updateProfile({avatar:result.url});
      }else{
        const url=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});
        updateProfile({avatar:url});
      }
      toast({title:'Identity image updated',type:'success'});
    }catch(error){toast({title:'Upload failed',message:error instanceof Error?error.message:'Please try again.',type:'error'});}
    finally{setUploading(false);event.target.value='';}
  };

  return <div className="sv-profile-page">
    <header className="sv-identity-head">
      <div><span className="sv-eyebrow">STRYVEN // HUNTER RECORD</span><h1>Hunter Profile</h1><p>Your identity, progression, and recorded history in one place.</p></div>
      <div className="sv-identity-rank" style={{borderColor:rank.color+'66'}}><span>{rank.emoji}</span><b style={{color:rank.color}}>{rank.name}</b></div>
    </header>

    <section className="sv-profile-hero sv-surface">
      <div className="sv-profile-avatar"><UserAvatar avatar={state.avatar} rank={rank} size="lg"/><button type="button" onClick={()=>inputRef.current?.click()} disabled={uploading} aria-label="Upload profile image"><Upload size={15}/></button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleUpload} hidden/></div>
      <div className="sv-profile-identity"><span className="sv-eyebrow">OPERATIVE IDENTITY</span><h2 style={{color:state.nameColor}}>{state.username||'Hunter'}</h2><div className="sv-profile-title"><Crown size={14}/>{equippedTitle?.name || 'No title equipped'}</div><p>{user?.email || 'Account email unavailable'}</p><div className="sv-profile-level"><b>LEVEL {state.level}</b><span>{state.xp.toLocaleString()} TOTAL XP</span></div><XpBar xp={state.xp}/><small>{nextRank ? `${Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()} XP TO ${nextRank.name.toUpperCase()}` : 'MAXIMUM RANK REACHED'}</small></div>
      <div className="sv-profile-upload-note"><ImageUp size={18}/><b>{uploading?'Uploading identity…':'Customize your identity'}</b><span>Use the image control to change your profile portrait.</span></div>
    </section>

    <section className="sv-profile-stat-grid">
      <ProfileStat icon={<Zap size={17}/>} label="TOTAL XP" value={state.xp.toLocaleString()} detail="Current saved total"/>
      <ProfileStat icon={<Target size={17}/>} label="MISSIONS COMPLETED" value={String(completedMissions)} detail="From saved daily history"/>
      <ProfileStat icon={<Dumbbell size={17}/>} label="TRAINING SESSIONS" value={String(state.workoutSessions.length)} detail={formatDuration(state.totalWorkoutSeconds)+' logged'}/>
      <ProfileStat icon={<Shield size={17}/>} label="CURRENT STREAK" value={`${state.streak} days`} detail={`Best: ${state.bestStreak} days`}/>
    </section>

    <div className="sv-profile-grid">
      <section className="sv-section sv-surface">
        <div className="sv-section-head"><div><span className="sv-eyebrow">01 // ATTRIBUTE REGISTER</span><h2>Tracked Attributes</h2><p>Unmeasured attributes are labelled rather than assigned invented scores.</p></div><Target size={18}/></div>
        <div className="sv-profile-attribute-grid">
          <ProfileAttribute label="STRENGTH" value={`${state.workoutSessions.length} sessions`} note="Logged training"/>
          <ProfileAttribute label="ENDURANCE" value={formatDuration(state.totalWorkoutSeconds)} note="Logged training time"/>
          <ProfileAttribute label="MOBILITY" value="Not tracked" note="No saved metric"/>
          <ProfileAttribute label="FLEXIBILITY" value="Not tracked" note="No saved metric"/>
          <ProfileAttribute label="DISCIPLINE" value={disciplineAverage===null?'Not tracked':`${disciplineAverage}% average`} note={`${state.history.length} recorded days`}/>
          <ProfileAttribute label="FOCUS" value="Not tracked" note="No saved metric"/>
          <ProfileAttribute label="LEARNING" value="Not tracked" note="No saved metric"/>
          <ProfileAttribute label="CONSISTENCY" value={`${state.streak}-day streak`} note="Current streak"/>
        </div>
      </section>

      <section className="sv-section sv-surface">
        <div className="sv-section-head"><div><span className="sv-eyebrow">02 // EQUIPMENT RECORD</span><h2>Active Loadout</h2><p>Selections currently saved to your profile.</p></div><Shield size={18}/></div>
        <div className="sv-profile-loadout">
          <LoadoutItem label="TITLE" value={equippedTitle?.name}/>
          <LoadoutItem label="AURA" value={equippedAura?.name}/>
          <LoadoutItem label="WEAPON" value={equippedWeapon?.name}/>
          <LoadoutItem label="SHIELD" value={state.equipped.shield || undefined}/>
        </div>
        <div className="sv-profile-loadout-counts"><span>{state.inventory.length} collected items</span><span>{state.achievements.length} saved achievements</span></div>
      </section>
    </div>

    <section className="sv-section sv-surface">
      <div className="sv-section-head"><div><span className="sv-eyebrow">03 // PROGRESSION LOG</span><h2>Recent Daily Records</h2><p>Only saved history entries appear here.</p></div><CalendarDays size={18}/></div>
      {recentRecord.length ? <div className="sv-profile-history">{recentRecord.map(day=><article key={day.date}><div className="sv-profile-history-icon">{day.allMainDone?<CheckCircle2 size={17}/>:<Clock3 size={17}/>}</div><div><b>{day.date}</b><span>{day.allMainDone?'All main missions complete':'Recorded activity'}</span></div><strong>+{day.xpGained} XP</strong></article>)}</div> : <div className="sv-empty-record">NO SAVED DAILY RECORDS YET.</div>}
    </section>

    <section className="sv-section sv-surface">
      <div className="sv-section-head"><div><span className="sv-eyebrow">04 // HONORS</span><h2>Achievement Collection</h2><p>Previously earned records remain preserved.</p></div><Trophy size={18}/></div>
      {state.achievements.length ? <div className="sv-earned-list">{[...state.achievements].sort((a,b)=>b.unlockedAt-a.unlockedAt).slice(0,8).map(item=><div key={item.id}><Award size={17}/><b>{item.id.replace(/[_-]/g,' ')}</b><small>{new Date(item.unlockedAt).toLocaleDateString()}</small></div>)}</div> : <div className="sv-empty-record">YOUR FIRST ACHIEVEMENT WILL APPEAR HERE WHEN RECORDED.</div>}
      <div className="sv-profile-footer-facts"><div><small>ACCOUNT CREATED</small><b>{new Date(state.createdAt).toLocaleDateString()}</b></div><div><small>FULL-CLEAR DAYS</small><b>{completedDays}</b></div><div><small>RANK</small><b>{rank.name}</b></div></div>
    </section>
  </div>;
}
function ProfileStat({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) {
  return <article className="sv-dashboard-stat"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}
function ProfileAttribute({label,value,note}:{label:string;value:string;note:string}) {
  return <div className="sv-dashboard-attribute"><small>{label}</small><b>{value}</b><span>{note}</span></div>;
}
function LoadoutItem({label,value}:{label:string;value?:string}) {
  return <div><small>{label}</small><b>{value || 'Not equipped'}</b></div>;
}
