import { LayoutDashboard, Dumbbell, UserRound, Settings, LogOut, Target, Activity, Award, Ghost } from 'lucide-react';
import { useState } from 'react';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId='dashboard'|'missions'|'workout'|'analytics'|'achievements'|'shadows'|'profile'|'settings';
interface NavItem{id:ViewId;label:string;shortLabel:string;icon:typeof LayoutDashboard}
const NAV_ITEMS:NavItem[]=[
 {id:'dashboard',label:'Dashboard',shortLabel:'Home',icon:LayoutDashboard},
 {id:'missions',label:'Missions',shortLabel:'Missions',icon:Target},
 {id:'workout',label:'Training',shortLabel:'Training',icon:Dumbbell},
 {id:'analytics',label:'Progress & Analytics',shortLabel:'Progress',icon:Activity},
 {id:'achievements',label:'Achievements',shortLabel:'Awards',icon:Award},
 {id:'shadows',label:'Story',shortLabel:'Story',icon:Ghost},
 {id:'profile',label:'Hunter Profile',shortLabel:'Profile',icon:UserRound},
 {id:'settings',label:'Settings',shortLabel:'Settings',icon:Settings},
];
const MOBILE_PRIMARY=new Set<ViewId>(['dashboard','missions','workout','profile']);
interface NavigationProps{current:ViewId;onNavigate:(v:ViewId)=>void}

export function Navigation({current,onNavigate}:NavigationProps){
 const {signOut}=useAuth(); const [moreOpen,setMoreOpen]=useState(false);
 const handleNav=(v:ViewId)=>{playSound('click');onNavigate(v);setMoreOpen(false)};
 const handleSignOut=async()=>{playSound('click');await signOut()};
 const brand=<div className="stryven-brand select-none" aria-label="STRYVEN"><span>STRYVEN</span><i aria-hidden="true"/></div>;
 return <>
  <header className="stryven-desktop-nav" aria-label="STRYVEN navigation">
   <div className="stryven-desktop-brand">{brand}<span className="stryven-desktop-edition">SYSTEM / 01</span></div>
   <nav className="stryven-desktop-links" aria-label="Main navigation">
    {NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} title={item.label} className={'stryven-desktop-link '+(active?'is-active':'')}><span className="stryven-desktop-link-index">{String(index+1).padStart(2,'0')}</span><Icon size={16}/><span>{item.shortLabel}</span></button>})}
   </nav>
   <div className="stryven-desktop-end"><span className="stryven-desktop-online"><i/>ONLINE</span><button className="stryven-desktop-signout" onClick={handleSignOut} aria-label="Sign out" title="Sign out"><LogOut size={17}/></button></div>
  </header>
  <header className="stryven-mobile-header">{brand}<button className="stryven-mobile-more" onClick={()=>setMoreOpen(v=>!v)} aria-label={moreOpen?'Close navigation':'Open navigation'} aria-expanded={moreOpen}>{moreOpen?'×':'☰'}</button></header>
  {moreOpen&&<div className="stryven-mobile-sheet" role="dialog" aria-modal="true" aria-label="Navigation menu"><button className="stryven-sheet-backdrop" aria-label="Close navigation" onClick={()=>setMoreOpen(false)}/><div className="stryven-mobile-sheet-inner"><div className="stryven-mobile-sheet-handle"/><div className="stryven-mobile-sheet-title">STRYVEN / NAVIGATION</div>{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;return <button key={item.id} className={`stryven-sheet-item ${current===item.id?'is-active':''}`} aria-current={current===item.id?'page':undefined} onClick={()=>handleNav(item.id)}><b>{String(index+1).padStart(2,'0')}</b><Icon size={19}/><span>{item.label}</span></button>})}<button className="stryven-sheet-item is-danger" onClick={handleSignOut}><LogOut size={19}/><span>Sign out</span></button></div></div>}
  <nav className="stryven-bottomnav" aria-label="Mobile primary navigation">{NAV_ITEMS.filter(item=>MOBILE_PRIMARY.has(item.id)).map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={`stryven-bottomnav-item ${active?'is-active':''}`}><span className="stryven-nav-index">0{index+1}</span><Icon size={19}/><span>{item.shortLabel}</span></button>})}<button className="stryven-bottomnav-item" onClick={()=>setMoreOpen(true)} aria-label="Open all pages"><span className="stryven-nav-index">05</span><Settings size={19}/><span>More</span></button></nav>
 </>;
}