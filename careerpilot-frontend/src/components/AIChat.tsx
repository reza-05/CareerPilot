"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input"; 
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react";

export default function AIChat({
  initialPrompt = "",
  promptVersion = 0,
}: {
  initialPrompt?: string;
  promptVersion?: number;
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const lastPromptVersion = useRef(-1);

  useEffect(() => {
    if (initialPrompt && promptVersion !== lastPromptVersion.current) {
      setInput(initialPrompt);
      lastPromptVersion.current = promptVersion;
    }
  }, [initialPrompt, promptVersion]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedInput,
          history: messages,
        }),
      });

      if (!response.ok) throw new Error("Connection failed");

      const data = await response.json();
      
      // 4. Extract content cleanly from whichever key your backend uses
      const replyContent = data.response || data.answer || data.message || (typeof data === "string" ? data : JSON.stringify(data));
      
      setMessages((prev) => [...prev, { role: "ai", content: replyContent }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "AI service error. Could not connect to backend engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-white shadow-sm">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-950">CareerPilot Assistant</h2>
            <p className="text-xs font-medium text-slate-500">CV-grounded career guidance</p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1E3A8A] sm:flex">
          <Sparkles size={13} />
          RAG Enabled
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto bg-gradient-to-b from-white to-slate-50/60 p-5 md:h-[300px]">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1E3A8A]">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Ask about fit, gaps, roadmap, or cover letters.</p>
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
              Your answers are grounded in the CV or profile you processed earlier.
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
                    <Bot size={16} />
                  </div>
                )}
                <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                  <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isUser ? "You" : "Assistant"}
                  </span>
                  <p
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
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
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm">
                <Loader2 className="animate-spin text-[#1E3A8A]" size={16} />
                Thinking with your CV context...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner focus-within:border-[#1E3A8A]/50 focus-within:bg-white">
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
