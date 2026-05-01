import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { playFailure, playSuccess, playTap } from "@/lib/audio";
import { SpeakButton } from "@/components/SpeakButton";

type Candidate = { id: string; symbol: string; name: string };

const CANDIDATES: Candidate[] = [
  { id: "lotus", symbol: "🌸", name: "Lotus Party" },
  { id: "hand", symbol: "✋", name: "Hand Party" },
  { id: "broom", symbol: "🧹", name: "Broom Party" },
  { id: "cycle", symbol: "🚲", name: "Cycle Party" },
];
const NOTA: Candidate = { id: "nota", symbol: "🚫", name: "NOTA" };

type Phase = "choose" | "vvpat" | "ink" | "done";

export function EvmPractice() {
  const [phase, setPhase] = useState<Phase>("choose");
  const [picked, setPicked] = useState<Candidate | null>(null);

  function reset() {
    setPhase("choose");
    setPicked(null);
  }

  function pick(c: Candidate) {
    playTap();
    setPicked(c);
    setPhase("vvpat");
    window.setTimeout(() => {
      setPhase("ink");
      playSuccess();
    }, 1400);
    window.setTimeout(() => setPhase("done"), 2800);
  }

  const intro =
    "This is a practice voting machine. Press the blue button next to any candidate. The VVPAT slip will show your choice for seven seconds, and then you will see the indelible ink mark on your finger.";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">EVM practice</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try the machine. No real vote is cast.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SpeakButton text={intro} label="Listen to instructions" size="sm" />
          <button
            onClick={reset}
            aria-label="Reset"
            className="focusable inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </button>
        </div>
      </div>

      {/* Machine */}
      <div className="mx-auto mt-5 max-w-md rounded-3xl border border-border bg-gradient-to-b from-slate-100 to-slate-200 p-4 shadow-[var(--shadow-elevated)]">
        <div className="rounded-2xl bg-white/80 p-3">
          <ul className="divide-y divide-border/60">
            {[...CANDIDATES, NOTA].map((c) => {
              const isPicked = picked?.id === c.id;
              return (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-2xl" aria-hidden>
                    {c.symbol}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">{c.name}</span>
                  <motion.button
                    type="button"
                    aria-label={`Vote for ${c.name}`}
                    disabled={phase !== "choose"}
                    onClick={() => pick(c)}
                    whileTap={{ scale: 0.85 }}
                    animate={
                      isPicked
                        ? { boxShadow: ["0 0 0 0 rgba(26,115,232,0.6)", "0 0 0 18px rgba(26,115,232,0)"] }
                        : phase === "choose"
                        ? { boxShadow: ["0 0 0 0 rgba(26,115,232,0.4)", "0 0 0 10px rgba(26,115,232,0)"] }
                        : { boxShadow: "0 0 0 0 rgba(26,115,232,0)" }
                    }
                    transition={{ duration: 1.3, repeat: phase === "choose" ? Infinity : 0 }}
                    className="focusable h-9 w-9 rounded-full bg-primary text-primary-foreground luminescent disabled:opacity-50"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* VVPAT + Ink overlay */}
      <div className="relative mt-5 min-h-[120px]">
        <AnimatePresence mode="wait">
          {phase === "vvpat" && picked && (
            <motion.div
              key="vvpat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="status"
              aria-live="polite"
              className="mx-auto max-w-sm rounded-2xl border border-dashed border-foreground/30 bg-yellow-50 px-4 py-3 text-center font-mono text-sm shadow-inner"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">VVPAT slip</div>
              <div className="mt-1 text-3xl">{picked.symbol}</div>
              <div className="mt-0.5 text-foreground">{picked.name}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">Visible for 7 seconds</div>
            </motion.div>
          )}

          {(phase === "ink" || phase === "done") && (
            <motion.div
              key="ink"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <motion.div
                className="relative text-7xl"
                aria-label="Indelible ink mark on your finger — you have voted"
                animate={{ rotate: [0, -4, 4, 0] }}
                transition={{ duration: 0.6 }}
              >
                <span aria-hidden>☝🏽</span>
                <motion.span
                  aria-hidden
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 14 }}
                  className="absolute -bottom-1 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full"
                  style={{ background: "oklch(0.42 0.18 290)" }}
                />
              </motion.div>
              <div className="text-base font-semibold text-foreground">
                You have voted! 🎉
              </div>
              <div className="text-xs text-muted-foreground">
                The ink mark stays for several days — it is your proof.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
