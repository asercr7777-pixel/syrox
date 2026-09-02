import { motion } from 'framer-motion';
import { Eye, Flame, GitBranch, ShieldAlert, Sparkles, Target, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ShadowMemory, ShadowMoment } from '../../data/story/shadowAI';

interface ShadowPanelProps { moment: ShadowMoment; memory: ShadowMemory; directive: string; compact?: boolean; }
const MODE_META: Record<ShadowMoment['mode'], { label: string; glyph: string }> = {
  watching: { label: 'WATCHING', glyph: '◉' }, testing: { label: 'TESTING', glyph: '△' }, trusting: { label: 'ALLY', glyph: '◇' },
  doubting: { label: 'DOUBTING', glyph: '!' }, warning: { label: 'WARNING', glyph: '⚠' }, revealing: { label: 'REVELATION', glyph: '◈' },
  respecting: { label: 'RESPECT', glyph: '✦' }, provoking: { label: 'PROVOCATION', glyph: '↗' },
};

export function ShadowPanel({ moment, memory, directive, compact = false }: ShadowPanelProps) {
  const meta = MODE_META[moment.mode];
  return <motion.section layout className={`relative overflow-hidden rounded-[1.6rem] border border-violet-300/15 bg-[#08070d]/90 ${compact ? 'p-3' : 'p-5'} shadow-[0_20px_70px_rgba(40,20,70,.28)] backdrop-blur-2xl`}>
    <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-ember-500/10 blur-3xl" />
    <div className="relative flex items-start gap-3">
      <motion.div animate={{ boxShadow: ['0 0 0 rgba(167,139,250,0)', '0 0 32px rgba(167,139,250,.22)', '0 0 0 rgba(167,139,250,0)'] }} transition={{ duration: 3.2, repeat: Infinity }} className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-300/25 bg-gradient-to-br from-violet-400/15 via-black to-black text-violet-200"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.12),transparent_40%)]" /><Eye size={20} /></motion.div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[8px] font-black uppercase tracking-[.3em] text-violet-300">Shadow Intelligence</span><span className="rounded-full border border-white/10 bg-white/[.03] px-2 py-0.5 text-[8px] font-black tracking-[.18em] text-ink-500">{meta.glyph} {meta.label}</span></div><h3 className="mt-1 font-display text-base font-black text-white">{moment.title.replace('SHADOW // ', '')}</h3><p className="mt-2 text-sm leading-6 text-ink-200">{moment.line}</p></div>
      <div className="hidden shrink-0 text-right sm:block"><div className="text-[8px] font-black uppercase tracking-[.2em] text-ink-600">Pressure</div><div className="mt-1 font-mono text-lg font-black text-white">{moment.pressure}</div></div>
    </div>
    <div className={`relative mt-4 grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-2`}><Metric icon={<Flame size={11} />} label="Streak" value={String(memory.currentStreak)} /><Metric icon={<Target size={11} />} label="Missions" value={String(memory.completedMissions)} /><Metric icon={<Sparkles size={11} />} label="Consistency" value={`${memory.recentConsistency}%`} /><Metric icon={<GitBranch size={11} />} label="Path" value={memory.dominantPath} /></div>
    <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-amber-300/10 bg-amber-300/[.035] px-3 py-2.5"><ShieldAlert size={13} className="shrink-0 text-amber-300" /><div className="min-w-0"><div className="text-[8px] font-black uppercase tracking-[.2em] text-amber-300">Directive</div><div className="mt-0.5 truncate text-[10px] font-semibold text-amber-50/80">{directive}</div></div><Zap size={12} className="ml-auto shrink-0 text-amber-300/70" /></div>
  </motion.section>;
}
function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] bg-white/[.025] px-2.5 py-2"><div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[.18em] text-ink-600">{icon}{label}</div><div className="mt-1 truncate font-mono text-[11px] font-black uppercase text-white">{value}</div></div>; }
