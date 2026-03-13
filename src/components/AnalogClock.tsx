import { useState, useEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const getBulgariaTime = () => {
  const now = new Date();
  const bgStr = now.toLocaleString('en-US', { timeZone: 'Europe/Sofia' });
  return new Date(bgStr);
};

export const AnalogClock = ({ size = 38 }: { size?: number }) => {
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

  // Hour markers
  const markers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMain = i % 3 === 0;
    const outerR = r - 2;
    const innerR = r - (isMain ? 6 : 4);
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
      isMain,
    };
  });

  // Numbers
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const num = i === 0 ? 12 : i;
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const numR = r - 10;
    return {
      x: cx + numR * Math.cos(angle),
      y: cy + numR * Math.sin(angle),
      num,
    };
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative cursor-pointer shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Face */}
            <circle cx={cx} cy={cy} r={r - 1} className="fill-card stroke-border" strokeWidth="1.5" />
            
            {/* Inner circle accent */}
            <circle cx={cx} cy={cy} r={r - 3} fill="none" className="stroke-muted-foreground/10" strokeWidth="0.5" />

            {/* Markers */}
            {markers.map((m, i) => (
              <line
                key={i}
                x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                className={m.isMain ? 'stroke-foreground' : 'stroke-muted-foreground/50'}
                strokeWidth={m.isMain ? 1.5 : 0.75}
                strokeLinecap="round"
              />
            ))}

            {/* Numbers - only show on larger clocks */}
            {size >= 60 && numbers.map((n) => (
              <text
                key={n.num}
                x={n.x}
                y={n.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground"
                fontSize={size >= 80 ? 7 : 5.5}
                fontWeight={n.num % 3 === 0 ? 700 : 500}
                fontFamily="system-ui"
              >
                {n.num}
              </text>
            ))}

            {/* Hour hand */}
            <line
              x1={cx} y1={cy}
              x2={cx} y2={cy - r * 0.4}
              className="stroke-foreground"
              strokeWidth={2}
              strokeLinecap="round"
              transform={`rotate(${hourDeg}, ${cx}, ${cy})`}
            />

            {/* Minute hand */}
            <line
              x1={cx} y1={cy}
              x2={cx} y2={cy - r * 0.55}
              className="stroke-foreground"
              strokeWidth={1.5}
              strokeLinecap="round"
              transform={`rotate(${minuteDeg}, ${cx}, ${cy})`}
            />

            {/* Second hand */}
            <line
              x1={cx} y1={cy + r * 0.1}
              x2={cx} y2={cy - r * 0.58}
              className="stroke-primary"
              strokeWidth={0.75}
              strokeLinecap="round"
              transform={`rotate(${secondDeg}, ${cx}, ${cy})`}
            />

            {/* Center dot */}
            <circle cx={cx} cy={cy} r={2} className="fill-primary" />
            <circle cx={cx} cy={cy} r={1} className="fill-primary-foreground" />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="font-mono text-xs">{digitalTime} (България)</span>
      </TooltipContent>
    </Tooltip>
  );
};
