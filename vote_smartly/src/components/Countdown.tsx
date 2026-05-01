import { useEffect, useState } from "react";

interface Props {
  date: Date;
}

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function Countdown({ date }: Props) {
  const [t, setT] = useState(() => diff(date));
  useEffect(() => {
    const id = setInterval(() => setT(diff(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  const Tile = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="font-display text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
    </div>
  );

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Days until election
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <Tile value={t.d} label="Days" />
        <Tile value={t.h} label="Hours" />
        <Tile value={t.m} label="Min" />
        <Tile value={t.s} label="Sec" />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {date.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
