import { useCallback, useEffect, useState } from "react";

const KEY = "voting-oracle:progress";

export function useProgress(stepIds: string[]) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...completed]));
    } catch {
      /* ignore */
    }
  }, [completed]);

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setCompleted(new Set()), []);

  const total = stepIds.length;
  const done = stepIds.filter((id) => completed.has(id)).length;
  const ratio = total === 0 ? 0 : done / total;
  const nextStepId = stepIds.find((id) => !completed.has(id)) ?? null;

  return { completed, toggle, reset, total, done, ratio, nextStepId };
}
