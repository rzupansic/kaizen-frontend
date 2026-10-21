import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import WeightLog from "../WeightLog/WeightLog.tsx";
import DateRangeSelector from "../DateRangeSelector/DateRangeSelector.tsx";
import { rangeForPreset } from "../DateRangeSelector/dateRange.ts";
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import { TagGroup, Tag } from "@heroui/react";
import {ProgressCircle} from "@heroui/react";
import Button from "@mui/material/Button";
import LogModal from "../LogModal/LogModal.tsx";
import WeightEditDialog from "../WeightEditDialog/WeightEditDialog.tsx";
import WorkoutDetailDialog from "../WorkoutDetailDialog/WorkoutDetailDialog.tsx";
import GoalDialog from "../GoalDialog/GoalDialog.tsx";
import { dayKey, formatDay, formatDayLong, toLocalDateKey } from "../../utils/dates.ts";
import { useGoalWeight } from "../../utils/useGoalWeight.ts";
import { chartTooltipStyle } from "../../utils/chartTheme.ts";
import {
  buildExerciseHistories,
  collectPRs,
  goalProgress,
  prsByWorkout,
  weeklyRate,
  withMovingAverage,
  type GoalProgress,
} from "../../utils/trainingStats.ts";
import type { SetRow, WeightEntry, WorkoutSummary } from "../../types.ts";

type SeriesId = "weight" | "workouts";

type ChartPoint = {
  date: string;
  label: string;
  value: number;
  /** Trailing 7-day average; only present for the body weight series. */
  average?: number;
};

