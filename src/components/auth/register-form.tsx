"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Box from "@mui/material/Box";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
      <TextField
        name="name"
        type="text"
        required
        fullWidth
        size="medium"
        label="Full name"
        placeholder="Jane Smith"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <User size={18} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        name="email"
        type="email"
        required
        fullWidth
        size="medium"
        label="Email address"
        placeholder="you@company.com"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Mail size={18} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        name="password"
        type="password"
        required
        fullWidth
        size="medium"
        label="Password"
        placeholder="Min. 8 characters"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Lock size={18} />
              </InputAdornment>
            ),
          },
          htmlInput: {
            minLength: 8,
          },
        }}
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{ mt: 0.5, py: 1.3 }}
      >
        {loading ? (
          <>
            <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </Box>
  );
}
