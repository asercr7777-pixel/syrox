import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigation, type ViewId } from './components/Navigation';
import { Background } from './components/Background';
import { ToastContainer } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './lib/auth';
import { useStore } from './store/useStore';
import { syncSoundFlag } from './lib/sound';
import { usePWA } from './hooks/usePWA';
import { InstallButton } from './components/pwa/InstallButton';
import { StoryProgressBridge } from './components/StoryProgressBridge';
import { Loader2 } from 'lucide-react';
import './performance.css'; import './theme.css'; import './theme-overrides.css'; import './theme-identities.css'; import './theme-motion.css'; import './mobile.css'; import './community-scroll.css';

const Dashboard = lazy(() => import('./views/Dashboard').then((m) => ({ default: m.Dashboard })));
const Tasks = lazy(() => import('./views/Tasks').then((m) => ({ default: m.Tasks })));
const StoryMode = lazy(() => import('./views/StoryMode').then((m) => ({ default: m.default })));
const SkillTree = lazy(() => import('./views/SkillTree').then((m) => ({ default: m.SkillTree })));
const WorkoutWithAIPlan = lazy(() => import('./components/WorkoutWithAIPlan').then((m) => ({ default: m.WorkoutWithAIPlan })));
const ShadowAI = lazy(() => import('./components/ShadowAIV2').then((m) => ({ default: m.ShadowAIV2 })));
const Dungeons = lazy(() => import('./views/Dungeons').then((m) => ({ default: m.Dungeons })));
const Profile = lazy(() => import('./views/Profile').then((m) => ({ default: m.Profile })));
const Marketplace = lazy(() => import('./views/Marketplace').then((m) => ({ default: m.Marketplace })));
const Inventory = lazy(() => import('./views/Inventory').then((m) => ({ default: m.Inventory })));
const Achievements = lazy(() => import('./views/Achievements').then((m) => ({ default: m.Achievements })));
const Leaderboard = lazy(() => import('./views/Leaderboard').then((m) => ({ default: m.Leaderboard })));
const Community = lazy(() => import('./views/Community').then((m) => ({ default: m.Community })));
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })));
const ItemInspection = lazy(() => import('./views/ItemInspection').then((m) => ({ default: m.ItemInspection })));
const Auth = lazy(() => import('./views/Auth').then((m) => ({ default: m.Auth })));
const ResetPassword = lazy(() => import('./views/ResetPassword').then((m) => ({ default: m.ResetPassword })));

const VALID_VIEWS = new Set<ViewId>(['dashboard', 'tasks', 'story', 'workout', 'shadowai', 'dungeons', 'profile', 'marketplace', 'inventory', 'achievements', 'leaderboard', 'community', 'skilltree', 'settings', 'iteminspection']);
function getViewFromUrl(): ViewId { if (typeof window === 'undefined') return 'dashboard'; const requested = new URLSearchParams(window.location.search).get('view'); if (requested === 'worldmap') return 'story'; return requested && VALID_VIEWS.has(requested as ViewId) ? (requested as ViewId) : 'dashboard'; }
function PageLoader() { return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-[rgb(var(--accent-400))]" size={32} /></div>; }

function AppContent() {
  const { user, loading } = useAuth(); const { state, loadFromCloud, setUserId } = useStore(); const [view, setView] = useState<ViewId>(getViewFromUrl); const { isInstalled, isInstallable, promptInstall } = usePWA(); const isReset = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === '1';
  useEffect(() => { syncSoundFlag(state.soundEnabled); }, [state.soundEnabled]);
  useEffect(() => { if (user) void loadFromCloud(user.id); else setUserId(null); }, [user, setUserId, loadFromCloud]);
  useEffect(() => { const onPopState = () => setView(getViewFromUrl()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', state.theme); document.body.setAttribute('data-theme', state.theme); return () => { document.documentElement.removeAttribute('data-theme'); document.body.removeAttribute('data-theme'); }; }, [state.theme]);
  const handleNavigate = (v: ViewId) => { if (v === 'iteminspection') return; const target = v === 'worldmap' ? 'story' : v; setView(target); const url = new URL(window.location.href); url.searchParams.set('view', target); if (target === 'story') url.searchParams.delete('chapter'); window.history.replaceState({}, '', url); window.dispatchEvent(new Event('stryven-view-change')); };
  const content = (() => { switch (view) { case 'dashboard': return <Dashboard onNavigate={handleNavigate} />; case 'tasks': return <Tasks />; case 'story': return <StoryMode />; case 'skilltree': return <SkillTree />; case 'workout': return <WorkoutWithAIPlan />; case 'shadowai': return <ShadowAI />; case 'dungeons': return <Dungeons />; case 'profile': return <Profile />; case 'marketplace': return <Marketplace />; case 'inventory': return <Inventory />; case 'achievements': return <Achievements />; case 'leaderboard': return <Leaderboard />; case 'community': return <Community />; case 'settings': return <Settings />; default: return <Dashboard onNavigate={handleNavigate} />; } })();
  if (loading) return <PageLoader />;
  if (!user && !isReset) return <Auth />;
  if (isReset) return <ResetPassword />;
  return <ErrorBoundary><div className="min-h-screen"><Background /><Navigation current={view} onNavigate={handleNavigate} /><main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6 lg:ml-64"><Suspense fallback={<PageLoader />}>{content}</Suspense></main><ToastContainer /><Confetti />{!isInstalled && isInstallable && <InstallButton onInstall={promptInstall} />}<StoryProgressBridge /></div></ErrorBoundary>;
}

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
