"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LogOut, Mail, RefreshCw, XCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import { CAREER_PROFILE_UPDATED_EVENT, loadCareerProfile, loadCareerProfileFromCloud } from "@/lib/profileData";
import { loadCvUploadStateFromCloud } from "@/lib/userSession";

const navItems = [
  { href: "/cv-upload", label: "CV", icon: "/brand/cv.png" },
  { href: "/job-hunter", label: "Jobs", icon: "/brand/job.png" },
  { href: "/assistant", label: "Assistant", shortLabel: "AI", icon: "/brand/assist.png" },
  { href: "/tracker", label: "Tracker", icon: "/brand/tracker.png", largerIcon: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, authError, logout, refreshUser, sendVerificationEmail } = useAuth();
  const isWelcome = pathname === "/" || pathname === "/welcome";
  const isAuth = pathname === "/auth";
  const isInfoPage = pathname === "/about" || pathname === "/contact";
  const isPublicRoute = isWelcome || isAuth || isInfoPage;
  const showAppFooter = !isWelcome && !isAuth;
  const [profile, setProfile] = useState(() => loadCareerProfile(user?.uid, user));
  const needsEmailVerification = Boolean(
    !isPublicRoute &&
      user &&
      !user.emailVerified &&
      user.providerData.some((provider) => provider.providerId === "password"),
  );

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace("/auth");
    }
  }, [isPublicRoute, loading, router, user]);

  useEffect(() => {
    if (!user?.uid) return;

    const refreshProfile = () => {
      setProfile(loadCareerProfile(user.uid, user));
    };

    refreshProfile();
    void loadCareerProfileFromCloud(user.uid, user).then(setProfile);
    void loadCvUploadStateFromCloud(user.uid);
    window.addEventListener(CAREER_PROFILE_UPDATED_EVENT, refreshProfile);
    window.addEventListener("storage", refreshProfile);
    return () => {
      window.removeEventListener(CAREER_PROFILE_UPDATED_EVENT, refreshProfile);
      window.removeEventListener("storage", refreshProfile);
    };
  }, [user]);

  if (!isPublicRoute && loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-b-[#1E3A8A]" />
          <p className="text-sm font-bold text-slate-600">Checking your secure session...</p>
        </div>
      </main>
    );
  }

  if (!isPublicRoute && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-600">Redirecting to sign in...</p>
        </div>
      </main>
    );
  }

  if (needsEmailVerification) {
    return (
      <EmailVerificationGate
        email={user?.email || "your email"}
        authError={authError}
        onResend={sendVerificationEmail}
        onRefresh={refreshUser}
        onLogout={logout}
      />
    );
  }

  return (
    <>
      {!isPublicRoute && (
        <nav className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/90 shadow-sm shadow-slate-200/70 backdrop-blur-md dark:border-blue-400/15 dark:bg-slate-950/88 dark:shadow-slate-950/70">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-2.5 min-[420px]:gap-3 sm:px-6">
            <Link href="/welcome" className="flex shrink-0 items-center transition hover:opacity-90" aria-label="CareerPilot welcome">
              <Image
                src="/brand/logo.png"
                alt="CareerPilot"
                width={240}
                height={90}
                priority
                className="h-8 w-auto min-[420px]:h-9 sm:h-12 md:h-14"
              />
            </Link>

            <div className="ml-auto flex min-w-0 items-center gap-0.5 rounded-2xl border border-blue-100 bg-[#EFF6FF] p-1 shadow-inner shadow-blue-100/60 min-[420px]:gap-1 min-[420px]:p-1.5 sm:mr-2 lg:mr-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className="group flex shrink-0 items-center gap-1 rounded-xl px-1.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-white hover:text-[#1E3A8A] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-100 min-[420px]:gap-1.5 min-[420px]:px-2 min-[420px]:py-2 min-[420px]:text-xs sm:gap-2 sm:px-3.5 sm:text-sm"
                >
                  <Image
                    src={item.icon}
                    alt=""
                    width={20}
                    height={20}
                    className={
                      item.largerIcon
                        ? "h-4 w-4 object-contain opacity-85 transition group-hover:opacity-100 min-[420px]:h-[18px] min-[420px]:w-[18px] sm:h-[22px] sm:w-[22px]"
                        : "h-3.5 w-3.5 object-contain opacity-80 transition group-hover:opacity-100 min-[420px]:h-4 min-[420px]:w-4 sm:h-5 sm:w-5"
                    }
                  />
                  <span className="hidden min-[500px]:inline sm:hidden">{item.shortLabel || item.label}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-sm font-black text-[#1E3A8A] shadow-sm transition hover:border-blue-200 hover:bg-blue-50 dark:border-blue-400/20 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
              aria-label="Open dashboard"
              title="Dashboard"
            >
              <ProfileAvatar profile={profile} fallbackName={user?.displayName || user?.email} size="nav" />
            </Link>

            <ThemeToggle compact />
          </div>
        </nav>
      )}

      <div className="flex-1">{children}</div>
      {showAppFooter && <AppFooter />}
    </>
  );
}

function EmailVerificationGate({
  email,
  authError,
  onResend,
  onRefresh,
  onLogout,
}: {
  email: string;
  authError: string | null;
  onResend: () => Promise<boolean>;
  onRefresh: () => Promise<boolean>;
  onLogout: () => Promise<void>;
}) {
  const [busyAction, setBusyAction] = useState<"resend" | "refresh" | null>(null);
  const [notice, setNotice] = useState("A verification link has been sent to your email.");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

  const handleResend = async () => {
    setBusyAction("resend");
    const success = await onResend();
    setBusyAction(null);

    if (success) {
      setNotice("Verification email sent again. Please check your inbox.");
      setNoticeTone("success");
    }
  };

  const handleRefresh = async () => {
    setBusyAction("refresh");
    const verified = await onRefresh();
    setBusyAction(null);

    if (!verified) {
      setNotice("Email is not verified yet. Please open the verification link first.");
      setNoticeTone("error");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5 py-10 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-2xl shadow-blue-950/10 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/60 sm:p-8">
        <Link href="/welcome" className="mx-auto mb-7 inline-flex items-center justify-center transition hover:opacity-90">
          <Image src="/brand/logo.png" alt="CareerPilot" width={230} height={86} className="h-10 w-auto" />
        </Link>

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-[#EFF6FF] text-[#1E3A8A] shadow-sm dark:border-blue-400/20 dark:bg-slate-800 dark:text-blue-100">
          <Mail className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">
          Verify your email
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
          Open the verification link sent to <span className="font-black text-[#1E3A8A] dark:text-blue-100">{email}</span>.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs font-bold leading-5 text-slate-400 dark:text-slate-400">
          No email yet? Check spam or promotions, then resend if needed.
        </p>

        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold dark:bg-slate-800 ${
            noticeTone === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:text-red-200"
              : "border-blue-100 bg-[#EFF6FF] text-slate-600 dark:border-blue-400/20 dark:text-slate-300"
          }`}
        >
          {noticeTone === "error" ? (
            <XCircle className="mr-2 inline h-4 w-4 text-red-600 dark:text-red-200" />
          ) : (
            <CheckCircle2 className="mr-2 inline h-4 w-4 text-[#1E3A8A] dark:text-blue-100" />
          )}
          {notice}
        </div>

        {authError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {authError}
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={Boolean(busyAction)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${busyAction === "refresh" ? "animate-spin" : ""}`} />
            I verified
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={Boolean(busyAction)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 text-sm font-black text-[#1E3A8A] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400/20 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-slate-800"
          >
            <Mail className="h-4 w-4" />
            Resend email
          </button>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-black text-slate-500 transition hover:text-[#1E3A8A] dark:text-slate-400 dark:hover:text-blue-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </section>
    </main>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white px-5 py-6 shadow-inner shadow-blue-50/70 dark:border-blue-400/15 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/welcome" className="inline-flex items-center transition hover:opacity-90" aria-label="CareerPilot welcome">
            <Image src="/brand/logo.png" alt="CareerPilot" width={190} height={72} className="h-9 w-auto" />
          </Link>
          <p className="mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
            CareerPilot helps job seekers turn CV data into matched opportunities, guidance, and application progress.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#1E3A8A] dark:text-blue-100 sm:items-end">
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="transition hover:text-[#1D4ED8]">
              About
            </Link>
            <Link href="/contact" className="transition hover:text-[#1D4ED8]">
              Contact
            </Link>
          </div>
          <p className="text-[11px] font-bold normal-case tracking-normal text-slate-400">
            © {new Date().getFullYear()} CareerPilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
