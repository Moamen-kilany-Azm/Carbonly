"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const SIDEBAR_WIDTH = 240;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  if (status === "loading" || !session?.user) return null;

  const handleMenuToggle = () => setMobileOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Desktop sidebar — permanent */}
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: SIDEBAR_WIDTH,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          <Sidebar user={session.user as { name?: string | null; email?: string | null; globalRole: string }} />
        </Drawer>
      </Box>

      {/* Mobile sidebar — temporary */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMenuToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Sidebar user={session.user as { name?: string | null; email?: string | null; globalRole: string }} />
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
        <Topbar
          user={session.user as { name?: string | null; email?: string | null; entitySlug?: string }}
          onMenuToggle={handleMenuToggle}
        />
        <Box
          component="main"
          sx={{ flex: 1, overflowY: "auto", py: 3, px: { xs: 2, md: 3.5 } }}
        >
          <div className="container-fluid">{children}</div>
        </Box>
      </Box>
    </Box>
  );
}
