import { useEffect, useMemo, useState } from "react";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import { IndeterminateProgressCircle } from "../Dashboard/Dashboard";

type WeightLogEntry = {
  date: string;
  weight: number;
};

const BLOCK_MARGIN = 3;
const FONT_SIZE = 12;
// Space the calendar needs besides the blocks: weekday labels on the left,
// month labels + gaps + legend above/below the 7 rows.
const LABEL_WIDTH = 40;
const CHROME_HEIGHT = 52;
const MIN_BLOCK = 10;
const MAX_BLOCK = 28;
const MIN_WEEKS = 8;
const MAX_WEEKS = 52;

const EMPTY_COLOR = "#e4d7bc";
const LOGGED_COLOR = "#2f6b45";

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLong(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, size] as const;
}

function buildActivities(weightsByDay: Map<string, number>, weekCount: number): Activity[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cursor = new Date(today);
  cursor.setDate(today.getDate() - today.getDay() - (weekCount - 1) * 7);

  const activities: Activity[] = [];
  while (cursor <= today) {
    const date = isoDate(cursor);
    const weight = weightsByDay.get(date);
    activities.push({
      date,
      count: weight ?? 0,
      level: weight === undefined ? 0 : 1,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return activities;
}

export default function WeightLog({ weights, isLoading }: { weights: WeightLogEntry[], isLoading: boolean }) {

  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();

  const blockSize = Math.min(MAX_BLOCK, Math.max(MIN_BLOCK, Math.floor((height - CHROME_HEIGHT) / 8)));
  const weekCount = Math.min(
    MAX_WEEKS,
    Math.max(MIN_WEEKS, Math.floor((width - LABEL_WIDTH + BLOCK_MARGIN) / (blockSize + BLOCK_MARGIN))),
  );

  const weightsByDay = useMemo(
    () => new Map(weights.map((entry) => [entry.date.slice(0, 10), entry.weight])),
    [weights],
  );
  const activities = useMemo(() => buildActivities(weightsByDay, weekCount), [weightsByDay, weekCount]);
  const loggedCount = activities.filter((activity) => activity.level > 0).length;
  const ready = width > 0 && height > 0;

  if (isLoading) {
    return (
      <section className="flex min-h-[22rem] flex-col items-center justify-center overflow-hidden border-b border-gold-deep p-4 lg:min-h-0">
        <IndeterminateProgressCircle />
      </section>
    );
  }

  return (
    <section className="flex min-h-72 flex-col overflow-hidden p-4 lg:h-full lg:min-h-0">
      <h2 className="shrink-0 text-xl font-bold text-gold-deep">Weight log</h2>
      <p className="mb-2 shrink-0 text-sm text-gold-deep">
        {loggedCount} {loggedCount === 1 ? "day" : "days"} with a weight logged in the last {weekCount} weeks
      </p>
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden">
        {ready && (
          <ActivityCalendar
            data={activities}
            colorScheme="light"
            theme={{ light: [EMPTY_COLOR, LOGGED_COLOR] }}
            minLevel={0}
            maxLevel={1}
            blockSize={blockSize}
            blockMargin={BLOCK_MARGIN}
            blockRadius={7}
            fontSize={FONT_SIZE}
            showWeekdayLabels={["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}
            showTotalCount={false}
            labels={{ legend: { less: "No entry", more: "Weight logged" } }}
            className="text-gold-deep"
            tooltips={{
              activity: {
                text: (activity) =>
                  activity.level > 0
                    ? `${formatLong(activity.date)} · ${activity.count} lb`
                    : `${formatLong(activity.date)} · No weight logged`,
                placement: "top",
                hoverRestMs: 0,
                withArrow: true,
              },
            }}
          />
        )}
      </div>
    </section>
  );
}
