"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarCheck2, FileText, LockKeyhole, MessageSquareText } from "lucide-react";

const pillars = [
  {
    icon: FileText,
    title: "Profile-first matching",
    copy: "CareerPilot keeps your CV at the center so every recommendation starts from your real skills, education, and experience.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Focused job discovery",
    copy: "Opportunities are ranked by relevance, making it easier to review strong matches instead of browsing blindly.",
  },
  {
    icon: MessageSquareText,
    title: "Personal guidance",
    copy: "The assistant helps explain fit, gaps, next steps, and application preparation in a clear career-focused way.",
  },
  {
    icon: CalendarCheck2,
    title: "Progress that stays visible",
    copy: "Applications, deadlines, weekly goals, and momentum stay organized in one connected workspace.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_55%,#F8FAFC_100%)] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <InfoNavbar />

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1E3A8A] shadow-sm">
            <LockKeyhole className="h-4 w-4" />
            Built For Career Decisions
          </div>
          <h1 className="text-4xl font-black leading-tight text-[#17435B] sm:text-5xl lg:text-6xl">
            A smarter workspace for job seekers who want clarity.
          </h1>
          <p className="mt-6 text-lg font-semibold leading-8 text-slate-600 dark:text-slate-300">
            CareerPilot combines CV preparation, job matching, AI guidance, and application tracking into one polished workspace. The goal is simple: help users understand where they fit, what to improve, and what to do next.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.title}
                className="group rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/50 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/70 dark:border-blue-400/20 dark:bg-slate-900"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1E3A8A]">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">{pillar.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{pillar.copy}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-blue-100 bg-[#1E3A8A] p-8 text-white shadow-2xl shadow-blue-950/20 sm:p-10">
          <h2 className="text-3xl font-black">Your data stays account-specific.</h2>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-blue-50">
            Each signed-in user keeps a separate CV profile, assistant history, tracker, goals, and dashboard. Profile photos are optional and are only used for personalization inside the product experience.
          </p>
          <Link
            href="/cv-upload"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-[#1E3A8A] transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Open CareerPilot
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100 bg-white/90 shadow-sm shadow-blue-950/5 backdrop-blur-xl dark:border-blue-400/15 dark:bg-slate-950/90">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/welcome" className="transition hover:opacity-90" aria-label="CareerPilot welcome">
          <Image src="/brand/logo.png" alt="CareerPilot" width={230} height={90} className="h-11 w-auto" />
        </Link>
        <div className="flex items-center gap-4 text-sm font-black text-[#1E3A8A] dark:text-blue-100">
          <Link href="/about" className="hover:text-[#1D4ED8]">About</Link>
          <Link href="/contact" className="hover:text-[#1D4ED8]">Contact</Link>
          <Link href="/auth?mode=login" className="rounded-xl border border-blue-100 bg-white px-4 py-2 shadow-sm hover:bg-blue-50 dark:bg-slate-900">
            Log In
          </Link>
        </div>
      </nav>
    </header>
  );
}
