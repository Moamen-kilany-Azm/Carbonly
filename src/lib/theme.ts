"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
      light: "#4ade80",
      dark: "#15803d",
      contrastText: "#fff",
    },
    secondary: {
      main: "#0d9488",
      light: "#2dd4bf",
      dark: "#0f766e",
      contrastText: "#fff",
    },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    info: { main: "#3b82f6" },
    success: { main: "#16a34a" },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      disabled: "#94a3b8",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Inter"',
      '"Segoe UI"',
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 900, letterSpacing: "-0.03em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: "0.8125rem" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: {
    borderRadius: 10,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shadows: [
    "none",
    "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
    "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)",
    "0 8px 24px -4px rgb(0 0 0 / 0.1), 0 4px 12px -4px rgb(0 0 0 / 0.06)",
    "0 12px 32px -4px rgb(0 0 0 / 0.12), 0 6px 16px -4px rgb(0 0 0 / 0.08)",
    ...Array(20).fill("0 12px 32px -4px rgb(0 0 0 / 0.12)"),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 18px",
          fontWeight: 700,
          fontSize: "0.875rem",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 24,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: "#94a3b8",
          background: "#f8fafc",
        },
        root: {
          fontSize: "0.875rem",
          padding: "12px 16px",
          borderColor: "#f1f5f9",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: "1px solid #e2e8f0",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: "1px solid #e2e8f0",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: "#f1f5f9",
        },
      },
    },
  },
});

// Dark theme variant for admin sidebar and landing page
export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: "dark",
    primary: theme.palette.primary,
    secondary: theme.palette.secondary,
    background: {
      default: "#030d05",
      paper: "#0a1a0e",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255,255,255,0.6)",
      disabled: "rgba(255,255,255,0.35)",
    },
    divider: "rgba(255,255,255,0.08)",
  },
});
