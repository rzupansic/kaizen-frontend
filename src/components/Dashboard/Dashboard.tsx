import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import WeightLog from "../WeightLog/WeightLog.tsx";
import DateRangeSelector from "../DateRangeSelector/DateRangeSelector.tsx";
import { rangeForPreset } from "../DateRangeSelector/dateRange.ts";
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import { TagGroup, Tag } from "@heroui/react";
import {ProgressCircle} from "@heroui/react";
import Button from "@mui/material/Button";
import LogModal from "../LogModal/LogModal.tsx";

type SeriesId = "weight" | "workouts";

type ChartPoint = {
  date: string;
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
  notes: string | null;
};

const seriesOptions: { id: SeriesId; label: string; unit: string }[] = [
  { id: "weight", label: "Body weight", unit: "lb" },
  { id: "workouts", label: "Workouts", unit: "sessions" },
];

function formatDay(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}


export function IndeterminateProgressCircle() {
  return (
    <ProgressCircle isIndeterminate aria-label="Loading" color="warning">
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>
  );
}

function weightPoints(weights: WeightEntry[]): ChartPoint[] {
  return [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date.slice(0, 10),
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
      date: day,
      label: formatDay(day),
      value: count,
    }));
}

function TrendChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  if (points.length === 0) {
    return (
      <p className="px-2 py-10 text-center text-gold-deep items-center justify-center m-auto">
        Nothing logged for {unit == "lb" ? "weight" : "workouts"} yet Log some data to see a trend.
      </p>
    );
  }

  return <RangeChart key={unit} points={points} unit={unit} />;
}

function RangeChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  const dates = useMemo(() => points.map((point) => point.date), [points]);
  const [range, setRange] = useState(() => rangeForPreset(dates, "3M"));
  const latest = points[points.length - 1];
  const visible = points.slice(range.start, range.end + 1);
  const visibleSpan = range.end - range.start;
  const allValues = points.map((point) => point.value);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yPadding = yMax === yMin ? 1 : (yMax - yMin) * 0.08;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-2 shrink-0 text-gold-deep">
        Latest: {latest.value} {unit}
      </p>
      <div className="relative min-h-0 flex-1 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1c1814" strokeOpacity={0.15} />
            <XAxis
              dataKey="date"
              stroke="#7a5c24"
              tick={{ fill: "#7a5c24", fontSize: 12 }}
              minTickGap={28}
              tickFormatter={(value) => formatDay(String(value))}
            />
            <YAxis
              stroke="#7a5c24"
              tick={{ fill: "#7a5c24", fontSize: 12 }}
              width={40}
              domain={[Math.floor(yMin - yPadding), Math.ceil(yMax + yPadding)]}
              allowDataOverflow
            />
            <Tooltip labelFormatter={(value) => formatDay(String(value))} />
            <Line
              type="monotone"
              dataKey="value"
              name={unit}
              stroke="#7a5c24"
              strokeWidth={3}
              dot={visibleSpan < 45 ? { fill: "#c43b22", r: 3 } : false}
              activeDot={{ r: 4, fill: "#c43b22" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DateRangeSelector dates={dates} value={range} onChange={setRange} />
    </div>
  );
}

function toLocalDateKey(value: string | Date) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function TodayPrompt({ message, action, onClick }: { message: string; action: string; onClick: () => void }) {
  return (
    <p className="flex items-center gap-2 text-xs text-gold-deep">
      {message}
      <Button
        variant="contained"
        size="small"
        sx={{
          height: 24,
          minHeight: 24,
          minWidth: 0,
          px: 1,
          py: 0,
          fontSize: "0.75rem",
          lineHeight: "1rem",
          fontWeight: 500,
          textTransform: "none",
          borderRadius: "0.75rem",
          boxShadow: "none",
        }}
        onClick={onClick}
      >
        {action}
      </Button>
    </p>
  );
}

export default function Dashboard() {
  const [series, setSeries] = useState<SeriesId>("weight");
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [error, setError] = useState("");
  const [noWeightForToday, setNoWeightForToday] = useState(false);
  const [noWorkoutForToday, setNoWorkoutForToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const selected = seriesOptions.find((option) => option.id === series) ?? seriesOptions[0];
  const points = series === "weight" ? weightPoints(weights) : workoutPoints(workouts);
  const recentWeights = [...weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const recentWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));


  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [weightResponse, workoutResponse] = await Promise.all([
          kaizenApiRequest<{ weights: WeightEntry[] }>("/api/weights"),
          kaizenApiRequest<{ workouts: WorkoutSummary[] }>("/api/workouts"),
        ]);
        if (cancelled) return;
        const today = toLocalDateKey(new Date());
        setWeights(weightResponse.weights);
        setWorkouts(workoutResponse.workouts);
        setNoWeightForToday(
          !weightResponse.weights.some((entry) => entry.date.slice(0, 10) === today),
        );
        setNoWorkoutForToday(
          !workoutResponse.workouts.some((entry) => entry.date.slice(0, 10) === today),
        );

      } catch {
        if (!cancelled) setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);




  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_18rem] gap-4">
      <div className="grid min-h-0 grid-rows-2 bg-sheet">
      {isLoading ? <IndeterminateProgressCircle /> : <section className="flex min-h-0 flex-col overflow-hidden  p-4 border-b border-gold-deep">
        <TagGroup
          aria-label="Chart data"
          className="mb-3 flex-row items-center justify-between pb-2"
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
              <Tag key={option.id} id={option.id} variant="surface" className="cursor-pointer bg-kinu text-gold-deep hover:bg-gold data-[selected=true]:bg-gold " onClick={() => setSeries(option.id)}>
                {option.label}
              </Tag>
            ))}
          </TagGroup.List>
          {noWeightForToday && series === "weight" ? (
            <TodayPrompt message="No weight logged for today." action="Log Weight" onClick={() => setShowWeightModal(true)} />
          ) : null}
          {noWorkoutForToday && series === "workouts" ? (
            <TodayPrompt message="No workouts logged for today." action="Log Workout" onClick={() => setShowWorkoutModal(true)} />
          ) : null}
        </TagGroup>
        {error ? <p className="text-vermilion">{error}</p> : <TrendChart points={points} unit={selected.unit} />}
      </section>}
      {showWeightModal && (
        <LogModal
          type="weight"
          onClose={() => setShowWeightModal(false)}
          onLogged={() => setReloadKey((key) => key + 1)}
        />
      )}
      {showWorkoutModal && (
        <LogModal
          type="workout"
          onClose={() => setShowWorkoutModal(false)}
          onLogged={() => setReloadKey((key) => key + 1)}
        />
      )}

      <WeightLog weights={weights} />
      </div>

      <div className="grid min-h-0 grid-rows-2 gap-4">
        <section className="flex min-h-0 flex-col overflow-hidden bg-sheet p-4">
          <h2 className="shrink-0 text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">Recent Weights</h2>
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
          <h2 className="shrink-0 text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">Recent Lifts</h2>
          {recentWorkouts.length === 0 ? (
            <p className="mt-2 text-gold-deep">No lifts logged yet.</p>
          ) : (
            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              {recentWorkouts.map((workout) => (
                <li key={workout.id} className="border-b border-gold/30 pb-3 last:border-b-0">
                  <p className="font-medium text-sumi">
                    {formatDay(workout.date)} - {workout.name}
                  </p>
                  {workout.notes && <p className="text-sm text-gold-deep">Note: {workout.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
