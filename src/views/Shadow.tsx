import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  generateInsights,
  generateWarnings,
  generateRecommendations,
  generateGoalSuggestions,
  getMotivationQuote,
  generateShadowGreeting,
  generateShadowResponse,
} from '../lib/shadowEngine';
import {
  Sparkles, AlertTriangle, TrendingUp, Target, Trophy, Flame, Zap, Brain, Send, FileText, Lightbulb, Calendar, ChevronRight,
} from 'lucide-react';

type Tab = 'overview' | 'analysis' | 'reports' | 'goals' | 'chat';

export function Shadow() {
  const { state, sendChat } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const rank = getRankByXp(state.xp);
  const dailyReport = useMemo(() => generateDailyReport(state), [state]);
  const weeklyReport = useMemo(() => generateWeeklyReport(state), [state]);
  const monthlyReport = useMemo(() => generateMonthlyReport(state), [state]);
  const insights = useMemo(() => generateInsights(state), [state]);
  const warnings = useMemo(() => generateWarnings(state), [state]);
  const recommendations = useMemo(() => generateRecommendations(state), [state]);
  const goals = useMemo(() => generateGoalSuggestions(state), [state]);
  const motivation = useMemo(() => getMotivationQuote(state), [state.streak, new Date().getDate()]);
  const greeting = useMemo(() => generateShadowGreeting(state), [state.username, state.streak, state.xp]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chat, isTyping]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setIsTyping(true);
    sendChat(text);
    setTimeout(() => setIsTyping(false), 600);
  };

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'analysis', label: 'Analysis', icon: Brain },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'chat', label: 'Ask Shadow', icon: Send },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-premium p-6 md:p-8 relative overflow-hidden page-enter">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 0%, rgba(139,92,246,0.3), transparent 60%)' }}
        />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center energy-pulse"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <Sparkles size={28} className="text-shadow-400" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient-shadow">Shadow AI</h1>
            <p className="text-sm text-ink-300 mt-1">{greeting}</p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === id
                ? 'bg-gradient-to-r from-shadow-500/20 to-transparent text-shadow-400 border border-shadow-500/30 shadow-lg shadow-shadow-500/10'
                : 'bg-ink-900/60 text-ink-300 border border-white/5 hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <Icon size={16} />
            {label}
            {id === 'analysis' && warnings.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-danger-500/20 text-danger-400 text-[10px] font-bold flex items-center justify-center">
                {warnings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={tab} className="page-enter">
        {tab === 'overview' && <OverviewTab motivation={motivation} dailyReport={dailyReport} insights={insights} recommendations={recommendations} warnings={warnings} />}
        {tab === 'analysis' && <AnalysisTab insights={insights} warnings={warnings} recommendations={recommendations} />}
        {tab === 'reports' && <ReportsTab dailyReport={dailyReport} weeklyReport={weeklyReport} monthlyReport={monthlyReport} />}
        {tab === 'goals' && <GoalsTab goals={goals} />}
        {tab === 'chat' && (
          <ChatTab
            chat={state.chat}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={handleSendChat}
            isTyping={isTyping}
            chatEndRef={chatEndRef}
            username={state.username}
          />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ motivation, dailyReport, insights, recommendations, warnings }: {
  motivation: string;
  dailyReport: ReturnType<typeof generateDailyReport>;
  insights: ReturnType<typeof generateInsights>;
  recommendations: ReturnType<typeof generateRecommendations>;
  warnings: ReturnType<typeof generateWarnings>;
}) {
  return (
    <div className="space-y-4">
      {/* Motivation card */}
      <div className="card-premium p-5 relative overflow-hidden stagger-in">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.2), transparent 70%)' }} />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-shadow-500/15 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-shadow-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-shadow-400 font-semibold mb-1">Today's Motivation</p>
            <p className="text-sm text-ink-100 italic leading-relaxed">"{motivation}"</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat icon={Zap} label="Today's XP" value={dailyReport.xpEarned.toLocaleString()} color="#ff7a18" index={0} />
        <QuickStat icon={Target} label="Discipline" value={`${dailyReport.disciplineScore}%`} color="#8b5cf6" index={1} />
        <QuickStat icon={Flame} label="Streak" value={`${dailyReport.streak} days`} color="#f43f5e" index={2} />
        <QuickStat icon={TrendingUp} label="Productivity" value={`${dailyReport.productivityRating}%`} color="#10b981" index={3} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger-400" />
            Active Warnings ({warnings.length})
          </h3>
          {warnings.slice(0, 3).map((w, i) => (
            <WarningCard key={i} warning={w} index={i} />
          ))}
        </div>
      )}

      {/* Top recommendations */}
      {recommendations.length > 0 && (
        <div className="card-premium p-5 stagger-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold text-ink-200 flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-gold-400" />
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-ink-950/40 border border-white/5 hover:border-white/10 transition-colors">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: rec.priority === 'high' ? '#f43f5e' : rec.priority === 'medium' ? '#f59e0b' : '#10b981' }}
                />
                <div>
                  <p className="text-sm text-ink-100 font-medium">{rec.text}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top insights */}
      <div className="card-premium p-5 stagger-in" style={{ animationDelay: '0.15s' }}>
        <h3 className="text-sm font-semibold text-ink-200 flex items-center gap-2 mb-3">
          <Brain size={16} className="text-shadow-400" />
          AI Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {insights.slice(0, 6).map((ins, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5">
              <span className="text-xl">{ins.icon}</span>
              <div>
                <p className="text-xs text-ink-400">{ins.label}</p>
                <p className="text-sm font-semibold text-ink-100">{ins.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({ insights, warnings, recommendations }: {
  insights: ReturnType<typeof generateInsights>;
  warnings: ReturnType<typeof generateWarnings>;
  recommendations: ReturnType<typeof generateRecommendations>;
}) {
  return (
    <div className="space-y-4">
      {/* Warnings */}
      <div className="card-premium p-5 stagger-in">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-danger-400" />
          Smart Warnings
        </h3>
        {warnings.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald2-500/15 flex items-center justify-center mb-2">
              <Trophy size={20} className="text-emerald2-400" />
            </div>
            <p className="text-sm text-ink-300">No active warnings. Your discipline is stable.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <WarningCard key={i} warning={w} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="card-premium p-5 stagger-in" style={{ animationDelay: '0.05s' }}>
        <h3 className="section-title mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-gold-400" />
          Personal Recommendations
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-ink-300 text-center py-4">No urgent recommendations. You are on track.</p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5 hover:border-white/10 transition-colors">
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0"
                  style={{
                    background: rec.priority === 'high' ? 'rgba(244,63,94,0.2)' : rec.priority === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                    color: rec.priority === 'high' ? '#fb7185' : rec.priority === 'medium' ? '#fbbf24' : '#34d399',
                  }}
                >
                  {rec.priority}
                </div>
                <div>
                  <p className="text-sm text-ink-100 font-medium">{rec.text}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="card-premium p-5 stagger-in" style={{ animationDelay: '0.1s' }}>
        <h3 className="section-title mb-4 flex items-center gap-2">
          <Brain size={18} className="text-shadow-400" />
          AI Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-ink-950/40 border border-white/5">
              <span className="text-xl">{ins.icon}</span>
              <div>
                <p className="text-xs text-ink-400">{ins.label}</p>
                <p className="text-sm font-semibold text-ink-100">{ins.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ dailyReport, weeklyReport, monthlyReport }: {
  dailyReport: ReturnType<typeof generateDailyReport>;
  weeklyReport: ReturnType<typeof generateWeeklyReport>;
  monthlyReport: ReturnType<typeof generateMonthlyReport>;
}) {
  return (
    <div className="space-y-4">
      {/* Daily Report */}
      <div className="card-premium p-5 stagger-in">
        <h3 className="section-title mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-ember-400" />
          Daily Report — {dailyReport.date}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <ReportStat label="Tasks Completed" value={`${dailyReport.tasksCompleted}`} color="#10b981" />
          <ReportStat label="Tasks Missed" value={`${dailyReport.tasksMissed}`} color="#f43f5e" />
          <ReportStat label="XP Earned" value={dailyReport.xpEarned.toLocaleString()} color="#ff7a18" />
          <ReportStat label="Coins Earned" value={dailyReport.coinsEarned.toLocaleString()} color="#fbbf24" />
          <ReportStat label="Discipline Score" value={`${dailyReport.disciplineScore}%`} color="#8b5cf6" />
          <ReportStat label="Productivity" value={`${dailyReport.productivityRating}%`} color="#3b82f6" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="p-3 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
            <p className="text-xs text-emerald2-400 font-semibold uppercase mb-1">Best Achievement</p>
            <p className="text-ink-200">{dailyReport.bestAchievement}</p>
          </div>
          <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
            <p className="text-xs text-danger-400 font-semibold uppercase mb-1">Biggest Weakness</p>
            <p className="text-ink-200">{dailyReport.biggestWeakness}</p>
          </div>
          <div className="p-3 rounded-xl bg-shadow-500/10 border border-shadow-500/20">
            <p className="text-xs text-shadow-400 font-semibold uppercase mb-1">Advice for Tomorrow</p>
            <p className="text-ink-200">{dailyReport.advice}</p>
          </div>
        </div>
      </div>

      {/* Weekly Report */}
      <div className="card-premium p-5 stagger-in" style={{ animationDelay: '0.05s' }}>
        <h3 className="section-title mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-frost-400" />
          Weekly Report
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <ReportStat label="Total XP" value={weeklyReport.totalXp.toLocaleString()} color="#ff7a18" />
          <ReportStat label="Total Tasks" value={`${weeklyReport.totalTasks}`} color="#10b981" />
          <ReportStat label="Consistency" value={`${weeklyReport.consistencyRating}%`} color="#8b5cf6" />
          <ReportStat label="Improvement" value={`${weeklyReport.improvementScore >= 0 ? '+' : ''}${weeklyReport.improvementScore}`} color={weeklyReport.improvementScore >= 0 ? '#10b981' : '#f43f5e'} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
            <p className="text-xs text-emerald2-400 font-semibold uppercase mb-1">Best Day</p>
            <p className="text-sm text-ink-200">{weeklyReport.bestDay.date} ({weeklyReport.bestDay.score}%)</p>
          </div>
          <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
            <p className="text-xs text-danger-400 font-semibold uppercase mb-1">Worst Day</p>
            <p className="text-sm text-ink-200">{weeklyReport.worstDay.date} ({weeklyReport.worstDay.score}%)</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {weeklyReport.strengths.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
              <p className="text-xs text-emerald2-400 font-semibold uppercase mb-1">Strengths</p>
              <ul className="text-ink-200 space-y-1">
                {weeklyReport.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 text-emerald2-400" />{s}</li>)}
              </ul>
            </div>
          )}
          {weeklyReport.weaknesses.length > 0 && (
            <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
              <p className="text-xs text-danger-400 font-semibold uppercase mb-1">Weaknesses</p>
              <ul className="text-ink-200 space-y-1">
                {weeklyReport.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 text-danger-400" />{w}</li>)}
              </ul>
            </div>
          )}
          <div className="p-3 rounded-xl bg-shadow-500/10 border border-shadow-500/20">
            <p className="text-xs text-shadow-400 font-semibold uppercase mb-1">Shadow's Advice</p>
            <p className="text-ink-200">{weeklyReport.advice}</p>
          </div>
        </div>
      </div>

      {/* Monthly Report */}
      <div className="card-premium p-5 stagger-in" style={{ animationDelay: '0.1s' }}>
        <h3 className="section-title mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-gold-400" />
          Monthly Report
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <ReportStat label="XP Growth" value={monthlyReport.xpGrowth.toLocaleString()} color="#ff7a18" />
          <ReportStat label="Longest Streak" value={`${monthlyReport.longestStreak} days`} color="#f43f5e" />
          <ReportStat label="Task Completion" value={`${monthlyReport.taskCompletionPct}%`} color="#10b981" />
          <ReportStat label="Rank Progress" value={`${monthlyReport.rankProgress.from} → ${monthlyReport.rankProgress.to}`} color="#8b5cf6" />
          <ReportStat label="Best Week" value={`Week ${monthlyReport.mostProductiveWeek}`} color="#3b82f6" />
        </div>
        <div className="space-y-2 text-sm">
          <div className="p-3 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
            <p className="text-xs text-emerald2-400 font-semibold uppercase mb-1">Biggest Improvement</p>
            <p className="text-ink-200">{monthlyReport.biggestImprovement}</p>
          </div>
          <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
            <p className="text-xs text-danger-400 font-semibold uppercase mb-1">Areas Needing Work</p>
            <ul className="text-ink-200 space-y-1">
              {monthlyReport.areasNeedingWork.map((a, i) => <li key={i} className="flex items-start gap-2"><ChevronRight size={14} className="mt-0.5 text-danger-400" />{a}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsTab({ goals }: { goals: ReturnType<typeof generateGoalSuggestions> }) {
  return (
    <div className="space-y-3">
      <div className="card-premium p-5 stagger-in">
        <h3 className="section-title mb-2 flex items-center gap-2">
          <Target size={18} className="text-shadow-400" />
          Goal Planner
        </h3>
        <p className="text-sm text-ink-300 mb-4">Recommended goals based on your history. Realistic goals are marked with ✓.</p>
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all hover:-translate-y-0.5 stagger-in ${
                goal.realistic
                  ? 'bg-shadow-500/5 border-shadow-500/20'
                  : 'bg-ink-950/40 border-white/5'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${goal.realistic ? 'text-emerald2-400' : 'text-ink-400'}`}>
                      {goal.realistic ? '✓ Realistic' : '○ Ambitious'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink-100">{goal.label}</p>
                  <p className="text-xs text-ink-300 mt-1">{goal.description}</p>
                  <p className="text-xs text-ink-400 mt-1.5">Target: <span className="font-semibold text-shadow-400">{goal.target}</span></p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: goal.realistic ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)' }}
                >
                  <Target size={18} className={goal.realistic ? 'text-shadow-400' : 'text-ink-400'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatTab({ chat, chatInput, setChatInput, onSend, isTyping, chatEndRef, username }: {
  chat: { id: string; role: 'user' | 'ai'; text: string; at: number }[];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  username: string;
}) {
  const quickPrompts = ['Daily report', 'Weekly report', 'Recommendations', 'Insights', 'Warnings', 'Goals', 'Motivate me'];

  return (
    <div className="card-premium flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {chat.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 energy-pulse" style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Sparkles size={24} className="text-shadow-400" />
            </div>
            <p className="text-sm text-ink-300">Ask Shadow anything about your progress, discipline, or goals.</p>
          </div>
        )}
        {chat.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-shadow-500/15 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Sparkles size={14} className="text-shadow-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed stagger-in ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-ember-500/20 to-ember-600/10 border border-ember-500/20 text-ink-100 rounded-br-sm'
                  : 'bg-ink-800/60 border border-white/5 text-ink-200 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-lg bg-shadow-500/15 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
              <Sparkles size={14} className="text-shadow-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-ink-800/60 border border-white/5 rounded-bl-sm flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-shadow-400 typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setChatInput(prompt)}
            className="px-3 py-1 rounded-full text-xs bg-ink-800/60 border border-white/5 text-ink-300 hover:border-shadow-500/30 hover:text-shadow-400 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Ask Shadow..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        />
        <button onClick={onSend} disabled={!chatInput.trim()} className="btn-primary btn-sheen px-4">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function WarningCard({ warning, index }: { warning: ReturnType<typeof generateWarnings>[0]; index: number }) {
  const colors = {
    critical: { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', text: '#fb7185', icon: '#f43f5e' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24', icon: '#f59e0b' },
    info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: '#7dd3fc', icon: '#38bdf8' },
  };
  const c = colors[warning.level];
  return (
    <div
      className="p-4 rounded-xl border stagger-in"
      style={{ background: c.bg, borderColor: c.border, animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} style={{ color: c.icon }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold" style={{ color: c.text }}>{warning.title}</p>
          <p className="text-xs text-ink-300 mt-1">{warning.message}</p>
          <p className="text-xs mt-1.5" style={{ color: c.text }}>
            <span className="font-semibold">→</span> {warning.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color, index }: { icon: typeof Zap; label: string; value: string; color: string; index: number }) {
  return (
    <div className="card-premium p-4 stagger-in" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}20`, color }}>
        <Icon size={18} />
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-ink-300">{label}</p>
    </div>
  );
}

function ReportStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-ink-950/40 border border-white/5">
      <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-xs text-ink-300">{label}</p>
    </div>
  );
}
