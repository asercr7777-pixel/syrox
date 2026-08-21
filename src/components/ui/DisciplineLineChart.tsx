import { useId, useMemo, useState } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }

export function DisciplineLineChart({ data, height = 285, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const id = useId().replace(/:/g, '');
  const W = 920, H = 350;
  const pad = { top: 34, right: 30, bottom: 62, left: 40 };
  const innerW = W - pad.left - pad.right, innerH = H - pad.top - pad.bottom;
  const points = useMemo(() => {
    if (!data.length) return [];
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    return data.map((d, i) => ({ ...d, x: pad.left + i * step, y: pad.top + innerH - (Math.max(0, Math.min(100, d.score)) / 100) * innerH }));
  }, [data, innerW, innerH]);
  const metrics = useMemo(() => {
    const ti = data.findIndex(p => p.isToday); const idx = ti >= 0 ? ti : Math.max(0, data.length - 1);
    const avg = (arr: DataPoint[]) => arr.length ? Math.round(arr.reduce((s, p) => s + p.score, 0) / arr.length) : 0;
    const week = data.slice(Math.max(0, idx - 6), idx + 1); const prev = data.slice(Math.max(0, idx - 13), Math.max(0, idx - 6));
    return { score: data[idx]?.score ?? 0, avg: avg(week), best: data.length ? Math.max(...data.map(p => p.score)) : 0, trend: week.length && prev.length ? avg(week) - avg(prev) : 0, idx };
  }, [data]);
  const formatDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  const formatDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }).toUpperCase();
  const smoothLine = points.length > 1 ? points.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = points[i - 1]; const cx = (prev.x + p.x) / 2; return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`; }).join(' ') : '';
  const area = points.length > 1 ? `${smoothLine} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z` : '';
  const today = points[metrics.idx]; const hover = hovered === null ? null : points[hovered];
  const labelIndexes = points.map((_, i) => i).filter(i => i === 0 || i === 7 || i === 14 || i === 21 || i === points.length - 1);

  return <section className="w-full" aria-label="Discipline performance chart">
    <div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.24em] text-ink-600">Discipline analytics</p><h3 className="mt-1 text-base font-black tracking-tight text-ink-100">Your momentum</h3></div><div className="text-right"><p className="text-2xl font-black leading-none tabular-nums text-white">{metrics.score}<span className="text-sm text-ink-500">%</span></p><p className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-ink-600">Today</p></div></div>
    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-0.5"><Metric label="7D" value={`${metrics.avg}%`} /><Metric label="BEST" value={`${metrics.best}%`} /><div className={`ml-auto shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] ${metrics.trend > 0 ? 'text-emerald2-400' : metrics.trend < 0 ? 'text-rose-400' : 'text-ink-600'}`}>{metrics.trend > 0 ? `↑ ${metrics.trend}%` : metrics.trend < 0 ? `↓ ${Math.abs(metrics.trend)}%` : '—'} <span className="font-medium text-ink-700">trend</span></div></div>
    <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0b0d12]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(99,102,241,.10),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(16,185,129,.06),transparent_30%)]" />
      {points.length === 0 ? <div className="relative flex items-center justify-center py-20 text-sm text-ink-500">No discipline history yet.</div> : <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="block w-full select-none">
          <defs><linearGradient id={`${id}Area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity=".25"/><stop offset="48%" stopColor="#6366f1" stopOpacity=".08"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient><linearGradient id={`${id}Stroke`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34d399"/><stop offset="48%" stopColor="#818cf8"/><stop offset="100%" stopColor="#c4b5fd"/></linearGradient><filter id={`${id}Glow`} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          {[25,50,75].map(v => { const y = pad.top + innerH - v * innerH / 100; return <g key={v}><line x1={pad.left} x2={W-pad.right} y1={y} y2={y} stroke="rgba(255,255,255,.045)" strokeDasharray="2 12"/><text x={W-pad.right+7} y={y+3} fontSize="9" fill="rgba(255,255,255,.22)">{v}</text></g>; })}
          <line x1={pad.left} x2={W-pad.right} y1={pad.top+innerH} y2={pad.top+innerH} stroke="rgba(255,255,255,.10)"/>
          {points.length > 1 && <path d={area} fill={`url(#${id}Area)`}/>} {points.length > 1 && <path d={smoothLine} fill="none" stroke={`url(#${id}Stroke)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}Glow)`} className={animate ? 'chart-line-draw' : ''}/>} 
          {today && showToday && <g><line x1={today.x} x2={today.x} y1={pad.top} y2={pad.top+innerH} stroke="#a78bfa" strokeOpacity=".18" strokeDasharray="4 8"/><circle cx={today.x} cy={today.y} r="15" fill="#818cf8" fillOpacity=".08"/><circle cx={today.x} cy={today.y} r="6" fill="#c4b5fd" stroke="#0b0d12" strokeWidth="3"/><g transform={`translate(${Math.max(8, Math.min(W-104, today.x-47))},${Math.max(7, today.y-51)})`}><rect width="94" height="26" rx="8" fill="#151827" stroke="rgba(167,139,250,.38)"/><text x="47" y="16.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#c4b5fd">TODAY · {today.score}%</text></g></g>}
          {points.map((p, i) => <g key={p.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}><rect x={Math.max(pad.left, p.x-18)} y={pad.top} width="36" height={innerH} fill="transparent" className="cursor-crosshair"/>{hovered === i && i !== metrics.idx && <circle cx={p.x} cy={p.y} r="5" fill="#a78bfa" stroke="#0b0d12" strokeWidth="2.5"/>}</g>)}
          {labelIndexes.map(i => { const p = points[i]; const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'; return <g key={`label-${p.date}`}><text x={p.x} y={H-29} textAnchor={anchor} fontSize="8" fontWeight="700" letterSpacing="1.2" fill="rgba(255,255,255,.22)">{formatDay(p.date)}</text><text x={p.x} y={H-12} textAnchor={anchor} fontSize="10" fontWeight="600" fill="rgba(255,255,255,.38)">{formatDate(p.date)}</text></g>; })}
        </svg>
        {hover && <div className="pointer-events-none absolute top-3 -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#151827]/95 px-3 py-2 shadow-2xl" style={{ left: `${(hover.x / W) * 100}%` }}><div className="text-[9px] font-semibold text-ink-500">{formatDate(hover.date)}</div><div className="text-sm font-black text-violet-300">{hover.score}%</div></div>}
      </div>}
    </div>
    <div className="mt-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-700"><span>Last 30 days</span><span>0 — 100%</span></div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="shrink-0 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-1.5"><div className="text-[8px] font-bold tracking-[0.16em] text-ink-600">{label}</div><div className="mt-0.5 text-xs font-black tabular-nums text-ink-300">{value}</div></div>; }

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days = 30): DataPoint[] {
  const today = new Date(); const todayStr = today.toISOString().slice(0, 10); const byDate = new Map(history.map(h => [h.date, h.disciplineScore]));
  return Array.from({ length: days }, (_, n) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - n)); const date = d.toISOString().slice(0, 10); return { date, score: Math.max(0, Math.min(100, byDate.get(date) ?? 0)), isToday: date === todayStr }; });
}
