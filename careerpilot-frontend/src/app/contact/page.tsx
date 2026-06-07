"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_55%,#F8FAFC_100%)] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <InfoNavbar />

      <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1E3A8A] shadow-sm">
            <MessageSquareText className="h-4 w-4" />
            Contact CareerPilot
          </div>
          <h1 className="text-4xl font-black leading-tight text-[#17435B] sm:text-5xl lg:text-6xl">
            Questions, feedback, or demo support.
          </h1>
          <p className="mt-6 text-lg font-semibold leading-8 text-slate-600 dark:text-slate-300">
            Reach out for product questions, account support, or hackathon demo discussion. CareerPilot is designed to keep every user profile and workspace separate, private, and easy to manage.
          </p>

          <div className="mt-8 space-y-4">
            <InfoRow icon={<Mail className="h-5 w-5" />} title="Email" copy="support@careerpilot.local" />
            <InfoRow icon={<ShieldCheck className="h-5 w-5" />} title="Privacy" copy="Your CV profile stays connected only to your signed-in account." />
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-100/60 dark:border-blue-400/20 dark:bg-slate-900 sm:p-8">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Send a Message</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">
            This demo contact form is ready for integration. For now, it presents the expected enterprise contact experience without exposing internal system details.
          </p>

          <form className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Name</span>
              <input
                type="text"
                placeholder="Your name"
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Message</span>
              <textarea
                placeholder="How can we help?"
                className="mt-2 min-h-36 w-full rounded-2xl border border-blue-100 bg-[#F8FBFF] px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function InfoRow({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1E3A8A]">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-black text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{copy}</p>
      </div>
    </div>
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
