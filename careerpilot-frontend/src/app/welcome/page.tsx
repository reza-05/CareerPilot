"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const featureCards = [
  {
    icon: FileText,
    title: "CV intelligence",
    copy: "CareerPilot turns your resume into a structured skill profile.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Matched jobs",
    copy: "Search results are ranked around your real background and goals.",
  },
  {
    icon: Sparkles,
    title: "AI assistant",
    copy: "Ask for guidance grounded in your uploaded CV information.",
  },
  {
    icon: CalendarCheck2,
    title: "Deadline tracker",
    copy: "Keep applications, goals, and follow-ups in one workspace.",
  },
];

const steps = [
  "Sign in securely",
  "Upload or build your CV",
  "Search jobs and track progress",
];

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSignedIn = Boolean(user);

  const goToCvUpload = () => router.push("/");
  const goToAuth = (mode: "login" | "signup" = "signup") => router.push(`/auth?mode=${mode}`);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-white">
        <header className="relative z-20 mx-auto flex h-24 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-28 lg:px-14">
          <button type="button" onClick={() => router.push("/welcome")} aria-label="CareerPilot welcome" className="flex items-center">
            <Image
              src="/brand/logo.png"
              alt="CareerPilot"
              width={300}
              height={110}
              priority
              className="h-10 w-auto sm:h-12 lg:h-16"
            />
          </button>

          {isSignedIn ? (
            <button
              type="button"
              onClick={goToCvUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1D4ED8] sm:px-6 lg:px-8 lg:py-3 lg:text-base"
            >
              CV Upload
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => goToAuth("login")}
                className="hidden rounded-xl px-4 py-2.5 text-sm font-black text-[#1E3A8A] transition hover:bg-blue-50 sm:inline-flex lg:text-base"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => goToAuth("signup")}
                className="rounded-xl border-2 border-[#1E3A8A] bg-white px-4 py-2.5 text-sm font-black text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white sm:px-7 lg:px-10 lg:py-3 lg:text-base"
              >
                Sign Up
              </button>
            </div>
          )}
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1500px] items-center gap-10 px-5 pb-14 pt-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-14 lg:pb-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-[#EFF6FF] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1E3A8A]">
              <Sparkles className="h-4 w-4" />
              AI Career Workspace
            </div>

            <h1 className="text-5xl font-black leading-[1.03] tracking-normal text-[#17435B] sm:text-6xl lg:text-7xl">
              Find Jobs That <span className="text-[#1E3A8A]">Actually Match</span> Your CV
            </h1>

            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-slate-700 sm:text-xl">
              Upload your resume, discover high-fit roles, get AI guidance, and track every application from one focused workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={isSignedIn ? goToCvUpload : () => goToAuth("signup")}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#1E3A8A] px-7 text-base font-black text-white shadow-xl shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8] sm:min-w-72"
              >
                {isSignedIn ? "Go to CV Upload" : "Get Started"}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step} className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-3 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-3xl lg:max-w-none">
            <HeroGraphic />
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-[#F8FAFC] px-5 py-16 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1E3A8A]">Why CareerPilot</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">A complete career workflow, arranged around your CV.</h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1E3A8A] transition group-hover:bg-[#1E3A8A] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{feature.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1E3A8A]">Built For Action</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">From resume to application tracking without losing context.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              The app keeps the first step simple: sign in, prepare your CV profile, then unlock recommendations, assistant guidance, and deadline tracking.
            </p>
            <button
              type="button"
              onClick={isSignedIn ? goToCvUpload : () => goToAuth("signup")}
              className="mt-7 inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 text-sm font-black text-white transition hover:bg-[#1D4ED8]"
            >
              {isSignedIn ? "Open CV Upload" : "Start Securely"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Create account", "Google or email/password authentication."],
              ["02", "Prepare profile", "Upload a resume or build a CV manually."],
              ["03", "Run the workflow", "Jobs, assistant, tracker, and deadlines."],
            ].map(([number, title, copy]) => (
              <div key={number} className="rounded-2xl border border-blue-100 bg-[#F8FAFC] p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-blue-950/10">
                <p className="text-3xl font-black text-[#1E3A8A]">{number}</p>
                <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroGraphic() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
      <div className="absolute left-[12%] top-[6%] hidden text-3xl font-black text-[#F59E0B] sm:block">+</div>
      <div className="absolute left-[28%] top-[13%] hidden text-3xl font-black text-slate-200 sm:block">+</div>
      <div className="absolute right-[18%] top-[4%] hidden h-36 w-36 rounded-full border-[28px] border-[#D7E6EF] sm:block" />
      <div className="absolute inset-x-[10%] top-[10%] h-[72%] rounded-full bg-[#EAF1F7]" />

      <div className="absolute left-[6%] top-[18%] z-20 rounded-2xl bg-white px-5 py-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1E3A8A] text-xl font-black text-white">87</div>
          <div>
            <p className="text-2xl font-black text-slate-950">match score</p>
            <p className="text-sm font-semibold text-slate-500">from your CV profile</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[8%] left-[16%] z-20 rounded-2xl bg-white px-5 py-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]">
            <CalendarCheck2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-950">12</p>
            <p className="text-sm font-semibold text-slate-500">deadlines tracked</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[23%] right-[2%] z-20 max-w-xs rounded-2xl bg-white px-5 py-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2F7EA9]">
            <Target className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-950">AI guidance ready</p>
            <p className="text-sm font-semibold text-slate-500">personalized by your resume</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-[26%] right-[6%] top-[20%] z-10 rounded-t-[12rem] bg-[linear-gradient(160deg,#DBEAFE,#FFFFFF_72%)] shadow-inner" />
      <div className="absolute bottom-[9%] left-[27%] z-10 h-48 w-[52%] rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-2xl shadow-blue-950/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E3A8A]">CareerPilot</p>
            <p className="mt-1 text-lg font-black text-slate-950">Your next step</p>
          </div>
          <Image src="/brand/assist.png" alt="" width={36} height={36} className="h-9 w-9 object-contain opacity-80" />
        </div>
        <div className="space-y-3">
          {["CV parsed", "Jobs ranked", "Tracker ready"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-3 py-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1E3A8A]" />
              <p className="text-sm font-black text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
