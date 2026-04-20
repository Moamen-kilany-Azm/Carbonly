"use client";

import { signOut } from "next-auth/react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { LogOut, Bell, Building2, Menu } from "lucide-react";

type TopbarProps = {
  user: { name?: string | null; email?: string | null; entitySlug?: string };
  onMenuToggle?: () => void;
};

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  return (
    <AppBar position="static" color="inherit" elevation={0}>
      <Toolbar sx={{ gap: 2, minHeight: 60 }}>
        {/* Hamburger — mobile only */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{ display: { xs: "flex", lg: "none" } }}
        >
          <Menu size={20} />
        </IconButton>

        {/* Left: org slug */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {user.entitySlug && (
            <Chip
              icon={<Building2 size={12} />}
              label={user.entitySlug}
              size="small"
              variant="outlined"
              sx={{ fontFamily: "monospace", fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right: actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
            <Bell size={15} />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: "auto", height: 22 }} />

          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "text.primary",
              mr: 1,
            }}
          >
            {user.name ?? user.email}
          </Typography>

          <Button
            variant="outlined"
            size="small"
            startIcon={<LogOut size={13} />}
            onClick={() => signOut({ callbackUrl: "/login" })}
            sx={{
              color: "text.secondary",
              borderColor: "divider",
              fontSize: "0.8125rem",
              fontWeight: 500,
              "&:hover": {
                borderColor: "divider",
                bgcolor: "action.hover",
                color: "text.primary",
              },
            }}
          >
            Sign out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
