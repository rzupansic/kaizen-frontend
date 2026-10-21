import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import SegmentedToggle from "../SegmentedToggle/SegmentedToggle.tsx";
import { formatDay, formatDayLong } from "../../utils/dates.ts";
import { buildExerciseHistories, collectPRs, type ExerciseSession } from "../../utils/trainingStats.ts";
import type { SetRow } from "../../types.ts";

type ProgressMetric = "oneRepMax" | "topWeight" | "volume";

const metricOptions: { id: ProgressMetric; label: string }[] = [
  { id: "oneRepMax", label: "Est. 1RM" },
  { id: "topWeight", label: "Top weight" },
  { id: "volume", label: "Volume" },
];

const metricUnit: Record<ProgressMetric, string> = {
  oneRepMax: "lb",
  topWeight: "lb",
  volume: "lb total",
};

const round1 = (value: number) => Math.round(value * 10) / 10;

type ChartPoint = {
  date: string;
  value: number;
  session: ExerciseSession;
};

function metricValue(session: ExerciseSession, metric: ProgressMetric) {
  if (metric === "oneRepMax") return round1(session.bestOneRepMax);
  if (metric === "topWeight") return session.topWeight;
  return Math.round(session.volume);
}

/** One line of the record ledger: label, dotted leader, value (like a menu or account book). */
function LedgerRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-sm text-gold-deep">{label}</dt>
      <span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-gold-deep/50" />
      <dd className="shrink-0 text-right">
        <span className="font-heading text-lg font-bold text-sumi">{value}</span>
        {note && <span className="ml-2 text-xs text-gold-deep">{note}</span>}
      </dd>
    </div>
  );
}

