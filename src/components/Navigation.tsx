import { LayoutDashboard, Dumbbell, UserRound, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId='dashboard'|'workout'|'profile'|'settings';
interface NavItem{id:ViewId;label:string;icon:typeof LayoutDashboard}
const NAV_ITEMS:NavItem[]=[{id:'dashboard',label:'Command',icon:LayoutDashboard},{id:'workout',label:'Training',icon:Dumbbell},{id:'profile',label:'Identity',icon:UserRound},{id:'settings',label:'Config',icon:Settings}];
interface NavigationProps{current:ViewId;onNavigate:(v:ViewId)=>void}

export function Navigation({current,onNavigate}:NavigationProps){
 const {signOut}=useAuth(); const [moreOpen,setMoreOpen]=useState(false);
 const handleNav=(v:ViewId)=>{playSound('click');onNavigate(v);setMoreOpen(false)};
 const handleSignOut=async()=>{playSound('click');await signOut()};
 const brand=<div className="stryven-brand select-none" aria-label="STRYVEN"><span>STRYVEN</span><i aria-hidden="true"/></div>;
 return <>
  <aside className="stryven-system-rail" aria-label="STRYVEN system navigation">
   <div className="stryven-rail-brand">{brand}<small>SYS / 01</small></div>
   <div className="stryven-rail-status"><i/>ONLINE</div>
   <nav className="stryven-rail-nav">
    {NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={'stryven-rail-item '+(active?'is-active':'')}><span className="stryven-rail-index">0{index+1}</span><span className="stryven-rail-icon"><Icon size={18}/></span><span className="stryven-rail-label">{item.label}</span></button>})}
   </nav>
   <div className="stryven-rail-footer"><div className="stryven-rail-rule"/><button className="stryven-rail-signout" onClick={handleSignOut}><LogOut size={16}/><span>Terminate</span></button></div>
  </aside>
  <header className="stryven-mobile-header">{brand}<button className="stryven-mobile-more" onClick={()=>setMoreOpen(v=>!v)} aria-label={moreOpen?'Close navigation':'Open navigation'} aria-expanded={moreOpen}>{moreOpen?'×':'☰'}</button></header>
  {moreOpen&&<div className="stryven-mobile-sheet" role="dialog" aria-modal="true" aria-label="Navigation menu"><button className="stryven-sheet-backdrop" aria-label="Close navigation" onClick={()=>setMoreOpen(false)}/><div className="stryven-mobile-sheet-inner"><div className="stryven-mobile-sheet-handle"/><div className="stryven-mobile-sheet-title">SYSTEM / NAVIGATION</div>{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;return <button key={item.id} className={`stryven-sheet-item ${current===item.id?'is-active':''}`} aria-current={current===item.id?'page':undefined} onClick={()=>handleNav(item.id)}><b>0{index+1}</b><Icon size={19}/><span>{item.label}</span></button>})}<button className="stryven-sheet-item is-danger" onClick={handleSignOut}><LogOut size={19}/><span>Terminate session</span></button></div></div>}
  <nav className="stryven-bottomnav" aria-label="Mobile navigation">{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={`stryven-bottomnav-item ${active?'is-active':''}`}><span className="stryven-nav-index">0{index+1}</span><Icon size={19}/><span>{item.label}</span></button>})}</nav>
 </>;
}