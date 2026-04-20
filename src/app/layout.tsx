import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Carbonly", template: "%s | Carbonly" },
  description: "Track and reduce your carbon emissions — Scope 1, 2 & 3.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
