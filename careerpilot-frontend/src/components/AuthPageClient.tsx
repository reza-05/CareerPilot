"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ThemeToggle from "@/components/ThemeToggle";

type AuthMode = "login" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.43Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.34l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.99A6 6 0 0 1 6.1 12c0-.69.11-1.36.31-1.99v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.59l3.34-2.6Z" />
      <path fill="#EA4335" d="M12 5.89c1.47 0 2.8.51 3.84 1.5l2.87-2.87C16.97 2.9 14.7 2 12 2a10 10 0 0 0-8.93 5.41l3.34 2.6C7.2 7.65 9.4 5.89 12 5.89Z" />
    </svg>
  );
}

export default function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authReady, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const requestedMode = searchParams.get("mode");
  const initialMode = requestedMode === "login" ? "login" : "signup";
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [showEmailForm, setShowEmailForm] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const passwordRules = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const missingPasswordRules = passwordRules.filter((rule) => !rule.valid).map((rule) => rule.label);
  const passwordTouched = password.length > 0;
  const confirmPasswordTouched = confirmPassword.length > 0;
  const passwordStrong = missingPasswordRules.length === 0;
  const confirmPasswordMatches = confirmPasswordTouched && password === confirmPassword;
  const signupReady = Boolean(email.trim()) && passwordStrong && confirmPasswordMatches;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToCvUpload = () => router.push("/cv-upload");

  const changeMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setShowEmailForm(mode === "signup");
    setAuthNotice(null);
    setValidationError(null);
    setConfirmPassword("");
  };

  const handleGoogleSignIn = async () => {
    setAuthNotice(null);
    setAuthBusy(true);
    const success = await signInWithGoogle();
    setAuthBusy(false);

    if (success) {
      goToCvUpload();
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthNotice(null);
    setValidationError(null);

    const normalizedEmail = email.trim();

    if (authMode === "signup") {
      const missingRules = passwordRules.filter((rule) => !rule.valid).map((rule) => rule.label);
      if (missingRules.length > 0) {
        setValidationError(`Password must include: ${missingRules.join(", ")}.`);
        return;
      }

      if (password !== confirmPassword) {
        setValidationError("Passwords do not match. Please confirm the same password.");
        return;
      }
    }

    setAuthBusy(true);
    const success =
      authMode === "signup"
        ? await signUpWithEmail(normalizedEmail, password)
        : await signInWithEmail(normalizedEmail, password);

    setAuthBusy(false);

    if (success) {
      goToCvUpload();
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim();
    setAuthNotice(null);

    if (!normalizedEmail) {
      setAuthNotice("Enter your email address first, then request a password reset.");
      return;
    }

    setAuthBusy(true);
    const success = await sendPasswordReset(normalizedEmail);
    setAuthBusy(false);

    if (success) {
      setAuthNotice("Password reset email sent. Please check your inbox.");
    }
  };

  const emailFormVisible = authMode === "signup" || showEmailForm;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
          isScrolled
            ? "border-blue-200/90 bg-[#EEF5FF]/[0.92] shadow-lg shadow-blue-950/10 backdrop-blur-xl dark:border-blue-400/20 dark:bg-slate-950/[0.92] dark:shadow-slate-950/70"
            : "border-blue-100/70 bg-white/[0.82] shadow-sm shadow-blue-950/5 backdrop-blur-xl dark:border-blue-400/15 dark:bg-slate-950/[0.82] dark:shadow-slate-950/60"
        }`}
      >
        <nav className="mx-auto flex h-[4.25rem] max-w-[1500px] items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8 lg:px-14">
          <button type="button" onClick={() => router.push("/welcome")} className="flex items-center" aria-label="Back to CareerPilot welcome">
            <Image src="/brand/logo.png" alt="CareerPilot" width={300} height={110} priority className="h-10 w-auto sm:h-12 lg:h-14" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/welcome")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 text-sm font-black text-[#1E3A8A] shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:border-blue-400/20 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-slate-800 sm:px-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pt-20 sm:px-8 lg:pt-[5.5rem]">
        <div className="flex flex-1 items-center justify-center py-5">
          <section className="w-full max-w-[520px] rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-950/10 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50 sm:p-8">
            {user ? (
              <div className="text-center">
                <p className="text-2xl font-black text-slate-950">You are already signed in.</p>
                <p className="mt-2 text-sm font-bold text-slate-500">{user.email || "CareerPilot account active"}</p>
                <button
                  type="button"
                  onClick={goToCvUpload}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] text-sm font-black text-white transition hover:bg-[#1D4ED8]"
                >
                  Open CV Upload
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-3xl font-black leading-tight text-[#17435B] sm:text-4xl">
                    {authMode === "signup" ? "Create your CareerPilot account" : "Log in to CareerPilot"}
                  </h1>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    {authMode === "signup"
                      ? "Create your account with email and password."
                      : "Continue with Google or use your email and password."}
                  </p>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-white p-1 shadow-sm shadow-blue-100/70">
                  {(["signup", "login"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => changeMode(mode)}
                      className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                        authMode === mode
                          ? "border-blue-100 bg-white text-[#1E3A8A] shadow-md shadow-blue-100/70"
                          : "border-transparent bg-white text-slate-500 hover:bg-blue-50 hover:text-[#1E3A8A]"
                      }`}
                    >
                      {mode === "signup" ? "Sign Up" : "Log In"}
                    </button>
                  ))}
                </div>

                {authMode === "login" && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authBusy}
                      className="grid h-13 w-full grid-cols-[24px_1fr_24px] items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-70"
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                      <span />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailForm((current) => !current);
                        setAuthNotice(null);
                      }}
                      className="grid h-13 w-full grid-cols-[24px_1fr_24px] items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <Mail className="h-5 w-5 text-[#1E3A8A]" />
                      <span>Continue with email</span>
                      <span />
                    </button>
                  </div>
                )}

                {emailFormVisible && (
                  <>
                    {authMode === "login" ? (
                      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" />
                        email access
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                    ) : (
                      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#1E3A8A]">
                        Sign up with email and password.
                      </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          className="h-12 w-full rounded-xl border border-blue-100 bg-[#F8FAFC] px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
                          placeholder="you@example.com"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                          <LockKeyhole className="h-3.5 w-3.5" />
                          Password
                        </span>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              setValidationError(null);
                            }}
                            required
                            minLength={authMode === "signup" ? 8 : 6}
                            className={`h-12 w-full rounded-xl border bg-[#F8FAFC] px-4 pr-20 text-sm font-semibold text-slate-800 outline-none transition focus:bg-white ${
                              authMode === "signup" && passwordTouched
                                ? passwordStrong
                                  ? "border-emerald-300 focus:border-emerald-500"
                                  : "border-red-300 focus:border-red-500"
                                : "border-blue-100 focus:border-[#1E3A8A]"
                            }`}
                            placeholder={authMode === "signup" ? "8+ chars with A-z, 0-9, symbol" : "Enter your password"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#1E3A8A]"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                          </button>
                          {authMode === "signup" && passwordTouched && (
                            passwordStrong ? (
                              <CheckCircle2 className="absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                            ) : (
                              <AlertCircle className="absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                            )
                          )}
                        </div>
                      </label>

                      {authMode === "signup" && (
                        <>
                          <p className={`-mt-2 text-xs font-black ${
                            passwordStrong ? "text-emerald-600" : "text-red-600"
                          }`}>
                            {passwordStrong
                              ? "Password strength ready."
                              : `Missing: ${missingPasswordRules.join(", ")}.`}
                          </p>

                          <label className="block">
                            <span className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                              <LockKeyhole className="h-3.5 w-3.5" />
                              Confirm Password
                            </span>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(event) => {
                                  setConfirmPassword(event.target.value);
                                  setValidationError(null);
                                }}
                                required
                                minLength={8}
                                className={`h-12 w-full rounded-xl border bg-[#F8FAFC] px-4 pr-20 text-sm font-semibold text-slate-800 outline-none transition focus:bg-white ${
                                  confirmPasswordTouched
                                    ? confirmPasswordMatches
                                      ? "border-emerald-300 focus:border-emerald-500"
                                      : "border-red-300 focus:border-red-500"
                                    : "border-blue-100 focus:border-[#1E3A8A]"
                                }`}
                                placeholder="Retype the same password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword((current) => !current)}
                                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#1E3A8A]"
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                              >
                                {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                              </button>
                              {confirmPasswordTouched && (
                                confirmPasswordMatches ? (
                                  <CheckCircle2 className="absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                                )
                              )}
                            </div>
                          </label>

                          {confirmPasswordTouched && (
                            <p className={`-mt-2 text-xs font-black ${
                              confirmPasswordMatches ? "text-emerald-600" : "text-red-600"
                            }`}>
                              {confirmPasswordMatches ? "Passwords match." : "Passwords do not match."}
                            </p>
                          )}
                        </>
                      )}

                      {authMode === "login" && (
                        <div className="-mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={authBusy}
                            className="text-xs font-black text-[#1E3A8A] transition hover:text-[#1D4ED8] disabled:opacity-60"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authBusy || (authMode === "signup" && !signupReady)}
                        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                          authMode === "signup" && !signupReady
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "bg-[#1E3A8A] text-white hover:bg-[#1D4ED8] disabled:opacity-70"
                        }`}
                      >
                        {authBusy ? "Please wait..." : authMode === "signup" ? "Create Account" : "Log In"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                )}

                {authError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {authError}
                  </div>
                )}

                {validationError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {validationError}
                  </div>
                )}

                {authNotice && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-[#1E3A8A]">
                    {authNotice}
                  </div>
                )}

                {!authReady && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                    Firebase keys are missing in .env.local.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
