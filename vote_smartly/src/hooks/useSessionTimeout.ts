import { useEffect, useState, useCallback } from "react";

/**
 * Privacy-friendly session timeout.
 * After `timeoutMs` of no user input, fires `onTimeout`.
 */
export function useSessionTimeout(timeoutMs: number, onTimeout: () => void) {
  const [lastActivity, setLastActivity] = useState(Date.now());

  const reset = useCallback(() => setLastActivity(Date.now()), []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, reset));
  }, [reset]);

  useEffect(() => {
    const i = setInterval(() => {
      if (Date.now() - lastActivity > timeoutMs) {
        onTimeout();
        setLastActivity(Date.now());
      }
    }, 5000);
    return () => clearInterval(i);
  }, [lastActivity, timeoutMs, onTimeout]);

  return { reset };
}
