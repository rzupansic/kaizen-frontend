/** The YYYY-MM-DD part of an API date ("2026-10-08T04:00:00.000Z" or "2026-10-08"). */
export function dayKey(value: string) {
  return value.slice(0, 10);
}

/** YYYY-MM-DD for a Date in the user's local timezone. */
export function toLocalDateKey(value: string | Date) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDay(value: string) {
  const [year, month, day] = dayKey(value).split("-").map(Number);
  return { year, month, day };
}

/** Local-midnight Date for a YYYY-MM-DD string. */
export function dateFromDay(value: string) {
  const { year, month, day } = parseDay(value);
  return new Date(year, month - 1, day);
}

export function formatDay(value: string) {
  const { year, month, day } = parseDay(value);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDayLong(value: string) {
  const { year, month, day } = parseDay(value);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Whole days from `from` to `to` (both YYYY-MM-DD); DST-safe. */
export function daysBetween(from: string, to: string) {
  const a = parseDay(from);
  const b = parseDay(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

/** Monday of the week containing `value`, as YYYY-MM-DD. */
export function weekStart(value: string) {
  const date = dateFromDay(value);
  const offset = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - offset);
  return toLocalDateKey(date);
}

export function addDays(value: string, days: number) {
  const date = dateFromDay(value);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}
