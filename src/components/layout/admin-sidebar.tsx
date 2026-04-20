"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { Building2, Users, Layers, SlidersHorizontal, CreditCard, BarChart3 } from "lucide-react";
import { SwitchToExpertButton } from "@/components/layout/switch-to-expert";

const nav = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/entities", label: "Entities", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/scopes", label: "Scopes & Activities", icon: Layers },
  { href: "/admin/emission-factors", label: "Emission Factors", icon: SlidersHorizontal },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#111827",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 56,
          display: "flex",
          alignItems: "center",
          px: 2.5,
          borderBottom: "1px solid",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Typography
          sx={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#4ade80",
          }}
        >
          Carbonly Admin
        </Typography>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 2 }}>
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  color: active ? "#fff" : "#9ca3af",
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
                  <Icon size={16} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: { fontSize: "0.875rem", fontWeight: active ? 500 : 400 },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Switch role (demo) */}
      <SwitchToExpertButton />

      {/* Back to app */}
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography
          component={Link}
          href="/dashboard"
          sx={{
            fontSize: "0.75rem",
            color: "#6b7280",
            textDecoration: "none",
            "&:hover": { color: "#d1d5db" },
          }}
        >
          &larr; Back to App
        </Typography>
      </Box>
    </Box>
  );
}
