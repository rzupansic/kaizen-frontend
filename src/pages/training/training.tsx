import { useEffect, useState } from "react";
import ExerciseProgress from "../../components/ExerciseProgress/ExerciseProgress.tsx";
import VolumeBalance from "../../components/VolumeBalance/VolumeBalance.tsx";
import { IndeterminateProgressCircle } from "../../components/Dashboard/Dashboard.tsx";
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import type { SetRow } from "../../types.ts";

type ExerciseSummary = { id: number; name: string; muscle_group: string | null };

export default function Training() {
  const [rows, setRows] = useState<SetRow[]>([]);
  const [libraryGroups, setLibraryGroups] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [history, exercises] = await Promise.all([
          kaizenApiRequest<{ sets: SetRow[] }>("/api/workouts/history"),
          // The exercise library lets the balance view call out groups you never train.
          kaizenApiRequest<{ exercises: ExerciseSummary[] }>("/api/exercises").catch(() => ({
            exercises: [] as ExerciseSummary[],
          })),
        ]);
        if (cancelled) return;
        setRows(history.sets);
        setLibraryGroups(
          [...new Set(exercises.exercises.map((exercise) => exercise.muscle_group).filter((group): group is string => !!group))],
        );
      } catch {
        if (!cancelled) setError("Could not load training data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-full lg:overflow-y-auto">
      <h1 className="shrink-0 border-b border-gold-deep pb-2 text-2xl font-bold text-gold-deep">Training</h1>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <IndeterminateProgressCircle />
        </div>
      ) : error ? (
        <p className="text-vermilion">{error}</p>
      ) : (
        <>
          <ExerciseProgress rows={rows} />
          <VolumeBalance rows={rows} libraryGroups={libraryGroups} />
        </>
      )}
    </div>
  );
}
