import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../slices/store.ts";

function read(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Goal body weight, persisted per user in localStorage (the API has no goal
 * field yet). Returns `[goal, setGoal]`; pass `null` to clear it.
 */
export function useGoalWeight() {
  const email = useSelector((state: RootState) => state.auth.user?.email);
  const key = `kaizen.goalWeight.${email ?? "guest"}`;
  // Routes using this hook only mount once the user is authenticated, so the key is stable.
  const [goal, setGoalState] = useState<number | null>(() => read(key));

  const setGoal = useCallback(
    (next: number | null) => {
      try {
        if (next === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, String(next));
      } catch {
        // Storage can be unavailable (private mode); keep the in-memory value.
      }
      setGoalState(next);
    },
    [key],
  );

  return [goal, setGoal] as const;
}
