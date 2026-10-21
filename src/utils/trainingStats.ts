import type { SetRow, WeightEntry } from "../types.ts";
import { addDays, daysBetween, dayKey, weekStart } from "./dates.ts";

/* -------------------------------------------------------------------------- */
/* Lifting: estimated 1RM, per-exercise history, personal records             */
/* -------------------------------------------------------------------------- */

/** Epley estimate. A single rep is its own 1RM; unweighted sets have no estimate. */
export function estimateOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export type ExerciseSession = {
  workoutId: number;
  date: string;
  /** Best estimated 1RM across the session's sets. */
  bestOneRepMax: number;
  /** Heaviest weight lifted in any set. */
  topWeight: number;
  /** Sum of weight x reps. */
  volume: number;
  setCount: number;
  /** The set that produced `bestOneRepMax`. */
  bestSet: { weight: number; reps: number };
  /** True when this session beat every earlier session's estimated 1RM. */
  isPR: boolean;
  /** The 1RM this session beat (only set when `isPR`). */
  previousBest: number | null;
};

export type ExerciseHistory = {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  /** Chronological (oldest first). */
  sessions: ExerciseSession[];
  prCount: number;
  best: ExerciseSession | null;
};

export type PREvent = {
  workoutId: number;
  date: string;
  exerciseId: number;
  exerciseName: string;
  oneRepMax: number;
  previousBest: number;
  set: { weight: number; reps: number };
};

export function buildExerciseHistories(rows: SetRow[]): ExerciseHistory[] {
  const byExercise = new Map<number, SetRow[]>();
  for (const row of rows) {
    const list = byExercise.get(row.exerciseId);
    if (list) list.push(row);
    else byExercise.set(row.exerciseId, [row]);
  }

  const histories: ExerciseHistory[] = [];
  for (const [exerciseId, exerciseRows] of byExercise) {
    const byWorkout = new Map<number, SetRow[]>();
    for (const row of exerciseRows) {
      const list = byWorkout.get(row.workoutId);
      if (list) list.push(row);
      else byWorkout.set(row.workoutId, [row]);
    }

    const sessions: ExerciseSession[] = [];
    for (const [workoutId, sets] of byWorkout) {
      let bestOneRepMax = 0;
      let bestSet = { weight: sets[0].weight, reps: sets[0].reps };
      let topWeight = 0;
      let volume = 0;
      for (const set of sets) {
        const oneRepMax = estimateOneRepMax(set.weight, set.reps);
        if (oneRepMax > bestOneRepMax) {
          bestOneRepMax = oneRepMax;
          bestSet = { weight: set.weight, reps: set.reps };
        }
        topWeight = Math.max(topWeight, set.weight);
        volume += set.weight * set.reps;
      }
      sessions.push({
        workoutId,
        date: sets[0].date,
        bestOneRepMax,
        topWeight,
        volume,
        setCount: sets.length,
        bestSet,
        isPR: false,
        previousBest: null,
      });
    }

    sessions.sort((a, b) => a.date.localeCompare(b.date) || a.workoutId - b.workoutId);

    // The first session only sets the baseline; later sessions are PRs when they beat it.
    let runningBest = 0;
    let prCount = 0;
    sessions.forEach((session, index) => {
      if (index > 0 && session.bestOneRepMax > runningBest + 1e-9) {
        session.isPR = true;
        session.previousBest = runningBest;
        prCount += 1;
      }
      runningBest = Math.max(runningBest, session.bestOneRepMax);
    });

    const best = sessions.reduce<ExerciseSession | null>(
      (top, session) => (top === null || session.bestOneRepMax >= top.bestOneRepMax ? session : top),
      null,
    );

    histories.push({
      exerciseId,
      name: exerciseRows[0].exerciseName,
      muscleGroup: exerciseRows[0].muscleGroup,
      sessions,
      prCount,
      best,
    });
  }

  return histories.sort((a, b) => a.name.localeCompare(b.name));
}

