import { useState, useEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const getBulgariaTime = () => {
  const now = new Date();
  const bgStr = now.toLocaleString('en-US', { timeZone: 'Europe/Sofia' });
  return new Date(bgStr);
};

export const AnalogClock = ({ size = 36 }: { size?: number }) => {
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
  const markers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMain = i % 3 === 0;
    const outerR = r - 2;
    const innerR = r - (isMain ? 5 : 3);
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
      isMain,
    };
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative cursor-pointer shrink-0 rounded-full ring-1 ring-border/60 shadow-md bg-white" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Face */}
            <circle cx={cx} cy={cy} r={r - 1} fill="white" stroke="hsl(0 0% 85%)" strokeWidth="1" />

            {/* Markers */}
            {markers.map((m, i) => (
              <line
                key={i}
                x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
                className={m.isMain ? 'stroke-foreground' : 'stroke-muted-foreground/40'}
                strokeWidth={m.isMain ? 1.5 : 0.5}
                strokeLinecap="round"
              />
            ))}

            {/* Hour hand */}
            <line
              x1={cx} y1={cy + 2}
              x2={cx} y2={cy - r * 0.38}
              className="stroke-foreground"
              strokeWidth={2}
              strokeLinecap="round"
              transform={`rotate(${hourDeg}, ${cx}, ${cy})`}
            />

            {/* Minute hand */}
            <line
              x1={cx} y1={cy + 2}
              x2={cx} y2={cy - r * 0.52}
              className="stroke-foreground"
              strokeWidth={1.5}
              strokeLinecap="round"
              transform={`rotate(${minuteDeg}, ${cx}, ${cy})`}
            />

            {/* Second hand */}
            <line
              x1={cx} y1={cy + r * 0.1}
              x2={cx} y2={cy - r * 0.55}
              className="stroke-primary"
              strokeWidth={0.75}
              strokeLinecap="round"
              transform={`rotate(${secondDeg}, ${cx}, ${cy})`}
            />

            {/* Center dot */}
            <circle cx={cx} cy={cy} r={1.5} className="fill-primary" />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-center">
          <div className="font-mono text-xs font-semibold">{digitalTime}</div>
          <div className="text-[10px] text-muted-foreground capitalize">{dateStr} • България</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
