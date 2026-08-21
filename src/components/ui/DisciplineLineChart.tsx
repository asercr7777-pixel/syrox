import { useId, useMemo, useState } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }

export function DisciplineLineChart({ data, height = 260, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const rawId = useId();
  const chartId = rawId.replace(/:/g, '');
  const W = 900, H = 300;
  const pad = { top: 28, right: 28, bottom: 42, left: 42 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const points = useMemo(() => {
    if (!data.length) return [];
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    return data.map((d, i) => ({ ...d, x: pad.left + i * step, y: pad.top + innerH - (Math.max(0, Math.min(100, d.score)) / 100) * innerH }));
  }, [data, innerW, innerH]);

  const metrics = useMemo(() => {
    const todayIndex = data.findIndex(p => p.isToday);
    const idx = todayIndex >= 0 ? todayIndex : Math.max(0, data.length - 1);
    const recent = data.slice(Math.max(0, idx - 6), idx + 1);
    const previous = data.slice(Math.max(0, idx - 13), Math.max(0, idx - 6));
    const avg = (values: DataPoint[]) => values.length ? Math.round(values.reduce((s, p) => s + p.score, 0) / values.length) : 0;
    const recentAvg = avg(recent);
    const previousAvg = avg(previous);
    return { todayScore: data[idx]?.score ?? 0, recentAvg, best: data.length ? Math.max(...data.map(p => p.score)) : 0, active: data.filter(p => p.score > 0).length, trend: recent.length && previous.length ? recentAvg - previousAvg : 0 };
  }, [data]);

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L${points[points.length - 1].x.toFixed(1)} ${pad.top + innerH} L${points[0].x.toFixed(1)} ${pad.top + innerH} Z` : '';
  const selectedPoint = selected === null ? null : points[selected];
  const todayIndex = points.findIndex(p => p.isToday);
  const activeIndex = selected ?? (todayIndex >= 0 ? todayIndex : points.length - 1);
  const formatDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return <div className="w-full">
    <div className="mb-3 flex items-end justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">Performance</p><p className="mt-0.5 text-sm font-bold text-ink-100">Discipline over time</p></div>
      <div className="text-right"><p className="text-xl font-black tabular-nums text-ember-400">{metrics.todayScore}%</p><p className="text-[9px] uppercase tracking-wider text-ink-600">today</p></div>
    </div>
    <div className="grid grid-cols-3 gap-2 mb-3">
      <MiniMetric label="7D AVG" value={`${metrics.recentAvg}%`} />
      <MiniMetric label="BEST" value={`${metrics.best}%`} />
      <MiniMetric label="ACTIVE" value={`${metrics.active}/${data.length}`} />
    </div>
    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-ink-500">
      <span className={metrics.trend > 0 ? 'font-semibold text-emerald2-400' : metrics.trend < 0 ? 'font-semibold text-rose-400' : 'font-semibold text-ink-400'}>{metrics.trend > 0 ? `↗ +${metrics.trend}%` : metrics.trend < 0 ? `↘ ${metrics.trend}%` : '→ Stable'} <span className="font-normal text-ink-600">vs previous 7 days</span></span>
      <span>Tap a point</span>
    </div>
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-950/55 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
      {points.length === 0 ? <div className="flex items-center justify-center py-16 text-sm text-ink-500">No discipline history yet.</div> : <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="block w-full select-none" role="img" aria-label={`30 day discipline trend. Today ${metrics.todayScore} percent, 7 day average ${metrics.recentAvg} percent, best ${metrics.best} percent.`}>
        <defs>
          <linearGradient id={`${chartId}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff7a18" stopOpacity=".22"/><stop offset=".6" stopColor="#ff7a18" stopOpacity=".055"/><stop offset="1" stopColor="#ff7a18" stopOpacity="0"/></linearGradient>
          <linearGradient id={`${chartId}-line`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff9a4d"/><stop offset=".55" stopColor="#ff7a18"/><stop offset="1" stopColor="#ffd166"/></linearGradient>
          <filter id={`${chartId}-glow`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {[0,25,50,75,100].map(t => { const y = pad.top + innerH - (t / 100) * innerH; return <g key={t}><line x1={pad.left} x2={W-pad.right} y1={y} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth="1" strokeDasharray={t ? '3 8' : undefined}/>{t > 0 && <text x={W-pad.right+2} y={y+4} textAnchor="start" fontSize="9" fill="rgba(230,234,245,.25)">{t}</text>}</g>; })}
        {points.length > 1 && <path d={area} fill={`url(#${chartId}-area)`}/>} 
        {points.length > 1 && <path d={line} fill="none" stroke={`url(#${chartId}-line)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${chartId}-glow)`} className={animate ? 'chart-line-draw' : ''}/>} 
        {points.map((p, i) => { const today = showToday && p.isToday; const active = activeIndex === i; return <g key={p.date} className="cursor-pointer" onClick={() => setSelected(i === selected ? null : i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(i === selected ? null : i); } }} tabIndex={0} role="button" aria-label={`${formatDate(p.date)}: ${p.score}%`}>
          <rect x={Math.max(pad.left, p.x - 20)} y={pad.top} width="40" height={innerH} fill="transparent"/>
          {active && <circle cx={p.x} cy={p.y} r="12" fill="none" stroke={today ? '#fbbf24' : '#ff7a18'} strokeOpacity=".18" strokeWidth="5"/>}
          <circle cx={p.x} cy={p.y} r={active ? 5.5 : today ? 4.5 : 2.8} fill={today ? '#fbbf24' : '#ff8b38'} stroke="#080a10" strokeWidth="2"/>
          {today && <circle cx={p.x} cy={p.y} r="9" fill="none" stroke="#fbbf24" strokeOpacity=".28"/>}
          {active && <g><rect x={Math.max(4, Math.min(W-88, p.x-44))} y={Math.max(5, p.y-42)} width="88" height="28" rx="8" fill="#0b0d14" stroke={today ? 'rgba(251,191,36,.65)' : 'rgba(255,122,24,.55)'}/><text x={Math.max(48, Math.min(W-48, p.x))} y={Math.max(22, p.y-24)} textAnchor="middle" fontSize="11" fontWeight="700" fill={today ? '#ffd166' : '#ffb45f'}>{p.score}% · {formatDate(p.date)}</text></g>}
        </g>; })}
        {points.map((p, i) => (i % 7 === 0 || i === points.length - 1) ? <text key={`d-${p.date}`} x={p.x} y={H-10} textAnchor="middle" fontSize="10" fill="rgba(230,234,245,.32)">{formatDate(p.date)}</text> : null)}
      </svg>}
    </div>
    {selectedPoint && <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.06] bg-ink-950/50 px-3 py-2 text-[11px] sm:text-xs"><span className="text-ink-400">{formatDate(selectedPoint.date)}{selectedPoint.isToday ? ' · Today' : ''}</span><span className="font-bold text-ember-400">Discipline {selectedPoint.score}%</span></div>}
    <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-ink-600"><span>Daily performance</span><span>0 — 100%</span></div>
  </div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.055] bg-ink-950/35 px-2.5 py-1.5"><p className="text-[8px] font-semibold tracking-[0.14em] text-ink-600">{label}</p><p className="mt-0.5 text-xs font-bold tabular-nums text-ink-200">{value}</p></div>; }

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days = 30): DataPoint[] {
  const today = new Date(); const todayStr = today.toISOString().slice(0, 10); const byDate = new Map(history.map(h => [h.date, h.disciplineScore]));
  return Array.from({ length: days }, (_, n) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - n)); const date = d.toISOString().slice(0, 10); return { date, score: Math.max(0, Math.min(100, byDate.get(date) ?? 0)), isToday: date === todayStr }; });
}
