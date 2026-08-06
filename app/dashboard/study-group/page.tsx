"use client";

import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Link from "next/link";

// Persona Definitions for UI (🔥 FIX: Added role to 'user' to fix TypeScript Error)
const PERSONAS = {
  user: { name: "You", role: "Student", icon: "👤", color: "bg-blue-600 text-white", border: "border-blue-600" },
  professor: { name: "Prof. Alan", role: "AI Professor", icon: "👨‍🏫", color: "bg-slate-100 text-slate-800", border: "border-slate-200" },
  topper: { name: "Sarah", role: "Class Topper", icon: "🤓", color: "bg-indigo-50 text-indigo-900", border: "border-indigo-100" },
  beginner: { name: "Ali", role: "Beginner Student", icon: "🙋‍♂️", color: "bg-teal-50 text-teal-900", border: "border-teal-100" },
  expert: { name: "Mr. Dave", role: "Industry Expert", icon: "💼", color: "bg-purple-50 text-purple-900", border: "border-purple-100" },
};

type PersonaKey = keyof typeof PERSONAS;

interface ChatMessage {
  id: string;
  sender: PersonaKey;
  text: string;
}

export default function StudyGroupPage() {
  const [profileName, setProfileName] = useState("Ashir");
  const [isMounted, setIsMounted] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Chat History State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "professor",
      text: "Welcome to the AI Virtual Study Group! I am Prof. Alan. Enter a topic or question below, and our panel will discuss it with you."
    }
  ]);

  // Auto-scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedName = localStorage.getItem("eduai_name");
    if (savedName) setProfileName(savedName);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isGenerating) return;

    const userTopic = topicInput.trim();
    setTopicInput("");
    
    // Add user's message to chat
    const newUserMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text: userTopic };
    setMessages(prev => [...prev, newUserMsg]);
    setIsGenerating(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are powering an AI Virtual Study Group for an IT student named ${profileName}.
      The student just asked: "${userTopic}".

      Generate a collaborative group discussion responding to this topic. You MUST generate responses from EXACTLY these 4 distinct personas in a logical conversational order:
      1. 'professor': Gives a detailed, academic, and clear explanation of the core concept.
      2. 'beginner': Asks a follow-up question or simplifies it in layman's terms ("So basically...").
      3. 'topper': Shares a clever trick, advanced tip, or exam-focused shortcut.
      4. 'expert': Explains how this concept is actually used in real-world IT industry jobs.

      RESPOND STRICTLY IN THIS JSON FORMAT (No markdown, no extra text):
      {
        "discussion": [
          { "persona": "professor", "text": "Detailed explanation here..." },
          { "persona": "beginner", "text": "Wait, so..." },
          { "persona": "topper", "text": "A pro tip for exams is..." },
          { "persona": "expert", "text": "In the industry, we use this to..." }
        ]
      }`;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);

      if (parsedData.discussion && Array.isArray(parsedData.discussion)) {
        // Add AI responses to chat array
        const aiMessages = parsedData.discussion.map((msg: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          sender: msg.persona as PersonaKey,
          text: msg.text
        }));

        setMessages(prev => [...prev, ...aiMessages]);
      }
    } catch (error) {
      console.error("Study Group Gen Error:", error);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: "professor",
        text: `My apologies ${profileName}, our virtual classroom encountered a network issue. Please try asking again.`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      
      {/* Header */}
      <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span>💬</span> AI Virtual Study Group
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            24/7 Intelligent Classroom. Discuss topics with your AI peers and professors.
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
        
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-gray-50/30">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const personaData = PERSONAS[msg.sender] || PERSONAS.professor;

            return (
              <div 
                key={msg.id} 
                className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-sm border ${personaData.border} bg-white z-10 relative`}>
                      {isUser ? (profileName ? profileName.charAt(0).toUpperCase() : "U") : personaData.icon}
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-baseline gap-2 mb-1.5 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="font-bold text-gray-900 text-sm">{isUser ? profileName : personaData.name}</span>
                      {!isUser && <span className="text-[10px] uppercase tracking-wider font-black text-gray-400">{personaData.role}</span>}
                    </div>
                    
                    <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm text-sm md:text-base leading-relaxed border
                      ${isUser ? 'rounded-tr-sm bg-blue-600 text-white border-blue-700' : `rounded-tl-sm ${personaData.color} ${personaData.border}`}
                    `}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isGenerating && (
            <div className="flex w-full justify-start animate-in fade-in">
              <div className="flex gap-4 max-w-[80%] flex-row">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl border border-gray-200 bg-white shadow-sm">
                  🤖
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-baseline gap-2 mb-1.5 px-1">
                    <span className="font-bold text-gray-500 text-sm">Study Group</span>
                    <span className="text-[10px] uppercase tracking-wider font-black text-gray-400">Typing</span>
                  </div>
                  <div className="p-4 md:p-5 rounded-2xl rounded-tl-sm bg-gray-100 border border-gray-200 text-gray-500 flex gap-1.5 items-center h-[52px]">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto relative">
            <input 
              type="text" 
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              disabled={isGenerating}
              placeholder="Ask the group anything... (e.g., 'Explain Object Oriented Programming')"
              className="flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm md:text-base font-medium text-gray-900 disabled:opacity-50 transition-all"
            />
            <button 
              type="submit"
              disabled={!topicInput.trim() || isGenerating}
              className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
            >
              <span>Discuss</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </form>
          <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">
            AI Personas: Professor 👨‍🏫 • Topper 🤓 • Beginner 🙋‍♂️ • Expert 💼
          </p>
        </div>

      </div>
    </div>
  );
}