"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-[#1E3A8A] shadow-sm shadow-blue-100/60 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-blue-400/20 dark:bg-slate-900 dark:text-blue-100 dark:shadow-slate-950/40 dark:hover:bg-slate-800 ${
        compact ? "h-9 w-9" : "h-11 w-11"
      }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
