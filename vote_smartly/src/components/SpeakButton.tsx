import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { isSpeechSupported, speak, stopSpeaking } from "@/lib/audio";

type Props = {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/** Audio-first button: reads `text` aloud via the browser's speech synthesis. */
export function SpeakButton({ text, label = "Read this aloud", className = "", size = "md" }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && isSpeechSupported();

  useEffect(() => {
    if (!speaking) return;
    const id = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) setSpeaking(false);
    }, 250);
    return () => window.clearInterval(id);
  }, [speaking]);

  useEffect(() => () => stopSpeaking(), []);

  const dims =
    size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  if (!supported) return null;

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        if (speaking) {
          stopSpeaking();
          setSpeaking(false);
        } else {
          speak(text);
          setSpeaking(true);
        }
      }}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      animate={
        speaking
          ? { boxShadow: ["0 0 0 0 rgba(26,115,232,0.45)", "0 0 0 14px rgba(26,115,232,0)"] }
          : { boxShadow: "0 0 0 0 rgba(26,115,232,0)" }
      }
      transition={speaking ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
      className={`focusable inline-flex ${dims} items-center justify-center rounded-full bg-primary text-primary-foreground luminescent ${className}`}
    >
      {speaking ? <VolumeX className={icon} /> : <Volume2 className={icon} />}
    </motion.button>
  );
}
