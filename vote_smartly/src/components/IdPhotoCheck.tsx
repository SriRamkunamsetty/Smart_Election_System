import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { checkIdPhoto } from "@/server/vision.functions";
import { playFailure, playSuccess } from "@/lib/audio";
import { SpeakButton } from "@/components/SpeakButton";

type Result = {
  ok: boolean;
  doc: string;
  reason: string;
  tips: string[];
  confidence: number;
};

export function IdPhotoCheck() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const check = useServerFn(checkIdPhoto);

  async function pickFile(file: File) {
    setResult(null);
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setBusy(true);
    try {
      const r = await check({ data: { image: dataUrl, docHint: "any" } });
      setResult({
        ok: r.ok,
        doc: r.doc,
        reason: r.reason,
        tips: r.tips,
        confidence: r.confidence,
      });
      if (r.ok) playSuccess();
      else playFailure();
    } catch (e) {
      console.error(e);
      setResult({ ok: false, doc: "unknown", reason: "Could not check the photo.", tips: [], confidence: 0 });
      playFailure();
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const intro =
    "Take or upload a photo of your ID card. The Oracle will check if it looks like an Aadhaar, Voter ID, Passport, or Driving Licence.";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Check my ID</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Photo never leaves the check — no numbers are stored.
          </p>
        </div>
        <SpeakButton text={intro} label="Listen to instructions" size="sm" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card/70">
          {preview ? (
            <img src={preview} alt="Your uploaded ID" className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <Camera className="mx-auto h-8 w-8 opacity-60" />
                <div className="mt-2">No photo yet</div>
              </div>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur">
              <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickFile(f);
            }}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            onClick={() => inputRef.current?.click()}
            className="focusable luminescent inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <Camera className="h-4 w-4" />
            {preview ? "Try another photo" : "Take or upload photo"}
          </motion.button>
          {preview && (
            <button
              type="button"
              onClick={reset}
              className="focusable inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-3 text-sm ${
                result.ok
                  ? "border-india-green/40 bg-india-green/10 text-foreground"
                  : "border-destructive/40 bg-destructive/10 text-foreground"
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-base font-semibold">
                <span aria-hidden>{result.ok ? "✅" : "⚠️"}</span>
                {result.ok ? "Looks good!" : "Try again"}
              </div>
              <div className="mt-1 text-muted-foreground">{result.reason}</div>
              {result.tips.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                  {result.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
