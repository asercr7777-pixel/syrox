import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Check, Map, Moon, Sparkles, Swords, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ALL_CHAPTERS, getNPCById } from '../data/story';
import type { StoryChapter } from '../data/story/types';

const SHADOW = getNPCById('npc_shadow');

function chapterStatus(chapter: StoryChapter, current: number, completed: Record<string, boolean>) {
  if (completed[chapter.boss.id]) return 'completed';
  if (chapter.number === current) return 'current';
  if (chapter.number < current) return 'available';
  return 'future';
}

export function WorldMap() {
  const { state } = useStore();
  const chapters = useMemo(() => [...ALL_CHAPTERS].sort((a, b) => a.number - b.number).slice(0, 30), []);
  const current = Math.min(state.storyChapter + 1, 30);
  const [selected, setSelected] = useState<StoryChapter>(chapters[0]);

  const openStory = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'story');
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <section className="relative space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-ember-500/25 bg-[#08090d]/95 p-5 sm:p-7">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-ember-400"><Map size={15} /> World Map · Arc I</div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">THE BROKEN REALITY</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-300 sm:text-base">Arc I follows your awakening inside a world damaged by millions of small surrenders. Thirty chapters trace one continuous path—from the first signal to the World Core. Every chapter is shown in story order; the map is not locked by level.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip border border-ember-500/25 bg-ember-500/10 text-ember-300"><BookOpen size={12} /> 30 Chapters</span>
              <span className="chip border border-violet-500/25 bg-violet-500/10 text-violet-300"><Moon size={12} /> Shadow Guide</span>
              <span className="chip border border-white/10 bg-white/[0.03] text-ink-300"><Swords size={12} /> Story Progression</span>
            </div>
          </div>
          <div className="hidden lg:flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-ember-400/40 bg-[radial-gradient(circle,rgba(245,158,11,.3),rgba(10,10,14,.95)_60%)] shadow-[0_0_45px_rgba(245,158,11,.12)]"><Sparkles size={34} className="text-ember-300" /></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-[#090910]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(124,58,237,.22),transparent_35%),radial-gradient(circle_at_15%_100%,rgba(245,158,11,.08),transparent_30%)]" />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-400/30 bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,.28),rgba(7,7,12,.98)_62%)]">
            <div className="absolute inset-x-4 bottom-0 h-16 rounded-t-full bg-gradient-to-t from-violet-950 via-violet-900/60 to-transparent" />
            <div className="relative z-10 h-12 w-9 rounded-[45%_45%_38%_38%] bg-gradient-to-b from-violet-300/80 to-violet-950 shadow-[0_0_28px_rgba(139,92,246,.55)]" />
            <div className="absolute bottom-7 left-1/2 z-20 h-1 w-5 -translate-x-1/2 rounded-full bg-violet-200 shadow-[0_0_10px_rgba(196,181,253,.9)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-2xl font-black text-white">SHADOW</h2><span className="chip border border-violet-500/30 bg-violet-500/10 text-violet-300">YOUR GUIDE</span></div>
            <p className="mt-1 text-sm text-violet-200/80">{SHADOW?.backstory ?? 'The mysterious guide bound to the System.'}</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-300">“{SHADOW?.dialogue[0]?.text ?? 'You are not the first to awaken here. But you may be the last hope this world has.'}” Shadow will appear throughout the journey to explain the path and guide you toward the next gate.</p>
          </div>
          <button onClick={openStory} className="btn-primary shrink-0"><ArrowRight size={16} /> Enter Story</button>
        </div>
      </motion.div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07080c] p-4 sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ember-400">Arc I · Main Route</p><h2 className="mt-1 font-display text-2xl font-black text-white">The Awakening Path</h2></div>
          <div className="text-right text-xs text-ink-400">Chapter {current} / 30</div>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="absolute bottom-8 left-1/2 top-8 w-px -translate-x-1/2 bg-gradient-to-b from-ember-500/60 via-violet-500/30 to-transparent" />
          <div className="space-y-3">
            {chapters.map((chapter, index) => {
              const status = chapterStatus(chapter, current, state.storyBossDefeated);
              const isSelected = selected?.number === chapter.number;
              const left = index % 2 === 0;
              return (
                <motion.div key={chapter.id} initial={{ opacity: 0, x: left ? -14 : 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.018, 0.45), duration: 0.24 }} className={`relative flex ${left ? 'justify-start' : 'justify-end'}`}>
                  <button onClick={() => setSelected(chapter)} className={`group relative w-[calc(50%-18px)] min-w-0 rounded-2xl border p-3 text-left transition-all duration-200 sm:p-4 ${isSelected ? 'border-ember-400/60 bg-ember-500/[0.09] shadow-[0_0_24px_rgba(245,158,11,.10)]' : status === 'completed' ? 'border-emerald-500/25 bg-emerald-500/[0.035]' : status === 'current' ? 'border-violet-400/45 bg-violet-500/[0.06]' : 'border-white/[0.07] bg-white/[0.018] hover:border-white/20 hover:bg-white/[0.035]'}`}>
                    <span className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${left ? '-right-[22px]' : '-left-[22px]'} ${status === 'completed' ? 'bg-emerald-400' : status === 'current' ? 'bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,.8)]' : 'bg-ember-400/60'}`} />
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold ${status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : status === 'current' ? 'border-violet-400/40 bg-violet-500/10 text-violet-200' : 'border-ember-500/20 bg-ember-500/5 text-ember-300'}`}>{status === 'completed' ? <Check size={17} /> : String(chapter.number).padStart(2, '0')}</div>
                      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink-500">Chapter {chapter.number}</p>{status === 'current' && <span className="chip border border-violet-400/25 bg-violet-500/10 px-1.5 py-0 text-[9px] text-violet-300">NOW</span>}</div><h3 className="truncate font-display text-sm font-bold text-white sm:text-base">{chapter.title}</h3><p className="mt-0.5 truncate text-[11px] text-ink-400">{chapter.subtitle}</p></div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-3xl border border-ember-500/20 bg-[#090a0f] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex-1"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ember-400"><Zap size={14} /> Chapter {selected.number}</div><h2 className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">{selected.title}</h2><p className="mt-1 text-sm text-ink-400">{selected.subtitle}</p><p className="mt-4 text-sm leading-6 text-ink-300">{selected.introCutscene?.[0]?.text ?? 'The path continues. Shadow is waiting at the next gate.'}</p></div>
              <div className="flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between text-xs text-ink-400"><span>Story route</span><span className="text-ember-300">{selected.number} / 30</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-violet-400" style={{ width: `${(selected.number / 30) * 100}%` }} /></div><button onClick={openStory} className="btn-primary mt-2 w-full"><BookOpen size={15} /> Open Story Chapter</button></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] uppercase tracking-[0.22em] text-ink-600">Arc I · 30 chapters · no level-gated map · story progression handled inside Story Mode</p>
    </section>
  );
}

export default WorldMap;