export default function ExerciseProgress({ rows }: { rows: SetRow[] }) {
  const histories = useMemo(() => buildExerciseHistories(rows), [rows]);
  const recentPRs = useMemo(() => collectPRs(histories).slice(0, 8), [histories]);
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const [metric, setMetric] = useState<ProgressMetric>("oneRepMax");

  // Default to whichever lift has been trained the most.
  const mostTrained = useMemo(
    () => [...histories].sort((a, b) => b.sessions.length - a.sessions.length)[0] ?? null,
    [histories],
  );
  const selected = histories.find((history) => history.exerciseId === exerciseId) ?? mostTrained;

  const points: ChartPoint[] = useMemo(
    () =>
      selected
        ? selected.sessions.map((session) => ({
            date: session.date,
            value: metricValue(session, metric),
            session,
          }))
        : [],
    [selected, metric],
  );

  if (!selected) {
    return (
      <section className="shrink-0 bg-sheet p-4">
        <h2 className="text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">Lift progress</h2>
        <p className="mt-2 text-gold-deep">Log a workout to start tracking progress per exercise.</p>
      </section>
    );
  }

  const unit = metricUnit[metric];
  const last = selected.sessions[selected.sessions.length - 1];
  const noWeightedSets = metric !== "volume" && points.every((point) => point.value === 0);

  return (
    <section className="grid shrink-0 grid-cols-1 gap-4 bg-sheet p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex min-w-0 flex-col">
        <h2 className="shrink-0 text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">Lift progress</h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <TextField
            select
            size="small"
            label="Exercise"
            value={selected.exerciseId}
            onChange={(event) => setExerciseId(Number(event.target.value))}
            sx={{ minWidth: 220 }}
          >
            {histories.map((history) => (
              <MenuItem key={history.exerciseId} value={history.exerciseId}>
                {history.name}
                <span className="ml-2 text-xs text-gold-deep">
                  {history.sessions.length} {history.sessions.length === 1 ? "session" : "sessions"}
                </span>
              </MenuItem>
            ))}
          </TextField>
          <SegmentedToggle value={metric} options={metricOptions} onChange={setMetric} ariaLabel="Progress metric" />
          <span className="flex items-center gap-1 text-xs text-gold-deep">
            <span aria-hidden className="inline-block size-3 rounded-full bg-vermilion" />
            New personal record (est. 1RM)
          </span>
        </div>

        <div className="relative mt-3 h-72 select-none">
          {noWeightedSets ? (
            <p className="flex h-full items-center justify-center px-4 text-center text-gold-deep">
              No weighted sets logged for {selected.name} yet, so there's no {metric === "oneRepMax" ? "1RM estimate" : "top weight"} to chart. Try the Volume view.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
                  width={48}
                  domain={metric === "volume" ? [0, "dataMax"] : ["dataMin - 5", "dataMax + 5"]}
                  allowDecimals={false}
                />
                <Tooltip
                  content={(tooltip) => {
                    const point = tooltip.payload?.[0]?.payload as ChartPoint | undefined;
                    if (!tooltip.active || !point) return null;
                    const { session } = point;
                    return (
                      <div className="border border-gold bg-sheet px-3 py-2 text-sm shadow">
                        <p className="font-medium text-sumi">{formatDayLong(point.date)}</p>
                        <p className="text-gold-deep">
                          {metricOptions.find((option) => option.id === metric)?.label}: {point.value} {unit}
                        </p>
                        <p className="text-gold-deep">
                          Best set: {session.bestSet.weight} lb × {session.bestSet.reps}
                          {" · "}
                          {session.setCount} {session.setCount === 1 ? "set" : "sets"}
                        </p>
                        {session.isPR && session.previousBest !== null && (
                          <p className="font-bold text-vermilion">
                            PR! est. 1RM {Math.round(session.bestOneRepMax)} lb (was {Math.round(session.previousBest)})
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={unit}
                  stroke="#7a5c24"
                  strokeWidth={2.5}
                  dot={(dotProps: { cx?: number; cy?: number; payload?: ChartPoint }) => {
                    const { cx, cy, payload } = dotProps;
                    if (cx === undefined || cy === undefined || !payload) return <g />;
                    return payload.session.isPR ? (
                      <circle cx={cx} cy={cy} r={6} fill="#c43b22" stroke="#faf6ec" strokeWidth={1.5} />
                    ) : (
                      <circle cx={cx} cy={cy} r={3} fill="#7a5c24" />
                    );
                  }}
                  activeDot={{ r: 6, fill: "#c43b22" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-2 border-t border-gold-deep pt-3 sm:grid-cols-2">
          <LedgerRow
            label="Best est. 1RM"
            value={selected.best ? `${Math.round(selected.best.bestOneRepMax)} lb` : "—"}
            note={selected.best ? formatDayLong(selected.best.date) : undefined}
          />
          <LedgerRow
            label="Best set"
            value={selected.best ? `${selected.best.bestSet.weight} lb × ${selected.best.bestSet.reps}` : "—"}
          />
          <LedgerRow
            label="Last session"
            value={last ? formatDay(last.date) : "—"}
            note={last ? `${last.bestSet.weight} lb × ${last.bestSet.reps}` : undefined}
          />
          <LedgerRow
            label="Personal records"
            value={String(selected.prCount)}
            note={`in ${selected.sessions.length} ${selected.sessions.length === 1 ? "session" : "sessions"}`}
          />
        </dl>
      </div>

      <aside className="min-w-0 border-t border-gold-deep pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <h3 className="text-lg font-bold text-gold-deep">Recent PRs</h3>
        {recentPRs.length === 0 ? (
          <p className="mt-2 text-sm text-gold-deep">
            No personal records yet. A PR is a session whose estimated 1RM beats all of your earlier sessions for that
            lift.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {recentPRs.map((pr) => (
              <li key={`${pr.workoutId}-${pr.exerciseId}`} className="border-b border-gold/30 pb-3 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExerciseId(pr.exerciseId)}
                  className="block w-full cursor-pointer text-left hover:bg-kinu"
                  aria-label={`Show ${pr.exerciseName} progress`}
                >
                  <p className="font-medium text-sumi">{pr.exerciseName}</p>
                  <p className="text-sm text-gold-deep">
                    {formatDay(pr.date)} · {pr.set.weight} lb × {pr.set.reps}
                  </p>
                  <p className="text-sm text-vermilion">
                    est. 1RM {Math.round(pr.oneRepMax)} lb (+{(pr.oneRepMax - pr.previousBest).toFixed(1)})
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-gold-deep">
          Estimated 1RM uses the Epley formula: weight × (1 + reps ÷ 30).
        </p>
      </aside>
    </section>
  );
}
