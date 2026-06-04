import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerPilot Dev Engine",
  description: "AI-Powered Hackathon Job Hunting Suite",
};

const navItems = [
  { href: "/", label: "CV", icon: "/brand/cv.png" },
  { href: "/job-hunter", label: "Jobs", icon: "/brand/job.png" },
  { href: "/assistant", label: "Assistant", shortLabel: "AI" },
  { href: "/tracker", label: "Tracker", icon: "/brand/tracker.png" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fa] text-slate-900 antialiased min-h-screen flex flex-col">
        
        {/* Persistent Premium Navigation Shell */}
        <nav className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/90 shadow-sm shadow-slate-200/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-2.5 min-[420px]:gap-3 sm:px-6">
            
            {/* Logo Emblem Link */}
            <Link href="/" className="flex shrink-0 items-center transition hover:opacity-90" aria-label="CareerPilot home">
              <Image
                src="/brand/logo.png"
                alt="CareerPilot"
                width={240}
                height={90}
                priority
                className="h-8 w-auto min-[420px]:h-9 sm:h-12 md:h-14"
              />
            </Link>

            {/* View Mode Switching Links */}
            <div className="flex min-w-0 items-center gap-0.5 rounded-2xl border border-blue-100 bg-[#EFF6FF] p-1 shadow-inner shadow-blue-100/60 min-[420px]:gap-1 min-[420px]:p-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex shrink-0 items-center gap-1 rounded-xl px-1.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-white hover:text-[#1E3A8A] hover:shadow-sm min-[420px]:gap-1.5 min-[420px]:px-2 min-[420px]:py-2 min-[420px]:text-xs sm:gap-2 sm:px-3.5 sm:text-sm"
                >
                  {item.icon ? (
                    <Image
                      src={item.icon}
                      alt=""
                      width={20}
                      height={20}
                      className="h-3.5 w-3.5 object-contain opacity-80 transition group-hover:opacity-100 min-[420px]:h-4 min-[420px]:w-4 sm:h-5 sm:w-5"
                    />
                  ) : (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-md bg-[#1E3A8A] text-[7px] font-black text-white shadow-sm min-[420px]:h-4 min-[420px]:w-4 min-[420px]:text-[8px] sm:h-5 sm:w-5 sm:text-[9px]">
                      AI
                    </span>
                  )}
                  <span className="sm:hidden">{item.shortLabel || item.label}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
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
