import { useId, useMemo, useState } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }

export function DisciplineLineChart({ data, height = 310, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const id = useId().replace(/:/g, '');
  const W = 960, H = 390;
  const pad = { top: 46, right: 34, bottom: 72, left: 48 };
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
  const labelIndexes = points.map((_, i) => i).filter(i => i === 0 || i === 5 || i === 10 || i === 15 || i === 20 || i === 25 || i === points.length - 1);
  const clipId = `${id}Clip`;

  return <section className="w-full" aria-label="Discipline performance chart">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div><div className="mb-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,.9)]"/><p className="text-[9px] font-bold uppercase tracking-[0.26em] text-ink-600">Performance intelligence</p></div><h3 className="text-lg font-black tracking-tight text-ink-100">Discipline momentum</h3></div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,.03)]"><p className="text-2xl font-black leading-none tabular-nums text-white">{metrics.score}<span className="text-sm text-ink-500">%</span></p><p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-ink-600">Today</p></div>
    </div>

    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
      <Metric icon="◈" label="7D AVG" value={`${metrics.avg}%`} />
      <Metric icon="✦" label="PEAK" value={`${metrics.best}%`} />
      <div className={`ml-auto flex shrink-0 items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] ${metrics.trend > 0 ? 'text-emerald2-400' : metrics.trend < 0 ? 'text-rose-400' : 'text-ink-600'}`}><span className="text-sm">{metrics.trend > 0 ? '↗' : metrics.trend < 0 ? '↘' : '→'}</span>{metrics.trend > 0 ? `+${metrics.trend}%` : metrics.trend < 0 ? `${metrics.trend}%` : 'STABLE'} <span className="font-medium text-ink-700">trend</span></div>
    </div>

    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#080a10] shadow-[0_20px_70px_rgba(0,0,0,.32),inset_0_1px_0_rgba(255,255,255,.035)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_5%,rgba(139,92,246,.15),transparent_30%),radial-gradient(circle_at_8%_90%,rgba(16,185,129,.08),transparent_28%)]" />
      <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full border border-violet-400/[0.06] shadow-[0_0_80px_rgba(139,92,246,.08)]" />
      {points.length === 0 ? <div className="relative flex items-center justify-center py-20 text-sm text-ink-500">No discipline history yet.</div> : <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="block w-full select-none">
          <defs>
            <linearGradient id={`${id}Area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity=".24"/><stop offset="42%" stopColor="#7c3aed" stopOpacity=".09"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/></linearGradient>
            <linearGradient id={`${id}Stroke`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#34d399"/><stop offset="38%" stopColor="#818cf8"/><stop offset="72%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#67e8f9"/></linearGradient>
            <linearGradient id={`${id}Shine`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity="0"/><stop offset="50%" stopColor="#fff" stopOpacity=".9"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>
            <filter id={`${id}Glow`} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <clipPath id={clipId}><rect x={pad.left} y={pad.top} width={innerW} height={innerH}/></clipPath>
          </defs>
          {[0,25,50,75,100].map(v => { const y = pad.top + innerH - v * innerH / 100; return <g key={v}><line x1={pad.left} x2={W-pad.right} y1={y} y2={y} stroke={v === 0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.045)'} strokeWidth={v === 0 ? 1.2 : 1} strokeDasharray={v && v !== 100 ? '2 11' : undefined}/>{v > 0 && <text x={W-pad.right+8} y={y+3} fontSize="9" fill="rgba(255,255,255,.20)">{v}</text>}</g>; })}
          <g clipPath={`url(#${clipId})`}>
            {points.length > 1 && <path d={area} fill={`url(#${id}Area)`}/>} 
            {points.length > 1 && <path d={smoothLine} fill="none" stroke={`url(#${id}Stroke)`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".16" filter={`url(#${id}Glow)`}/>} 
            {points.length > 1 && <path d={smoothLine} fill="none" stroke={`url(#${id}Stroke)`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}Glow)`} className={animate ? 'chart-line-draw' : ''}/>} 
            {points.length > 1 && <path d={smoothLine} fill="none" stroke={`url(#${id}Shine)`} strokeWidth="1" strokeLinecap="round" opacity=".45" className={animate ? 'chart-shine-sweep' : ''}/>} 
            {points.map((p, i) => <g key={p.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}><rect x={Math.max(pad.left, p.x-20)} y={pad.top} width="40" height={innerH} fill="transparent" className="cursor-crosshair"/>{hovered === i && i !== metrics.idx && <><circle cx={p.x} cy={p.y} r="12" fill="#a78bfa" fillOpacity=".07"/><circle cx={p.x} cy={p.y} r="4.5" fill="#ddd6fe" stroke="#080a10" strokeWidth="2.5"/></>}</g>)}
          </g>
          {today && showToday && <g>
            <line x1={today.x} x2={today.x} y1={pad.top} y2={pad.top+innerH} stroke="#a78bfa" strokeOpacity=".16" strokeDasharray="4 8"/>
            <circle cx={today.x} cy={today.y} r="20" fill="#8b5cf6" fillOpacity=".055" className="chart-today-pulse"/>
            <circle cx={today.x} cy={today.y} r="9" fill="#c4b5fd" fillOpacity=".16" className="chart-today-pulse"/>
            <circle cx={today.x} cy={today.y} r="5.5" fill="#f5f3ff" stroke="#171326" strokeWidth="3"/>
            <g transform={`translate(${Math.max(8, Math.min(W-116, today.x-53))},${Math.max(8, today.y-57)})`}><rect width="106" height="29" rx="10" fill="#121522" stroke="rgba(196,181,253,.34)"/><text x="53" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#ddd6fe">TODAY · {today.score}%</text></g>
          </g>}
          {labelIndexes.map(i => { const p = points[i]; const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'; return <g key={`label-${p.date}`}><text x={p.x} y={H-33} textAnchor={anchor} fontSize="8" fontWeight="700" letterSpacing="1.4" fill="rgba(255,255,255,.23)">{formatDay(p.date)}</text><text x={p.x} y={H-14} textAnchor={anchor} fontSize="10" fontWeight="700" fill="rgba(255,255,255,.42)">{formatDate(p.date)}</text></g>; })}
        </svg>
        {hover && <div className="pointer-events-none absolute top-4 -translate-x-1/2 rounded-xl border border-violet-300/10 bg-[#131724]/96 px-3 py-2 shadow-2xl backdrop-blur-md" style={{ left: `${(hover.x / W) * 100}%` }}><div className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">{formatDay(hover.date)} · {formatDate(hover.date)}</div><div className="mt-0.5 text-base font-black text-violet-200">{hover.score}%</div></div>}
      </div>}
    </div>
    <div className="mt-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-700"><span>Last 30 days</span><span>0 — 100%</span></div>
  </section>;
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) { return <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.02)]"><span className="text-[11px] text-violet-300/70">{icon}</span><div><div className="text-[7px] font-bold tracking-[0.16em] text-ink-600">{label}</div><div className="mt-0.5 text-xs font-black tabular-nums text-ink-300">{value}</div></div></div>; }

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days = 30): DataPoint[] {
  const today = new Date(); const todayStr = today.toISOString().slice(0, 10); const byDate = new Map(history.map(h => [h.date, h.disciplineScore]));
  return Array.from({ length: days }, (_, n) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - n)); const date = d.toISOString().slice(0, 10); return { date, score: Math.max(0, Math.min(100, byDate.get(date) ?? 0)), isToday: date === todayStr }; });
}
