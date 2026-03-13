import { useState, useEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const getBulgariaTime = () => {
  const now = new Date();
  const bgStr = now.toLocaleString('en-US', { timeZone: 'Europe/Sofia' });
  return new Date(bgStr);
};

export const AnalogClock = ({ size = 80 }: { size?: number }) => {
  const [time, setTime] = useState(getBulgariaTime);

  useEffect(() => {
    const id = setInterval(() => setTime(getBulgariaTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  const r = size / 2;
  const cx = r;
  const cy = r;

  const digitalTime = time.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Sofia' });
  const dateStr = time.toLocaleDateString('bg-BG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Sofia' });

  // Hour markers
  const markers = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6 - 90) * (Math.PI / 180);
    const isHour = i % 5 === 0;
    const isMain = i % 15 === 0;
    const outerR = r - 3;
    const innerR = r - (isMain ? 10 : isHour ? 7 : 4);
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
      isHour,
      isMain,
    };
  });

  // Numbers
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const num = i === 0 ? 12 : i;
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const numR = r - (size >= 80 ? 16 : 10);
    return {
      x: cx + numR * Math.cos(angle),
      y: cy + numR * Math.sin(angle),
      num,
    };
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-pointer shrink-0 rounded-full ring-2 ring-border/50 shadow-lg bg-card p-1" style={{ width: size + 8, height: size + 8 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Outer ring gradient */}
              <defs>
                <radialGradient id="clockFace" cx="40%" cy="35%">
                  <stop offset="0%" stopColor="hsl(var(--card))" />
                  <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
                </radialGradient>
              </defs>

              {/* Face */}
              <circle cx={cx} cy={cy} r={r - 1} fill="url(#clockFace)" className="stroke-border" strokeWidth="1" />
              
              {/* Inner decorative circles */}
              <circle cx={cx} cy={cy} r={r - 14} fill="none" className="stroke-border/20" strokeWidth="0.5" />

              {/* Minute markers */}
              {markers.map((m, i) => (
                <line
                  key={i}
                  x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                  className={m.isMain ? 'stroke-foreground' : m.isHour ? 'stroke-foreground/70' : 'stroke-muted-foreground/30'}
                  strokeWidth={m.isMain ? 2 : m.isHour ? 1.2 : 0.5}
                  strokeLinecap="round"
                />
              ))}

              {/* Numbers */}
              {numbers.map((n) => (
                <text
                  key={n.num}
                  x={n.x}
                  y={n.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground"
                  fontSize={size >= 80 ? 9 : 7}
                  fontWeight={n.num % 3 === 0 ? 700 : 500}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {n.num}
                </text>
              ))}

              {/* Hour hand - tapered */}
              <line
                x1={cx} y1={cy + 3}
                x2={cx} y2={cy - r * 0.38}
                className="stroke-foreground"
                strokeWidth={3}
                strokeLinecap="round"
                transform={`rotate(${hourDeg}, ${cx}, ${cy})`}
              />

              {/* Minute hand */}
              <line
                x1={cx} y1={cy + 4}
                x2={cx} y2={cy - r * 0.52}
                className="stroke-foreground"
                strokeWidth={2}
                strokeLinecap="round"
                transform={`rotate(${minuteDeg}, ${cx}, ${cy})`}
              />

              {/* Second hand */}
              <line
                x1={cx} y1={cy + r * 0.12}
                x2={cx} y2={cy - r * 0.56}
                className="stroke-primary"
                strokeWidth={1}
                strokeLinecap="round"
                transform={`rotate(${secondDeg}, ${cx}, ${cy})`}
              />

              {/* Center cap */}
              <circle cx={cx} cy={cy} r={3.5} className="fill-primary" />
              <circle cx={cx} cy={cy} r={1.5} className="fill-primary-foreground" />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="font-mono text-xs">{digitalTime} (България)</span>
        </TooltipContent>
      </Tooltip>
      <div className="text-center">
        <div className="text-xs font-mono font-semibold text-foreground">{digitalTime}</div>
        <div className="text-[10px] text-muted-foreground capitalize">{dateStr}</div>
      </div>
    </div>
  );
};
