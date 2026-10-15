import { useState } from "react";
import Slider from "@mui/material/Slider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  MIN_SPAN,
  PRESETS,
  formatShort,
  rangeForPreset,
  sameRange,
  type DateRange,
  type PresetId,
} from "./dateRange.ts";

type DateRangeSelectorProps = {
  /** Sorted ISO dates (YYYY-MM-DD), one per data point. */
  dates: string[];
  /** Selected window as inclusive indexes into `dates`. */
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export default function DateRangeSelector({ dates, value, onChange }: DateRangeSelectorProps) {
  // Only set while a thumb is being dragged, so the chart updates on release.
  const [draft, setDraft] = useState<DateRange | null>(null);
  const shown = draft ?? value;

  const max = Math.max(0, dates.length - 1);
  const minSpan = Math.min(MIN_SPAN, max);
  const activePreset = PRESETS.find((preset) => sameRange(rangeForPreset(dates, preset.id), value))?.id ?? null;

  const handleSlide = (_event: Event, next: number | number[], activeThumb: number) => {
    if (!Array.isArray(next)) return;
    const [start, end] = next;
    if (activeThumb === 0) {
      setDraft({ start: Math.min(start, shown.end - minSpan), end: shown.end });
    } else {
      setDraft({ start: shown.start, end: Math.max(end, shown.start + minSpan) });
    }
  };

  const commit = () => {
    if (draft && !sameRange(draft, value)) onChange(draft);
    setDraft(null);
  };

  return (
    <div className="flex shrink-0 items-center gap-4 pt-2">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={activePreset}
        aria-label="Date range"
        onChange={(_event, preset: PresetId | null) => {
          if (preset) onChange(rangeForPreset(dates, preset));
        }}
      >
        {PRESETS.map((preset) => (
          <ToggleButton
            key={preset.id}
            value={preset.id}
            sx={{
              px: 1.25,
              py: 0.25,
              fontSize: 12,
              textTransform: "none",
              color: "#7a5c24",
              borderColor: "rgba(208, 173, 106, 0.6)",
              "&.Mui-selected": {
                bgcolor: "#d0ad6a",
                color: "#1c1814",
                "&:hover": { bgcolor: "#d0ad6a" },
              },
            }}
          >
            {preset.id}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Slider
        size="small"
        min={0}
        max={max}
        step={1}
        disableSwap
        disabled={max === 0}
        value={[shown.start, shown.end]}
        onChange={handleSlide}
        onChangeCommitted={commit}
        valueLabelDisplay="auto"
        valueLabelFormat={(index) => (dates[index] ? formatShort(dates[index]) : "")}
        getAriaLabel={(index) => (index === 0 ? "Range start" : "Range end")}
        sx={{
          flex: 1,
          color: "#7a5c24",
          "& .MuiSlider-rail": { opacity: 0.25 },
          "& .MuiSlider-valueLabel": { bgcolor: "#1c1814", fontSize: 11 },
        }}
      />

      <span className="shrink-0 text-xs text-gold-deep">
        {dates[shown.start] ? formatShort(dates[shown.start]) : ""} – {dates[shown.end] ? formatShort(dates[shown.end]) : ""}
      </span>
    </div>
  );
}
