import { createTheme } from "@mui/material/styles";

// Single MUI theme for the whole app. It is provided in main.tsx so every MUI
// component (layout, login, dialogs) gets the same Kaizen look.
//
// Status colors are drawn from the same palette as the rest of the app instead
// of Material's defaults: vermilion (shu) for errors, aged gold for warnings and
// matcha green for success, so alerts and destructive buttons look like part of
// the scroll rather than a stock UI kit.
export const theme = createTheme({
  palette: {
    background: { default: "#efe6d4", paper: "#faf6ec" },
    text: { primary: "#1c1814" },
    primary: { main: "#d0ad6a", contrastText: "#1c1814" },
    error: { main: "#c43b22", contrastText: "#faf6ec" },
    warning: { main: "#b8862b", contrastText: "#1c1814" },
    success: { main: "#2f6b45", contrastText: "#faf6ec" },
    info: { main: "#7a5c24", contrastText: "#faf6ec" },
  },
  typography: {
    fontFamily: '"Zen Kaku Gothic New", ui-sans-serif, system-ui, sans-serif',
  },
  shape: { borderRadius: 0 },
});
