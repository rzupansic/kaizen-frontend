import type { CSSProperties } from "react";

/** Recharts tooltip styled as a small parchment slip with a gold rule, not the default white box. */
export const chartTooltipStyle: {
  contentStyle: CSSProperties;
  labelStyle: CSSProperties;
  itemStyle: CSSProperties;
} = {
  contentStyle: {
    background: "#faf6ec",
    border: "1px solid #d0ad6a",
    borderRadius: 0,
    boxShadow: "none",
    fontSize: 13,
    color: "#1c1814",
  },
  labelStyle: { color: "#7a5c24", fontWeight: 500 },
  itemStyle: { color: "#1c1814" },
};
