import { useState } from 'react';

export default function AIChat() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input.trim()) return; // Don't send empty messages

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput(''); // Clear input box immediately

    try {
      const res = await fetch('http://127.0.0.1:8000/api/query-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, history: messages }),
      });
      
      const data = await res.json();
      setMessages([...newMessages, { role: 'ai', content: data.answer }]);
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl w-full max-w-md mt-6 shadow-xl">
      <h3 className="text-sm font-bold text-neutral-300 mb-2">AI Chat</h3>
      
      {/* Chat History Area */}
      <div className="h-48 overflow-y-auto mb-4 p-2 bg-neutral-950 rounded border border-neutral-800 text-sm">
        {messages.map((m, i) => (
          <p key={i} className="mb-2 text-neutral-300">
            <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
          </p>
        ))}
      </div>

      {/* Input Field: Must have value and onChange to work! */}
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Ask something..."
        className="w-full bg-neutral-950 border border-neutral-800 p-2 text-white rounded mb-2"
      />
      
      {/* Send Button */}
      <button 
        onClick={send} 
        className="w-full bg-neutral-100 text-neutral-950 p-2 rounded font-bold hover:bg-neutral-200"
      >
        Send
      </button>
    </div>
  );
}