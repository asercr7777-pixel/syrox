import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Award, CalendarDays, CheckCircle2, Clock3, Crown, Dumbbell, Shield, Target, Trophy, Upload, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { getRankByXp, getNextRank } from '../data/ranks';
import { TITLES } from '../data/collections';
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
  const completedMissions=state.history.reduce((sum,day)=>sum+Object.values(day.coreCompleted).filter(Boolean).length,0);
  const completedActions=state.history.reduce((sum,day)=>sum+Object.values(day.customCompleted).filter(Boolean).length,0);
  const totalActions=state.customTasks.length+completedActions;
  const totalSessions=state.workoutSessions.length;
  const completedDays=state.history.filter(day=>day.allMainDone).length;
  const discipline=state.history.length ? Math.round((completedDays/state.history.length)*100) : 0;
  const consistency=state.history.length ? Math.min(100,Math.round((completedMissions+completedActions)/Math.max(1,state.history.length*5)*100)) : 0;
  const focus=totalActions ? Math.min(100,Math.round((completedActions/totalActions)*100)) : 0;
  const strength=Math.min(100,totalSessions*5);
  const accountAge=Math.max(1,Math.floor((Date.now()-state.createdAt)/86400000));
  const equippedTitle=TITLES.find(t=>t.id===state.equipped.title);
  const recentRecord=useMemo(()=>[
    ...state.history.slice(-8).reverse().map(day=>({date:day.date,label:day.allMainDone?'FULL SYSTEM CLEAR':'FIELD ACTIVITY',detail:day.xpGained+' XP EARNED'}))
  ],[state.history]);

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
        updateProfile({avatar:result.url});
      }else{
        const url=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});
        updateProfile({avatar:url});
      }
      toast({title:'Identity image updated',type:'success'});
    }catch(error){toast({title:'Upload failed',message:error instanceof Error?error.message:'Please try again.',type:'error'});}
    finally{setUploading(false);event.target.value='';}
  };

  return <div className="sv-identity-page">
    <header className="sv-identity-head">
      <div><span className="sv-eyebrow">HUNTER // IDENTITY RECORD</span><h1>Hunter Identity</h1><p>The record of what you have become through completed actions.</p></div>
      <div className="sv-identity-rank" style={{borderColor:rank.color+'66'}}><span>{rank.emoji}</span><b style={{color:rank.color}}>{rank.name}</b></div>
    </header>

    <section className="sv-identity-hero">
      <div className="sv-identity-portrait">
        <UserAvatar avatar={state.avatar} rank={rank} size="lg"/>
        <button onClick={()=>inputRef.current?.click()} disabled={uploading} aria-label="Upload identity image"><Upload size={15}/></button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleUpload} className="hidden"/>
      </div>
      <div className="sv-identity-main">
        <span>OPERATIVE</span>
        <h2 style={{color:state.nameColor}}>{state.username||'Hunter'}</h2>
        <div className="sv-title-line"><Crown size={14}/>{equippedTitle?.name || 'No Title Equipped'}</div>
        <div className="sv-identity-level"><b>LEVEL {state.level}</b><span>{state.xp.toLocaleString()} XP</span></div>
        <XpBar xp={state.xp}/>
        {nextRank&&<small>{Math.max(0,nextRank.xpRequired-state.xp).toLocaleString()} XP UNTIL {nextRank.name.toUpperCase()}</small>}
      </div>
      <div className="sv-identity-xp"><span>TOTAL XP</span><strong>{state.xp.toLocaleString()}</strong><small>RANK {rank.name.toUpperCase()}</small></div>
    </section>

    <section className="sv-attribute-grid">
      <Attribute icon={<Shield size={15}/>} name="DISCIPLINE" value={discipline}/>
      <Attribute icon={<Dumbbell size={15}/>} name="STRENGTH" value={strength}/>
      <Attribute icon={<Target size={15}/>} name="CONSISTENCY" value={consistency}/>
      <Attribute icon={<Zap size={15}/>} name="FOCUS" value={focus}/>
    </section>

    <section className="sv-identity-grid">
      <div className="sv-identity-panel sv-identity-panel--wide">
        <PanelHead icon={<Trophy size={17}/>} eyebrow="PROGRESSION" title="Core Record"/>
        <div className="sv-record-grid">
          <Record label="MISSIONS COMPLETED" value={String(completedMissions)}/>
          <Record label="ACTIONS COMPLETED" value={String(completedActions)}/>
          <Record label="TRAINING SESSIONS" value={String(totalSessions)}/>
          <Record label="TRAINING TIME" value={formatDuration(state.totalWorkoutSeconds)}/>
          <Record label="ACCOUNT AGE" value={accountAge+' DAYS'}/>
          <Record label="CURRENT LEVEL" value={String(state.level)}/>
        </div>
      </div>

      <div className="sv-identity-panel">
        <PanelHead icon={<Award size={17}/>} eyebrow="ACHIEVEMENTS" title="Hunter Feats"/>
        <div className="sv-feat-list">
          <Feat label="FIRST AWAKENING" unlocked={state.xp>0}/>
          <Feat label="FIRST TRAINING" unlocked={totalSessions>0}/>
          <Feat label="1,000 XP" unlocked={state.xp>=1000}/>
          <Feat label="5,000 XP" unlocked={state.xp>=5000}/>
          <Feat label="50 ACTIONS" unlocked={completedActions>=50}/>
        </div>
      </div>

      <div className="sv-identity-panel">
        <PanelHead icon={<Clock3 size={17}/>} eyebrow="FIELD RECORD" title="Recent Activity"/>
        <div className="sv-record-list">
          {recentRecord.length===0&&<div className="sv-empty-record">NO FIELD RECORD YET</div>}
          {recentRecord.map((item,index)=><div key={index}><span>{item.date}</span><b>{item.label}</b><small>{item.detail}</small></div>)}
        </div>
      </div>

      <div className="sv-identity-panel sv-identity-panel--wide">
        <PanelHead icon={<CheckCircle2 size={17}/>} eyebrow="IDENTITY DATA" title="System Facts"/>
        <div className="sv-facts">
          <Fact icon={<CalendarDays size={14}/>} label="ACCOUNT CREATED" value={new Date(state.createdAt).toLocaleDateString()}/>
          <Fact icon={<Target size={14}/>} label="CURRENT RANK" value={rank.name}/>
          <Fact icon={<Trophy size={14}/>} label="ACHIEVEMENTS" value={String(state.achievements.length)}/>
          <Fact icon={<Zap size={14}/>} label="TODAY XP" value={'+'+state.dailyXp}/>
        </div>
      </div>
    </section>
  </div>;
}

function Attribute({icon,name,value}:{icon:ReactNode;name:string;value:number}){
  return <div className="sv-attribute"><div>{icon}</div><span>{name}</span><strong>{value}</strong><i><b style={{width:value+'%'}}/></i></div>;
}
function PanelHead({icon,eyebrow,title}:{icon:React.ReactNode;eyebrow:string;title:string}){
  return <div className="sv-panel-head"><div>{icon}</div><span>{eyebrow}</span><h2>{title}</h2></div>;
}
function Record({label,value}:{label:string;value:string}){return <div className="sv-record"><span>{label}</span><strong>{value}</strong></div>;}
function Feat({label,unlocked}:{label:string;unlocked:boolean}){return <div className={unlocked?'is-unlocked':''}><span>{unlocked?'◆':'◇'}</span><b>{label}</b><small>{unlocked?'UNLOCKED':'LOCKED'}</small></div>;}
function Fact({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div><span>{icon}</span><label>{label}</label><b>{value}</b></div>;}