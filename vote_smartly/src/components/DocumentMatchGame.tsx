import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { playFailure, playSuccess, playTap } from "@/lib/audio";
import { SpeakButton } from "@/components/SpeakButton";

type Doc = {
  id: string;
  name: string;
  emoji: string;
  valid: boolean;
  description: string;
};

const DOCS: Doc[] = [
  { id: "aadhaar", name: "Aadhaar Card", emoji: "🪪", valid: true, description: "Aadhaar card — accepted as ID proof." },
  { id: "epic", name: "Voter ID (EPIC)", emoji: "🗳️", valid: true, description: "Your Voter ID card — the gold standard." },
  { id: "passport", name: "Passport", emoji: "📘", valid: true, description: "Indian passport — accepted." },
  { id: "driving", name: "Driving Licence", emoji: "🚗", valid: true, description: "Driving licence — accepted." },
  { id: "library", name: "Library Card", emoji: "📚", valid: false, description: "Library card — not an accepted ID." },
  { id: "shopping", name: "Shopping Card", emoji: "🛍️", valid: false, description: "Loyalty card — not an accepted ID." },
];

type Status = "ready" | "win" | "lose";

export function DocumentMatchGame() {
  const [items, setItems] = useState<Doc[]>(() => shuffle(DOCS));
  const [status, setStatus] = useState<Status>("ready");
  const [feedbackDocId, setFeedbackDocId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const matched = useMemo(() => items.filter((d) => d.valid === false || d.id === "matched"), [items]);

  function reset() {
    setItems(shuffle(DOCS));
    setStatus("ready");
    setFeedbackDocId(null);
  }

  function handleDrop(doc: Doc) {
    playTap();
    if (doc.valid) {
      setFeedbackDocId(doc.id);
      playSuccess();
      setStatus("win");
      window.setTimeout(() => setFeedbackDocId(null), 900);
      // remove the doc from tray after a short beat
      window.setTimeout(() => {
        setItems((prev) => prev.filter((d) => d.id !== doc.id));
      }, 600);
      window.setTimeout(() => setStatus("ready"), 1400);
    } else {
      setFeedbackDocId(doc.id);
      playFailure();
      setStatus("lose");
      window.setTimeout(() => setFeedbackDocId(null), 900);
      window.setTimeout(() => setStatus("ready"), 1400);
    }
  }

  const introText =
    "Drag a document into the voting box. Aadhaar, Voter ID, Passport, and Driving Licence will be accepted. Other cards will be rejected.";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Is it me? — Document game</h3>
          <p className="mt-1 text-sm text-muted-foreground">Drag the right card into the box.</p>
        </div>
        <div className="flex items-center gap-2">
          <SpeakButton text={introText} label="Listen to the rules" size="sm" />
          <button
            onClick={reset}
            aria-label="Reset game"
            className="focusable inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Box */}
      <div className="mt-5 flex flex-col items-center">
        <motion.div
          ref={boxRef}
          animate={
            status === "win"
              ? { scale: [1, 1.06, 1], borderColor: "var(--color-india-green)" }
              : status === "lose"
              ? { x: [0, -10, 10, -8, 8, 0], borderColor: "var(--color-destructive)" }
              : { scale: 1, borderColor: "var(--color-border)" }
          }
          transition={{ duration: status === "ready" ? 0.3 : 0.5 }}
          className="relative grid h-44 w-72 place-items-center rounded-3xl border-2 border-dashed bg-card/60 backdrop-blur"
          aria-label="Voting box drop zone"
        >
          <div className="text-center">
            <div className="text-5xl" aria-hidden>
              🗳️
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Drop here
            </div>
          </div>

          <AnimatePresence>
            {status === "win" && (
              <motion.div
                key="win"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="pointer-events-none absolute inset-0 grid place-items-center"
                aria-live="polite"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-india-green/20 text-india-green">
                  <Check className="h-10 w-10" strokeWidth={3} />
                </div>
              </motion.div>
            )}
            {status === "lose" && (
              <motion.div
                key="lose"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="pointer-events-none absolute inset-0 grid place-items-center"
                aria-live="polite"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                  <X className="h-10 w-10" strokeWidth={3} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tray */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((doc) => (
            <DraggableDoc
              key={doc.id}
              doc={doc}
              boxRef={boxRef}
              onDrop={handleDrop}
              feedback={feedbackDocId === doc.id ? (doc.valid ? "win" : "lose") : null}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full rounded-2xl bg-card/60 p-4 text-center text-sm text-muted-foreground">
              You sorted every valid document. Great job — you're ready! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggableDoc({
  doc,
  boxRef,
  onDrop,
  feedback,
}: {
  doc: Doc;
  boxRef: React.RefObject<HTMLDivElement | null>;
  onDrop: (d: Doc) => void;
  feedback: "win" | "lose" | null;
}) {
  const controls = useDragControls();
  const [grabbing, setGrabbing] = useState(false);

  return (
    <motion.button
      type="button"
      aria-label={`${doc.name}. ${doc.description} Drag into the voting box, or tap to drop.`}
      drag
      dragControls={controls}
      dragSnapToOrigin
      dragElastic={0.6}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -3 }}
      animate={
        feedback === "win"
          ? { scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }
          : feedback === "lose"
          ? { x: [0, -8, 8, -6, 6, 0] }
          : { scale: 1, rotate: 0, x: 0 }
      }
      onDragStart={() => setGrabbing(true)}
      onDragEnd={(_, info) => {
        setGrabbing(false);
        const box = boxRef.current?.getBoundingClientRect();
        if (!box) return;
        const { x, y } = info.point;
        if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
          onDrop(doc);
        }
      }}
      onClick={() => onDrop(doc)} // tap-to-drop fallback for keyboard / no-drag users
      className={`focusable relative flex select-none flex-col items-center gap-1.5 rounded-2xl border bg-card/80 p-3 text-center luminescent ${
        grabbing ? "z-20 cursor-grabbing shadow-2xl" : "cursor-grab"
      }`}
      style={{ touchAction: "none" }}
    >
      <span className="text-3xl" aria-hidden>
        {doc.emoji}
      </span>
      <span className="text-xs font-medium text-foreground">{doc.name}</span>
    </motion.button>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
