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
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/query-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }), 
      });

      if (!response.ok) throw new Error("Connection failed");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Error: Could not connect to AI." }]);
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
              <p className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-[85%]">
                {m.content}
              </p>
            </div>
          ))}
          {loading && <p className="text-neutral-500 text-sm">AI is thinking...</p>}
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