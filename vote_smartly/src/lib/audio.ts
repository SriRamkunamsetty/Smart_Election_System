// Lightweight audio helpers — no external deps.
// Browser SpeechSynthesis for TTS + WebAudio chimes for win/fail feedback.

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctor = (window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext) as typeof AudioContext | undefined;
  if (!Ctor) return null;
  _ctx = new Ctor();
  return _ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.18) {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playSuccess() {
  // Bright C-major arpeggio
  tone(523.25, 0, 0.18, "triangle"); // C5
  tone(659.25, 0.09, 0.2, "triangle"); // E5
  tone(783.99, 0.18, 0.28, "triangle", 0.22); // G5
  tone(1046.5, 0.28, 0.4, "sine", 0.15); // C6 shimmer
}

export function playFailure() {
  tone(311.13, 0, 0.18, "sawtooth", 0.12); // Eb4
  tone(220, 0.12, 0.32, "sawtooth", 0.14); // A3
}

export function playTap() {
  tone(880, 0, 0.06, "sine", 0.08);
}

// ---------- Speech ----------
let _voice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (_voice) return _voice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer English India, then any English, then default
  _voice =
    voices.find((v) => /en[-_]IN/i.test(v.lang)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
    voices[0] ||
    null;
  return _voice;
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = "en-IN";
  }
  u.rate = opts.rate ?? 0.95;
  u.pitch = opts.pitch ?? 1.0;
  synth.speak(u);
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
