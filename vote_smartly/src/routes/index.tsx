import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Accessibility, ArrowRight, Eye, Gamepad2, LayoutDashboard, RotateCcw, Vote } from "lucide-react";
import { ChatBubble } from "@/components/ChatBubble";
import { Countdown } from "@/components/Countdown";
import { PollingMap } from "@/components/PollingMap";
import { ProgressCore } from "@/components/ProgressCore";
import { QuestScreen } from "@/components/QuestScreen";
import { SpeakButton } from "@/components/SpeakButton";
import { Timeline } from "@/components/Timeline";
import { useProgress } from "@/hooks/useProgress";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useStepDetails } from "@/hooks/useStepDetails";
import { NEXT_ELECTION_DATE, STEPS } from "@/lib/election-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Voting Oracle — India Election Guide" },
      {
        name: "description",
        content:
          "A calm, beautiful guide to voting in India. Track your progress, find your polling booth, and ask the AI Oracle anything about the election process.",
      },
      { property: "og:title", content: "The Voting Oracle — India Election Guide" },
      {
        property: "og:description",
        content: "A calm, beautiful guide to voting in India.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const stepIds = useMemo(() => STEPS.map((s) => s.id), []);
  const progress = useProgress(stepIds);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [sessionNotice, setSessionNotice] = useState(false);
  const [mode, setMode] = useState<"classic" | "quest">("classic");
  const stepDetails = useStepDetails();

  const onTimeout = useCallback(() => setSessionNotice(true), []);
  useSessionTimeout(15 * 60 * 1000, onTimeout);

  // Fetch live India/ECI details when a step is opened.
  useEffect(() => {
    if (!expanded) return;
    const step = STEPS.find((s) => s.id === expanded);
    if (step) void stepDetails.load(step.id, step.title);
  }, [expanded, stepDetails]);

  const toggleContrast = useCallback(() => {
    setHighContrast((v) => {
      const next = !v;
      document.documentElement.classList.toggle("contrast-high", next);
      return next;
    });
  }, []);

  const nextStep = STEPS.find((s) => s.id === progress.nextStepId) ?? STEPS[STEPS.length - 1];
  const allDone = progress.done === progress.total;

  const handleStartNext = useCallback(() => {
    if (!nextStep) return;
    setExpanded(nextStep.id);
    document.getElementById(`step-anchor`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [nextStep]);

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Header
        onToggleContrast={toggleContrast}
        highContrast={highContrast}
        mode={mode}
        onModeChange={setMode}
      />

      {sessionNotice && (
        <div
          role="status"
          className="glass squircle mt-4 flex items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <span className="text-muted-foreground">
            You've been idle for a while — your chat session has been refreshed for privacy.
          </span>
          <button
            onClick={() => setSessionNotice(false)}
            className="focusable rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            Dismiss
          </button>
        </div>
      )}

      <Hero />

      {mode === "quest" ? (
        <section className="mt-8">
          <QuestScreen />
        </section>
      ) : (
        <>
          {/* Bento grid */}
          <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-5">
            {/* Hero "Next Step" card — spans 2 cols on desktop */}
            <BentoCard className="md:col-span-2 md:row-span-2">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Eyebrow icon={<Vote className="h-3 w-3" />}>
                      {allDone ? "You're ready" : "Next step"}
                    </Eyebrow>
                    <SpeakButton
                      text={allDone ? "All set. Go vote." : `${nextStep.title}. ${nextStep.short}`}
                      label="Read this step aloud"
                      size="sm"
                    />
                  </div>
                  <h2 className="font-display mt-3 text-3xl font-semibold text-balance text-foreground sm:text-4xl">
                    {allDone ? "All set. Go vote." : nextStep.title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {allDone
                      ? "You've completed every step in the guide. Carry your EPIC or an approved ID to your booth on polling day."
                      : nextStep.short}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={handleStartNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="focusable luminescent inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    {allDone ? "Review checklist" : "Start this step"}
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                  {progress.done > 0 && (
                    <button
                      type="button"
                      onClick={progress.reset}
                      className="focusable inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset progress
                    </button>
                  )}
                </div>
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-1 md:row-span-2">
              <Eyebrow>Progress core</Eyebrow>
              <div className="flex h-full items-center justify-center pt-4">
                <ProgressCore ratio={progress.ratio} done={progress.done} total={progress.total} />
              </div>
            </BentoCard>

            <BentoCard className="md:col-span-1">
              <Countdown date={NEXT_ELECTION_DATE} />
            </BentoCard>

            <BentoCard className="md:col-span-1">
              <Eyebrow>Did you know</Eyebrow>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                India's electorate is the world's largest — over <span className="font-semibold text-foreground">960 million</span> registered voters in 2024.
              </p>
            </BentoCard>
          </section>

          {/* Timeline + Map */}
          <section id="step-anchor" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-5">
            <BentoCard className="md:col-span-3">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">Your guide</h2>
                <span className="text-xs text-muted-foreground">Tap a circle to mark complete</span>
              </div>
              <Timeline
                steps={STEPS}
                completed={progress.completed}
                activeId={progress.nextStepId}
                expandedId={expanded}
                onToggleComplete={progress.toggle}
                onExpand={setExpanded}
                details={stepDetails.byId}
                onRetry={stepDetails.retry}
              />
            </BentoCard>

            <BentoCard className="md:col-span-2 !p-0 overflow-hidden">
              <div className="flex items-baseline justify-between p-5 pb-3">
                <h2 className="font-display text-xl font-semibold text-foreground">Find your booth</h2>
                <span className="text-xs text-muted-foreground">Approximate</span>
              </div>
              <div className="h-[420px] px-3 pb-3">
                <PollingMap />
              </div>
            </BentoCard>
          </section>
        </>
      )}

      <ChatBubble />
    </main>
  );
}

function Header({
  onToggleContrast,
  highContrast,
  mode,
  onModeChange,
}: {
  onToggleContrast: () => void;
  highContrast: boolean;
  mode: "classic" | "quest";
  onModeChange: (m: "classic" | "quest") => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="relative grid h-9 w-9 place-items-center rounded-2xl bg-card luminescent">
          <Vote className="h-4 w-4 text-primary" />
          <span aria-hidden className="absolute -inset-1 -z-10 rounded-3xl opacity-50 gemini-pulse blur-md" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold tracking-tight text-foreground">The Voting Oracle</div>
          <div className="text-[11px] text-muted-foreground">India election guide</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Mode toggle */}
        <div
          role="tablist"
          aria-label="Display mode"
          className="inline-flex items-center rounded-full border border-border bg-card/70 p-0.5 text-xs font-medium"
        >
          <button
            role="tab"
            aria-selected={mode === "classic"}
            onClick={() => onModeChange("classic")}
            className={`focusable inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
              mode === "classic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Classic
          </button>
          <button
            role="tab"
            aria-selected={mode === "quest"}
            onClick={() => onModeChange("quest")}
            className={`focusable inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
              mode === "quest" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" /> Quest
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleContrast}
          aria-pressed={highContrast}
          className="focusable inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {highContrast ? <Eye className="h-3.5 w-3.5" /> : <Accessibility className="h-3.5 w-3.5" />}
          {highContrast ? "Standard" : "High contrast"}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mt-10 sm:mt-14">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="font-display max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl"
      >
        Vote with{" "}
        <span className="bg-gradient-to-br from-primary via-primary-glow to-saffron bg-clip-text text-transparent">
          quiet confidence.
        </span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
      >
        A calm, step-by-step guide to the Indian election process — from voter registration to polling day. Ask the Oracle anything along the way.
      </motion.p>
    </section>
  );
}

function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}

function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={`glass squircle relative p-5 transition-shadow hover:shadow-[var(--shadow-elevated)] sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
