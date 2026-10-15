import { createTheme } from "@mui/material/styles";

// Single MUI theme for the whole app. It is provided in main.tsx so every MUI
// component (layout, login, dialogs) gets the same Kaizen look.
export const theme = createTheme({
  palette: {
    background: { default: "#efe6d4", paper: "#faf6ec" },
    text: { primary: "#1c1814" },
    primary: { main: "#d0ad6a", contrastText: "#1c1814" },
  },
  typography: {
    fontFamily: '"Zen Kaku Gothic New", ui-sans-serif, system-ui, sans-serif',
  },
  shape: { borderRadius: 0 },
});
