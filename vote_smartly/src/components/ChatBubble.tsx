import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I register as a voter?",
  "What ID can I use at the polling booth?",
  "How do I get my e-EPIC?",
];

async function streamChat(
  history: Msg[],
  onDelta: (chunk: string) => void,
): Promise<void> {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
  });
  if (!resp.ok || !resp.body) {
    let msg = "Something went wrong.";
    try {
      const j = await resp.json();
      msg = j.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}

function ChatBubbleImpl() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      setError(null);
      const next: Msg[] = [...messages, { role: "user", content: t }];
      setMessages(next);
      setInput("");
      setBusy(true);
      let acc = "";
      try {
        await streamChat(next, (chunk) => {
          acc += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: acc } : m,
              );
            }
            return [...prev, { role: "assistant", content: acc }];
          });
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reach the Oracle.");
      } finally {
        setBusy(false);
      }
    },
    [busy, messages],
  );

  return (
    <>
      <motion.button
        type="button"
        aria-label={open ? "Close Voting Oracle" : "Open Voting Oracle"}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="focusable fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-card text-foreground shadow-[var(--shadow-elevated)] luminescent"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }}>
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }}>
              <MessageCircle className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
        <span aria-hidden className="absolute inset-0 -z-10 rounded-full opacity-60 gemini-pulse blur-md" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass squircle fixed bottom-24 right-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden shadow-[var(--shadow-elevated)]"
            style={{ height: "min(560px, 75vh)" }}
            role="dialog"
            aria-label="Voting Oracle chat"
          >
            <header className="flex items-center gap-3 border-b border-glass-border px-4 py-3">
              <div className="relative grid h-9 w-9 place-items-center rounded-full bg-card">
                <Sparkles className="h-4 w-4 text-primary" />
                {busy && <span aria-hidden className="absolute inset-0 rounded-full gemini-pulse opacity-70 blur-sm" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">The Voting Oracle</div>
                <div className="text-[11px] text-muted-foreground">
                  Non-partisan · India elections
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ask anything about voting in India — registration, your booth, what to carry on polling day.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="focusable rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground border border-border"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_a]:text-primary [&_p]:my-1 [&_ul]:my-1 [&_strong]:text-foreground">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </motion.div>
              ))}

              {busy && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                  The Oracle is thinking…
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-glass-border px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Oracle…"
                aria-label="Message the Voting Oracle"
                className="focusable flex-1 rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                disabled={busy}
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={busy || !input.trim()}
                className="focusable grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const ChatBubble = memo(ChatBubbleImpl);
