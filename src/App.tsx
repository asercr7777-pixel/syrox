import { useEffect, useState } from 'react';
import { Navigation, type ViewId } from './components/Navigation';
import { Background } from './components/Background';
import { ToastContainer } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { Dashboard } from './views/Dashboard';
import { Tasks } from './views/Tasks';
import { Workout } from './views/Workout';
import { Dungeons } from './views/Dungeons';
import { Inventory } from './views/Inventory';
import { Marketplace } from './views/Marketplace';
import { Quests } from './views/Quests';
import StoryMode from './views/StoryMode';
import { Achievements } from './views/Achievements';
import { Leaderboard } from './views/Leaderboard';
import { Profile } from './views/Profile';
import { Settings } from './views/Settings';
import { ItemInspection } from './views/ItemInspection';
import { Auth } from './views/Auth';
import { Shadow } from './views/Shadow';
import { AuthProvider, useAuth } from './lib/auth';
import { useStore } from './store/useStore';
import { syncSoundFlag } from './lib/sound';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const { state, loadFromCloud, setUserId, cloudLoaded } = useStore();
  const [view, setView] = useState<ViewId>('dashboard');

  useEffect(() => {
    syncSoundFlag(state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    if (user) {
      void loadFromCloud(user.id);
    } else {
      setUserId(null);
    }
  }, [user, setUserId, loadFromCloud]);

  const handleNavigate = (v: ViewId) => {
    if (v === 'iteminspection') return;
    setView(v);
  };

  if (loading || (user && !cloudLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-ember-400" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Background />
        <Auth />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <Background />
      <Navigation current={view} onNavigate={handleNavigate} />
      <ToastContainer />
      <Confetti />

      <main className="lg:ml-64 pt-16 lg:pt-6 px-4 pb-24 lg:pb-8 max-w-6xl mx-auto">
        <div key={view} className="page-enter">
          {view === 'dashboard' && <Dashboard onNavigate={setView} />}
          {view === 'tasks' && <Tasks />}
          {view === 'quests' && <Quests />}
          {view === 'story' && <StoryMode />}
          {view === 'workout' && <Workout />}
          {view === 'dungeons' && <Dungeons />}
          {view === 'profile' && <Profile />}
          {view === 'marketplace' && <Marketplace />}
          {view === 'inventory' && <Inventory />}
          {view === 'achievements' && <Achievements />}
          {view === 'leaderboard' && <Leaderboard />}
          {view === 'shadow' && <Shadow />}
          {view === 'settings' && <Settings />}
          {view === 'iteminspection' && (
            <ItemInspection itemId="" category="weapon" onBack={() => setView('inventory')} />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
