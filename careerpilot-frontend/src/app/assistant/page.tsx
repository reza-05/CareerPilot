"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AIChat from "@/components/AIChat";

function AssistantContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const [selectedPrompt, setSelectedPrompt] = useState({ text: prompt, version: 0 });

  useEffect(() => {
    if (prompt) {
      setSelectedPrompt((current) => ({
        text: prompt,
        version: current.version + 1,
      }));
    }
  }, [prompt]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1E3A8A]">
            CareerPilot Assistant
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Ask questions grounded in your CV
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            Use this assistant for fit analysis, skill gaps, learning roadmap, and personalized cover letters.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
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
