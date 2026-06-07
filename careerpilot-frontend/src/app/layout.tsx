import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import AppShell from "@/components/AppShell";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CareerPilot",
  description: "AI-powered career workspace for CV-based job matching, guidance, and tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urbanist.className} bg-[#f8f9fa] text-slate-900 antialiased min-h-screen flex flex-col dark:bg-slate-950 dark:text-slate-100`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
