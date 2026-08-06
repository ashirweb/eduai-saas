
"use client";

import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat ko hamesha neechay scroll karne ke liye
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 1. User ka message screen par dikhana
    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Gemini AI ko API Key de kar bulana
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      
      // FIX: Yahan model ka naam latest "gemini-2.5-flash" kar diya hai taake 404 error na aaye
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 3. AI ko batana ke usne kis tarha behave karna hai (Teacher ki tarha)
      const prompt = `You are an expert AI University Tutor for the EduAI platform. 
      A student is asking you a question. Answer clearly, step-by-step, and in an encouraging tone. 
      Do not use shortcuts, explain everything properly from zero knowledge.
      Student Question: ${userMessage}`;

      // 4. AI se jawab lena
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 5. AI ka jawab screen par dikhana
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "Error: I am having trouble connecting to my brain right now. Please check if your API key in .env.local is correct." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Tutor</h1>
        <p className="text-gray-600">Ask any question, solve problems, or understand complex topics step-by-step.</p>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        
        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-6xl mb-4">🎓</span>
              <p className="text-lg">What do you want to learn today?</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-sm shadow-md" 
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm text-gray-500 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}