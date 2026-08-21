import { useId, useMemo, useState, useEffect, useRef } from 'react';

interface DataPoint { date: string; score: number; isToday: boolean; }
interface DisciplineLineChartProps { data: DataPoint[]; height?: number; showToday?: boolean; animate?: boolean; }

export function DisciplineLineChart({ data, height = 220, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(!animate);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0]?.contentRect.width ?? 600);
      setWidth(Math.max(280, nextWidth));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(t);
  }, [animate]);

  const padding = { top: 24, right: 20, bottom: 34, left: 40 };
  const chartW = Math.max(width - padding.left - padding.right, 100);
  const chartH = Math.max(height - padding.top - padding.bottom, 80);

  const metrics = useMemo(() => {
    const best = data.length ? Math.max(...data.map((p) => p.score)) : 0;
    const todayIndex = data.findIndex((p) => p.isToday);
    const lastIndex = todayIndex >= 0 ? todayIndex : data.length - 1;
    const todayScore = lastIndex >= 0 ? data[lastIndex].score : 0;
    const recent = data.slice(Math.max(0, lastIndex - 6), lastIndex + 1);
    const previous = data.slice(Math.max(0, lastIndex - 13), Math.max(0, lastIndex - 6));
    const recentAvg = recent.length ? Math.round(recent.reduce((s, p) => s + p.score, 0) / recent.length) : 0;
    const previousAvg = previous.length ? Math.round(previous.reduce((s, p) => s + p.score, 0) / previous.length) : recentAvg;
    const trend = recentAvg - previousAvg;
    const activeDays = data.filter((p) => p.score > 0).length;
    return { best, todayScore, recentAvg, trend, activeDays, todayIndex: lastIndex };
  }, [data]);

  const points = useMemo(() => {
    if (!data.length) return [];
    const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;
    return data.map((d, i) => ({ x: padding.left + i * stepX, y: padding.top + chartH - (Math.max(0, Math.min(100, d.score)) / 100) * chartH, ...d }));
  }, [data, chartW, chartH]);

  const movingAverage = useMemo(() => points.map((p, i) => {
    const values = data.slice(Math.max(0, i - 6), i + 1);
    const avg = values.length ? values.reduce((sum, v) => sum + v.score, 0) / values.length : 0;
    return { x: p.x, y: padding.top + chartH - (avg / 100) * chartH };
  }), [points, data, chartH]);

  const linePath = useMemo(() => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '), [points]);
  const averagePath = useMemo(() => movingAverage.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '), [movingAverage]);
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const baseline = padding.top + chartH;
    return `M ${points[0].x} ${baseline} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${baseline} Z`;
  }, [points, chartH]);

  const animProgress = mounted ? 1 : 0;
  const yTicks = [0, 25, 50, 75, 100];
  const trendText = metrics.trend > 0 ? `+${metrics.trend}% vs previous 7 days` : metrics.trend < 0 ? `${metrics.trend}% vs previous 7 days` : 'Stable vs previous 7 days';

  return <div ref={containerRef} className="relative w-full">
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metric label="Today" value={`${metrics.todayScore}%`} accent="text-ember-400" />
      <Metric label="7D average" value={`${metrics.recentAvg}%`} accent="text-ink-100" />
      <Metric label="Best" value={`${metrics.best}%`} accent="text-gold-400" />
      <Metric label="Active days" value={`${metrics.activeDays}/${data.length}`} accent="text-emerald2-400" />
    </div>
    <div className="mb-2 flex items-center justify-between gap-3 text-[10px] text-ink-500 sm:text-[11px]">
      <span className={`font-semibold ${metrics.trend >= 0 ? 'text-emerald2-400' : 'text-rose-400'}`}>{trendText}</span>
      <span>30-day discipline</span>
    </div>
    <div className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-ink-950/35">
      {!data.length ? <div className="flex items-center justify-center text-xs text-ink-500" style={{ height }}>No discipline data yet</div> : <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="block overflow-visible" role="img" aria-label={`30 day discipline trend. Today ${metrics.todayScore} percent, 7 day average ${metrics.recentAvg} percent, best ${metrics.best} percent.`}>
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff7a18" stopOpacity="0.28" /><stop offset="65%" stopColor="#ff7a18" stopOpacity="0.06" /><stop offset="100%" stopColor="#ff7a18" stopOpacity="0" /></linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffb27a" /><stop offset="50%" stopColor="#ff7a18" /><stop offset="100%" stopColor="#e85d00" /></linearGradient>
          <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {yTicks.map((tick) => { const y = padding.top + chartH - (tick / 100) * chartH; return <g key={tick}><line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray={tick === 0 ? undefined : '4 4'} /><text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(230,234,245,0.4)">{tick}</text></g>; })}
        <path d={areaPath} fill={`url(#${gradientId}-area)`} style={{ opacity: animProgress, transition: 'opacity .5s ease' }} />
        {movingAverage.length > 1 && <path d={averagePath} fill="none" stroke="#a7adb9" strokeWidth="1.75" strokeDasharray="6 6" strokeLinecap="round" opacity="0.7" style={{ opacity: animProgress, transition: 'opacity .5s ease' }} />}
        {points.length > 1 && <path d={linePath} fill="none" stroke={`url(#${gradientId}-line)`} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${gradientId}-glow)`} style={{ strokeDasharray: Math.max(chartW * 2, 1000), strokeDashoffset: animate ? Math.max(chartW * 2, 1000) * (1 - animProgress) : 0, transition: 'stroke-dashoffset .9s ease' }} />}
        {points.map((p, i) => {
          const isHovered = hovered === i;
          const isTodayPoint = p.isToday && showToday;
          return <g key={i}>
            <rect x={Math.max(padding.left, p.x - 16)} y={padding.top} width={32} height={chartH} fill="transparent" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
            <circle cx={p.x} cy={p.y} r={isHovered ? 5.5 : isTodayPoint ? 5 : 2.75} fill={isTodayPoint ? '#fbbf24' : '#ff7a18'} stroke="#05060a" strokeWidth="2" />
            {isTodayPoint && <circle cx={p.x} cy={p.y} r="9" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.45" />}
            {(isHovered || isTodayPoint) && <g><rect x={Math.max(2, Math.min(width - 60, p.x - 29))} y={Math.max(2, p.y - 32)} width="58" height="24" rx="7" fill="#0b0d14" stroke="rgba(255,122,24,.4)" /><text x={Math.max(31, Math.min(width - 31, p.x))} y={Math.max(18, p.y - 16)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fbbf24">{p.score}%</text></g>}
          </g>;
        })}
        {points.map((p, i) => { if (i % 7 !== 0 && i !== points.length - 1) return null; const d = new Date(`${p.date}T00:00:00`); return <text key={i} x={p.x} y={height - 9} textAnchor="middle" fontSize="10" fill="rgba(230,234,245,.4)">{d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</text>; })}
      </svg>}
    </div>
    {hovered !== null && points[hovered] && <div className="pointer-events-none absolute z-10 card-premium px-3 py-2 text-xs" style={{ left: Math.min(Math.max(points[hovered].x - 65, 0), Math.max(0, width - 140)), top: Math.max(points[hovered].y - 62, 20) }}>
      <p className="font-semibold text-ember-400">{new Date(`${points[hovered].date}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
      <p className="mt-0.5 text-ink-200">Score: <span className="font-bold">{points[hovered].score}%</span></p>
      <p className="mt-0.5 text-ink-500">7D avg: {Math.round(data.slice(Math.max(0, hovered - 6), hovered + 1).reduce((s, p) => s + p.score, 0) / Math.max(1, data.slice(Math.max(0, hovered - 6), hovered + 1).length))}%</p>
    </div>}
    <div className="mt-3 flex items-center gap-4 text-[10px] text-ink-500"><span className="flex items-center gap-1.5"><i className="h-1.5 w-5 rounded-full bg-ember-500" /> Daily score</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-5 border-t border-dashed border-ink-400" /> 7-day average</span></div>
  </div>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) { return <div className="rounded-xl border border-white/[0.05] bg-ink-950/40 px-2.5 py-2"><p className="text-[10px] uppercase tracking-wider text-ink-500">{label}</p><p className={`mt-0.5 text-sm font-bold tabular-nums sm:text-base ${accent}`}>{value}</p></div>; }

export function buildDisciplineData(history: { date: string; disciplineScore: number }[], days: number = 30): DataPoint[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const byDate = new Map(history.map((h) => [h.date, h.disciplineScore]));
  const result: DataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, score: Math.max(0, Math.min(100, byDate.get(dateStr) ?? 0)), isToday: dateStr === todayStr });
  }
  return result;
}
