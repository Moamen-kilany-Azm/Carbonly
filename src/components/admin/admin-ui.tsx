"use client";

import { useEffect, useState, type ReactNode } from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import MuiMenu from "@mui/material/Menu";
import MuiMenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { X, MoreHorizontal } from "lucide-react";

// ─── Sidesheet (MUI Drawer, anchor right, 75% width) ─────────────────────────

export function AdminDrawer({
  open,
  onClose,
  title,
  description,
  children,
  size: _size,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "75%",
            maxWidth: 760,
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          px: 4,
          pt: 3,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </Box>
      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 3 }}>{children}</Box>
    </Drawer>
  );
}

// ─── Form footer (MUI Buttons) ──────────────────────────────────────────────

export function FormFooter({
  onCancel,
  submitLabel = "Save",
  submitting = false,
  variant = "primary",
}: {
  onCancel: () => void;
  submitLabel?: string;
  submitting?: boolean;
  variant?: "primary" | "danger";
}) {
  return (
    <Box
      sx={{
        mt: 3,
        pt: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        justifyContent: "flex-end",
        gap: 1,
      }}
    >
      <Button
        variant="outlined"
        color="inherit"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="contained"
        color={variant === "danger" ? "error" : "primary"}
        disabled={submitting}
      >
        {submitting ? "Saving\u2026" : submitLabel}
      </Button>
    </Box>
  );
}

// ─── Row dropdown menu (MUI IconButton + Menu + MenuItem) ────────────────────

export function RowMenu({
  children,
}: {
  children: (close: () => void) => ReactNode;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
      >
        <MoreHorizontal size={16} />
      </IconButton>
      <MuiMenu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        {children(() => setAnchorEl(null))}
      </MuiMenu>
    </>
  );
}

export function MenuAction({
  icon,
  children,
  onClick,
  danger,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <MuiMenuItem
      onClick={onClick}
      sx={danger ? { color: "error.main" } : undefined}
    >
      {icon && <ListItemIcon sx={danger ? { color: "error.main" } : undefined}>{icon}</ListItemIcon>}
      <ListItemText>{children}</ListItemText>
    </MuiMenuItem>
  );
}

// ─── Toast hook (MUI Snackbar + Alert) ──────────────────────────────────────

export function useToast() {
  const [toast, setToast] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return {
    toast,
    showToast: (kind: "ok" | "err", msg: string) => setToast({ kind, msg }),
  };
}

export function Toast({
  toast,
}: {
  toast: { kind: "ok" | "err"; msg: string } | null;
}) {
  return (
    <Snackbar
      open={!!toast}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        severity={toast?.kind === "ok" ? "success" : "error"}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {toast?.msg}
      </Alert>
    </Snackbar>
  );
}

// ─── Backward-compatible aliases (old names used by admin client components) ─

import TextField from "@mui/material/TextField";
import MuiSelect from "@mui/material/Select";

export { AdminDrawer as AdminModal };
export { MenuAction as MenuItem };

export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <Box
      component="label"
      sx={{
        display: "block",
        mb: 0.75,
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "text.secondary",
      }}
    >
      {children} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </Box>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <TextField
      fullWidth
      size="small"
      slotProps={{ htmlInput: rest }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { children, className, ...rest } = props;
  return (
    <select
      {...rest}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        fontSize: "0.875rem",
        background: "#fff",
        outline: "none",
      }}
    >
      {children}
    </select>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        fontSize: "0.875rem",
        background: "#fff",
        outline: "none",
        resize: "vertical",
      }}
    />
  );
}
