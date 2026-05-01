import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { playTap } from "@/lib/audio";

export type Station = {
  id: string;
  title: string;
  emoji: string; // big visual icon
  caption: string;
};

type Props = {
  stations: Station[];
  activeId: string;
  completed: Set<string>;
  onSelect: (id: string) => void;
};

/** Visual roadmap — a winding "game board" path of stations.
 *  Designed to be readable without text: emoji icon, color, ring state.
 */
export function GameBoard({ stations, activeId, completed, onSelect }: Props) {
  return (
    <div className="relative">
      {/* Connecting path (decorative) */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="path-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.17 60)" />
            <stop offset="50%" stopColor="oklch(0.58 0.19 258)" />
            <stop offset="100%" stopColor="oklch(0.62 0.15 150)" />
          </linearGradient>
        </defs>
      </svg>

      <ol className="relative grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
        {stations.map((s, idx) => {
          const isDone = completed.has(s.id);
          const isActive = s.id === activeId;
          const isLocked = !isDone && !isActive && idx > 0 && !completed.has(stations[idx - 1].id);

          return (
            <li key={s.id} className="flex flex-col items-center text-center">
              <motion.button
                type="button"
                aria-label={`Station ${idx + 1}: ${s.title}. ${
                  isDone ? "Completed." : isActive ? "Current step." : isLocked ? "Locked." : "Available."
                }`}
                onClick={() => {
                  playTap();
                  onSelect(s.id);
                }}
                whileTap={{ scale: 0.9 }}
                whileHover={{ y: -4, scale: 1.04 }}
                animate={
                  isActive
                    ? { y: [0, -6, 0] }
                    : isDone
                    ? { rotate: [0, -2, 2, 0] }
                    : { y: 0, rotate: 0 }
                }
                transition={
                  isActive
                    ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4 }
                }
                className={`focusable relative grid h-24 w-24 place-items-center rounded-[28px] luminescent transition-colors ${
                  isDone
                    ? "bg-india-green/15 text-india-green ring-2 ring-india-green/40"
                    : isActive
                    ? "bg-primary/12 text-primary ring-2 ring-primary/50"
                    : "bg-card text-foreground ring-1 ring-border"
                }`}
              >
                <span className="text-5xl drop-shadow-sm" aria-hidden>
                  {s.emoji}
                </span>
                {isDone && (
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-india-green text-white shadow-md">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
                {isLocked && (
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground shadow-md">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -inset-2 -z-10 rounded-[36px] bg-primary/10 blur-xl"
                  />
                )}
              </motion.button>
              <div className="mt-3 max-w-[10rem] text-xs font-medium text-foreground">{s.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{s.caption}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
