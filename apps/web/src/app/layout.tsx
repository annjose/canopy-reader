import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canopy",
  description: "A self-hosted read-it-later and knowledge management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Suspense>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
