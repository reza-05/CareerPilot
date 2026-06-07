"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DM_Sans } from "next/font/google";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  FileText,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ThemeToggle from "@/components/ThemeToggle";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const features = [
  {
    icon: FileText,
    title: "CV Intelligence",
    copy: "Upload or build your CV once, then keep the same profile connected across the workspace.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Matched Jobs",
    copy: "Search jobs with profile-aware fit scores, match reasons, and one-click tracking.",
  },
  {
    icon: MessageSquareText,
    title: "Career Assistant",
    copy: "Get guidance that stays grounded in the resume and profile data saved for that account.",
  },
  {
    icon: CalendarCheck2,
    title: "Progress Tracker",
    copy: "Track deadlines, application status, weekly activity, goals, and momentum.",
  },
];

const steps = [
  {
    title: "Create a Private Workspace",
    copy: "Your CV profile, saved roles, guidance history, and progress stay connected only to your account.",
  },
  {
    title: "Build Your Career Profile",
    copy: "Upload a resume or complete your profile manually, then update it whenever your experience changes.",
  },
  {
    title: "Move With Clarity",
    copy: "Review matched roles, ask for next-step guidance, track deadlines, and keep weekly momentum visible.",
  },
];

const stats = [
  { label: "Workspace modules", value: 4, suffix: "" },
  { label: "Secure access paths", value: 3, suffix: "" },
  { label: "Activity window", value: 7, suffix: "d" },
  { label: "Per-user workspace", value: 100, suffix: "%" },
];

