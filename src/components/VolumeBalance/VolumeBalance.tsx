import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SegmentedToggle from "../SegmentedToggle/SegmentedToggle.tsx";
import { chartTooltipStyle } from "../../utils/chartTheme.ts";
import { formatDay, formatDayLong, toLocalDateKey } from "../../utils/dates.ts";
import {
  HIGH_WEEKLY_SETS,
  LOW_WEEKLY_SETS,
  muscleBalance,
  normalizeGroup,
  weeklyVolumeByMuscle,
  type BalanceStatus,
  type VolumeMetric,
} from "../../utils/trainingStats.ts";
import type { SetRow } from "../../types.ts";

const weekOptions = [
  { id: 8, label: "8W" },
  { id: 12, label: "12W" },
  { id: 26, label: "26W" },
];

const metricOptions: { id: VolumeMetric; label: string }[] = [
  { id: "sets", label: "Sets" },
  { id: "volume", label: "Volume" },
];

// Muted traditional Japanese pigments so the chart reads as ink and dye on paper.
// Reused when there are more groups than colors.
const PALETTE = [
  "#7a5c24", // kincha (aged gold)
  "#c43b22", // shu (vermilion)
  "#2f6b45", // matcha (deep green)
  "#2b4a66", // ai (indigo)
  "#d0ad6a", // kin (gold)
  "#6b4b63", // murasaki (muted purple)
  "#4a4036", // sumi (ink)
  "#b8702c", // kakishibu (persimmon)
  "#5f827e", // asagi (teal grey)
  "#9c4a55", // enji (crimson)
  "#7a8a3c", // uguisu (olive)
  "#8b8372", // nezumi (mouse grey)
];

const statusStyle: Record<BalanceStatus, { label: string; className: string }> = {
  none: { label: "Not trained", className: "bg-sumi/10 text-sumi" },
  low: { label: "Low", className: "bg-vermilion/15 text-vermilion" },
  ok: { label: "On target", className: "bg-[#2f6b45]/15 text-[#2f6b45]" },
  high: { label: "High", className: "bg-gold/30 text-gold-deep" },
};

export default function VolumeBalance({ rows, libraryGroups }: { rows: SetRow[]; libraryGroups: string[] }) {
  const [weeks, setWeeks] = useState(12);
  const [metric, setMetric] = useState<VolumeMetric>("sets");
  const [today] = useState(() => toLocalDateKey(new Date()));

  const weekly = useMemo(() => weeklyVolumeByMuscle(rows, weeks, metric, today), [rows, weeks, metric, today]);
  const balance = useMemo(() => muscleBalance(rows, libraryGroups, today), [rows, libraryGroups, today]);

  // Stable color per group regardless of which groups are visible in the window.
  const colorFor = useMemo(() => {
    const all = [...new Set([...rows.map((row) => normalizeGroup(row.muscleGroup)), ...libraryGroups.map(normalizeGroup)])].sort();
    return (group: string) => PALETTE[Math.max(0, all.indexOf(group)) % PALETTE.length];
  }, [rows, libraryGroups]);

  const maxSets = Math.max(1, ...balance.map((entry) => entry.sets));
  const unit = metric === "sets" ? "sets" : "lb";

  return (
    <section className="grid shrink-0 grid-cols-1 gap-4 bg-sheet p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col">
        <h2 className="shrink-0 text-xl font-bold text-gold-deep border-b border-gold-deep pb-2">
          Weekly volume by muscle group
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SegmentedToggle value={weeks} options={weekOptions} onChange={setWeeks} ariaLabel="Weeks to show" />
          <SegmentedToggle value={metric} options={metricOptions} onChange={setMetric} ariaLabel="Volume metric" />
          <span className="text-xs text-gold-deep">
            {metric === "sets" ? "Working sets per week" : "Weight × reps per week"} · weeks start Monday
          </span>
        </div>

        <div className="relative mt-3 h-72 select-none">
          {weekly.groups.length === 0 ? (
            <p className="flex h-full items-center justify-center px-4 text-center text-gold-deep">
              No sets logged in the last {weeks} weeks.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart data={weekly.weeks} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#1c1814" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="weekStart"
                  stroke="#7a5c24"
                  tick={{ fill: "#7a5c24", fontSize: 12 }}
                  minTickGap={16}
                  tickFormatter={(value) => formatDay(String(value))}
                />
                <YAxis stroke="#7a5c24" tick={{ fill: "#7a5c24", fontSize: 12 }} width={48} allowDecimals={false} />
                <Tooltip
                  {...chartTooltipStyle}
                  cursor={{ fill: "#d0ad6a", fillOpacity: 0.15 }}
                  labelFormatter={(value) => `Week of ${formatDayLong(String(value))}`}
                  formatter={(value, name) => [`${Number(value).toLocaleString()} ${unit}`, String(name)]}
                  itemSorter={(item) => -(Number(item.value) || 0)}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#7a5c24" }} iconType="square" />
                {weekly.groups.map((group) => (
                  <Bar key={group} dataKey={group} stackId="volume" fill={colorFor(group)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <aside className="min-w-0 border-t border-gold-deep pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <h3 className="text-lg font-bold text-gold-deep">Muscle balance</h3>
        <p className="text-xs text-gold-deep">Last 4 weeks</p>

        {balance.length === 0 ? (
          <p className="mt-2 text-sm text-gold-deep">Log a workout to see how your training is distributed.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {balance.map((entry) => (
              <li key={entry.group}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-sumi">
                    <span
                      aria-hidden
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: colorFor(entry.group) }}
                    />
                    {entry.group}
                  </span>
                  <span className="text-gold-deep">
                    {entry.sets} {entry.sets === 1 ? "set" : "sets"}
                    {entry.sets > 0 && ` · ${entry.weeklyAverage.toFixed(1)}/wk`}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 bg-kinu">
                    <div
                      className="h-full"
                      style={{ width: `${(entry.sets / maxSets) * 100}%`, backgroundColor: colorFor(entry.group) }}
                    />
                  </div>
                  <span className={`rounded-sm px-1.5 text-xs font-medium ${statusStyle[entry.status].className}`}>
                    {statusStyle[entry.status].label}
                  </span>
                </div>
                {entry.sets === 0 && entry.lastTrained && (
                  <p className="mt-0.5 text-xs text-gold-deep">Last trained {formatDayLong(entry.lastTrained)}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-gold-deep">
          Rough guide: under {LOW_WEEKLY_SETS} sets per week is low, over {HIGH_WEEKLY_SETS} is high. Needs vary by
          goal and experience.
        </p>
      </aside>
    </section>
  );
}
