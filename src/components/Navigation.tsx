import { LayoutDashboard, Dumbbell, UserRound, Settings, LogOut, Target, Activity, Award, Ghost, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId='dashboard'|'missions'|'workout'|'analytics'|'achievements'|'shadows'|'profile'|'settings';
interface NavItem{id:ViewId;label:string;icon:typeof LayoutDashboard}
const NAV_ITEMS:NavItem[]=[
 {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},
 {id:'missions',label:'Missions',icon:Target},
 {id:'workout',label:'Training',icon:Dumbbell},
 {id:'analytics',label:'Progress & Analytics',icon:Activity},
 {id:'achievements',label:'Achievements',icon:Award},
 {id:'shadows',label:'Shadow Army',icon:Ghost},
 {id:'profile',label:'Hunter Profile',icon:UserRound},
 {id:'settings',label:'Settings',icon:Settings},
];
const MOBILE_PRIMARY=new Set<ViewId>(['dashboard','missions','workout','profile']);
interface NavigationProps{current:ViewId;onNavigate:(v:ViewId)=>void}

export function Navigation({current,onNavigate}:NavigationProps){
 const {signOut}=useAuth(); const [moreOpen,setMoreOpen]=useState(false); const [collapsed,setCollapsed]=useState(false);
 const handleNav=(v:ViewId)=>{playSound('click');onNavigate(v);setMoreOpen(false)};
 const handleSignOut=async()=>{playSound('click');await signOut()};
 const brand=<div className="stryven-brand select-none" aria-label="STRYVEN"><span>STRYVEN</span><i aria-hidden="true"/></div>;
 return <>
  <aside className={`stryven-system-rail ${collapsed?'is-collapsed':''}`} aria-label="STRYVEN system navigation">
   <div className="stryven-rail-brand">{brand}<small>SYS / 01</small><button className="stryven-rail-collapse" onClick={()=>setCollapsed(value=>!value)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} title={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button></div>
   <div className="stryven-rail-status"><i/>ONLINE<span>CORE</span></div>
   <nav className="stryven-rail-nav">
    {NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={'stryven-rail-item '+(active?'is-active':'')}><span className="stryven-rail-index">{String(index+1).padStart(2,'0')}</span><span className="stryven-rail-icon"><Icon size={18}/></span><span className="stryven-rail-label">{item.label}</span></button>})}
   </nav>
   <div className="stryven-rail-footer"><div className="stryven-rail-system"><span>SYSTEM</span><b>STRYVEN / 03</b></div><div className="stryven-rail-rule"/><button className="stryven-rail-signout" onClick={handleSignOut}><LogOut size={16}/><span>Sign out</span></button></div>
  </aside>
  <header className="stryven-mobile-header">{brand}<button className="stryven-mobile-more" onClick={()=>setMoreOpen(v=>!v)} aria-label={moreOpen?'Close navigation':'Open navigation'} aria-expanded={moreOpen}>{moreOpen?'×':'☰'}</button></header>
  {moreOpen&&<div className="stryven-mobile-sheet" role="dialog" aria-modal="true" aria-label="Navigation menu"><button className="stryven-sheet-backdrop" aria-label="Close navigation" onClick={()=>setMoreOpen(false)}/><div className="stryven-mobile-sheet-inner"><div className="stryven-mobile-sheet-handle"/><div className="stryven-mobile-sheet-title">STRYVEN / NAVIGATION</div>{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;return <button key={item.id} className={`stryven-sheet-item ${current===item.id?'is-active':''}`} aria-current={current===item.id?'page':undefined} onClick={()=>handleNav(item.id)}><b>{String(index+1).padStart(2,'0')}</b><Icon size={19}/><span>{item.label}</span></button>})}<button className="stryven-sheet-item is-danger" onClick={handleSignOut}><LogOut size={19}/><span>Sign out</span></button></div></div>}
  <nav className="stryven-bottomnav" aria-label="Mobile primary navigation">{NAV_ITEMS.filter(item=>MOBILE_PRIMARY.has(item.id)).map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={`stryven-bottomnav-item ${active?'is-active':''}`}><span className="stryven-nav-index">0{index+1}</span><Icon size={19}/><span>{item.label}</span></button>})}<button className="stryven-bottomnav-item" onClick={()=>setMoreOpen(true)} aria-label="Open all pages"><span className="stryven-nav-index">05</span><Settings size={19}/><span>More</span></button></nav>
 </>;
}