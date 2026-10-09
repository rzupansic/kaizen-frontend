import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { logout } from "../../slices/authSlice.ts";
import type { AppDispatch, RootState } from "../../slices/store.ts";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";

const expandedWidth = 240;
const collapsedWidth = 88;

const theme = createTheme({
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

const navItems = [{ to: "/", label: "Dashboard", icon: DashboardIcon }, { to: "/calendar", label: "Calendar", icon: CalendarIcon }, { to: "/settings", label: "Settings", icon: SettingsIcon }];

export default function AppLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const [open, setOpen] = useState(true);
  const width = open ? expandedWidth : collapsedWidth;

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } finally {
      navigate("/login");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Drawer
          variant="permanent"
          sx={{
            width,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width,
              display: "flex",
              flexDirection: "column",
              overflowX: "hidden",
              bgcolor: "background.paper",
              borderRight: "1px solid",
              borderColor: "rgba(208, 173, 106, 0.45)",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: open ? 1 : 0.5,
              py: 1.5,
            }}
          >
            {open ? (
              <>
                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    px: 1,
                    fontFamily: '"Shippori Mincho", ui-serif, Georgia, serif',
                    fontSize: "1.05rem",
                  }}
                >
                  Kaizen
                </Typography>
                <IconButton
                  aria-label="Collapse sidebar"
                  onClick={() => setOpen(false)}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </>
            ) : (
              <Tooltip title="Expand sidebar" placement="right">
                <Button
                  onClick={() => setOpen(true)}
                  sx={{
                    minWidth: 0,
                    width: "100%",
                    px: 0.5,
                    color: "text.primary",
                    fontFamily: '"Shippori Mincho", ui-serif, Georgia, serif',
                    fontSize: "0.8rem",
                    textTransform: "none",
                  }}
                >
                  Kaizen
                </Button>
              </Tooltip>
            )}
          </Box>
          <List>
            {navItems.map((item) => {
              const selected = pathname === item.to;
              const button = (
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  end
                  selected={selected}
                  sx={{
                    justifyContent: open ? "flex-start" : "center",
                    px: open ? 2 : 1,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      "&:hover": { bgcolor: "primary.main" },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 1.5 : 0,
                      color: "inherit",
                      justifyContent: "center",
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  {open && <ListItemText primary={item.label} />}
                </ListItemButton>
              );

              return (
                <ListItem key={item.to} disablePadding>
                  {open ? (
                    button
                  ) : (
                    <Tooltip title={item.label} placement="right">
                      {button}
                    </Tooltip>
                  )}
                </ListItem>
              );
            })}
          </List>
          {open && (
            <Typography variant="body2" noWrap sx={{ mt: "auto", px: 2, py: 2 }}>
              Current User: {user?.email}
            </Typography>
          )}
        </Drawer>
        <Box
          component="main"
          sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}
        >
          <Box
            component="header"
            sx={{
              display: "flex",
              alignItems: "center",
              height: 56,
              px: 2,
              borderBottom: "1px solid",
              borderColor: "rgba(208, 173, 106, 0.45)",
            }}
          >
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{ ml: "auto" }}
            >
              Logout
            </Button>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", p: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
