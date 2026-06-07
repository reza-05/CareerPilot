"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AIChat from "@/components/AIChat";
import { useAuth } from "@/components/AuthProvider";
import { hasProfileReady, syncCvUploadStateFromServer } from "@/lib/userSession";

function AssistantContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const [profileReady, setProfileReady] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState({ text: prompt, version: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const updateProfileAccess = async () => {
        const syncedState = hasProfileReady(user?.uid)
          ? null
          : await syncCvUploadStateFromServer(user?.uid);
        setProfileReady(hasProfileReady(user?.uid) || Boolean(syncedState?.uploaded));
      };

      void updateProfileAccess();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user?.uid]);

  useEffect(() => {
    if (prompt) {
      const timer = window.setTimeout(() => {
        setSelectedPrompt((current) => ({
          text: prompt,
          version: current.version + 1,
        }));
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [prompt]);

  if (!profileReady) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:py-6">
        <div className="mx-auto max-w-5xl">
          <header className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1E3A8A]">
              CareerPilot Assistant
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              Complete your profile to use the assistant
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              A completed profile is required before using the CareerPilot Assistant. Please upload your CV or build your profile first, because every recommendation, skill-gap analysis, roadmap, and cover letter is grounded in your verified CV information.
            </p>
          </header>

          <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/70 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50 sm:p-6">
            <p className="text-sm font-bold text-[#1E3A8A]">Profile required</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              CareerPilot does not generate assistant responses without your CV context. This keeps the guidance specific to your actual education, experience, skills, and projects.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cv-upload"
                className="rounded-xl bg-[#1E3A8A] px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8]"
              >
                Upload CV
              </Link>
              <Link
                href="/cv-builder"
                className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center text-sm font-bold text-[#1E3A8A] transition hover:bg-blue-50"
              >
                Build Profile Manually
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1E3A8A]">
            CareerPilot Assistant
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            Ask questions grounded in your CV
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            Use this assistant for fit analysis, skill gaps, learning roadmap, and personalized cover letters.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <section className="min-w-0 rounded-2xl border border-blue-100 bg-[#F8FBFF] p-3 shadow-xl shadow-slate-200/70 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50 sm:p-4 md:p-6">
            <AIChat initialPrompt={selectedPrompt.text} promptVersion={selectedPrompt.version} />
          </section>

          <aside className="space-y-3">
            {[
              "Am I ready for this data engineer role?",
              "What skills am I missing for a Google internship?",
              "Build me a 3-month roadmap to become job-ready.",
              "Draft a cover letter for the last job I selected.",
            ].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() =>
                  setSelectedPrompt((current) => ({
                    text: item,
                    version: current.version + 1,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#1E3A8A]/40 hover:bg-blue-50 hover:text-[#1E3A8A] active:scale-[0.99]"
              >
                {item}
              </button>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-600">Loading assistant...</div>}>
      <AssistantContent />
    </Suspense>
  );
}
