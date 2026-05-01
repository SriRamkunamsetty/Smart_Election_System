import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  ratio: number; // 0..1
  done: number;
  total: number;
}

export function ProgressCore({ ratio, done, total }: Props) {
  const size = 168;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);

  const offset = c - animated * c;
  const pct = Math.round(ratio * 100);

  return (
    <div className="relative grid place-items-center" aria-label={`Progress: ${pct} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.58 0.19 258)" />
            <stop offset="60%" stopColor="oklch(0.7 0.18 290)" />
            <stop offset="100%" stopColor="oklch(0.78 0.17 60)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="oklch(0.9 0.01 260)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#progress-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          key={pct}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight tabular-nums text-foreground"
        >
          {pct}%
        </motion.div>
        <div className="mt-1 text-xs text-muted-foreground">
          {done} of {total} steps
        </div>
      </div>
    </div>
  );
}
