"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input"; 
import { CalendarCheck2, DollarSign, ExternalLink, Loader2, MapPin, Percent, Send, Sparkles, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getAssistantChatStateKey } from "@/lib/userSession";

type ChatMessage = { role: string; content: string };

export type JobAssistantContext = {
  title: string;
  company: string;
  location?: string;
  salaryRange?: string;
  applicationDeadline?: string;
  matchPercent?: number;
  matchReason?: string;
  url?: string;
};

type AssistantChatState = {
  messages: ChatMessage[];
  input: string;
  activeJobContext?: JobAssistantContext | null;
};

const emptyAssistantChatState: AssistantChatState = {
  messages: [],
  input: "",
  activeJobContext: null,
};

function hasUsefulValue(value?: string) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && normalized !== "not specified" && normalized !== "open";
}

function loadAssistantChatState(userId?: string | null): AssistantChatState {
  if (!userId || typeof window === "undefined") return emptyAssistantChatState;

  try {
    const saved = window.localStorage.getItem(getAssistantChatStateKey(userId));
    if (!saved) return emptyAssistantChatState;

    return {
      ...emptyAssistantChatState,
      ...(JSON.parse(saved) as Partial<AssistantChatState>),
    };
  } catch {
    return emptyAssistantChatState;
  }
}

