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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../../slices/authSlice.ts";
import type { AppDispatch, RootState } from "../../slices/store.ts";

const expandedWidth = 240;
const collapsedWidth = 88;

const headerLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/training", label: "Training" },
];

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AppLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const [open, setOpen] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);
  const closeMenu = () => setMenuAnchor(null);
  const width = open ? expandedWidth : collapsedWidth;

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } finally {
      navigate("/login");
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* <Drawer
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
        </Drawer> */}
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
            <Typography variant="h6" noWrap sx={{ flex: 1, fontFamily: '"Shippori Mincho", ui-serif, Georgia, serif', fontSize: "1.5rem"  }} className="text-gold-deep font-bold">Kaizen</Typography>
            <Box
              component="nav"
              aria-label="Main"
              sx={{
                display: "flex",
                gap: 0.5,
                mx: 2,
                p: 0.5,
                borderRadius: 999,
                border: "1px solid rgba(208, 173, 106, 0.7)",
                bgcolor: "background.paper",
              }}
            >
              {headerLinks.map((link) => {
                const active = pathname === link.to;
                return (
                  <Button
                    key={link.to}
                    component={NavLink}
                    to={link.to}
                    end
                    aria-current={active ? "page" : undefined}
                    disableElevation
                    sx={{
                      minWidth: 112,
                      px: 2.5,
                      py: 0.5,
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: active ? 700 : 500,
                      bgcolor: active ? "primary.main" : "transparent",
                      color: active ? "primary.contrastText" : "#7a5c24",
                      "&:hover": { bgcolor: active ? "primary.main" : "rgba(208, 173, 106, 0.25)" },
                    }}
                  >
                    {link.label}
                  </Button>
                );
              })}
            </Box>
            <Tooltip title="Account">
              <IconButton
                aria-label="Account menu"
                aria-haspopup="true"
                aria-controls={menuOpen ? "account-menu" : undefined}
                aria-expanded={menuOpen ? "true" : undefined}
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ ml: "auto", color: "#7a5c24" }}
              >
                <AccountCircleIcon fontSize="large" />
              </IconButton>
            </Tooltip>
            <Menu
              id="account-menu"
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={closeMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {user?.email && (
                <MenuItem disabled sx={{ opacity: "1 !important" }}>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </MenuItem>
              )}
              {user?.email && <Divider />}
              <MenuItem
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: { xs: "auto", lg: "hidden" }, p: { xs: 2, lg: 3 } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </>
  );
}
