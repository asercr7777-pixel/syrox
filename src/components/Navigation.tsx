import { LayoutDashboard, Dumbbell, UserRound, Settings2, LogOut } from 'lucide-react';
import { useState } from 'react';
import { playSound } from '../lib/sound';
import { useAuth } from '../lib/auth';

export type ViewId = 'dashboard' | 'workout' | 'profile' | 'settings';
interface NavItem { id: ViewId; label: string; icon: typeof LayoutDashboard; }
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Command', icon: LayoutDashboard },
  { id: 'workout', label: 'Training', icon: Dumbbell },
  { id: 'profile', label: 'Identity', icon: UserRound },
  { id: 'settings', label: 'Config', icon: Settings2 },
];
interface NavigationProps { current: ViewId; onNavigate: (v: ViewId) => void; }

export function Navigation({ current, onNavigate }: NavigationProps){
  const { signOut }=useAuth(); const [moreOpen,setMoreOpen]=useState(false);
  const handleNav=(v:ViewId)=>{playSound('click');onNavigate(v);setMoreOpen(false)};
  const handleSignOut=async()=>{playSound('click');await signOut()};
  const brand=<div className="stryven-brand select-none" aria-label="STRYVEN"><span>STRYVEN</span><i aria-hidden="true"/></div>;
  return <>
    <header className="stryven-topbar"><div className="stryven-topbar-brand">{brand}<small>PERSONAL EVOLUTION SYSTEM</small></div><nav className="stryven-topnav" aria-label="Primary navigation">{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={'stryven-topnav-item '+(active?'is-active':'')}><span className="stryven-nav-index">{String(index+1).padStart(2,'0')}</span><Icon size={16}/><span>{item.label}</span></button>})}</nav><div className="stryven-topbar-end"><span className="stryven-live">SYSTEM ONLINE</span><button className="stryven-signout" onClick={handleSignOut} aria-label="Sign out"><LogOut size={16}/></button></div></header>
    <div className="stryven-mobile-header">{brand}<button className="stryven-mobile-more" onClick={()=>setMoreOpen(v=>!v)} aria-label={moreOpen?'Close navigation':'Open navigation'} aria-expanded={moreOpen}>{moreOpen?'×':'☰'}</button></div>
    {moreOpen&&<div className="stryven-mobile-sheet" role="dialog" aria-modal="true" aria-label="Navigation menu"><button className="stryven-sheet-backdrop" aria-label="Close navigation" onClick={()=>setMoreOpen(false)}/><div className="stryven-mobile-sheet-inner"><div className="stryven-mobile-sheet-handle"/><div className="stryven-mobile-sheet-title">SYSTEM NAVIGATION</div>{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;return <button key={item.id} className={`stryven-sheet-item ${current===item.id?'is-active':''}`} aria-current={current===item.id?'page':undefined} onClick={()=>handleNav(item.id)}><b>{String(index+1).padStart(2,'0')}</b><Icon size={19}/><span>{item.label}</span></button>})}<button className="stryven-sheet-item is-danger" onClick={handleSignOut}><LogOut size={19}/><span>Terminate session</span></button></div></div>}
    <nav className="stryven-bottomnav" aria-label="Mobile navigation">{NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=current===item.id;return <button key={item.id} onClick={()=>handleNav(item.id)} aria-current={active?'page':undefined} className={`stryven-bottomnav-item ${active?'is-active':''}`}><span className="stryven-nav-index">{String(index+1).padStart(2,'0')}</span><Icon size={19}/><span>{item.label}</span></button>})}</nav>
  </>;
}
