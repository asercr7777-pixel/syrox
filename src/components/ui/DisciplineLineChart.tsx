import { useId, useMemo, useState } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }
type Range = '7D' | '30D' | '1Y';

export function DisciplineLineChart({ data, height = 310, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [range, setRange] = useState<Range>('7D');
  const id = useId().replace(/:/g, '');
  const W = 960, H = 390;
  const pad = { top: 46, right: 34, bottom: 70, left: 48 };
  const innerW = W - pad.left - pad.right, innerH = H - pad.top - pad.bottom;

  const visibleData = useMemo(() => {
    const count = range === '7D' ? 7 : range === '30D' ? 30 : 365;
    return data.slice(-count);
  }, [data, range]);

  const points = useMemo(() => {
    if (!visibleData.length) return [];
    const step = visibleData.length > 1 ? innerW / (visibleData.length - 1) : 0;
    return visibleData.map((d, i) => ({
      ...d,
      x: pad.left + i * step,
      y: pad.top + innerH - (Math.max(0, Math.min(100, d.score)) / 100) * innerH,
    }));
  }, [visibleData, innerW, innerH]);

  const metrics = useMemo(() => {
    const todayIndex = visibleData.findIndex(p => p.isToday);
    const idx = todayIndex >= 0 ? todayIndex : Math.max(0, visibleData.length - 1);
    const avg = (arr: DataPoint[]) => arr.length ? Math.round(arr.reduce((sum, p) => sum + p.score, 0) / arr.length) : 0;
    const week = visibleData.slice(-7);
    return {
      score: visibleData[idx]?.score ?? 0,
      avg: avg(week),
      best: visibleData.length ? Math.max(...visibleData.map(p => p.score)) : 0,
      idx,
    };
  }, [visibleData]);

  const formatDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  const formatDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en', { weekday: 'short' }).toUpperCase();

  const smoothLine = points.length > 1
    ? points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
      }).join(' ')
    : '';

  const area = points.length > 1
    ? `${smoothLine} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`
    : '';

  const today = points[metrics.idx];
  const hover = hovered === null ? null : points[hovered];
  const clipId = `${id}Clip`;
  const labelIndexes = points.length <= 10
    ? points.map((_, i) => i)
    : points.map((_, i) => i).filter(i => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0);

  return (
    <section className="w-full" aria-label="Discipline performance chart">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,.9)]" />
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-ink-600">Performance intelligence</p>
          </div>
          <h3 className="text-lg font-black tracking-tight text-ink-100">Discipline momentum</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
            {(['7D', '30D', '1Y'] as Range[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setRange(r); setHovered(null); }}
                className={`rounded-lg px-3 py-1.5 text-[9px] font-black tracking-[0.14em] transition-all ${range === r ? 'bg-violet-500/20 text-violet-200 shadow-[0_0_18px_rgba(139,92,246,.12)]' : 'text-ink-600 hover:text-ink-300'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-right">
            <p className="text-2xl font-black leading-none tabular-nums text-white">{metrics.score}<span className="text-sm text-ink-500">%</span></p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-ink-600">Today</p>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
        <Metric icon="◈" label="7D AVG" value={`${metrics.avg}%`} />
        <Metric icon="✦" label="PEAK" value={`${metrics.best}%`} />
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#080a10] shadow-[0_20px_70px_rgba(0,0,0,.32)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_5%,rgba(139,92,246,.15),transparent_30%),radial-gradient(circle_at_8%_90%,rgba(16,185,129,.08),transparent_28%)]" />
        {points.length === 0 ? (
          <div className="relative flex items-center justify-center py-20 text-sm text-ink-500">No discipline history yet.</div>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="block w-full select-none">
              <defs>
                <linearGradient id={`${id}Area`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity=".24" />
                  <stop offset="45%" stopColor="#7c3aed" stopOpacity=".08" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${id}Stroke`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="38%" stopColor="#818cf8" />
                  <stop offset="72%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>
                <filter id={`${id}Glow`} x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <clipPath id={clipId}><rect x={pad.left} y={pad.top} width={innerW} height={innerH} /></clipPath>
              </defs>

              {[0, 25, 50, 75, 100].map(v => {
                const y = pad.top + innerH - v * innerH / 100;
                return (
                  <g key={v}>
                    <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke={v === 0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.045)'} strokeWidth={v === 0 ? 1.2 : 1} strokeDasharray={v && v !== 100 ? '2 11' : undefined} />
                    {v > 0 && <text x={W - pad.right + 8} y={y + 3} fontSize="9" fill="rgba(255,255,255,.20)">{v}</text>}
                  </g>
                );
              })}

              <g clipPath={`url(#${clipId})`}>
                {points.length > 1 && <path d={area} fill={`url(#${id}Area)`} />}
                {points.length > 1 && <path d={smoothLine} fill="none" stroke={`url(#${id}Stroke)`} strokeWidth="7" strokeLinecap="round" opacity=".16" filter={`url(#${id}Glow)`} />}
                {points.length > 1 && <path d={smoothLine} fill="none" stroke={`url(#${id}Stroke)`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}Glow)`} className={animate ? 'chart-line-draw' : ''} />}
                {points.map((p, i) => (
                  <g key={p.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                    <rect x={Math.max(pad.left, p.x - 16)} y={pad.top} width="32" height={innerH} fill="transparent" className="cursor-crosshair" />
                    {hovered === i && <><circle cx={p.x} cy={p.y} r="12" fill="#a78bfa" fillOpacity=".07" /><circle cx={p.x} cy={p.y} r="4.5" fill="#ddd6fe" stroke="#080a10" strokeWidth="2.5" /></>}
                  </g>
                ))}
              </g>

              {today && showToday && (
                <g>
                  <line x1={today.x} x2={today.x} y1={pad.top} y2={pad.top + innerH} stroke="#a78bfa" strokeOpacity=".16" strokeDasharray="4 8" />
                  <circle cx={today.x} cy={today.y} r="20" fill="#8b5cf6" fillOpacity=".055" className="chart-today-pulse" />
                  <circle cx={today.x} cy={today.y} r="5.5" fill="#f5f3ff" stroke="#171326" strokeWidth="3" />
                </g>
              )}

              {labelIndexes.map(i => {
                const p = points[i];
                return (
                  <g key={`axis-${p.date}`}>
                    <line x1={p.x} x2={p.x} y1={pad.top + innerH} y2={pad.top + innerH + 7} stroke="rgba(255,255,255,.16)" />
                    <text x={p.x} y={H - 31} textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(255,255,255,.30)">{formatDay(p.date)}</text>
                    <text x={p.x} y={H - 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(255,255,255,.48)">{formatDate(p.date)}</text>
                  </g>
                );
              })}
            </svg>

            {hover && (
              <div className="pointer-events-none absolute top-4 -translate-x-1/2 rounded-xl border border-violet-300/10 bg-[#131724]/96 px-3 py-2 shadow-2xl backdrop-blur-md" style={{ left: `${(hover.x / W) * 100}%` }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">{formatDay(hover.date)} · {formatDate(hover.date)}</div>
                <div className="mt-0.5 text-base font-black text-violet-200">{hover.score}%</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-700">
        <span>{range === '7D' ? 'Last 7 days' : range === '30D' ? 'Last 30 days' : 'Last year'}</span>
        <span>0 — 100%</span>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-1.5"><span className="text-[11px] text-violet-300/70">{icon}</span><div><div className="text-[7px] font-bold tracking-[0.16em] text-ink-600">{label}</div><div className="mt-0.5 text-xs font-black tabular-nums text-ink-300">{value}</div></div></div>;
}

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days = 365): DataPoint[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const byDate = new Map(history.map(h => [h.date, h.disciplineScore]));
  return Array.from({ length: days }, (_, n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - n));
    const date = d.toISOString().slice(0, 10);
    return { date, score: Math.max(0, Math.min(100, byDate.get(date) ?? 0)), isToday: date === todayStr };
  });
}