/** Every PR across all exercises, newest first. */
export function collectPRs(histories: ExerciseHistory[]): PREvent[] {
  const events: PREvent[] = [];
  for (const history of histories) {
    for (const session of history.sessions) {
      if (!session.isPR || session.previousBest === null) continue;
      events.push({
        workoutId: session.workoutId,
        date: session.date,
        exerciseId: history.exerciseId,
        exerciseName: history.name,
        oneRepMax: session.bestOneRepMax,
        previousBest: session.previousBest,
        set: session.bestSet,
      });
    }
  }
  return events.sort((a, b) => b.date.localeCompare(a.date) || b.workoutId - a.workoutId);
}

/** PRs grouped by the workout that set them. */
export function prsByWorkout(events: PREvent[]) {
  const map = new Map<number, PREvent[]>();
  for (const event of events) {
    const list = map.get(event.workoutId);
    if (list) list.push(event);
    else map.set(event.workoutId, [event]);
  }
  return map;
}

/* -------------------------------------------------------------------------- */
/* Weekly volume + muscle-group balance                                       */
/* -------------------------------------------------------------------------- */

export type VolumeMetric = "sets" | "volume";

/** Match how the log form displays groups ("chest" / "CHEST" -> "Chest"). */
export function normalizeGroup(group: string | null | undefined) {
  const trimmed = (group ?? "").trim();
  if (!trimmed) return "Other";
  return trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export type WeeklyVolume = {
  /** Muscle groups that have any volume in the window, biggest first. */
  groups: string[];
  /** One row per week, oldest first: `{ weekStart, [group]: value }`. */
  weeks: ({ weekStart: string } & Record<string, number | string>)[];
};

export function weeklyVolumeByMuscle(
  rows: SetRow[],
  weekCount: number,
  metric: VolumeMetric,
  today: string,
): WeeklyVolume {
  const firstWeek = addDays(weekStart(today), -(weekCount - 1) * 7);
  const starts = Array.from({ length: weekCount }, (_, index) => addDays(firstWeek, index * 7));
  const buckets = new Map(starts.map((start) => [start, new Map<string, number>()]));
  const totals = new Map<string, number>();

  for (const row of rows) {
    const bucket = buckets.get(weekStart(row.date));
    if (!bucket) continue; // outside the window
    const group = normalizeGroup(row.muscleGroup);
    const amount = metric === "sets" ? 1 : row.weight * row.reps;
    bucket.set(group, (bucket.get(group) ?? 0) + amount);
    totals.set(group, (totals.get(group) ?? 0) + amount);
  }

  const groups = [...totals.entries()]
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([group]) => group);

  const weeks = starts.map((start) => {
    const row: { weekStart: string } & Record<string, number | string> = { weekStart: start };
    for (const group of groups) row[group] = Math.round(buckets.get(start)?.get(group) ?? 0);
    return row;
  });

  return { groups, weeks };
}

/** Rough weekly-set guidance used to flag under/over-trained muscle groups. */
export const LOW_WEEKLY_SETS = 6;
export const HIGH_WEEKLY_SETS = 20;

export type BalanceStatus = "none" | "low" | "ok" | "high";

export type MuscleBalance = {
  group: string;
  sets: number;
  weeklyAverage: number;
  status: BalanceStatus;
  /** Date of the most recent set for this group, if ever trained. */
  lastTrained: string | null;
};

export function muscleBalance(
  rows: SetRow[],
  libraryGroups: string[],
  today: string,
  windowDays = 28,
): MuscleBalance[] {
  const since = addDays(today, -(windowDays - 1));
  const sets = new Map<string, number>();
  const lastTrained = new Map<string, string>();

  for (const group of libraryGroups) sets.set(normalizeGroup(group), 0);

  for (const row of rows) {
    const group = normalizeGroup(row.muscleGroup);
    const last = lastTrained.get(group);
    if (!last || row.date > last) lastTrained.set(group, row.date);
    if (row.date >= since && row.date <= today) sets.set(group, (sets.get(group) ?? 0) + 1);
    else if (!sets.has(group)) sets.set(group, 0);
  }

  const weeks = windowDays / 7;
  return [...sets.entries()]
    .map(([group, count]): MuscleBalance => {
      const weeklyAverage = count / weeks;
      const status: BalanceStatus =
        count === 0
          ? "none"
          : weeklyAverage < LOW_WEEKLY_SETS
            ? "low"
            : weeklyAverage > HIGH_WEEKLY_SETS
              ? "high"
              : "ok";
      return { group, sets: count, weeklyAverage, status, lastTrained: lastTrained.get(group) ?? null };
    })
    .sort((a, b) => b.sets - a.sets || a.group.localeCompare(b.group));
}

