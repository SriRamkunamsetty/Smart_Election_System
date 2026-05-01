import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, Sparkles } from "lucide-react";
import { GameBoard, type Station } from "@/components/GameBoard";
import { DocumentMatchGame } from "@/components/DocumentMatchGame";
import { IdPhotoCheck } from "@/components/IdPhotoCheck";
import { EvmPractice } from "@/components/EvmPractice";
import { SpeakButton } from "@/components/SpeakButton";
import { useProgress } from "@/hooks/useProgress";
import { playSuccess } from "@/lib/audio";

const STATIONS: Station[] = [
  { id: "eligibility", title: "Am I eligible?", emoji: "🪪", caption: "Citizen, 18+" },
  { id: "register", title: "Register", emoji: "📝", caption: "Form 6 / NVSP" },
  { id: "verify", title: "Check my ID", emoji: "🔍", caption: "Photo check" },
  { id: "documents", title: "Pack my docs", emoji: "🎒", caption: "Drag game" },
  { id: "booth", title: "Find my booth", emoji: "📍", caption: "On the map" },
  { id: "vote", title: "Vote!", emoji: "🗳️", caption: "Practice EVM" },
];

const STATION_INTRO: Record<string, string> = {
  eligibility:
    "Station 1. Am I eligible? You can vote in India if you are an Indian citizen and at least 18 years old on the qualifying date.",
  register:
    "Station 2. Register to vote. Use Form 6 on the Voters Service Portal or the Voter Helpline app. You will need a photo, an ID proof, and an address proof.",
  verify:
    "Station 3. Check your ID. Take a photo of your Aadhaar, Voter ID, Passport, or Driving Licence. The Oracle will tell you if it looks good.",
  documents:
    "Station 4. Pack your documents. Drag the right cards into the voting box. Aadhaar, Voter ID, Passport, and Driving Licence are accepted. Other cards are not.",
  booth:
    "Station 5. Find your polling booth. Your booth is decided by your part number in the electoral roll. Switch to Classic mode to see it on the map.",
  vote:
    "Station 6. Vote! Press the blue button next to your candidate. Watch the VVPAT slip for seven seconds. Then check the indelible ink mark on your finger.",
};

export function QuestScreen() {
  const stationIds = useMemo(() => STATIONS.map((s) => s.id), []);
  const progress = useProgress(stationIds);
  const [active, setActive] = useState<string>(progress.nextStepId ?? "eligibility");

  const station = STATIONS.find((s) => s.id === active) ?? STATIONS[0];
  const isDone = progress.completed.has(station.id);

  function complete() {
    if (!isDone) {
      progress.toggle(station.id);
      playSuccess();
    }
    // advance
    const idx = STATIONS.findIndex((s) => s.id === station.id);
    const next = STATIONS[idx + 1];
    if (next) setActive(next.id);
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass squircle p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Voting quest
          </div>
          <SpeakButton
            text={`Welcome to the voting quest. There are ${STATIONS.length} stations. Tap any station to start. ${
              STATION_INTRO[station.id] ?? ""
            }`}
            label="Read the quest map"
            size="md"
          />
        </div>

        <h2 className="font-display mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
          Pick a station
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Big icons. Big buttons. Tap a station, listen to the steps, and play the mini-game.
        </p>

        <div className="mt-6">
          <GameBoard
            stations={STATIONS}
            activeId={active}
            completed={progress.completed}
            onSelect={setActive}
          />
        </div>
      </motion.div>

      {/* Station detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={station.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="glass squircle p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-3xl" aria-hidden>
                {station.emoji}
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Station {STATIONS.findIndex((s) => s.id === station.id) + 1} of {STATIONS.length}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{station.title}</h3>
              </div>
            </div>
            <SpeakButton text={STATION_INTRO[station.id] ?? station.title} label="Read this station aloud" />
          </div>

          <div className="mt-5">
            <StationContent id={station.id} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const idx = STATIONS.findIndex((s) => s.id === station.id);
                if (idx > 0) setActive(STATIONS[idx - 1].id);
              }}
              disabled={STATIONS[0].id === station.id}
              className="focusable inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>

            <motion.button
              type="button"
              onClick={complete}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              className="focusable luminescent inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {isDone ? "Next station" : "I did this"}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StationContent({ id }: { id: string }) {
  switch (id) {
    case "documents":
      return <DocumentMatchGame />;
    case "verify":
      return <IdPhotoCheck />;
    case "vote":
      return <EvmPractice />;
    case "eligibility":
      return (
        <BigVisual
          icon="🇮🇳"
          headline="Citizen of India + 18 years or older"
          bullets={["Indian citizen", "At least 18 on the qualifying date", "Living in your constituency"]}
        />
      );
    case "register":
      return (
        <BigVisual
          icon="📝"
          headline="Fill Form 6 — online or offline"
          bullets={[
            "Open voters.eci.gov.in or the Voter Helpline app",
            "Add a passport-size photo, ID proof, and address proof",
            "Wait for your EPIC (Voter ID) card",
          ]}
        />
      );
    case "booth":
      return (
        <BigVisual
          icon="📍"
          headline="Your booth is decided by your part number"
          bullets={[
            "Search by EPIC, name, or mobile",
            "Save the address and route the night before",
            "Switch to Classic mode to see the live map",
          ]}
        />
      );
    default:
      return null;
  }
}

function BigVisual({
  icon,
  headline,
  bullets,
}: {
  icon: string;
  headline: string;
  bullets: string[];
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto,1fr] sm:gap-6">
      <div className="grid h-32 w-32 place-items-center rounded-[32px] bg-gradient-to-br from-accent to-card text-7xl luminescent" aria-hidden>
        {icon}
      </div>
      <div>
        <div className="font-display text-xl font-semibold text-foreground">{headline}</div>
        <ul className="mt-3 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-foreground/85">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
