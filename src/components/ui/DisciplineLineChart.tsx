import { useId, useMemo, useState } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }

export function DisciplineLineChart({ data, height = 260, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const rawId = useId();
  const chartId = rawId.replace(/:/g, '');
  const W = 900, H = 300;
  const pad = { top: 30, right: 34, bottom: 42, left: 34 };
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
  const todayIndex = points.findIndex(p => p.isToday);
  const hoverPoint = hovered === null ? null : points[hovered];
  const formatDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return <div className="w-full">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div><p className="text-[9px] font-bold uppercase tracking-[0.22em] text-ink-600">DISCIPLINE</p><p className="mt-1 text-base font-black tracking-tight text-ink-100">30 Day Progress</p></div>
      <div className="text-right"><p className="text-2xl font-black leading-none tabular-nums text-ember-400">{metrics.todayScore}%</p><p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-ink-600">Today</p></div>
    </div>

    <div className="mb-3 grid grid-cols-3 gap-2">
      <MiniMetric label="7D AVG" value={`${metrics.recentAvg}%`} />
      <MiniMetric label="BEST" value={`${metrics.best}%`} />
      <MiniMetric label="ACTIVE" value={`${metrics.active}/${data.length}`} />
    </div>

    <div className="mb-2 flex items-center justify-between text-[10px] text-ink-500">
      <span className={metrics.trend > 0 ? 'font-semibold text-emerald2-400' : metrics.trend < 0 ? 'font-semibold text-rose-400' : 'font-semibold text-ink-400'}>{metrics.trend > 0 ? `↗ +${metrics.trend}%` : metrics.trend < 0 ? `↘ ${metrics.trend}%` : '→ Stable'} <span className="font-normal text-ink-600">vs previous 7 days</span></span>
      <span className="text-ink-600">Hover to inspect</span>
    </div>

    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#090b10] shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
      {points.length === 0 ? <div className="flex items-center justify-center py-16 text-sm text-ink-500">No discipline history yet.</div> : <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="block w-full select-none" role="img" aria-label={`30 day discipline trend. Today ${metrics.todayScore} percent, 7 day average ${metrics.recentAvg} percent, best ${metrics.best} percent.`}>
          <defs>
            <linearGradient id={`${chartId}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff7a18" stopOpacity=".30"/><stop offset=".55" stopColor="#ff7a18" stopOpacity=".10"/><stop offset="1" stopColor="#ff7a18" stopOpacity="0"/></linearGradient>
            <linearGradient id={`${chartId}-stroke`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff9b52"/><stop offset=".55" stopColor="#ff7a18"/><stop offset="1" stopColor="#ffd166"/></linearGradient>
            <filter id={`${chartId}-glow`} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {[0,25,50,75,100].map(t => { const y = pad.top + innerH - (t / 100) * innerH; return <g key={t}><line x1={pad.left} x2={W-pad.right} y1={y} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth="1" strokeDasharray={t === 0 ? undefined : '2 9'}/>{t > 0 && <text x={W-pad.right+7} y={y+3} fontSize="9" fill="rgba(230,234,245,.20)">{t}</text>}</g>; })}
          {points.length > 1 && <path d={area} fill={`url(#${chartId}-fill)`}/>} 
          {points.length > 1 && <path d={line} fill="none" stroke={`url(#${chartId}-stroke)`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${chartId}-glow)`} className={animate ? 'chart-line-draw' : ''}/>} 

          {todayIndex >= 0 && showToday && <g>
            <line x1={points[todayIndex].x} x2={points[todayIndex].x} y1={pad.top} y2={pad.top+innerH} stroke="#fbbf24" strokeOpacity=".13" strokeWidth="1" strokeDasharray="3 6"/>
            <circle cx={points[todayIndex].x} cy={points[todayIndex].y} r="11" fill="#fbbf24" fillOpacity=".10"/>
            <circle cx={points[todayIndex].x} cy={points[todayIndex].y} r="5.5" fill="#ffd166" stroke="#0a0c12" strokeWidth="2"/>
            <g transform={`translate(${Math.max(8, Math.min(W-84, points[todayIndex].x-38))},${Math.max(5, points[todayIndex].y-48)})`}>
              <rect width="76" height="24" rx="7" fill="#11131a" stroke="rgba(251,191,36,.45)"/>
              <text x="38" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="#ffd166">TODAY · {metrics.todayScore}%</text>
            </g>
          </g>}

          {points.map((p, i) => <g key={p.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <rect x={Math.max(pad.left, p.x-16)} y={pad.top} width="32" height={innerH} fill="transparent" className="cursor-crosshair"/>
            {hovered === i && i !== todayIndex && <circle cx={p.x} cy={p.y} r="5" fill="#ff9b52" stroke="#090b10" strokeWidth="2"/>}
          </g>)}

          {points.map((p, i) => (i % 7 === 0 || i === points.length - 1) ? <text key={`d-${p.date}`} x={p.x} y={H-11} textAnchor="middle" fontSize="10" fill="rgba(230,234,245,.28)">{formatDate(p.date)}</text> : null)}
        </svg>

        {hoverPoint && <div className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-lg border border-white/[0.08] bg-ink-900/95 px-2.5 py-1.5 text-[10px] shadow-xl" style={{ left: `${(hoverPoint.x / W) * 100}%` }}><span className="font-semibold text-ink-300">{formatDate(hoverPoint.date)}</span><span className="ml-2 font-black text-ember-400">{hoverPoint.score}%</span></div>}
      </div>}
    </div>

    <div className="mt-2 flex items-center justify-between text-[9px] font-medium uppercase tracking-wider text-ink-600"><span>Daily discipline</span><span>0 — 100%</span></div>
  </div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.055] bg-ink-950/35 px-2.5 py-1.5"><p className="text-[8px] font-semibold tracking-[0.14em] text-ink-600">{label}</p><p className="mt-0.5 text-xs font-bold tabular-nums text-ink-200">{value}</p></div>; }

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days = 30): DataPoint[] {
  const today = new Date(); const todayStr = today.toISOString().slice(0, 10); const byDate = new Map(history.map(h => [h.date, h.disciplineScore]));
  return Array.from({ length: days }, (_, n) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - n)); const date = d.toISOString().slice(0, 10); return { date, score: Math.max(0, Math.min(100, byDate.get(date) ?? 0)), isToday: date === todayStr }; });
}