const seriesOptions: { id: SeriesId; label: string; unit: string }[] = [
  { id: "weight", label: "Body weight", unit: "lb" },
  { id: "workouts", label: "Workouts", unit: "sessions" },
];


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
  return withMovingAverage(weights).map((point) => ({
    date: point.date,
    label: formatDay(point.date),
    value: point.weight,
    average: point.average,
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

type TrendChartProps = {
  points: ChartPoint[];
  unit: string;
  /** Replaces the default "Latest: ..." line above the chart. */
  header?: ReactNode;
  /** Draws a goal line and keeps it inside the y-axis range. */
  goal?: number | null;
};

function TrendChart({ points, unit, header, goal }: TrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="px-2 py-10 text-center text-gold-deep items-center justify-center m-auto">
          Nothing logged for {unit == "lb" ? "weight" : "workouts"} yet Log some data to see a trend.
        </p>
        {header}
      </div>
    );
  }

  // Keyed on length so the visible window resets when entries are added or removed.
  return <RangeChart key={`${unit}-${points.length}`} points={points} unit={unit} header={header} goal={goal} />;
}

function RangeChart({ points, unit, header, goal }: TrendChartProps) {
  const dates = useMemo(() => points.map((point) => point.date), [points]);
  const [range, setRange] = useState(() => rangeForPreset(dates, "3M"));
  const latest = points[points.length - 1];
  const visible = points.slice(range.start, range.end + 1);
  const visibleSpan = range.end - range.start;
  const hasAverage = points.some((point) => point.average !== undefined);
  const allValues = points.map((point) => point.value);
  if (goal !== null && goal !== undefined) allValues.push(goal);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yPadding = yMax === yMin ? 1 : (yMax - yMin) * 0.08;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header ?? (
        <p className="mb-2 shrink-0 text-gold-deep">
          Latest: {latest.value} {unit}
        </p>
      )}
      <div className="relative min-h-48 flex-1 select-none">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
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
            <Tooltip {...chartTooltipStyle} labelFormatter={(value) => formatDay(String(value))} />
            {goal !== null && goal !== undefined && (
              <ReferenceLine
                y={goal}
                stroke="#c43b22"
                strokeDasharray="6 4"
                label={{ value: `Goal ${goal}`, position: "insideTopRight", fill: "#c43b22", fontSize: 12 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              name={hasAverage ? "Weight" : unit}
              // With a smoothed line on top, the raw daily values step back to a thinner, lighter line.
              stroke={hasAverage ? "#c9a45c" : "#7a5c24"}
              strokeWidth={hasAverage ? 1.5 : 3}
              dot={visibleSpan < 45 ? { fill: "#c43b22", r: hasAverage ? 2.5 : 3 } : false}
              activeDot={{ r: 4, fill: "#c43b22" }}
            />
            {hasAverage && (
              <Line
                type="monotone"
                dataKey="average"
                name="7-day avg"
                stroke="#7a5c24"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, fill: "#7a5c24" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DateRangeSelector dates={dates} value={range} onChange={setRange} />
    </div>
  );
}

/** Compact stats row above the body weight chart: latest, smoothed value, trend and goal. */
function WeightSummary({
  weights,
  goal,
  progress,
  onEditGoal,
}: {
  weights: WeightEntry[];
  goal: number | null;
  progress: GoalProgress | null;
  onEditGoal: () => void;
}) {
  const smoothed = useMemo(() => withMovingAverage(weights), [weights]);
  const rate = useMemo(() => weeklyRate(weights), [weights]);
  const latest = smoothed[smoothed.length - 1];
  if (!latest) return null;

  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}`;

  let goalText: string | null = null;
  if (goal !== null && progress) {
    const toGo = Math.abs(progress.remaining).toFixed(1);
    if (progress.status === "reached") {
      goalText = `Goal ${goal} lb reached`;
    } else if (progress.status === "on-track" && progress.etaDate) {
      goalText = `Goal ${goal} lb · ${toGo} lb to go · on pace for ${formatDayLong(progress.etaDate)}`;
    } else if (progress.status === "off-track") {
      goalText = `Goal ${goal} lb · ${toGo} lb to go · recent trend isn't heading there`;
    } else {
      goalText = `Goal ${goal} lb · ${toGo} lb to go · log a few more weeks for a finish estimate`;
    }
  }

  return (
    <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gold-deep">
      <span>
        Latest: <strong>{latest.weight}</strong> lb
      </span>
      <span className="flex items-center gap-1">
        <span aria-hidden className="inline-block h-0.5 w-4 bg-gold-deep" />
        7-day avg: <strong>{latest.average}</strong> lb
      </span>
      {rate !== null && (
        <span title="Least-squares change over the last 28 days">
          Trend: <strong>{signed(rate)}</strong> lb/wk
        </span>
      )}
      {goalText ? (
        <span className="flex items-center gap-1 text-vermilion">
          <span aria-hidden className="inline-block w-4 border-t-2 border-dashed border-vermilion" />
          {goalText}
        </span>
      ) : null}
      <Button
        size="small"
        onClick={onEditGoal}
        sx={{ minWidth: 0, px: 1, py: 0, fontSize: "0.75rem", textTransform: "none" }}
      >
        {goal === null ? "Set goal" : "Edit goal"}
      </Button>
    </div>
  );
}

function TodayPrompt({ message, action, onClick }: { message: string; action: string; onClick: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-gold-deep">
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
  const [setRows, setSetRows] = useState<SetRow[]>([]);
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);
  const [openWorkoutId, setOpenWorkoutId] = useState<number | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goal, setGoal] = useGoalWeight();

  const reload = () => setReloadKey((key) => key + 1);

  const selected = seriesOptions.find((option) => option.id === series) ?? seriesOptions[0];
  const points = series === "weight" ? weightPoints(weights) : workoutPoints(workouts);
  const recentWeights = [...weights].sort((a, b) => dayKey(b.date).localeCompare(dayKey(a.date))).slice(0, 30);
  const recentWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = weights.length
    ? [...weights].sort((a, b) => dayKey(a.date).localeCompare(dayKey(b.date))).at(-1)!.weight
    : null;
  const progress = useMemo(() => (goal === null ? null : goalProgress(weights, goal)), [weights, goal]);
  const workoutPRs = useMemo(
    () => prsByWorkout(collectPRs(buildExerciseHistories(setRows))),
    [setRows],
  );


  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const [weightResponse, workoutResponse, historyResponse] = await Promise.all([
          kaizenApiRequest<{ weights: WeightEntry[] }>("/api/weights"),
          kaizenApiRequest<{ workouts: WorkoutSummary[] }>("/api/workouts"),
          // Only feeds the PR badges, so a failure here must not break the dashboard.
          kaizenApiRequest<{ sets: SetRow[] }>("/api/workouts/history").catch(() => ({ sets: [] as SetRow[] })),
        ]);
        if (cancelled) return;
        
        const today = toLocalDateKey(new Date());
        setWeights(weightResponse.weights);
        setWorkouts(workoutResponse.workouts);
        setSetRows(historyResponse.sets);
        setNoWeightForToday(
          !weightResponse.weights.some((entry) => entry.date.slice(0, 10) === today),
        );
        setNoWorkoutForToday(
          !workoutResponse.workouts.some((entry) => entry.date.slice(0, 10) === today),
        );
        setIsLoading(false);
      } catch {
        if (!cancelled) setError("Could not load dashboard data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);




  return (
    <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="grid min-h-0 grid-cols-1 bg-sheet lg:h-full lg:grid-rows-2">
      <section className="flex min-h-[22rem] flex-col overflow-hidden border-b border-gold-deep p-4 lg:min-h-0">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <IndeterminateProgressCircle />
        </div>
      ) : (
        <>
        <TagGroup
          aria-label="Chart data"
          className="mb-3 flex-col items-stretch gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between"
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
        {error ? (
          <p className="text-vermilion">{error}</p>
        ) : (
          <TrendChart
            points={points}
            unit={selected.unit}
            goal={series === "weight" ? goal : null}
            header={
              series === "weight" && weights.length > 0 ? (
                <WeightSummary
                  weights={weights}
                  goal={goal}
                  progress={progress}
                  onEditGoal={() => setShowGoalDialog(true)}
                />
              ) : undefined
            }
          />
        )}
        </>
      )}
      </section>
      {showWeightModal && (
        <LogModal
          type="weight"
          onClose={() => setShowWeightModal(false)}
          onLogged={reload}
        />
      )}
      {showWorkoutModal && (
        <LogModal
          type="workout"
          onClose={() => setShowWorkoutModal(false)}
          onLogged={reload}
        />
      )}
      {editingWeight && (
        <WeightEditDialog
          entry={editingWeight}
          onClose={() => setEditingWeight(null)}
          onChanged={reload}
        />
      )}
      {openWorkoutId !== null && (
        <WorkoutDetailDialog
          workoutId={openWorkoutId}
          prs={workoutPRs.get(openWorkoutId)}
          onClose={() => setOpenWorkoutId(null)}
          onChanged={reload}
        />
      )}
      {showGoalDialog && (
        <GoalDialog
          goal={goal}
          latest={latestWeight}
          onSave={setGoal}
          onClose={() => setShowGoalDialog(false)}
        />
      )}

      <WeightLog weights={weights} isLoading={isLoading}/>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
        <section className="flex min-h-48 flex-col overflow-hidden bg-sheet p-4 lg:min-h-0">
          <h2 className="shrink-0 text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">Recent Weights</h2>
          {recentWeights.length === 0 ? (
            <p className="mt-2 text-gold-deep">No weights logged yet.</p>
          ) : (
            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              {recentWeights.map((entry) => (
                <li key={entry.id} className="border-b border-gold/30 pb-3 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setEditingWeight(entry)}
                    aria-label={`Edit weight for ${formatDay(entry.date)}`}
                    className="flex w-full cursor-pointer items-baseline justify-between gap-2 text-left hover:bg-kinu"
                  >
                    <span className="text-sumi">{formatDay(entry.date)}</span>
                    <span className="font-medium text-gold-deep">{entry.weight} lb</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="flex min-h-48 flex-col overflow-hidden bg-sheet p-4 lg:min-h-0">
          <h2 className="shrink-0 text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">Recent Lifts</h2>
          {recentWorkouts.length === 0 ? (
            <p className="mt-2 text-gold-deep">No lifts logged yet.</p>
          ) : (
            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
              {recentWorkouts.map((workout) => {
                const prs = workoutPRs.get(workout.id);
                return (
                  <li key={workout.id} className="border-b border-gold/30 pb-3 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenWorkoutId(workout.id)}
                      aria-label={`Open ${workout.name} workout from ${formatDay(workout.date)}`}
                      className="block w-full cursor-pointer text-left hover:bg-kinu"
                    >
                      <p className="flex items-center gap-2 font-medium text-sumi">
                        <span>
                          {formatDay(workout.date)} - {workout.name}
                        </span>
                        {prs && (
                          <span
                            className="rounded-sm bg-vermilion px-1.5 text-xs font-bold tracking-wide text-sheet"
                            title={prs.map((pr) => `${pr.exerciseName}: est. 1RM ${Math.round(pr.oneRepMax)} lb`).join("\n")}
                          >
                            PR{prs.length > 1 ? ` ×${prs.length}` : ""}
                          </span>
                        )}
                      </p>
                      {workout.notes && <p className="text-sm text-gold-deep">Note: {workout.notes}</p>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
