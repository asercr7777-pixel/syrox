import { useMemo, useState, type ReactNode } from 'react';
import { Activity, Brain, Check, ChevronRight, Flame, MessageCircle, RotateCcw, Send, ShieldCheck, Target, Timer, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

type Mode = 'today' | 'plan' | 'progress' | 'chat';
type Group = 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower' | 'Conditioning';
type DayPlan = { day: number; title: string; focus: string; exercises: string[] };

type CoachMessage = { role: 'shadow' | 'user'; text: string };

const PLAN: DayPlan[] = [
  { day: 1, title: 'Push', focus: 'Chest · Shoulders · Triceps', exercises: ['Push-ups', 'Pike Push-ups', 'Close-grip Push-ups', 'Front Plank'] },
  { day: 2, title: 'Pull', focus: 'Back · Biceps · Core', exercises: ['Backpack Rows', 'Reverse Snow Angels', 'Bird Dog', 'Side Plank'] },
  { day: 3, title: 'Legs', focus: 'Quads · Glutes · Calves', exercises: ['Squats', 'Reverse Lunges', 'Split Squats', 'Calf Raises'] },
  { day: 4, title: 'Upper', focus: 'Push · Pull · Core', exercises: ['Push-ups', 'Backpack Rows', 'Pike Push-ups', 'Dead Bug'] },
  { day: 5, title: 'Lower', focus: 'Posterior Chain · Stability', exercises: ['Glute Bridges', 'Reverse Lunges', 'Hip Hinge', 'Calf Raises'] },
  { day: 6, title: 'Conditioning', focus: 'Engine · Mobility · Recovery', exercises: ['Jumping Jacks', 'Mountain Climbers', 'World’s Greatest Stretch', 'Ankle Rocks'] },
];

const num = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function getCoachScore(raw: Record<string, unknown>) {
  const streak = num(raw.streak);
  const history = Array.isArray(raw.history) ? raw.history as Array<Record<string, unknown>> : [];
  const recent = history.slice(-7);
  const workoutDays = recent.filter(x => x.workoutCompleted === true).length;
  const completeDays = recent.filter(x => x.allMainDone === true).length;
  const consistency = recent.length ? ((workoutDays + completeDays) / (recent.length * 2)) * 100 : Math.min(100, streak * 10);
  return Math.max(35, Math.min(98, Math.round(consistency * 0.7 + Math.min(30, streak * 3))));
}

function chooseDay(raw: Record<string, unknown>) {
  const day = num(raw.workoutDay, 0);
  if (day >= 1 && day <= 6) return day;
  const history = Array.isArray(raw.history) ? raw.history as Array<Record<string, unknown>> : [];
  return (history.length % 6) + 1;
}

export default function ShadowAICinematic() {
  const { state } = useStore();
  const raw = state as unknown as Record<string, unknown>;
  const [mode, setMode] = useState<Mode>('today');
  const [selectedDay, setSelectedDay] = useState(chooseDay(raw));
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<CoachMessage[]>([
    { role: 'shadow', text: 'I am your coach. Tell me what you want to improve, what you completed, or what is stopping you. I will adjust the next move.' },
  ]);
  const [input, setInput] = useState('');

  const streak = num(raw.streak);
  const level = num(raw.level, 1);
  const xp = num(raw.xp);
  const score = getCoachScore(raw);
  const today = PLAN[selectedDay - 1];
  const completed = today.exercises.filter((_, i) => done[`${selectedDay}-${i}`]).length;
  const completion = Math.round((completed / today.exercises.length) * 100);

  const phase = level < 10 ? 'FOUNDATION' : level < 25 ? 'BUILD' : level < 50 ? 'ASCEND' : 'ELITE';
  const readiness = score >= 82 ? 'READY' : score >= 62 ? 'MODERATE' : 'RECOVERY';

  const recommendation = useMemo(() => {
    if (readiness === 'RECOVERY') return 'Reduce intensity today. Keep the session short, focus on technique and finish with mobility.';
    if (readiness === 'MODERATE') return 'Train, but do not chase failure. Leave 1–2 clean reps in reserve on hard sets.';
    return 'You are ready for a full-quality session. Push performance, not sloppy volume.';
  }, [readiness]);

  const send = (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text) return;
    const t = text.toLowerCase();
    let reply = 'Stay with the plan. Give me the result after the session and I will adjust the next one.';
    if (t.includes('rest') || t.includes('راحة') || t.includes('recover') || t.includes('استشفاء')) {
      reply = readiness === 'RECOVERY' ? 'Today is a recovery signal. Keep intensity low, sleep well, hydrate, and do mobility instead of forcing volume.' : 'Rest is part of the program. Keep at least one full recovery window between hard lower-body or power sessions.';
    } else if (t.includes('workout') || t.includes('تمر') || t.includes('تمرين') || t.includes('today')) {
      reply = `Today: Day ${selectedDay} — ${today.title}. Focus: ${today.focus}. Start with ${today.exercises[0]}, then move through the session in order.`;
    } else if (t.includes('weight') || t.includes('وزن') || t.includes('lose') || t.includes('تنشيف')) {
      reply = 'For body composition, consistency matters more than extreme restriction. Keep protein-rich meals, regular training, hydration and enough sleep.';
    } else if (t.includes('strong') || t.includes('قوة') || t.includes('strength')) {
      reply = 'For strength, use controlled reps, progressive difficulty and enough recovery. When the top of the rep range becomes easy, increase difficulty instead of adding endless volume.';
    } else if (t.includes('jump') || t.includes('dunk') || t.includes('قفز') || t.includes('دانك')) {
      reply = 'Power work needs freshness. Keep jumps explosive and low-volume, land quietly, and never stack hard plyometrics on an exhausted leg day.';
    }
    setMessages(prev => [...prev, { role: 'user', text }, { role: 'shadow', text: reply }]);
    setInput('');
  };

  const resetSession = () => setDone({});

  return (
    <section className="min-h-[70vh] space-y-4 pb-10 text-white">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/45 p-5 sm:p-7">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ember-500/30 bg-ember-500/10"><Brain className="text-ember-300" size={28} /></div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-ember-300"><ShieldCheck size={14} /> Shadow · Personal Coach</div>
              <h1 className="mt-1 text-2xl font-black sm:text-4xl">Your training has a system now.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Shadow reads your current progress, chooses the next training focus, tracks this session and adapts the coaching advice to your consistency.</p>
            </div>
          </div>
          <button onClick={resetSession} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold"><RotateCcw size={14} /> Reset session</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<Zap size={17} />} label="Readiness" value={`${score}%`} />
        <Stat icon={<Flame size={17} />} label="Streak" value={String(streak)} />
        <Stat icon={<Trophy size={17} />} label="Level" value={String(level)} />
        <Stat icon={<TrendingUp size={17} />} label="Phase" value={phase} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ModeButton active={mode === 'today'} icon={<Target size={16} />} label="Today" onClick={() => setMode('today')} />
        <ModeButton active={mode === 'plan'} icon={<Activity size={16} />} label="6-Day Plan" onClick={() => setMode('plan')} />
        <ModeButton active={mode === 'progress'} icon={<TrendingUp size={16} />} label="Progress" onClick={() => setMode('progress')} />
        <ModeButton active={mode === 'chat'} icon={<MessageCircle size={16} />} label="Talk" onClick={() => setMode('chat')} />
      </div>

      {mode === 'today' && <div className="space-y-4">
        <section className="rounded-2xl border border-ember-500/20 bg-ember-500/[.045] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-ember-300">Coach decision · {readiness}</div><h2 className="mt-1 text-xl font-black">Day {selectedDay} · {today.title}</h2><p className="mt-1 text-xs text-slate-500">{today.focus}</p></div>
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-right"><div className="text-[9px] uppercase text-slate-600">Session</div><b className="text-lg">{completion}%</b></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{recommendation}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Execute</div><h2 className="mt-1 text-xl font-black">{today.title}</h2></div><div className="text-xs font-bold text-slate-500">{completed}/{today.exercises.length}</div></div>
          <div className="space-y-2">{today.exercises.map((exercise, i) => { const key = `${selectedDay}-${i}`; const checked = !!done[key]; return <button key={exercise} onClick={() => setDone(v => ({ ...v, [key]: !v[key] }))} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${checked ? 'border-emerald-400/20 bg-emerald-400/[.05]' : 'border-white/5 bg-white/[.02] hover:bg-white/[.04]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${checked ? 'border-emerald-400/30 text-emerald-300' : 'border-white/10 text-slate-500'}`}>{checked ? <Check size={16} /> : i + 1}</span><span className="min-w-0 flex-1"><b className={checked ? 'text-slate-500 line-through' : 'text-slate-100'}>{exercise}</b><span className="mt-0.5 block text-[10px] text-slate-600">{readiness === 'RECOVERY' ? '2 easy sets · controlled' : '3 quality sets · stop before form breaks'}</span></span><ChevronRight size={15} className="text-slate-600" /></button>; })}</div>
        </section>
      </div>}

      {mode === 'plan' && <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5"><div className="mb-4"><div className="text-[10px] font-black uppercase tracking-[.2em] text-ember-300">Adaptive week</div><h2 className="mt-1 text-xl font-black">Six-day training system</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{PLAN.map(day => <button key={day.day} onClick={() => { setSelectedDay(day.day); setMode('today'); }} className={`rounded-2xl border p-4 text-left transition ${selectedDay === day.day ? 'border-ember-500/35 bg-ember-500/[.06]' : 'border-white/5 bg-black/20 hover:bg-white/[.03]'}`}><div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Day {day.day}</span><ChevronRight size={14} className="text-slate-700" /></div><b className="mt-2 block">{day.title}</b><span className="mt-1 block text-[10px] leading-5 text-slate-500">{day.focus}</span><span className="mt-3 block text-[10px] text-slate-600">{day.exercises.length} movements</span></button>)}</div></section>}

      {mode === 'progress' && <div className="grid gap-3 sm:grid-cols-2"><ProgressCard icon={<Flame size={17} />} title="Consistency" value={`${score}%`} text="Based on recent completed training and daily consistency." /><ProgressCard icon={<Trophy size={17} />} title="Current phase" value={phase} text={`Level ${level} · ${xp.toLocaleString()} XP. Keep building before chasing complexity.`} /><ProgressCard icon={<ShieldCheck size={17} />} title="Readiness" value={readiness} text={recommendation} /><ProgressCard icon={<Timer size={17} />} title="Coach rule" value="QUALITY" text="Technique first. Recovery is part of progression, not a failure." /></div>}

      {mode === 'chat' && <section className="rounded-2xl border border-white/10 bg-black/35 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-ember-300"><MessageCircle size={14} /> Shadow conversation</div><div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">{messages.map((message, i) => <div key={`${message.role}-${i}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'border-white/10 bg-white/[.06] text-slate-200' : 'border-ember-500/15 bg-ember-500/[.045] text-slate-300'}`}><div className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-600">{message.role === 'user' ? 'You' : 'Shadow'}</div>{message.text}</div></div>)}</div><div className="mt-4 flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Ask your coach..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700" /><button onClick={() => send()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-500 text-white"><Send size={17} /></button></div><div className="mt-3 flex flex-wrap gap-2">{['What should I train today?', 'How should I recover?', 'I want more strength', 'I want to jump higher'].map(q => <button key={q} onClick={() => send(q)} className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-2 text-[10px] text-slate-500 hover:text-slate-300">{q}</button>)}</div></section>}
    </section>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="mb-2 text-slate-500">{icon}</div><span className="block text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</span><b className="mt-1 block text-lg">{value}</b></div>;
}

function ModeButton({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-wider transition ${active ? 'border-ember-500/35 bg-ember-500/[.08] text-ember-200' : 'border-white/10 bg-black/20 text-slate-500 hover:text-slate-300'}`}>{icon}{label}</button>;
}

function ProgressCard({ icon, title, value, text }: { icon: ReactNode; title: string; value: string; text: string }) {
  return <section className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5"><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-[10px] font-black uppercase tracking-widest">{title}</span></div><b className="mt-3 block text-2xl">{value}</b><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></section>;
}
