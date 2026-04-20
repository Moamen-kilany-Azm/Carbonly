"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Topbar } from "@/components/layout/topbar";

const SIDEBAR_WIDTH = 224;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  if (status === "loading" || !session?.user) return null;

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Admin sidebar — permanent */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#111827",
            borderRight: "none",
          },
        }}
        open
      >
        <AdminSidebar />
      </Drawer>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Topbar user={session.user as { name?: string | null; email?: string | null; entitySlug?: string }} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 3,
            bgcolor: "#f9fafb",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
