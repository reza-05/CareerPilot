"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 

export default function AIChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ query: trimmedInput }), // 💻 Fixed back to 'query' to stop the 422 error
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
    <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 shadow-xl mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">AI Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message area */}
        <div className="h-64 overflow-y-auto space-y-4 p-4 border border-neutral-800 rounded-lg bg-neutral-950">
          {messages.length === 0 && <p className="text-neutral-500 text-sm italic">No messages yet...</p>}
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <span className={`text-xs mb-1 ${m.role === "user" ? "text-blue-400" : "text-green-400"}`}>
                {m.role === "user" ? "You" : "AI"}
              </span>
              <p className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-[85%] whitespace-pre-wrap">
                {m.content}
              </p>
            </div>
          ))}
          {loading && <p className="text-neutral-500 text-sm animate-pulse">AI is thinking...</p>}
        </div>

        {/* Input area with high-contrast classes */}
        <div className="flex gap-2">
          <Input 
            value={input} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)} 
            placeholder="Ask something..."
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && sendMessage()}
            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
          />
          <Button onClick={sendMessage} disabled={loading} className="bg-white text-black hover:bg-neutral-200">
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}