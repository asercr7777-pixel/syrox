import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp, getNextRank } from '../data/ranks';
import { DisciplineLineChart, buildDisciplineData } from '../components/ui/DisciplineLineChart';
import { TrendingUp, Flame, Award, Target, Dumbbell, Zap, Coins, CheckCircle2, Calendar, Trophy, Clock, Swords } from 'lucide-react';

export function Stats() {
  const { state } = useStore();
  const rank = getRankByXp(state.xp);
  const nextRank = getNextRank(state.xp);

  const disciplineData = useMemo(() => buildDisciplineData(state.history, 30), [state.history]);

  const enabledMainTasks = state.mainTasks.filter((t) => t.enabled);
  const mainDone = enabledMainTasks.filter((t) => state.coreCompleted[t.id]).length;
  const extraDone = Object.values(state.customCompleted).filter(Boolean).length;
  const totalDone = mainDone + extraDone;
  const totalTasks = enabledMainTasks.length + state.customTasks.length;
  const remainingTasks = totalTasks - totalDone;
  const dailyCompletionPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const totalWorkoutMin = Math.floor(state.totalWorkoutSeconds / 60);
  const totalTasksCompleted = state.history.reduce((a, h) => a + Object.values(h.coreCompleted).filter(Boolean).length + Object.values(h.customCompleted).filter(Boolean).length, 0);

  const last30Days = state.history.slice(-30);
  const avgDailyCompletion = last30Days.length > 0
    ? Math.round(last30Days.reduce((a, h) => a + h.disciplineScore, 0) / last30Days.length)
    : 0;

  const rankProgressPct = nextRank
    ? Math.min(100, Math.round(((state.xp - rank.xpRequired) / (nextRank.xpRequired - rank.xpRequired)) * 100))
    : 100;

  const tasksCompletedToday = mainDone + extraDone;

  return (
    <div className="space-y-6">
      <div className="page-enter">
        <h1 className="section-title">Statistics</h1>
        <p className="text-sm text-ink-300">Your discipline journey, visualized</p>
      </div>

      {/* Radial Dashboard */}
      <div className="card-premium p-6 md:p-8 page-enter relative overflow-hidden" style={{ animationDelay: '0.05s' }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${rank.glow}, transparent 70%)` }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-ember-400" />
            <h2 className="section-title">Daily Completion Radial</h2>
          </div>
          <RadialDashboard
            tasks={enabledMainTasks}
            completed={state.coreCompleted}
            overallPct={dailyCompletionPct}
            done={mainDone}
            total={enabledMainTasks.length}
            rankColor={rank.color}
          />
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={TrendingUp} label="Daily Completion" value={`${dailyCompletionPct}%`} color="#ff7a18" index={0} />
        <StatBox icon={CheckCircle2} label="Total Completed" value={totalTasksCompleted.toLocaleString()} color="#10b981" index={1} />
        <StatBox icon={Target} label="Remaining Tasks" value={`${remainingTasks}`} color="#f43f5e" index={2} />
        <StatBox icon={Flame} label="Current Streak" value={`${state.streak} days`} color="#f97316" index={3} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={Award} label="Longest Streak" value={`${state.bestStreak} days`} color="#fbbf24" index={0} />
        <StatBox icon={Zap} label="Total XP" value={state.xp.toLocaleString()} color="#ff7a18" index={1} />
        <StatBox icon={Trophy} label="Rank Progress" value={`${rankProgressPct}%`} sub={nextRank ? `to ${nextRank.name}` : 'MAX'} color="#a855f7" index={2} />
        <StatBox icon={Swords} label="Dungeon Status" value={state.dungeonClearedToday ? 'Cleared' : 'Available'} color={state.dungeonClearedToday ? '#10b981' : '#ff7a18'} index={3} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={TrendingUp} label="Avg Completion (30d)" value={`${avgDailyCompletion}%`} color="#3b82f6" index={0} />
        <StatBox icon={Dumbbell} label="Total Workout Time" value={`${totalWorkoutMin}m`} color="#a855f7" index={1} />
        <StatBox icon={CheckCircle2} label="Tasks Completed Today" value={`${tasksCompletedToday}`} color="#10b981" index={2} />
        <StatBox icon={Coins} label="Coins" value={state.coins.toLocaleString()} color="#fbbf24" index={3} />
      </div>

      {/* Discipline Line Graph */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={18} className="text-ember-400" />
          <h2 className="font-display text-lg font-bold">Discipline Graph</h2>
        </div>
        <p className="text-xs text-ink-300 mb-4">Daily discipline score (last 30 days)</p>
        <DisciplineLineChart data={disciplineData} height={240} />
      </div>

      {/* Rank Progress Bar */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Trophy size={18} className="text-gold-400" />
            Rank Progress
          </h2>
          <span className="text-sm text-ink-300">{rank.emoji} {rank.name}</span>
        </div>
        <div className="h-4 bg-ink-950 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-ember-500 to-gold-500 rounded-full transition-all duration-700 progress-glow"
            style={{ width: `${rankProgressPct}%`, ['--progress-color' as any]: rank.color }}
          />
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)' }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-ink-300">
          <span>{rank.xpRequired.toLocaleString()} XP</span>
          <span className="font-semibold text-ember-400">{rankProgressPct}%</span>
          <span>{nextRank ? nextRank.xpRequired.toLocaleString() : 'MAX'} XP</span>
        </div>
      </div>

      {/* Workout Stats */}
      <div className="card-premium p-5 page-enter" style={{ animationDelay: '0.2s' }}>
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Dumbbell size={18} className="text-ember-400" />
          Workout Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={Dumbbell} label="Sessions" value={`${state.workoutSessions.length}`} color="#a855f7" index={0} />
          <StatBox icon={Clock} label="Total Time" value={`${totalWorkoutMin}m`} color="#ff7a18" index={1} />
          <StatBox icon={Flame} label="Today's Sessions" value={`${state.workoutsCompletedToday}`} color="#f43f5e" index={2} />
          <StatBox icon={Calendar} label="Perfect Days" value={`${state.history.filter((h) => h.allMainDone).length}`} color="#10b981" index={3} />
        </div>
      </div>
    </div>
  );
}

function RadialDashboard({ tasks, completed, overallPct, done, total, rankColor }: {
  tasks: { id: string; label: string; emoji: string; points: number }[];
  completed: Record<string, boolean>;
  overallPct: number;
  done: number;
  total: number;
  rankColor: string;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const [animatedTasks, setAnimatedTasks] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(overallPct), 100);
    return () => clearTimeout(timer);
  }, [overallPct]);

  useEffect(() => {
    tasks.forEach((t, i) => {
      setTimeout(() => {
        setAnimatedTasks((prev) => ({ ...prev, [t.id]: completed[t.id] ? 100 : 0 }));
      }, 100 + i * 80);
    });
  }, [tasks, completed]);

  const size = 280;
  const center = size / 2;
  const mainRadius = 100;
  const strokeWidth = 12;

  const taskRadius = 28;
  const taskRingRadius = 140;
  const taskCount = tasks.length;
  const taskAngleStep = 360 / Math.max(taskCount, 1);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        <defs>
          <linearGradient id="radialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb27a" />
            <stop offset="50%" stopColor="#ff7a18" />
            <stop offset="100%" stopColor="#e85d00" />
          </linearGradient>
          <filter id="radialGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ring */}
        <circle cx={center} cy={center} r={mainRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />

        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={mainRadius}
          fill="none"
          stroke="url(#radialGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * mainRadius}
          strokeDashoffset={2 * Math.PI * mainRadius * (1 - animatedPct / 100)}
          transform={`rotate(-90 ${center} ${center})`}
          filter="url(#radialGlow)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Center text */}
        <text x={center} y={center - 8} textAnchor="middle" fontSize="36" fontWeight="bold" fill="#ff7a18" fontFamily="system-ui">
          {animatedPct}%
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600" letterSpacing="1">
          COMPLETION
        </text>
        <text x={center} y={center + 32} textAnchor="middle" fontSize="10" fill="#64748b">
          {done}/{total} tasks
        </text>

        {/* Task nodes around the circle */}
        {tasks.map((task, i) => {
          const angle = (taskAngleStep * i - 90) * (Math.PI / 180);
          const x = center + taskRingRadius * Math.cos(angle);
          const y = center + taskRingRadius * Math.sin(angle);
          const isDone = completed[task.id];
          const taskPct = animatedTasks[task.id] ?? 0;
          const color = isDone ? '#10b981' : '#475569';

          // Connector line
          const lineStart = {
            x: center + mainRadius * Math.cos(angle),
            y: center + mainRadius * Math.sin(angle),
          };

          return (
            <g key={task.id}>
              {/* Connector */}
              <line
                x1={lineStart.x}
                y1={lineStart.y}
                x2={x}
                y2={y}
                stroke={isDone ? '#10b98140' : '#ffffff10'}
                strokeWidth="2"
                strokeDasharray="4 4"
                style={{ transition: 'stroke 0.5s' }}
              />
              {/* Task ring background */}
              <circle cx={x} cy={y} r={taskRadius} fill="rgba(10,12,20,0.8)" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              {/* Task progress ring */}
              <circle
                cx={x}
                cy={y}
                r={taskRadius}
                fill="none"
                stroke={isDone ? '#10b981' : color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * taskRadius}
                strokeDashoffset={2 * Math.PI * taskRadius * (1 - taskPct / 100)}
                transform={`rotate(-90 ${x} ${y})`}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
              {/* Task emoji */}
              <text x={x} y={y + 5} textAnchor="middle" fontSize="18">
                {task.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Task labels below */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4 w-full max-w-2xl">
        {tasks.map((task) => {
          const isDone = completed[task.id];
          return (
            <div
              key={task.id}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                isDone
                  ? 'bg-emerald2-500/10 border-emerald2-500/30'
                  : 'bg-ink-950/40 border-white/5'
              }`}
            >
              <span className="text-lg">{task.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isDone ? 'text-emerald2-400' : 'text-ink-300'}`}>{task.label}</p>
                <p className="text-[10px] text-ink-400">{isDone ? 'Complete' : 'Pending'}</p>
              </div>
              {isDone && <CheckCircle2 size={14} className="text-emerald2-400 flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, sub, color, index }: { icon: typeof Flame; label: string; value: string; sub?: string; color: string; index: number }) {
  return (
    <div className="card-premium p-4 stagger-in" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}20`, color }}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-ink-300">{label}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}
