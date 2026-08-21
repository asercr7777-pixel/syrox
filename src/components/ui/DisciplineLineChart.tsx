import { useMemo, useState } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }

export function DisciplineLineChart({ data, height = 240, showToday = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 900, H = 300;
  const pad = { top: 22, right: 24, bottom: 38, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const points = useMemo(() => {
    if (!data.length) return [];
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    return data.map((d, i) => ({ ...d, x: pad.left + i * step, y: pad.top + innerH - (Math.max(0, Math.min(100, d.score)) / 100) * innerH }));
  }, [data, innerW, innerH]);
  const metrics = useMemo(() => {
    const today = data.findIndex(p => p.isToday);
    const idx = today >= 0 ? today : Math.max(0, data.length - 1);
    const recent = data.slice(Math.max(0, idx - 6), idx + 1);
    const previous = data.slice(Math.max(0, idx - 13), Math.max(0, idx - 6));
    const avg = (a: DataPoint[]) => a.length ? Math.round(a.reduce((s, p) => s + p.score, 0) / a.length) : 0;
    return { todayScore: data[idx]?.score ?? 0, recentAvg: avg(recent), best: data.length ? Math.max(...data.map(p => p.score)) : 0, active: data.filter(p => p.score > 0).length, trend: avg(recent) - avg(previous.length ? previous : recent) };
  }, [data]);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = points.length ? `${line} L${points[points.length - 1].x} ${pad.top + innerH} L${points[0].x} ${pad.top + innerH} Z` : '';
  const moving = points.map((p, i) => {
    const values = data.slice(Math.max(0, i - 6), i + 1);
    const avg = values.reduce((s, v) => s + v.score, 0) / Math.max(1, values.length);
    return `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${(pad.top + innerH - (avg / 100) * innerH).toFixed(1)}`;
  }).join(' ');
  const hoveredPoint = hovered === null ? null : points[hovered];
  const formatDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return <div className="w-full">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
      <Metric label="Today" value={`${metrics.todayScore}%`} />
      <Metric label="7D average" value={`${metrics.recentAvg}%`} />
      <Metric label="Best" value={`${metrics.best}%`} />
      <Metric label="Active days" value={`${metrics.active}/${data.length}`} />
    </div>
    <div className="mb-2 flex items-center justify-between gap-3 text-[10px] sm:text-[11px] text-ink-500">
      <span className={metrics.trend >= 0 ? 'font-semibold text-emerald2-400' : 'font-semibold text-rose-400'}>{metrics.trend > 0 ? `+${metrics.trend}% vs previous 7 days` : metrics.trend < 0 ? `${metrics.trend}% vs previous 7 days` : 'Stable vs previous 7 days'}</span>
      <span>30-day discipline</span>
    </div>
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-ink-950/40">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="block w-full" role="img" aria-label={`30 day discipline trend. Today ${metrics.todayScore} percent, 7 day average ${metrics.recentAvg} percent, best ${metrics.best} percent.`}>
        <defs>
          <linearGradient id="disciplineAreaV2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff7a18" stopOpacity=".24"/><stop offset="1" stopColor="#ff7a18" stopOpacity="0"/></linearGradient>
          <linearGradient id="disciplineLineV2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffb27a"/><stop offset=".5" stopColor="#ff7a18"/><stop offset="1" stopColor="#ffd166"/></linearGradient>
          <filter id="disciplineGlowV2" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {[0,25,50,75,100].map(t => { const y = pad.top + innerH - (t / 100) * innerH; return <g key={t}><line x1={pad.left} x2={W-pad.right} y1={y} y2={y} stroke="rgba(255,255,255,.075)" strokeWidth="1" strokeDasharray={t ? '5 7' : undefined}/><text x={pad.left-10} y={y+4} textAnchor="end" fontSize="11" fill="rgba(230,234,245,.42)">{t}</text></g>; })}
        {points.length > 1 && <path d={area} fill="url(#disciplineAreaV2)"/>}
        {points.length > 1 && <path d={moving} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6 7" opacity=".55"/>}
        {points.length > 1 && <path d={line} fill="none" stroke="url(#disciplineLineV2)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#disciplineGlowV2)"/>}
        {points.map((p, i) => { const today = showToday && p.isToday; const active = hovered === i || today; return <g key={p.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
          <rect x={p.x - 18} y={pad.top} width="36" height={innerH} fill="transparent"/>
          <circle cx={p.x} cy={p.y} r={active ? 6 : 3.5} fill={today ? '#fbbf24' : '#ff7a18'} stroke="#07090f" strokeWidth="2"/>
          {today && <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#fbbf24" strokeOpacity=".35"/>}
          {active && <g><rect x={Math.max(4, Math.min(W-84, p.x-40))} y={Math.max(5, p.y-34)} width="80" height="25" rx="7" fill="#0b0d14" stroke="rgba(255,122,24,.45)"/><text x={Math.max(44, Math.min(W-44, p.x))} y={Math.max(21, p.y-17)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffd166">{p.score}%</text></g>}
        </g>; })}
        {points.map((p, i) => (i % 7 === 0 || i === points.length - 1) ? <text key={`d-${p.date}`} x={p.x} y={H-10} textAnchor="middle" fontSize="11" fill="rgba(230,234,245,.42)">{formatDate(p.date)}</text> : null)}
      </svg>
      {hoveredPoint && <div className="pointer-events-none absolute left-1/2 top-2 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-[11px] shadow-xl sm:block"><span className="font-semibold text-ember-400">{formatDate(hoveredPoint.date)}</span><span className="ml-3 text-ink-200">Score {hoveredPoint.score}%</span></div>}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-ink-500"><span className="flex items-center gap-1.5"><i className="h-1.5 w-5 rounded-full bg-ember-500"/>Daily score</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-5 border-t border-dashed border-ink-400"/>7-day average</span></div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.06] bg-ink-950/45 px-2.5 py-2"><p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p><p className="mt-0.5 text-sm font-bold tabular-nums text-ink-100 sm:text-base">{value}</p></div>; }

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days = 30): DataPoint[] {
  const today = new Date(); const todayStr = today.toISOString().slice(0, 10); const byDate = new Map(history.map(h => [h.date, h.disciplineScore]));
  return Array.from({ length: days }, (_, n) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - n)); const date = d.toISOString().slice(0, 10); return { date, score: Math.max(0, Math.min(100, byDate.get(date) ?? 0)), isToday: date === todayStr }; });
}