const dashboardJobs = [
  { title: "Frontend Developer", company: "Remote", score: 92 },
  { title: "Product Intern", company: "Dhaka", score: 84 },
  { title: "Junior Software Engineer", company: "Hybrid", score: 78 },
];

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSignedIn = Boolean(user);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToCvUpload = () => router.push("/cv-upload");
  const goToAuth = (mode: "login" | "signup") => router.push(`/auth?mode=${mode}`);
  const primaryAction = () => {
    if (isSignedIn) {
      goToCvUpload();
      return;
    }
    goToAuth("signup");
  };

  return (
    <main className={`${dmSans.className} min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-100`}>
      <WelcomeNavbar
        isScrolled={isScrolled}
        isSignedIn={isSignedIn}
        onLogo={() => router.push("/welcome")}
        onCv={goToCvUpload}
        onLogin={() => goToAuth("login")}
        onSignup={() => goToAuth("signup")}
      />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_58%,#F8FAFC_100%)] px-5 pb-10 pt-[5.5rem] dark:bg-[linear-gradient(180deg,#0F172A_0%,#111827_58%,#020617_100%)] sm:px-8 sm:pb-12 sm:pt-24 lg:px-14 lg:pb-14 lg:pt-[6.5rem]">
        <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute right-[-8rem] top-52 h-96 w-96 rounded-full bg-[#DBEAFE]/80 blur-3xl" />

        <div className="pointer-events-none absolute right-5 top-[5.25rem] z-20 hidden items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1E3A8A] shadow-sm shadow-blue-100/80 backdrop-blur dark:border-blue-400/20 dark:bg-slate-900/80 dark:text-blue-100 sm:flex lg:right-14">
          <Sparkles className="h-4 w-4" />
          AI-Powered Career Workspace
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1500px] items-center gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1E3A8A] shadow-sm shadow-blue-100/80 backdrop-blur dark:border-blue-400/20 dark:bg-slate-900/80 dark:text-blue-100 sm:hidden">
              <Sparkles className="h-4 w-4" />
              AI-Powered Career Workspace
            </div>

            <h1 className="max-w-4xl text-[2.65rem] font-black leading-[1.04] tracking-normal text-[#17435B] dark:text-slate-50 sm:text-5xl md:text-6xl lg:text-[4.55rem] xl:text-[5.35rem]">
              Find Jobs That <span className="text-[#1E3A8A]">Actually Match</span> Your CV
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Upload your resume, get fit-ranked opportunities, ask for CV-grounded guidance, and track every application from one focused workspace.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={primaryAction}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#1E3A8A] px-7 text-base font-black text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8] sm:min-w-72"
              >
                {isSignedIn ? "Open CV Workspace" : "Start Your CareerPilot"}
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-blue-200 bg-white px-7 text-base font-black text-[#1E3A8A] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                See how it works
              </button>
            </div>

            <div className="mt-6 grid gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 sm:grid-cols-3">
              {["CV-ready matching", "Deadline calendar", "Weekly progress"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white/85 px-3 py-3 shadow-sm backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <HeroGraphic />
        </div>
      </section>

      <LiveDashboardSection />
      <StatsStrip />
      <FeaturesSection />
      <HowItWorksSection isSignedIn={isSignedIn} onAction={primaryAction} />
      <CtaSection isSignedIn={isSignedIn} onAction={primaryAction} />
      <Footer onLogo={() => router.push("/welcome")} />
    </main>
  );
}

function WelcomeNavbar({
  isScrolled,
  isSignedIn,
  onLogo,
  onCv,
  onLogin,
  onSignup,
}: {
  isScrolled: boolean;
  isSignedIn: boolean;
  onLogo: () => void;
  onCv: () => void;
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
        isScrolled
            ? "border-blue-200/90 bg-[#EEF5FF]/[0.92] shadow-lg shadow-blue-950/10 backdrop-blur-xl dark:border-blue-400/20 dark:bg-slate-950/[0.92] dark:shadow-slate-950/70"
            : "border-blue-100/70 bg-white/[0.82] shadow-sm shadow-blue-950/5 backdrop-blur-xl dark:border-blue-400/15 dark:bg-slate-950/[0.82] dark:shadow-slate-950/60"
      }`}
    >
      <nav className="mx-auto flex h-[4.25rem] max-w-[1500px] items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8 lg:px-14">
        <button type="button" onClick={onLogo} aria-label="CareerPilot welcome" className="flex shrink-0 items-center transition hover:opacity-90">
          <Image
            src="/brand/logo.png"
            alt="CareerPilot"
            width={300}
            height={110}
            priority
            className="h-10 w-auto sm:h-12 lg:h-14"
          />
        </button>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <button
              type="button"
              onClick={onCv}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1D4ED8] sm:px-6"
            >
              Open CV
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-black text-[#1E3A8A] transition hover:bg-blue-50 dark:text-blue-100 dark:hover:bg-slate-800 sm:px-6"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={onSignup}
              className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-[#1E3A8A] bg-white px-4 text-sm font-black text-[#1E3A8A] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1E3A8A] hover:text-white dark:border-blue-300 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-[#1E3A8A] sm:px-8"
            >
              Sign Up
            </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

function HeroGraphic() {
  return (
    <div className="relative mx-auto min-h-[380px] w-full max-w-2xl sm:min-h-[440px] lg:min-h-[500px] lg:max-w-none">
      <div className="absolute left-[8%] top-[8%] hidden text-3xl font-black text-[#F59E0B] sm:block">+</div>
      <div className="absolute right-[15%] top-[4%] hidden h-36 w-36 rounded-full border-[26px] border-[#D7E6EF] sm:block" />
      <div className="absolute inset-x-[6%] top-[15%] h-[74%] rounded-full bg-[#EAF1F7]" />
      <div className="absolute bottom-0 left-[24%] right-[4%] top-[18%] rounded-t-[12rem] bg-[linear-gradient(160deg,#DBEAFE,#FFFFFF_72%)] shadow-inner" />

      <FloatingChip className="left-[4%] top-[19%]" icon={<Target className="h-6 w-6 text-white" />} title="87%" copy="match score" color="bg-[#1E3A8A]" />
      <FloatingChip className="bottom-[11%] left-[12%]" icon={<CalendarCheck2 className="h-6 w-6 text-white" />} title="12" copy="deadlines queued" color="bg-[#F59E0B]" />
      <FloatingChip className="right-[2%] top-[37%]" icon={<Sparkles className="h-6 w-6 text-white" />} title="CV context" copy="assistant ready" color="bg-[#2563EB]" />

      <div className="absolute bottom-[10%] left-[28%] right-[7%] z-10 rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E3A8A]">CareerPilot</p>
            <p className="mt-1 text-lg font-black text-slate-950">Resume-aware workspace</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF6FF]">
            <UserRound className="h-5 w-5 text-[#1E3A8A]" />
          </div>
        </div>
        <div className="space-y-3">
          {[
            ["CV profile parsed", 88],
            ["Jobs ranked", 76],
            ["Tracker ready", 64],
          ].map(([item, width]) => (
            <div key={item} className="rounded-xl bg-[#F8FAFC] px-3 py-3">
              <div className="mb-2 flex items-center justify-between text-sm font-black text-slate-900">
                <span>{item}</span>
                <CheckCircle2 className="h-4 w-4 text-[#1E3A8A]" />
              </div>
              <div className="h-2 rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingChip({
  className,
  icon,
  title,
  copy,
  color,
}: {
  className: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
  color: string;
}) {
  return (
    <div className={`absolute z-20 rounded-2xl bg-white px-4 py-4 shadow-xl shadow-slate-900/10 ring-1 ring-blue-100 transition duration-300 hover:-translate-y-1 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>{icon}</div>
        <div>
          <p className="text-xl font-black text-slate-950">{title}</p>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{copy}</p>
        </div>
      </div>
    </div>
  );
}

function LiveDashboardSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-14">
      <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1E3A8A]">Live dashboard mockup</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">A clearer view of matching, tracking, and progress.</h2>
          <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
            The first screen after CV setup is built to show useful signals: top matches, weekly activity, profile skills, and current application status.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-[#F8FBFF] p-5 shadow-2xl shadow-blue-950/10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E3A8A]">Matched Jobs</p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">Top opportunities</h3>
            </div>
            <span className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-black text-[#1E3A8A]">Profile-aware</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              {dashboardJobs.map((job) => (
                <div key={job.title} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-slate-950">{job.title}</h4>
                      <p className="text-sm font-bold text-slate-500">{job.company}</p>
                    </div>
                    <span className="rounded-xl bg-[#EFF6FF] px-3 py-2 text-sm font-black text-[#1E3A8A]">{job.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-blue-100">
                    <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${job.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <MiniStat icon={<BriefcaseBusiness className="h-5 w-5" />} label="Applications" value="6" />
              <MiniStat icon={<BarChart3 className="h-5 w-5" />} label="Profile skills" value="18" />
              <MiniStat icon={<LineChart className="h-5 w-5" />} label="Roadmap" value="72%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1E3A8A]">{icon}</div>
      <p className="text-3xl font-black text-[#1E3A8A]">{value}</p>
      <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function StatsStrip() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-y border-blue-100 bg-[#F8FAFC] px-5 py-12 sm:px-8 lg:px-14">
      <div className="mx-auto grid max-w-[1400px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCounter key={stat.label} active={active} {...stat} />
        ))}
      </div>
    </section>
  );
}

function StatCounter({ label, value, suffix, active }: { label: string; value: number; suffix: string; active: boolean }) {
  const shown = useCountUp(value, active);
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <p className="text-4xl font-black text-[#1E3A8A]">
        {shown}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = 42;
    const tick = () => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [active, target]);

  return value;
}

function FeaturesSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1400px]">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1E3A8A]">Features</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Four connected pillars, one career command center.</h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white/85 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[#1E3A8A] transition duration-300 group-hover:scale-x-100" />
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
  );
}

function HowItWorksSection({ isSignedIn, onAction }: { isSignedIn: boolean; onAction: () => void }) {
  return (
    <section id="how-it-works" className="bg-[#F8FAFC] px-5 py-16 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1E3A8A]">How it works</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">From CV readiness to measurable progress in three steps.</h2>
        </div>

        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-blue-200 md:block" />
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-blue-200 bg-[#EFF6FF] text-2xl font-black text-[#1E3A8A] shadow-sm">
                {index + 1}
              </div>
              <h3 className="text-xl font-black text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{step.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-7 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1D4ED8]"
          >
            {isSignedIn ? "Continue to CV Upload" : "Create your workspace"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function CtaSection({ isSignedIn, onAction }: { isSignedIn: boolean; onAction: () => void }) {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-3xl border border-blue-100 bg-[radial-gradient(circle_at_top_left,#DBEAFE,transparent_34%),linear-gradient(135deg,#1E3A8A,#2563EB)] p-8 text-white shadow-2xl shadow-blue-950/20 sm:p-12">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] backdrop-blur">
            <LockKeyhole className="h-4 w-4" />
            Secure CareerPilot Access
          </div>
          <h2 className="text-3xl font-black leading-tight sm:text-5xl">Build your career workspace around your own CV.</h2>
          <p className="mt-5 text-base font-semibold leading-8 text-blue-50">
            Save your profile, discover better matches, and keep every application decision visible in one protected workspace.
          </p>
          <button
            type="button"
            onClick={onAction}
            className="mt-8 inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-white px-7 text-base font-black text-[#1E3A8A] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            {isSignedIn ? "Open CV Workspace" : "Get Started"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer({ onLogo }: { onLogo: () => void }) {
  return (
    <footer className="border-t border-blue-100 bg-[#F8FAFC] px-5 py-8 sm:px-8 lg:px-14">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onLogo} className="flex items-center transition hover:opacity-90" aria-label="CareerPilot welcome">
          <Image src="/brand/logo.png" alt="CareerPilot" width={220} height={80} className="h-10 w-auto" />
        </button>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-4 text-sm font-black text-[#1E3A8A]">
            <Link href="/about" className="transition hover:text-[#1D4ED8]">About</Link>
            <Link href="/contact" className="transition hover:text-[#1D4ED8]">Contact</Link>
          </div>
          <p className="text-sm font-semibold text-slate-500">© {new Date().getFullYear()} CareerPilot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
