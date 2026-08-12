import { useMemo, useState, useEffect, useRef } from 'react';

interface DataPoint {
  date: string;
  score: number;
  isToday: boolean;
}

interface DisciplineLineChartProps {
  data: DataPoint[];
  height?: number;
  showToday?: boolean;
  animate?: boolean;
}

export function DisciplineLineChart({ data, height = 200, showToday = true, animate = true }: DisciplineLineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(!animate);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 600;
      setWidth(Math.max(280, Math.floor(nextWidth)));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(t);
  }, [animate]);

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = Math.max(width - padding.left - padding.right, 100);
  const chartH = Math.max(height - padding.top - padding.bottom, 80);

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;
    return data.map((d, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (Math.max(0, Math.min(100, d.score)) / 100) * chartH,
      ...d,
    }));
  }, [data, chartW, chartH]);

  const linePath = useMemo(() => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '), [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x} ${padding.top + chartH} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${last.x} ${padding.top + chartH} Z`;
  }, [points, chartH]);

  const todayPoint = points.find((p) => p.isToday) ?? points[points.length - 1];
  const average = data.length ? Math.round(data.reduce((sum, p) => sum + p.score, 0) / data.length) : 0;
  const best = data.length ? Math.max(...data.map((p) => p.score)) : 0;
  const animProgress = mounted ? 1 : 0;
  const visiblePoints = mounted ? points.length : 0;
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="flex flex-wrap items-center justify-end gap-2 mb-2 text-[11px]">
        <span className="rounded-full border border-white/5 bg-ink-950/50 px-2.5 py-1 text-ink-300">Today <strong className="text-ember-400">{todayPoint?.score ?? 0}%</strong></span>
        <span className="rounded-full border border-white/5 bg-ink-950/50 px-2.5 py-1 text-ink-300">Avg <strong className="text-ink-100">{average}%</strong></span>
        <span className="rounded-full border border-white/5 bg-ink-950/50 px-2.5 py-1 text-ink-300">Best <strong className="text-gold-400">{best}%</strong></span>
      </div>

      <div className="relative overflow-hidden rounded-xl">
        <svg width={width} height={height} className="block w-full overflow-visible" role="img" aria-label={`Discipline graph. Today ${todayPoint?.score ?? 0} percent, average ${average} percent, best ${best} percent.`}>
          <defs>
            <linearGradient id="disciplineArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#ff7a18" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ff7a18" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="disciplineLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffb27a" />
              <stop offset="50%" stopColor="#ff7a18" />
              <stop offset="100%" stopColor="#e85d00" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {yTicks.map((tick) => {
            const y = padding.top + chartH - (tick / 100) * chartH;
            return (
              <g key={tick}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray={tick === 0 ? '0' : '4 4'} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(230,234,245,0.4)">{tick}</text>
              </g>
            );
          })}

          {points.length > 0 && <path d={areaPath} fill="url(#disciplineArea)" style={{ opacity: animProgress, transition: 'opacity 0.5s ease' }} />}
          {points.length > 1 && (
            <path d={linePath} fill="none" stroke="url(#disciplineLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" style={{ strokeDasharray: chartW * 2, strokeDashoffset: animate ? chartW * 2 * (1 - animProgress) : 0, transition: 'stroke-dashoffset 0.9s ease' }} />
          )}

          {points.map((p, i) => {
            if (i >= visiblePoints) return null;
            const isHovered = hovered === i;
            const isTodayPoint = p.isToday && showToday;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={isHovered ? 6 : isTodayPoint ? 5 : 3} fill={isTodayPoint ? '#fbbf24' : '#ff7a18'} stroke="#05060a" strokeWidth="2" />
                {isTodayPoint && <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.45" />}
                {p.score > 0 && (isHovered || isTodayPoint) && (
                  <g>
                    <rect x={Math.max(2, Math.min(width - 54, p.x - 26))} y={Math.max(2, p.y - 30)} width="52" height="22" rx="7" fill="#0b0d14" stroke="rgba(255,122,24,0.35)" />
                    <text x={Math.max(28, Math.min(width - 28, p.x))} y={Math.max(17, p.y - 15)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fbbf24">{p.score}%</text>
                  </g>
                )}
                <rect x={Math.max(padding.left, p.x - 15)} y={padding.top} width={30} height={chartH} fill="transparent" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
              </g>
            );
          })}

          {points.map((p, i) => {
            if (i % 7 !== 0 && i !== points.length - 1) return null;
            const d = new Date(`${p.date}T00:00:00`);
            return <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="rgba(230,234,245,0.4)">{d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</text>;
          })}
        </svg>
      </div>

      {hovered !== null && points[hovered] && (
        <div className="absolute pointer-events-none card-premium px-3 py-2 text-xs z-10" style={{ left: Math.min(Math.max(points[hovered].x - 60, 0), Math.max(0, width - 130)), top: Math.max(points[hovered].y - 55, 20) }}>
          <p className="font-semibold text-ember-400">{new Date(`${points[hovered].date}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
          <p className="text-ink-200 mt-0.5">Discipline: <span className="font-bold">{points[hovered].score}%</span></p>
          {points[hovered].isToday && <p className="text-gold-400 font-semibold mt-0.5">Today</p>}
        </div>
      )}
    </div>
  );
}

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
