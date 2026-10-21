import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

type SegmentedToggleProps<T extends string | number> = {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
};

/** Small single-select toggle that matches the date-range presets. */
export default function SegmentedToggle<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedToggleProps<T>) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      aria-label={ariaLabel}
      onChange={(_event, next: T | null) => {
        if (next !== null) onChange(next);
      }}
      sx={{ flexWrap: "wrap" }}
    >
      {options.map((option) => (
        <ToggleButton
          key={String(option.id)}
          value={option.id}
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
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
