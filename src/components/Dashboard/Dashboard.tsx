import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DayTooltip from "@mui/material/Tooltip";
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import { TagGroup, Tag } from "@heroui/react";

type SeriesId = "weight" | "workouts";

type ChartPoint = {
  label: string;
  value: number;
};

type WeightEntry = {
  id: number;
  weight: number;
  date: string;
};

type WorkoutSummary = {
  id: number;
  name: string;
  date: string;
};

type WorkoutDetail = {
  id: number;
  name: string;
  date: string;
  exercises: {
    exerciseId: number;
    exerciseName: string;
    sets: { weight: number; reps: number }[];
  }[];
};

type LiftEntry = {
  key: string;
  name: string;
  date: string;
  workoutName: string;
  detail: string;
};

type DayCell = {
  key: string;
  date: Date;
  weight?: number;
  future: boolean;
};

const seriesOptions: { id: SeriesId; label: string; unit: string }[] = [
  { id: "weight", label: "Body weight", unit: "lb" },
  { id: "workouts", label: "Workouts", unit: "sessions" },
];

const WEEK_COUNT = 20;

function formatDay(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weightPoints(weights: WeightEntry[]): ChartPoint[] {
  return [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      label: formatDay(entry.date),
      value: entry.weight,
    }));
}

function workoutPoints(workouts: WorkoutSummary[]): ChartPoint[] {
  const counts = new Map<string, number>();
  for (const workout of workouts) {
    const day = workout.date.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({
      label: formatDay(day),
      value: count,
    }));
}

function formatSets(sets: { weight: number; reps: number }[]) {
  if (sets.length === 0) return "No sets";
  const sameWeight = sets.every((set) => set.weight === sets[0].weight);
  if (sameWeight) {
    return `${sets.map((set) => set.reps).join(", ")} reps @ ${sets[0].weight} lb`;
  }
  return sets.map((set) => `${set.weight} lb × ${set.reps}`).join(", ");
}

function recentLifts(workouts: WorkoutDetail[]): LiftEntry[] {
  return workouts.flatMap((workout) =>
    workout.exercises.map((exercise) => ({
      key: `${workout.id}-${exercise.exerciseId}`,
      name: exercise.exerciseName,
      date: workout.date,
      workoutName: workout.name,
      detail: formatSets(exercise.sets),
    })),
  ).slice(0, 6);
}