/* -------------------------------------------------------------------------- */
/* Body weight: smoothing, trend, goal                                        */
/* -------------------------------------------------------------------------- */

export type WeightPoint = {
  date: string;
  weight: number;
  /** Trailing average of entries from the last `windowDays` days (inclusive). */
  average: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export function withMovingAverage(weights: WeightEntry[], windowDays = 7): WeightPoint[] {
  const sorted = [...weights]
    .map((entry) => ({ date: dayKey(entry.date), weight: entry.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((point, index) => {
    let sum = 0;
    let count = 0;
    for (let back = index; back >= 0; back -= 1) {
      if (daysBetween(sorted[back].date, point.date) >= windowDays) break;
      sum += sorted[back].weight;
      count += 1;
    }
    return { date: point.date, weight: point.weight, average: round1(sum / count) };
  });
}

/**
 * Least-squares weight change in lb per week over the last `lookbackDays`
 * ending at the most recent entry. Null when there isn't enough data.
 */
export function weeklyRate(weights: WeightEntry[], lookbackDays = 28): number | null {
  const sorted = [...weights]
    .map((entry) => ({ date: dayKey(entry.date), weight: entry.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return null;

  const lastDate = sorted[sorted.length - 1].date;
  const recent = sorted.filter((point) => daysBetween(point.date, lastDate) < lookbackDays);
  if (recent.length < 5) return null;

  const origin = recent[0].date;
  if (daysBetween(origin, lastDate) < 7) return null;

  const xs = recent.map((point) => daysBetween(origin, point.date));
  const ys = recent.map((point) => point.weight);
  const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < xs.length; i += 1) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }
  if (denominator === 0) return null;
  return (numerator / denominator) * 7;
}

export type GoalStatus = "reached" | "on-track" | "off-track" | "no-trend";

export type GoalProgress = {
  goal: number;
  latest: number;
  /** goal - latest: negative means you still need to lose weight. */
  remaining: number;
  /** lb per week, or null when there isn't enough recent data. */
  rate: number | null;
  /** Projected date (YYYY-MM-DD) the goal is reached at the current rate. */
  etaDate: string | null;
  status: GoalStatus;
};

const GOAL_TOLERANCE = 0.5;
const MAX_ETA_DAYS = 365 * 3;

export function goalProgress(weights: WeightEntry[], goal: number): GoalProgress | null {
  if (weights.length === 0) return null;
  const sorted = [...weights].sort((a, b) => dayKey(a.date).localeCompare(dayKey(b.date)));
  const latestEntry = sorted[sorted.length - 1];
  const latest = latestEntry.weight;
  const remaining = goal - latest;
  const rate = weeklyRate(weights);

  if (Math.abs(remaining) <= GOAL_TOLERANCE) {
    return { goal, latest, remaining, rate, etaDate: null, status: "reached" };
  }
  if (rate === null) {
    return { goal, latest, remaining, rate, etaDate: null, status: "no-trend" };
  }

  const movingToward = Math.sign(rate) === Math.sign(remaining) && Math.abs(rate) >= 0.05;
  if (!movingToward) {
    return { goal, latest, remaining, rate, etaDate: null, status: "off-track" };
  }

  const days = Math.ceil((remaining / rate) * 7);
  if (days > MAX_ETA_DAYS) {
    return { goal, latest, remaining, rate, etaDate: null, status: "off-track" };
  }
  return {
    goal,
    latest,
    remaining,
    rate,
    etaDate: addDays(dayKey(latestEntry.date), days),
    status: "on-track",
  };
}
