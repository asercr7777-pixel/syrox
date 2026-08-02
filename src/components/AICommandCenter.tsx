import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp, Flame, Award, Target, Zap, Calendar, Clock, Trophy,
  Activity, Brain, AlertTriangle, Sparkles, Cpu,
  Shield, Gauge, Crown,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import {
  computeMetrics, computeInsights, computePredictions, computeTraits,
  computeRankProgress, computeStreakHistory,
  computeTaskDistribution, computeDisciplineTimeline, computeXpProgress,
  computeRadarData, getDailyCoach,
} from '../lib/aiAnalysis';

type RangeKey = 'week' | 'month' | 'year' | 'all';

const NEON_PURPLE = '#a855f7';
const NEON_CYAN = '#06b6d4';
const NEON_GREEN = '#10b981';
const NEON_ORANGE = '#ff7a18';
const NEON_GOLD = '#fbbf24';
const NEON_PINK = '#f43f5e';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function GlassCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`relative rounded-2xl border border-purple-500/15 bg-gradient-to-br from-slate-900/80 via-purple-950/20 to-slate-900/80 backdrop-blur-xl overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 0%, rgba(168,85,247,0.08), transparent 60%)' }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

const AnimatedCounter = memo(function AnimatedCounter({ value, suffix = '', duration = 1000 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const startVal = display;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef) cancelAnimationFrame(rafRef.current!); };
  }, [value, duration]);

  return <span className="tabular-nums">{display.toLocaleString()}{suffix}</span>;
});


function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Cpu; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
        <Icon size={16} className="text-purple-400" />
      </div>
      <div>
        <h3 className="font-display text-sm font-bold text-purple-100 tracking-wide uppercase">{title}</h3>
        {subtitle && <p className="text-[10px] text-purple-300/60">{subtitle}</p>}
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: 'rgba(10,12,20,0.95)',
  border: '1px solid rgba(168,85,247,0.3)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#e6eaf5',
  backdropFilter: 'blur(8px)',
};

export const AICommandCenter = memo(function AICommandCenter() {
  const { state } = useStore();
  const [timelineRange, setTimelineRange] = useState<RangeKey>('month');

  const metrics = useMemo(() => computeMetrics(state), [state.history, state.xp, state.streak, state.bestStreak]);
  const insights = useMemo(() => computeInsights(state), [state.history]);
  const predictions = useMemo(() => computePredictions(state), [state.history, state.xp, state.streak]);
  const traits = useMemo(() => computeTraits(state), [state.history, state.streak, state.bestStreak, state.workoutSessions, state.achievements]);
  const rankProgress = useMemo(() => computeRankProgress(state), [state.history, state.xp]);
  const streakHistory = useMemo(() => computeStreakHistory(state), [state.history]);
  const taskDist = useMemo(() => computeTaskDistribution(state), [state.history]);
  const timelineData = useMemo(() => computeDisciplineTimeline(state, timelineRange), [state.history, timelineRange]);
  const xpData = useMemo(() => computeXpProgress(state), [state.history]);
  const radarData = useMemo(() => computeRadarData(state), [state.history, state.xp, state.streak, state.workoutSessions, state.achievements, state.dungeonsCleared]);
  const coachTip = useMemo(() => getDailyCoach(state), [state.history, state.xp, state.streak, state.mainTasks, state.coreCompleted]);

  const rank = getRankByXp(state.xp);

  const overviewItems = [
    { label: 'Discipline Rating', value: metrics.overallDisciplineRating, suffix: '/100', color: NEON_PURPLE, icon: Gauge },
    { label: 'Current Rank', value: rank.name, isText: true, color: rank.color, icon: Crown },
    { label: 'Level', value: state.level, color: NEON_CYAN, icon: Zap },
    { label: 'Total XP', value: state.xp, color: NEON_ORANGE, icon: TrendingUp },
    { label: 'Streak', value: state.streak, suffix: ' days', color: NEON_PINK, icon: Flame },
    { label: 'Daily Score', value: metrics.dailyScore, suffix: '/100', color: NEON_GREEN, icon: Target },
    { label: 'Weekly Perf', value: metrics.weeklyPerformance, suffix: '%', color: NEON_GOLD, icon: Activity },
    { label: 'Monthly Growth', value: metrics.monthlyGrowth > 0 ? `+${metrics.monthlyGrowth}` : `${metrics.monthlyGrowth}`, isText: true, color: metrics.monthlyGrowth >= 0 ? NEON_GREEN : NEON_PINK, icon: TrendingUp },
  ];

  const analyticsItems = [
    { label: 'Total Tasks Completed', value: metrics.totalTasksCompleted, icon: Target, color: NEON_GREEN },
    { label: 'Success Rate', value: `${metrics.successRate}%`, isText: true, icon: Award, color: NEON_GOLD },
    { label: 'Failure Rate', value: `${metrics.failureRate}%`, isText: true, icon: AlertTriangle, color: NEON_PINK },
    { label: 'Avg Completion', value: `${metrics.avgCompletionPct}%`, isText: true, icon: Gauge, color: NEON_PURPLE },
    { label: 'Daily Avg XP', value: metrics.avgDailyXp, icon: Zap, color: NEON_ORANGE },
    { label: 'Weekly Avg XP', value: metrics.avgWeeklyXp, icon: TrendingUp, color: NEON_CYAN },
    { label: 'Monthly Avg XP', value: metrics.avgMonthlyXp, icon: Calendar, color: NEON_PURPLE },
    { label: 'Longest Streak', value: metrics.longestStreak, suffix: ' days', icon: Flame, color: NEON_PINK },
    { label: 'Best Month', value: metrics.bestMonth?.month ?? '—', isText: true, icon: Trophy, color: NEON_GOLD },
    { label: 'Peak Hour', value: metrics.mostProductiveHour, isText: true, icon: Clock, color: NEON_CYAN },
    { label: 'Best Day', value: metrics.mostProductiveDay, isText: true, icon: Award, color: NEON_GREEN },
    { label: 'Worst Day', value: metrics.leastProductiveDay, isText: true, icon: AlertTriangle, color: NEON_PINK },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-purple-950/40 backdrop-blur-xl p-5 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)' }} />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
              <Cpu size={24} className="text-purple-300" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-purple-100 tracking-wide">AI COMMAND CENTER</h2>
            <p className="text-xs text-purple-300/60">Real-time analysis of your discipline, habits, and progression</p>
          </div>
        </div>
      </motion.div>

      {/* AI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {overviewItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.label} delay={i}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color: item.color }} />
                  <span className="text-[10px] uppercase tracking-wider text-purple-300/70 font-medium">{item.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: item.color }}>
                  {item.isText ? item.value : <AnimatedCounter value={item.value as number} suffix={item.suffix} />}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Capability Radar — Redesigned */}
      <GlassCard delay={0}>
        <div className="p-5">
          <SectionTitle icon={Brain} title="Capability Radar" subtitle="Multi-dimensional discipline analysis" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="relative">
              {/* Glow background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)' }} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={NEON_CYAN} stopOpacity={0.6} />
                      <stop offset="50%" stopColor={NEON_PURPLE} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={NEON_PINK} stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={NEON_CYAN} />
                      <stop offset="50%" stopColor={NEON_PURPLE} />
                      <stop offset="100%" stopColor={NEON_PINK} />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="rgba(168,85,247,0.12)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#475569' }} axisLine={false} />
                  <Radar
                    dataKey="value"
                    stroke="url(#radarStroke)"
                    fill="url(#radarGradient)"
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.5))' }}
                    animationDuration={800}
                    isAnimationActive
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Metric breakdown */}
            <div className="space-y-2.5">
              {radarData.map((d: any, i: number) => (
                <motion.div
                  key={d.metric}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-slate-300 w-24 flex-shrink-0">{d.metric}</span>
                  <div className="flex-1 h-2 bg-slate-950/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.value}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_PURPLE})`,
                        boxShadow: `0 0 6px ${NEON_PURPLE}80`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-purple-300 w-10 text-right">{d.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Professional Analytics */}
      <GlassCard delay={0}>
        <div className="p-5">
          <SectionTitle icon={Activity} title="Professional Analytics" subtitle="Deep metrics computed from your historical data" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {analyticsItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="p-3 rounded-xl border border-white/5 bg-slate-950/40 hover:border-purple-500/20 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon size={12} style={{ color: item.color }} />
                    <span className="text-[9px] uppercase tracking-wide text-slate-400">{item.label}</span>
                  </div>
                  <p className="text-base font-bold tabular-nums" style={{ color: item.color }}>
                    {item.isText ? item.value : <AnimatedCounter value={item.value as number} suffix={item.suffix} />}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Discipline Score Timeline */}
      <GlassCard delay={0}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={TrendingUp} title="Discipline Score Timeline" />
            <div className="flex gap-1">
              {(['week', 'month', 'year', 'all'] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimelineRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-all ${
                    timelineRange === r
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="disciplineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEON_PURPLE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={NEON_PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="score"
                stroke={NEON_PURPLE}
                strokeWidth={2.5}
                dot={{ r: 3, fill: NEON_PURPLE }}
                activeDot={{ r: 5, fill: NEON_PURPLE, stroke: '#fff', strokeWidth: 1 }}
                style={{ filter: `drop-shadow(0 0 6px ${NEON_PURPLE})` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* XP Progress + Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard delay={0}>
          <div className="p-5">
            <SectionTitle icon={Zap} title="XP Progress" subtitle="Cumulative XP gained over time" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={xpData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NEON_ORANGE} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={NEON_ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,122,24,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#64749b' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke={NEON_ORANGE}
                  strokeWidth={2.5}
                  fill="url(#xpGlow)"
                  style={{ filter: `drop-shadow(0 0 6px ${NEON_ORANGE})` }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard delay={1}>
          <div className="p-5">
            <SectionTitle icon={Target} title="Task Distribution" subtitle="Completed vs skipped across all time" />
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {taskDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 4px ${entry.color})` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8a93b0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Rank Progress Timeline + Streak History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard delay={0}>
          <div className="p-5">
            <SectionTitle icon={Crown} title="Rank Progress Timeline" subtitle="Every rank unlocked with XP thresholds" />
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
              {rankProgress.filter((r) => r.unlocked).map((rp, i) => (
                <motion.div
                  key={rp.rank.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-slate-950/40"
                >
                  <span className="text-lg flex-shrink-0">{rp.rank.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: rp.rank.color }}>{rp.rank.name}</p>
                    <p className="text-[10px] text-slate-500">{rp.xpRequired.toLocaleString()} XP{rp.dateReached ? ` · ${rp.dateReached}` : ''}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: rp.rank.color, boxShadow: `0 0 6px ${rp.rank.color}` }} />
                </motion.div>
              ))}
              {rankProgress.filter((r) => !r.unlocked).slice(0, 3).map((rp) => (
                <div key={rp.rank.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-slate-950/20 opacity-50">
                  <span className="text-lg flex-shrink-0">{rp.rank.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-400">{rp.rank.name}</p>
                    <p className="text-[10px] text-slate-600">{rp.xpRequired.toLocaleString()} XP required</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={1}>
          <div className="p-5">
            <SectionTitle icon={Flame} title="Streak History" subtitle="Longest consecutive perfect-day streaks" />
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
              {streakHistory.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">No extended streaks yet. Complete all core tasks for 2+ consecutive days to appear here.</p>
              )}
              {streakHistory.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-slate-950/40"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(244,63,94,0.15)' }}>
                    <Flame size={14} className="text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-rose-300">{s.length} day streak</p>
                    <p className="text-[10px] text-slate-500">{s.start} → {s.end}</p>
                  </div>
                  <div className="flex items-end gap-0.5 h-6">
                    {Array.from({ length: Math.min(s.length, 12) }, (_, j) => (
                      <div key={j} className="w-1 rounded-full bg-rose-400/60" style={{ height: `${40 + j * 5}%` }} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Insights */}
      <GlassCard delay={0}>
        <div className="p-5">
          <SectionTitle icon={Brain} title="AI Insights" subtitle="Automated behavioral patterns detected from your data" />
          <div className="space-y-2.5">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl border bg-slate-950/40"
                style={{
                  borderColor: insight.type === 'positive' ? 'rgba(16,185,129,0.2)' : insight.type === 'warning' ? 'rgba(244,63,94,0.2)' : 'rgba(168,85,247,0.15)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: insight.type === 'positive' ? 'rgba(16,185,129,0.15)' : insight.type === 'warning' ? 'rgba(244,63,94,0.15)' : 'rgba(168,85,247,0.15)',
                  }}
                >
                  {insight.type === 'positive' ? <Award size={14} className="text-emerald-400" /> :
                   insight.type === 'warning' ? <AlertTriangle size={14} className="text-rose-400" /> :
                   <Sparkles size={14} className="text-purple-400" />}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed pt-1">{insight.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* AI Predictions + Discipline DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard delay={0}>
          <div className="p-5">
            <SectionTitle icon={Cpu} title="AI Predictions" subtitle="Forecast based on your current trajectory" />
            <div className="space-y-2.5">
              <PredictionRow label="Complete Today's Tasks" value={`${predictions.chanceCompleteToday}%`} color={NEON_GREEN} />
              <PredictionRow label="Break Current Streak" value={`${predictions.chanceBreakStreak}%`} color={NEON_PINK} />
              <PredictionRow label="Expected Level (30d)" value={`${predictions.expectedLevel}`} color={NEON_CYAN} />
              <PredictionRow label="Expected Rank (30d)" value={predictions.expectedRank} isText color={NEON_PURPLE} />
              <PredictionRow label="Expected XP (30d)" value={predictions.expectedXp.toLocaleString()} color={NEON_ORANGE} />
              <PredictionRow
                label="Burnout Risk"
                value={`${predictions.burnoutRisk}%`}
                color={predictions.burnoutRisk > 50 ? NEON_PINK : NEON_GOLD}
              />
              <PredictionRow
                label="Recovery Trend"
                value={predictions.recoveryTrend === 'up' ? '↑ Improving' : predictions.recoveryTrend === 'down' ? '↓ Declining' : '→ Stable'}
                isText
                color={predictions.recoveryTrend === 'up' ? NEON_GREEN : predictions.recoveryTrend === 'down' ? NEON_PINK : NEON_GOLD}
              />
              <PredictionRow label="Projected Growth" value={`+${predictions.futureGrowth}%`} color={NEON_GREEN} />
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={1}>
          <div className="p-5">
            <SectionTitle icon={Shield} title="Discipline DNA" subtitle="Unlockable traits based on your history" />
            <div className="grid grid-cols-2 gap-2.5">
              {traits.map((trait, i) => (
                <motion.div
                  key={trait.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    trait.unlocked
                      ? 'border-purple-500/30 bg-purple-950/30'
                      : 'border-white/5 bg-slate-950/30 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-1" style={{ filter: trait.unlocked ? 'drop-shadow(0 0 8px rgba(168,85,247,0.6))' : 'grayscale(1)' }}>
                    {trait.icon}
                  </div>
                  <p className={`text-xs font-bold ${trait.unlocked ? 'text-purple-200' : 'text-slate-500'}`}>{trait.name}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{trait.description}</p>
                  {trait.unlocked && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-purple-400 font-semibold uppercase tracking-wider">
                      <Award size={10} /> Unlocked
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Coach */}
      <GlassCard delay={0}>
        <div className="p-5">
          <SectionTitle icon={Sparkles} title="AI Coach" subtitle="Daily personalized recommendation" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative p-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-950/30 to-slate-950/40"
          >
            <div className="absolute -top-2 -left-2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)', boxShadow: '0 0 15px rgba(168,85,247,0.3)' }}>
              <Cpu size={14} className="text-purple-300" />
            </div>
            <p className="text-sm text-purple-100 leading-relaxed pl-4">
              {coachTip}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-purple-400/60">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Generated from {metrics.totalDaysActive} days of historical data</span>
            </div>
          </motion.div>
        </div>
      </GlassCard>
    </div>
  );
});

function PredictionRow({ label, value, color, isText }: { label: string; value: string; color: string; isText?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-slate-950/40">
      <span className="text-xs text-slate-300">{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}