function buildWeeks(weightsByDay: Map<string, number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (WEEK_COUNT - 1) * 7);

  const weeks: DayCell[][] = [];
  for (let weekIndex = 0; weekIndex < WEEK_COUNT; weekIndex += 1) {
    const week: DayCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      const key = isoDate(date);
      week.push({
        key,
        date,
        weight: weightsByDay.get(key),
        future: date > today,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

function monthSpans(weeks: DayCell[][]) {
  const spans: { label: string; count: number }[] = [];
  for (const week of weeks) {
    const firstOfMonth = week.find((day) => day.date.getDate() === 1);
    if (spans.length === 0) {
      const labelSource = firstOfMonth ?? week[0];
      spans.push({
        label: labelSource.date.toLocaleDateString(undefined, { month: "short" }),
        count: 1,
      });
      continue;
    }
    if (firstOfMonth) {
      spans.push({
        label: firstOfMonth.date.toLocaleDateString(undefined, { month: "short" }),
        count: 1,
      });
      continue;
    }
    spans[spans.length - 1].count += 1;
  }
  return spans;
}

function TrendChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  if (points.length === 0) {
    return (
      <p className="px-2 py-10 text-center text-gold-deep items-center justify-center m-auto">
        Nothing logged for {unit == "lb" ? "weight" : "workouts"} yet Log some data to see a trend.
      </p>
    );
  }

  const latest = points[points.length - 1];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-2 shrink-0 text-gold-deep">
        Latest: {latest.value} {unit}
      </p>
      <div className="relative h-full min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke="#1c1814" strokeOpacity={0.15} />
            <XAxis dataKey="label" stroke="#7a5c24" tick={{ fill: "#7a5c24", fontSize: 12 }} />
            <YAxis stroke="#7a5c24" tick={{ fill: "#7a5c24", fontSize: 12 }} width={40} />
            <Tooltip />
            <Line type="monotone" dataKey="value" name={unit} stroke="#7a5c24" strokeWidth={3} dot={{ fill: "#c43b22", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WeightCalendar({ weights }: { weights: WeightEntry[] }) {
  const weightsByDay = new Map(weights.map((entry) => [entry.date.slice(0, 10), entry.weight]));
  const weeks = buildWeeks(weightsByDay);
  const spans = monthSpans(weeks);
  const loggedCount = weeks.flat().filter((day) => day.weight !== undefined).length;
  const weekColumns = `repeat(${WEEK_COUNT}, minmax(0, 1fr))`;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-kinu p-4">
      <h2 className="shrink-0 text-xl font-bold text-gold-deep">Weight log</h2>
      <p className="mb-2 shrink-0 text-sm text-gold-deep">
        {loggedCount} {loggedCount === 1 ? "day" : "days"} with a weight logged in the last {WEEK_COUNT} weeks
      </p>
      <div className="flex w-full shrink-0 gap-2">
        <div className="w-8 shrink-0" />
        <div className="grid min-w-0 flex-1 gap-1 text-xs text-gold-deep" style={{ gridTemplateColumns: weekColumns }}>
          {spans.map((span, index) => (
            <span key={`${span.label}-${index}`} className="truncate" style={{ gridColumn: `span ${span.count}` }}>
              {span.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-1 flex min-h-0 flex-1 gap-2">
        <div className="grid h-full w-8 shrink-0 grid-rows-7 gap-1 text-[11px] text-gold-deep">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((label, index) => (
            <span key={label || index} className="flex items-center">{label}</span>
          ))}
        </div>
        <div
          className="grid min-h-0 min-w-0 flex-1 gap-1"
          style={{
            gridTemplateColumns: weekColumns,
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gridAutoFlow: "column",
          }}
        >
        {weeks.flat().map((day) => {
          const dateLabel = day.date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <DayTooltip
              key={day.key}
              arrow
              placement="top"
              title={
                <span>
                  {dateLabel}
                  {day.weight !== undefined && (
                    <>
                      <br />
                      {day.weight} lb
                    </>
                  )}
                </span>
              }
            >
              <button
                type="button"
                aria-label={day.weight === undefined ? dateLabel : `${dateLabel}, ${day.weight} lb`}
                className={`h-full w-full border-0 p-0 ${
                  day.future ? "bg-transparent" : day.weight !== undefined ? "bg-[#2f6b45]" : "bg-[#e4d7bc]"
                }`}
              />
            </DayTooltip>
          );
        })}
        </div>
      </div>
      <div className="mt-2 flex shrink-0 items-center gap-2 text-xs text-gold-deep">
        <span className="size-3.5 bg-[#e4d7bc]" />
        No entry
        <span className="size-3.5 bg-[#2f6b45]" />
        Weight logged
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [series, setSeries] = useState<SeriesId>("weight");
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [lifts, setLifts] = useState<LiftEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [weightResponse, workoutResponse] = await Promise.all([
          kaizenApiRequest<{ weights: WeightEntry[] }>("/api/weights"),
          kaizenApiRequest<{ workouts: WorkoutSummary[] }>("/api/workouts"),
        ]);
        if (cancelled) return;
        setWeights(weightResponse.weights);
        setWorkouts(workoutResponse.workouts);

        const recent = workoutResponse.workouts.slice(0, 5);
        const details = await Promise.all(
          recent.map((workout) =>
            kaizenApiRequest<{ workout: WorkoutDetail }>(`/api/workouts/${workout.id}`)
              .then((response) => response.workout)
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        setLifts(recentLifts(details.filter((workout): workout is WorkoutDetail => workout !== null)));
      } catch {
        if (!cancelled) setError("Could not load dashboard data.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = seriesOptions.find((option) => option.id === series) ?? seriesOptions[0];
  const points = series === "weight" ? weightPoints(weights) : workoutPoints(workouts);
  const recentWeights = [...weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_18rem] gap-4">
      <div className="grid min-h-0 grid-rows-2 bg-sheet">
      <section className="flex min-h-0 flex-col overflow-hidden bg-kinu p-4 border-b border-gold-deep">
        <TagGroup
          aria-label="Chart data"
          className="mb-3 shrink-0"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[series]}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next === "weight" || next === "workouts") setSeries(next);
          }}
          variant="surface"
        >
          <TagGroup.List>
            {seriesOptions.map((option) => (
              <Tag key={option.id} id={option.id} variant="surface" className="cursor-pointer bg-kinu text-gold-deep hover:bg-gold data-[selected=true]:bg-gold" onClick={() => setSeries(option.id)}>
                {option.label}
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
        {error ? <p className="text-vermilion">{error}</p> : <TrendChart points={points} unit={selected.unit} />}
      </section>
      

      <WeightCalendar weights={weights} />
      </div>

      <div className="grid min-h-0 grid-rows-2 gap-4">
        <section className="flex min-h-0 flex-col overflow-hidden bg-sheet p-4">
          <h2 className="shrink-0 text-xl font-bold text-gold-deep">Recent Weights</h2>
          {recentWeights.length === 0 ? (
            <p className="mt-2 text-gold-deep">No weights logged yet.</p>
          ) : (
            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              {recentWeights.map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between gap-2 border-b border-gold/30 pb-3 last:border-b-0">
                  <span className="text-sumi">{formatDay(entry.date)}</span>
                  <span className="font-medium text-gold-deep">{entry.weight} lb</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden bg-sheet p-4">
          <h2 className="shrink-0 text-xl font-bold text-gold-deep">Recent Lifts</h2>
          {lifts.length === 0 ? (
            <p className="mt-2 text-gold-deep">No lifts logged yet.</p>
          ) : (
            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              {lifts.map((lift) => (
                <li key={lift.key} className="border-b border-gold/30 pb-3 last:border-b-0">
                  <p className="font-medium text-sumi">{lift.name}</p>
                  <p className="text-sm text-gold-deep">
                    {formatDay(lift.date)} · {lift.workoutName}
                  </p>
                  <p className="text-sm text-sumi">{lift.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
