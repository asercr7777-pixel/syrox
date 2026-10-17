import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation, type ViewId } from './components/Navigation';
import { Background } from './components/Background';
import { ToastContainer } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './lib/auth';
import { useStore } from './store/useStore';
import { syncSoundFlag } from './lib/sound';
import { ensureStoryReset } from './lib/story/storyReset';
import { usePWA } from './hooks/usePWA';
import { InstallButton } from './components/pwa/InstallButton';
import { Loader2 } from 'lucide-react';
import './theme.css';
import './theme-overrides.css';
import './theme-identities.css';
import './theme-motion.css';
import './stryven-ui-system.css';
import './solo-system-v3.css';
import './stryven-training-system.css';
import './stryven-redesign.css';
import './stryven-shell.css';
import './stryven-pages.css';
import './stryven-settings.css';
import './stryven-ui-polish.css';
import './stryven-performance.css';
import './stryven-ascension.css';
import './stryven-v2.css';
import './stryven-v2-pages.css';
import './stryven-evolution.css';
import './stryven-final.css';

const Dashboard=lazy(()=>import('./views/Dashboard').then(m=>({default:m.Dashboard})));
const WorkoutWithAIPlan=lazy(()=>import('./components/WorkoutWithAIPlan').then(m=>({default:m.WorkoutWithAIPlan})));
const Profile=lazy(()=>import('./views/Profile').then(m=>({default:m.Profile})));
const Settings=lazy(()=>import('./views/Settings').then(m=>({default:m.Settings})));
const Auth=lazy(()=>import('./views/Auth').then(m=>({default:m.Auth})));
const ResetPassword=lazy(()=>import('./views/ResetPassword').then(m=>({default:m.ResetPassword})));
const Missions=lazy(()=>import('./views/Missions').then(m=>({default:m.Missions})));
const Analytics=lazy(()=>import('./views/Analytics').then(m=>({default:m.Analytics})));
const Achievements=lazy(()=>import('./views/Achievements').then(m=>({default:m.Achievements})));
const ShadowArmy=lazy(()=>import('./views/ShadowArmy').then(m=>({default:m.ShadowArmy})));
const VALID_VIEWS=new Set<ViewId>(['dashboard','missions','workout','analytics','achievements','shadows','profile','settings']);
function getViewFromUrl():ViewId{if(typeof window==='undefined')return'dashboard';const requested=new URLSearchParams(window.location.search).get('view');return requested&&VALID_VIEWS.has(requested as ViewId)?requested as ViewId:'dashboard'}
function PageLoader(){return <div className="stryven-page-loader" role="status" aria-label="Loading page"><Loader2 className="animate-spin" size={30}/><span>Loading system module…</span></div>}
function AppContent(){
  const {user,loading}=useAuth(); const {state,loadFromCloud,setUserId}=useStore(); const [view,setView]=useState<ViewId>(getViewFromUrl); const {isInstalled,isInstallable,promptInstall}=usePWA(); const isReset=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('reset')==='1';
  useEffect(()=>{syncSoundFlag(state.soundEnabled)},[state.soundEnabled]);
  const userId=user?.id??null;
  useEffect(()=>{if(!userId){setUserId(null);return}void Promise.allSettled([ensureStoryReset(userId),loadFromCloud(userId)])},[userId,setUserId,loadFromCloud]);
  useEffect(()=>{const onPopState=()=>setView(getViewFromUrl());window.addEventListener('popstate',onPopState);return()=>window.removeEventListener('popstate',onPopState)},[]);
  useEffect(()=>{document.documentElement.setAttribute('data-theme',state.theme);document.body.setAttribute('data-theme',state.theme);return()=>{document.documentElement.removeAttribute('data-theme');document.body.removeAttribute('data-theme')}},[state.theme]);
  const handleNavigate=(target:ViewId)=>{setView(target);const url=new URL(window.location.href);url.searchParams.set('view',target);window.history.pushState({},'',url);window.scrollTo({top:0,behavior:'auto'})};
  if(loading)return <div className="stryven-auth-loader" role="status" aria-label="Loading session"><Loader2 className="animate-spin" size={38}/></div>;
  if(isReset)return <><Background/><Suspense fallback={<PageLoader/>}><ResetPassword/></Suspense></>;
  if(!user)return <><Background/><ToastContainer/><Suspense fallback={<PageLoader/>}><Auth/></Suspense></>;
  return <div className="stryven-app-shell" data-theme={state.theme}><Background/><Navigation current={view} onNavigate={handleNavigate}/><ToastContainer/><Confetti/><main className={`stryven-main stryven-view-${view}`}><div className="stryven-page-frame"><Suspense fallback={<PageLoader/>}>
    {view==='dashboard'&&<section className="stryven-page"><Dashboard onNavigate={handleNavigate}/>{!isInstalled&&<div className="stryven-install"><InstallButton isInstallable={isInstallable} isInstalled={isInstalled} onInstall={promptInstall}>Install STRYVEN</InstallButton></div>}</section>}
    {view==='missions'&&<section className="stryven-page"><Missions/></section>}
    {view==='workout'&&<section className="stryven-page"><WorkoutWithAIPlan/></section>}
    {view==='analytics'&&<section className="stryven-page"><Analytics/></section>}
    {view==='achievements'&&<section className="stryven-page"><Achievements/></section>}
    {view==='shadows'&&<section className="stryven-page"><ShadowArmy/></section>}
    {view==='profile'&&<section className="stryven-page"><Profile/></section>}
    {view==='settings'&&<section className="stryven-page stryven-settings"><Settings/></section>}
  </Suspense></div></main></div>
}
function App(){return <ErrorBoundary><AuthProvider><AppContent/></AuthProvider></ErrorBoundary>}
export default App;