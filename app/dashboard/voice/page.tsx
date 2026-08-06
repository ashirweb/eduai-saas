"use client";

import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  sender: "user" | "ai";
  text: string;
}

export default function VoiceTutorPage() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"english" | "teacher">("teacher");
  const [isProcessing, setIsProcessing] = useState(false);

  const [textInput, setTextInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // NAYA: Smart Voice Control Refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTextRef = useRef("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSpeaking, isProcessing]);

  const speak = (text: string, currentMode: "english" | "teacher") => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); 
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    if (currentMode === "english") {
      utterance.lang = "en-US";
      const enVoice = voices.find(v => v.lang === "en-US" && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;
    } else {
      utterance.lang = "ur-PK"; 
      const urVoice = voices.find(v => v.lang === "ur-PK" || v.lang === "hi-IN") || voices[0];
      if (urVoice) utterance.voice = urVoice;
    }

    utterance.rate = 0.95; 
    utterance.pitch = 1.1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleAIResponse = async (userText: string) => {
    setIsProcessing(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      let prompt = "";
      if (mode === "english") {
        // 🔥 FIX: Ab English language nahi sikhayega, balki pure English mein subjects/concepts samjhayega
        prompt = `Act as an expert University Professor. You explain complex educational concepts purely and clearly in English.
        The user is testing their understanding or asking a question about a topic.
        Rule 1: Focus strictly on the subject matter/concept, DO NOT correct their English grammar.
        Rule 2: Explain the topic purely in English. If their concept is wrong, gently correct the concept.
        Rule 3: Keep your response concise, clear, and conversational (1-3 sentences maximum).
        User says: "${userText}"`;
      } else {
        prompt = `Act as an expert University Professor. You speak in a natural mix of English and everyday Roman Urdu.
        The user is your student.
        Your Job: Listen to the student's definitions, explanations, or questions. 
        Rule 1: If the student explains something incorrectly, gently point out their mistake.
        Rule 2: Explain the correct concept clearly using BOTH English and Roman Urdu.
        Rule 3: You can ask them a quick follow-up question to test if they understood.
        Rule 4: Keep your response short and conversational (max 3-4 sentences). Do not use complex formatting.
        Student says: "${userText}"`;
      }

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const cleanTextForVoice = responseText.replace(/\*/g, ""); 
      
      setMessages((prev) => [...prev, { sender: "ai", text: cleanTextForVoice }]);
      speak(cleanTextForVoice, mode);

    } catch (error) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, I am having trouble connecting to my brain right now." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // NAYA: Manual Mic Control
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = mode === "english" ? "en-US" : "ur-PK";
    recognition.interimResults = true; 
    recognition.continuous = true; // 🔥 NAYA MAGIC: Ab pause par auto-band nahi hoga!
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTextInput(""); 
      accumulatedTextRef.current = "";
      window.speechSynthesis.cancel(); 
      setIsSpeaking(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        accumulatedTextRef.current += finalTranscript + " ";
      }

      const currentDisplay = accumulatedTextRef.current + interimTranscript;
      if (currentDisplay.trim()) {
        setTextInput(currentDisplay + "...");
      }

      // 🔥 NAYA MAGIC: Smart Silence Detector (2.5 sec khamoshi par khud send)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 2500); 
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      if (event.error === 'no-speech') {
        setTextInput("No voice detected, please try again.");
        setTimeout(() => setTextInput(""), 3000);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      const finalMessage = accumulatedTextRef.current.trim();
      if (finalMessage) {
        setTextInput(""); 
        setMessages((prev) => [...prev, { sender: "user", text: finalMessage }]);
        handleAIResponse(finalMessage);
      }
      accumulatedTextRef.current = "";
    };

    recognition.start();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || textInput.includes("...")) return; 
    
    setMessages((prev) => [...prev, { sender: "user", text: textInput }]);
    handleAIResponse(textInput);
    setTextInput("");
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6 flex-shrink-0 text-center">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 inline-block mb-2">Live Voice AI Tutor</h1>
        <p className="text-gray-600">Test your concepts and get explanations in English or Urdu.</p>
      </div>

      <div className="flex justify-center mb-8 flex-shrink-0">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
          <button 
            onClick={() => { setMode("english"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === "english" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
          >
            🗣️ English Explainer
          </button>
          <button 
            onClick={() => { setMode("teacher"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === "teacher" ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
          >
            👨‍🏫 Urdu Explainer
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
          {isSpeaking && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 bg-blue-400/20 rounded-full animate-ping absolute"></div>
              <div className="w-64 h-64 bg-purple-400/10 rounded-full animate-pulse absolute delay-75"></div>
            </div>
          )}

          <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${isSpeaking ? "scale-110 shadow-blue-500/50" : isListening ? "scale-105 shadow-red-500/50" : "shadow-gray-200"}`}>
            <div className={`absolute inset-0 rounded-full opacity-20 ${mode === "english" ? "bg-blue-500" : "bg-purple-500"}`}></div>
            <div className={`w-full h-full rounded-full border-4 flex items-center justify-center bg-white ${isSpeaking ? "border-blue-400" : isListening ? "border-red-400" : "border-gray-200"}`}>
              <span className="text-5xl">
                {isSpeaking ? "👨‍🏫" : isListening ? "👂" : "🤖"}
              </span>
            </div>
          </div>

          <div className="mt-6 text-center z-10 h-8">
            {isSpeaking && <span className="text-blue-600 font-bold animate-pulse">Professor AI is speaking...</span>}
            {isListening && <span className="text-red-500 font-bold animate-pulse">Listening... (Auto-send after 2s silence)</span>}
            {isProcessing && <span className="text-gray-500 font-medium animate-pulse">Thinking...</span>}
            {!isSpeaking && !isListening && !isProcessing && <span className="text-gray-400 font-medium">Ready to test you</span>}
          </div>
        </div>

        <div className="h-64 bg-gray-50 border-t border-gray-100 p-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center">
              Press the mic and say: "Listen to my definition of Object-Oriented Programming..."
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender === "user" ? "bg-gray-900 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"}`}>
                    <p className="font-semibold text-xs mb-1 opacity-60 uppercase tracking-wider">{msg.sender === "user" ? "You" : "AI Teacher"}</p>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center flex-shrink-0">
        <button 
          onClick={toggleListening}
          disabled={isSpeaking || isProcessing}
          className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening ? "bg-red-500 scale-110 animate-pulse" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 disabled:opacity-50 disabled:grayscale"}`}
        >
          <span className="text-2xl text-white">{isListening ? "⏹️" : "🎤"}</span>
        </button>

        <form onSubmit={handleTextSubmit} className="flex-1 w-full flex gap-2">
          <input 
            type="text" 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isSpeaking || isProcessing}
            placeholder="Or type your concept here..." 
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black disabled:bg-gray-100"
          />
          <button 
            type="submit"
            disabled={!textInput.trim() || textInput.includes("...") || isSpeaking || isProcessing}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50 transition-colors hover:bg-gray-800"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}