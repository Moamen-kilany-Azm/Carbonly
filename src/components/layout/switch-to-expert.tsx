"use client";

import { signIn } from "next-auth/react";
import { UserRound, Loader2, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

/**
 * Demo-only: signs out whoever is currently logged in and signs back in as
 * the seeded expert user, landing on the tenant dashboard.
 * NextAuth v5's `signIn("credentials", ...)` replaces the existing session.
 */
export function SwitchToExpertButton() {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    setLoading(true);
    await signIn("credentials", {
      email: "expert@acme-corp.com",
      password: "expert1234",
      redirect: true,
      callbackUrl: "/dashboard",
    });
  }

  return (
    <Box
      sx={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        px: 1.5,
        py: 1.5,
      }}
    >
      <Typography
        sx={{
          px: 0.5,
          pb: 1,
          fontSize: "0.625rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#6b7280",
        }}
      >
        Switch role
      </Typography>
      <Button
        onClick={handle}
        disabled={loading}
        fullWidth
        sx={{
          justifyContent: "flex-start",
          gap: 1.25,
          borderRadius: 2,
          px: 1.5,
          py: 1,
          bgcolor: "rgba(255,255,255,0.05)",
          color: "#d1d5db",
          textTransform: "none",
          fontWeight: 400,
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.08)",
            color: "#fff",
          },
          "&.Mui-disabled": {
            opacity: 0.6,
            color: "#d1d5db",
          },
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1.5,
            bgcolor: "rgba(34,197,94,0.15)",
            color: "#4ade80",
            flexShrink: 0,
          }}
        >
          {loading ? <Loader2 size={13} /> : <UserRound size={13} />}
        </Box>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.3 }}>
          <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#fff" }}>
            Expert View
          </Typography>
          <Typography component="span" sx={{ fontSize: "0.625rem", color: "#6b7280" }}>
            Sign in as expert
          </Typography>
        </Box>
        <ArrowRightLeft size={13} color="#6b7280" />
      </Button>
    </Box>
  );
}