export default function AIChat({
  initialPrompt = "",
  promptVersion = 0,
  jobContext = null,
  compact = false,
}: {
  initialPrompt?: string;
  promptVersion?: number;
  jobContext?: JobAssistantContext | null;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const initialChatState = loadAssistantChatState(user?.uid);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatState.messages);
  const [input, setInput] = useState(initialChatState.input);
  const [activeJobContext, setActiveJobContext] = useState<JobAssistantContext | null>(initialChatState.activeJobContext || null);
  const [loading, setLoading] = useState(false);
  const lastPromptVersion = useRef(-1);

  useEffect(() => {
    if (!jobContext) return;

    const timer = window.setTimeout(() => {
      setActiveJobContext(jobContext);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [jobContext]);

  useEffect(() => {
    if (initialPrompt && promptVersion !== lastPromptVersion.current) {
      setInput(initialPrompt);
      lastPromptVersion.current = promptVersion;
    }
  }, [initialPrompt, promptVersion]);

  useEffect(() => {
    if (!user?.uid) return;

    window.localStorage.setItem(
      getAssistantChatStateKey(user.uid),
      JSON.stringify({ messages, input, activeJobContext }),
    );
  }, [activeJobContext, input, messages, user?.uid]);

  const contextLabel = activeJobContext
    ? `${activeJobContext.title}${activeJobContext.company ? ` at ${activeJobContext.company}` : ""}`
    : "";

  const visibleJobDetails = activeJobContext
    ? [
        { label: "Company", value: activeJobContext.company, icon: UserRound },
        { label: "Location", value: activeJobContext.location, icon: MapPin },
        { label: "Salary", value: activeJobContext.salaryRange, icon: DollarSign },
        { label: "Deadline", value: activeJobContext.applicationDeadline, icon: CalendarCheck2 },
        {
          label: "Match",
          value: typeof activeJobContext.matchPercent === "number" ? `${activeJobContext.matchPercent}%` : "",
          icon: Percent,
        },
      ].filter((item) => hasUsefulValue(item.value))
    : [];

  const buildContextAwareQuery = (rawQuery: string) => {
    if (!activeJobContext) return rawQuery;

    const details = [
      `Role: ${activeJobContext.title}`,
      activeJobContext.company ? `Company: ${activeJobContext.company}` : "",
      activeJobContext.location ? `Location: ${activeJobContext.location}` : "",
      activeJobContext.salaryRange ? `Salary: ${activeJobContext.salaryRange}` : "",
      activeJobContext.applicationDeadline ? `Deadline: ${activeJobContext.applicationDeadline}` : "",
      typeof activeJobContext.matchPercent === "number" ? `Match score: ${activeJobContext.matchPercent}%` : "",
      activeJobContext.matchReason ? `Current fit insight: ${activeJobContext.matchReason}` : "",
      activeJobContext.url ? `Job link: ${activeJobContext.url}` : "",
    ].filter(Boolean);

    return [
      "Please answer the user's question using their CV/profile and the selected job details below.",
      "Keep the answer practical, professional, and easy for a job seeker to act on.",
      "",
      "Selected job:",
      details.join("\n"),
      "",
      `User question: ${rawQuery}`,
    ].join("\n");
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // 1. Log user message to UI state
    const userMessage = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    
    // 2. Clear input immediately for optimal UX
    setInput("");
    setLoading(true);

    try {
      // 3. Routed through local Next.js rewrite configuration proxy rules safely
      const response = await fetch("/api/query-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user?.uid || "" },
        body: JSON.stringify({
          query: buildContextAwareQuery(trimmedInput),
          history: messages,
        }),
      });

      if (!response.ok) throw new Error("Connection failed");

      const data = await response.json();
      
      // Extract content cleanly from whichever key the assistant service returns.
      const replyContent = data.response || data.answer || data.message || (typeof data === "string" ? data : JSON.stringify(data));
      
      setMessages((prev) => [...prev, { role: "ai", content: replyContent }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "The assistant is temporarily unavailable. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
    setActiveJobContext(null);
    if (user?.uid) {
      window.localStorage.removeItem(getAssistantChatStateKey(user.uid));
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-blue-200/80 bg-[#F7FAFF] shadow-2xl shadow-blue-100/80 ring-1 ring-white">
      <div className="flex flex-col gap-3 border-b border-blue-100 bg-[#EEF4FF] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-blue-100">
            <Image src="/brand/assist.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-950">CareerPilot Assistant</h2>
            <p className="text-xs font-medium text-slate-500">
              {contextLabel ? `Discussing ${contextLabel}` : "CV-grounded career guidance"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1E3A8A] shadow-sm sm:flex">
            <Sparkles size={13} />
            {activeJobContext ? "Job Context" : "CV Context"}
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm transition hover:text-[#1E3A8A]"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={`${compact ? "h-[min(62vh,520px)] min-h-[360px]" : "h-[min(58vh,420px)] min-h-[340px] md:h-[420px] lg:h-[460px]"} overflow-y-auto bg-gradient-to-b from-white via-[#F8FBFF] to-[#EEF4FF]/60 p-4 sm:p-5`}>
        {activeJobContext && (
          <section className="mb-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1E3A8A]">Selected Job</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">
                  {activeJobContext.title}
                </h3>
              </div>
              {activeJobContext.url && (
                <a
                  href={activeJobContext.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#1E3A8A] transition hover:bg-blue-100"
                  aria-label="Open selected job"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>

            {visibleJobDetails.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibleJobDetails.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-xl border border-blue-50 bg-[#F8FBFF] px-3 py-2">
                      <Icon className="h-4 w-4 shrink-0 text-[#1E3A8A]" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                        <p className="truncate text-xs font-bold text-slate-700">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeJobContext.matchReason && (
              <p className="mt-3 line-clamp-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                {activeJobContext.matchReason}
              </p>
            )}
          </section>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex h-[calc(100%-6rem)] min-h-[220px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1E3A8A]">
              <Image src="/brand/assist.png" alt="" width={34} height={34} className="h-8 w-8 object-contain" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {activeJobContext ? "Ask about this role, your fit, gaps, or application plan." : "Ask about fit, gaps, roadmap, or cover letters."}
            </p>
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
              {activeJobContext
                ? "CareerPilot will use this job and your saved CV profile together."
                : "Your answers are grounded in the CV or profile you processed earlier."}
            </p>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-white">
                    <Image src="/brand/assist.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain brightness-0 invert" />
                  </div>
                )}
                <div className={`max-w-[82%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"} flex min-w-0 flex-col`}>
                  <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isUser ? "You" : "Assistant"}
                  </span>
                  <p
                    className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isUser
                        ? "rounded-tr-sm bg-[#1E3A8A] text-white"
                        : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {m.content}
                  </p>
                </div>
                {isUser && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A] text-white">
                <Image src="/brand/assist.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain brightness-0 invert" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm">
                <Loader2 className="animate-spin text-[#1E3A8A]" size={16} />
                Preparing a tailored answer...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-blue-100 bg-[#EEF4FF] p-3 sm:p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white p-2 shadow-lg shadow-blue-100/60 focus-within:border-[#1E3A8A]/60 sm:gap-3">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder="Ask CareerPilot about your next step..."
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && sendMessage()}
            className="h-11 border-0 bg-transparent px-3 text-sm font-medium text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-0 focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <span className="hidden sm:inline">Send</span>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
