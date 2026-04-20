"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import {
  LayoutDashboard,
  Flame,
  Zap,
  Globe,
  FileText,
  Settings,
  ListFilter,
  Leaf,
  Shield,
} from "lucide-react";

type NavItem =
  | { href: string; label: string; icon: typeof LayoutDashboard; sub?: string; type?: undefined }
  | { label: string; type: "section" };

const baseNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/emissions", label: "All Records", icon: ListFilter },
  { label: "Calculator", type: "section" },
  { href: "/scope/1", label: "Scope 1", sub: "Direct Emissions", icon: Flame },
  { href: "/scope/2", label: "Scope 2", sub: "Energy", icon: Zap },
  { href: "/scope/3", label: "Scope 3", sub: "Value Chain", icon: Globe },
  { label: "Reporting", type: "section" },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  user: { name?: string | null; email?: string | null; globalRole: string };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    ...baseNav,
    { label: "Platform", type: "section" },
    { href: "/admin", label: "Admin Panel", sub: "Platform view", icon: Shield },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      {/* Logo */}
      <Box
        component={Link}
        href="/"
        sx={{
          height: 60,
          display: "flex",
          alignItems: "center",
          px: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          gap: 1.25,
          flexShrink: 0,
          textDecoration: "none",
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 2,
            background: "linear-gradient(135deg, #16a34a, #0d9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 10px rgba(22,163,74,0.3)",
          }}
        >
          <Leaf size={16} color="white" />
        </Box>
        <Typography
          sx={{
            fontSize: "1.0625rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "text.primary",
          }}
        >
          Carbonly
        </Typography>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.25, py: 1.5 }}>
        <List disablePadding>
          {nav.map((item, i) => {
            if (item.type === "section") {
              return (
                <Typography
                  key={i}
                  sx={{
                    px: 1.5,
                    pt: i === 0 ? 0 : 2,
                    pb: 0.75,
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "text.disabled",
                  }}
                >
                  {item.label}
                </Typography>
              );
            }
            const Icon = item.icon!;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href!));
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href!}
                selected={active}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.25,
                  py: 0.75,
                  px: 1.25,
                  "&.Mui-selected": {
                    bgcolor: "rgba(22,163,74,0.08)",
                    color: "primary.main",
                    "&:hover": { bgcolor: "rgba(22,163,74,0.12)" },
                  },
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 1.25,
                    width: 30,
                    height: 30,
                    borderRadius: 1.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: active ? "rgba(22,163,74,0.12)" : "transparent",
                    color: active ? "primary.main" : "text.secondary",
                    transition: "background 0.12s ease",
                  }}
                >
                  <Icon size={15} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.sub || undefined}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.875rem",
                        fontWeight: active ? 600 : 500,
                        color: active ? "primary.main" : "text.primary",
                      },
                    },
                    secondary: {
                      sx: {
                        fontSize: "0.7rem",
                        color: active ? "primary.light" : "text.disabled",
                        opacity: 0.8,
                        mt: 0,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* User footer */}
      <Divider />
      <Box sx={{ px: 1.75, py: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.8125rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #16a34a, #0d9488)",
            }}
          >
            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "text.primary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name ?? user.email}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "text.disabled" }}>
              {user.globalRole}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
