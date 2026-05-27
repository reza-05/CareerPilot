import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerPilot Dev Engine",
  description: "AI-Powered Hackathon Job Hunting Suite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">
        
        {/* Persistent Premium Navigation Shell */}
        <nav className="w-full bg-slate-950 border-b border-slate-900 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            
            {/* Logo Emblem Link */}
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-sm hover:opacity-90 transition">
              <span className="h-5 w-5 rounded bg-white flex items-center justify-center text-slate-950 font-black text-xs">
                C
              </span>
              <span>CareerPilot</span>
            </Link>

            {/* View Mode Switching Links */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/40">
              <Link 
                href="/" 
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-100 transition"
              >
                AI CV Hub
              </Link>
              <Link 
                href="/tracker" 
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-100 transition"
              >
                Kanban Pipeline
              </Link>
            </div>

          </div>
        </nav>

        {/* Core Screen Page Output Content viewport */}
        <div className="flex-1">
          {children}
        </div>

      </body>
    </html>
  );
}