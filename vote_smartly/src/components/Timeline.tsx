import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { memo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { Step } from "@/lib/election-data";

type DetailsEntry = {
  status: "idle" | "loading" | "ready" | "error";
  content?: string;
  error?: string;
};

interface Props {
  steps: Step[];
  completed: Set<string>;
  activeId: string | null;
  expandedId: string | null;
  onToggleComplete: (id: string) => void;
  onExpand: (id: string | null) => void;
  details: Record<string, DetailsEntry>;
  onRetry: (stepId: string, stepTitle: string) => void;
}

function TimelineImpl({
  steps,
  completed,
  activeId,
  expandedId,
  onToggleComplete,
  onExpand,
  details,
  onRetry,
}: Props) {
  const handleExpand = useCallback(
    (id: string) => onExpand(expandedId === id ? null : id),
    [expandedId, onExpand],
  );

  return (
    <ol className="relative space-y-3" aria-label="Election guide timeline">
      <span
        aria-hidden
        className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent"
      />
      {steps.map((step, i) => {
        const isDone = completed.has(step.id);
        const isActive = activeId === step.id;
        const isExpanded = expandedId === step.id;

        return (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative pl-14"
          >
            <button
              type="button"
              aria-label={`Mark step ${i + 1} ${isDone ? "incomplete" : "complete"}: ${step.title}`}
              onClick={() => onToggleComplete(step.id)}
              className={`focusable absolute left-0 top-1.5 grid h-10 w-10 place-items-center rounded-full border transition-all ${
                isDone
                  ? "border-transparent bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.58_0.19_258/0.6)]"
                  : isActive
                    ? "breathing-glow border-primary/50 bg-background text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDone ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="num"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-semibold tabular-nums"
                  >
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <motion.button
              layout
              type="button"
              onClick={() => handleExpand(step.id)}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`focusable group block w-full rounded-2xl border px-5 py-4 text-left transition-shadow ${
                isExpanded
                  ? "border-primary/30 bg-card shadow-[var(--shadow-elevated)]"
                  : "border-border/70 bg-card/70 hover:shadow-[var(--shadow-soft)]"
              }`}
              aria-expanded={isExpanded}
            >
              <motion.div layout className="flex items-baseline justify-between gap-3">
                <h3
                  className={`font-display text-base font-semibold leading-snug ${
                    isDone ? "text-muted-foreground line-through decoration-1" : "text-foreground"
                  }`}
                >
                  {step.title}
                </h3>
                <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
                  ~{step.estimatedMinutes} min
                </span>
              </motion.div>
              <motion.p layout className="mt-1 text-sm text-muted-foreground">
                {step.short}
              </motion.p>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <StepDetails
                      step={step}
                      entry={details[step.id]}
                      onRetry={() => onRetry(step.id, step.title)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.li>
        );
      })}
    </ol>
  );
}

export const Timeline = memo(TimelineImpl);

function StepDetails({
  step,
  entry,
  onRetry,
}: {
  step: Step;
  entry: DetailsEntry | undefined;
  onRetry: () => void;
}) {
  const status = entry?.status ?? "loading";

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        Live from the Oracle
      </div>

      {status === "loading" && <DetailsSkeleton />}

      {status === "ready" && entry?.content && (
        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground/85 [&_a]:text-primary [&_a:hover]:underline [&_p]:my-2 [&_ul]:my-2 [&_li]:my-0.5 [&_strong]:text-foreground">
          <ReactMarkdown>{entry.content}</ReactMarkdown>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-foreground/80">{step.body}</p>
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="flex-1">{entry?.error ?? "Couldn't fetch live details."}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="focusable inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-background px-2.5 py-1 font-medium text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}

      {step.link && (
        <a
          href={step.link.href}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {step.link.label} →
        </a>
      )}
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {[88, 96, 72, 84].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-gradient-to-r from-muted via-muted/40 to-muted bg-[length:200%_100%]"
          style={{ width: `${w}%`, animation: "shimmer 1.6s ease-in-out infinite" }}
        />
      ))}
    </div>
  );
}
