import { useMemo } from 'react';
import { Lock, Map, Swords, Shield, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

const REGIONS = [
  { id: 'ironhold', name: 'The Ironhold', subtitle: 'The first gate', level: 10, icon: '🏰', accent: '#f59e0b', description: 'A fortified starting region where hunters prove their discipline.' },
  { id: 'shadowfen', name: 'Shadowfen', subtitle: 'The silent marsh', level: 20, icon: '🌲', accent: '#22c55e', description: 'A dark wilderness filled with hidden paths and stronger enemies.' },
  { id: 'ember-ridge', name: 'Ember Ridge', subtitle: 'The burning ascent', level: 15, icon: '🔥', accent: '#f97316', description: 'A volcanic training ground where endurance is tested.' },
  { id: 'watchtower', name: 'The Watchtower', subtitle: 'The final outpost', level: 5, icon: '🗼', accent: '#60a5fa', description: 'An ancient tower overlooking the next stage of the journey.' },
  { id: 'the-deep', name: 'The Deep', subtitle: 'Endgame territory', level: 25, icon: '🌑', accent: '#8b5cf6', description: 'A locked region reserved for hunters who reach the highest tiers.' },
];

export function WorldMap() {
  const { state } = useStore();
  const unlockedLevel = state.level;
  const regions = useMemo(() => REGIONS.map((region, index) => ({ ...region, unlocked: unlockedLevel >= region.level, index })), [unlockedLevel]);

  return (
    <section className="space-y-5">
      <div className="card-premium p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.24), transparent 58%)' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ember-400">Hunter Territory</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-white">World Map</h1>
            <p className="mt-1 text-sm text-ink-400">Explore regions, unlock new territory, and follow your progression.</p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-ember-500/30 bg-ember-500/10 text-ember-400"><Map size={24} /></div>
        </div>
      </div>

      <div className="card-premium p-4 sm:p-6 overflow-hidden">
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#090b10] p-4 sm:p-8">
          <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-ember-500/35 to-transparent" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {regions.map((region) => (
              <button key={region.id} disabled={!region.unlocked} className={`group relative min-h-44 rounded-2xl border p-4 text-left transition-colors ${region.unlocked ? 'border-white/10 bg-white/[0.025] hover:border-ember-500/40 hover:bg-white/[0.045]' : 'cursor-not-allowed border-white/[0.06] bg-black/30 opacity-55'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl">{region.icon}</span>
                  {region.unlocked ? <Swords size={16} className="text-ember-400" /> : <Lock size={16} className="text-ink-600" />}
                </div>
                <p className="mt-4 text-[10px] uppercase tracking-wider" style={{ color: region.accent }}>{region.subtitle}</p>
                <h2 className="mt-1 font-display text-base font-bold text-white">{region.name}</h2>
                <p className="mt-1 text-[11px] leading-4 text-ink-500">{region.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-400"><Shield size={11} /> Level {region.level}+</div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500"><Sparkles size={13} className="text-ember-400" /> Your current level: <span className="font-bold text-ember-400">{state.level}</span></div>
        </div>
      </div>
    </section>
  );
}

export default WorldMap;
