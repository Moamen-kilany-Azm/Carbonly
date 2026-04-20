import { Leaf } from "lucide-react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #f0fdfa 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 320,
          height: 320,
          background: "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      {/* Centered content */}
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 5,
          px: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          {/* Brand */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 3.5,
                background: "linear-gradient(135deg, #16a34a, #0d9488)",
                mb: 2,
                boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
              }}
            >
              <Leaf size={24} color="white" />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "text.primary",
              }}
            >
              Carbonly
            </Typography>
            <Typography
              sx={{
                fontSize: "0.9375rem",
                color: "text.secondary",
                mt: 0.5,
              }}
            >
              Carbon Emissions Management Platform
            </Typography>
          </Box>

          {/* Card */}
          <Paper
            elevation={2}
            sx={{
              bgcolor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: 5,
              px: 5,
              py: 4.5,
            }}
          >
            {children}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
