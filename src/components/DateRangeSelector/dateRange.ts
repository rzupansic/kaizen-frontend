export type DateRange = { start: number; end: number };

export type PresetId = "1M" | "3M" | "6M" | "1Y" | "All";

export const PRESETS: { id: PresetId; days: number | null }[] = [
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "6M", days: 180 },
  { id: "1Y", days: 365 },
  { id: "All", days: null },
];

export const MIN_SPAN = 6;

function shiftDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatShort(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function rangeForPreset(dates: string[], preset: PresetId = "3M"): DateRange {
  const last = Math.max(0, dates.length - 1);
  const days = PRESETS.find((item) => item.id === preset)?.days ?? null;
  if (days === null || dates.length === 0) return { start: 0, end: last };

  const cutoff = shiftDays(dates[last], -days);
  const found = dates.findIndex((date) => date >= cutoff);
  const start = Math.min(Math.max(0, found), Math.max(0, last - MIN_SPAN));
  return { start, end: last };
}

export function sameRange(a: DateRange, b: DateRange) {
  return a.start === b.start && a.end === b.end;
}
