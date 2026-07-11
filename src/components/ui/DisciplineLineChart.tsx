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
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        setWidth(entries[0].contentRect.width);
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setMounted(true), 100);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = Math.max(width - padding.left - padding.right, 100);
  const chartH = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;
    return data.map((d, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (d.score / 100) * chartH,
      ...d,
    }));
  }, [data, chartW, chartH, padding.left, padding.top]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x} ${padding.top + chartH} ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')} L ${last.x} ${padding.top + chartH} Z`;
  }, [points, chartH, padding.top]);

  const animProgress = mounted ? 1 : 0;
  const visiblePoints = Math.floor(points.length * animProgress);

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div ref={containerRef} className="w-full relative">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="disciplineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#ff7a18" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ff7a18" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="disciplineLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffb27a" />
            <stop offset="50%" stopColor="#ff7a18" />
            <stop offset="100%" stopColor="#e85d00" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pointGlow">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Y-axis grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartH - (tick / 100) * chartH;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray={tick === 0 ? '0' : '4 4'}
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(230,234,245,0.4)">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {points.length > 0 && (
          <path
            d={areaPath}
            fill="url(#disciplineArea)"
            style={{ opacity: animProgress, transition: 'opacity 1s ease' }}
          />
        )}

        {/* Line */}
        {points.length > 0 && (
          <path
            d={linePath}
            fill="none"
            stroke="url(#disciplineLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              strokeDasharray: points.length > 1 ? `${chartW * 2}` : '0',
              strokeDashoffset: animate ? chartW * 2 * (1 - animProgress) : 0,
              transition: 'stroke-dashoffset 1.5s ease',
            }}
          />
        )}

        {/* Points */}
        {points.map((p, i) => {
          if (i >= visiblePoints) return null;
          const isHovered = hovered === i;
          const isTodayPoint = p.isToday && showToday;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : isTodayPoint ? 5 : 3}
                fill={isTodayPoint ? '#fbbf24' : '#ff7a18'}
                stroke="#05060a"
                strokeWidth="2"
                style={{ opacity: animProgress, transition: 'r 0.2s, opacity 0.5s' }}
              />
              {isTodayPoint && (
                <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.5">
                  <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Invisible larger hit area */}
              <rect
                x={p.x - 15}
                y={padding.top}
                width={30}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        {/* X-axis labels (every 7th day) */}
        {points.map((p, i) => {
          if (i % 7 !== 0 && i !== points.length - 1) return null;
          const d = new Date(p.date);
          const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return (
            <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="rgba(230,234,245,0.4)">
              {label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered !== null && points[hovered] && (
        <div
          className="absolute pointer-events-none card-premium px-3 py-2.5 text-xs z-10 stagger-in"
          style={{
            left: Math.min(Math.max(points[hovered].x - 60, 0), width - 130),
            top: Math.max(points[hovered].y - 60, 0),
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          <p className="font-semibold text-ember-400">{new Date(points[hovered].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
          <p className="text-ink-200 mt-0.5">Discipline: <span className="font-bold">{points[hovered].score}%</span></p>
          {points[hovered].isToday && <p className="text-gold-400 font-semibold mt-0.5">Today</p>}
        </div>
      )}
    </div>
  );
}

export function buildDisciplineData(
  history: { date: string; disciplineScore: number }[],
  days: number = 30
): DataPoint[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const result: DataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const hist = history.find((h) => h.date === dateStr);
    result.push({
      date: dateStr,
      score: hist?.disciplineScore ?? 0,
      isToday: dateStr === todayStr,
    });
  }
  return result;
}
