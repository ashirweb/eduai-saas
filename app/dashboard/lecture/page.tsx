"use client";

import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Flashcard {
  front: string;
  back: string;
}

export default function LectureAnalyzerPage() {
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  
  const [topicSummary, setTopicSummary] = useState("");
  const [detailedResult, setDetailedResult] = useState("");
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, detailedResult, flashcards]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMimeType(file.type);
    
    setTopicSummary(""); 
    setDetailedResult("");
    setFlashcards([]);
    setFlippedCards({});
    setChatMessages([]);
    setCurrentAction(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeFile = async () => {
    if (!fileBase64) return;
    setIsLoading(true);
    setCurrentAction("analyzing");

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const filePart = { inlineData: { data: fileBase64, mimeType: fileMimeType } };
      const prompt = "Analyze this lecture document. Provide a clear and concise title of the main topic, followed by a short bullet-point summary of the key concepts covered inside it. Keep it beautifully formatted using markdown.";

      const result = await model.generateContent([filePart, prompt]);
      const response = await result.response;
      setTopicSummary(response.text());
    } catch (error) {
      console.error("AI Error:", error);
      alert("Error analyzing file. Please check your API key.");
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const handleUserChoice = async (choice: "explain" | "questions" | "quiz" | "flashcards") => {
    if (!fileBase64) return;
    setIsLoading(true);
    setCurrentAction(choice);
    setDetailedResult("");
    setFlashcards([]);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const filePart = { inlineData: { data: fileBase64, mimeType: fileMimeType } };

      let prompt = "";
      
      if (choice === "explain") {
        prompt = `Act as an expert university professor. Explain the attached lecture. Wherever a process, architecture, or workflow is explained, you MUST create a visual text-based flowchart using markdown symbols (like [Step 1] --> [Step 2]). Use markdown tables for comparisons. Make it highly visual.`;
      } else if (choice === "questions") {
        prompt = "Based on the attached document, generate Important Short and Long Questions with detailed answers. Use markdown formatting.";
      } else if (choice === "quiz") {
        prompt = "Based on the attached document, create a 5-question MCQs quiz with an Answer Key at the end.";
      } else if (choice === "flashcards") {
        prompt = `Based on the attached lecture, generate exactly 5 high-yield study flashcards. 
        You MUST respond strictly in the following format so that I can parse it cleanly:
        Q: [Question or Core Concept] | A: [Crisp Definition or Answer]
        Q: [Question or Core Concept] | A: [Crisp Definition or Answer]
        Do not add any introductory or concluding text, write each card on a new line separated exactly by ' | '.`;
      }

      const result = await model.generateContent([filePart, prompt]);
      const response = await result.response;
      const textOutput = response.text();

      if (choice === "flashcards") {
        const lines = textOutput.split("\n").filter(line => line.includes("|"));
        const parsedCards = lines.map(line => {
          const parts = line.split("|");
          const frontText = parts[0]?.replace(/^Q:\s*/i, "").trim() || "Concept";
          const backText = parts[1]?.replace(/^A:\s*/i, "").trim() || "Definition";
          return { front: frontText, back: backText };
        });
        setFlashcards(parsedCards);
      } else {
        setDetailedResult(textOutput);
      }
    } catch (error) {
      setDetailedResult("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const handleCardClick = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !fileBase64 || isChatLoading) return;

    const userMessage = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const filePart = { inlineData: { data: fileBase64, mimeType: fileMimeType } };
      const historyContext = chatMessages.map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`).join("\n");
      
      const prompt = `You are an AI Tutor. Based on the document, answer the student. If asked for a diagram, use text graphics.
      History: ${historyContext}
      Student: ${userMessage}
      Tutor:`;

      const result = await model.generateContent([filePart, prompt]);
      const response = await result.response;
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.text() }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] relative">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">Smart Lecture Analyzer</h1>
        <p className="text-gray-600 mt-1">Upload your lecture, get the topic overview, generate quizzes, and flashcards!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left Side: Upload Box & Pinned Options */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto relative">
          
          {/* Scrollable Content Area */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Step 1: Upload Lecture</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-gray-50/50">
              <input type="file" accept=".pdf,.txt" id="lecture-file" className="hidden" onChange={handleFileUpload} />
              <label htmlFor="lecture-file" className="cursor-pointer block">
                <span className="text-4xl mb-2 block">📁</span>
                <span className="text-gray-700 font-medium block">{fileName ? fileName : "Upload Lecture PDF or TXT"}</span>
              </label>
            </div>
            
            {fileBase64 && !topicSummary && (
              <button onClick={handleAnalyzeFile} disabled={isLoading} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md">
                {currentAction === "analyzing" ? "Analyzing..." : "Analyze File"}
              </button>
            )}
            
            {/* Original Full Size Summary Box */}
            {topicSummary && (
              <div className="mt-6 border-t pt-6">
                <h3 className="font-bold text-gray-800 text-lg mb-2">Detected Topic:</h3>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-gray-700 text-sm whitespace-pre-wrap">
                  {topicSummary}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Bar for Buttons */}
          {topicSummary && (
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4 z-10 mt-auto shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => handleUserChoice("explain")} className="py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs border border-blue-200 font-bold hover:bg-blue-100 shadow-sm transition-all">🔍 Explain</button>
                <button onClick={() => handleUserChoice("questions")} className="py-2.5 bg-purple-50 text-purple-700 rounded-xl text-xs border border-purple-200 font-bold hover:bg-purple-100 shadow-sm transition-all">📝 Questions</button>
                <button onClick={() => handleUserChoice("quiz")} className="py-2.5 bg-green-50 text-green-700 rounded-xl text-xs border border-green-200 font-bold hover:bg-green-100 shadow-sm transition-all">🎓 Quiz</button>
                <button onClick={() => handleUserChoice("flashcards")} className="py-2.5 bg-yellow-50 text-yellow-700 rounded-xl text-xs border border-yellow-200 font-bold hover:bg-yellow-100 shadow-sm transition-all">🃏 Flashcards</button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Workspace & Chat */}
        <div className={`flex flex-col bg-gray-50 border border-gray-200 transition-all ${isFullscreen ? "fixed inset-4 z-50 rounded-2xl shadow-2xl bg-white" : "rounded-2xl shadow-sm relative min-h-0"}`}>
          <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-2xl flex-shrink-0">
            <h2 className="font-semibold text-gray-800">Study Workspace & Chat</h2>
            {topicSummary && <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-gray-600 border px-3 py-1 rounded-md text-sm hover:bg-gray-50">↗️ Fullscreen</button>}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-500 animate-pulse font-medium py-8">
                <span className="text-4xl mb-3">🧠</span>
                Generating your study material...
              </div>
            ) : flashcards.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider text-center bg-yellow-100 py-1.5 rounded-md text-yellow-800">Interactive Flashcards (Click to flip)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {flashcards.map((card, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleCardClick(idx)}
                      className="w-full h-40 cursor-pointer [perspective:1000px]"
                    >
                      <div className={`relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards[idx] ? '[transform:rotateY(180deg)]' : ''}`}>
                        <div className="absolute inset-0 w-full h-full bg-white border-2 border-yellow-200 rounded-xl shadow-sm p-4 flex items-center justify-center font-bold text-gray-900 [backface-visibility:hidden]">
                          <div>
                            <span className="text-xs text-yellow-600 block mb-1">Concept {idx + 1}</span>
                            {card.front}
                          </div>
                        </div>
                        <div className="absolute inset-0 w-full h-full bg-yellow-50/90 border-2 border-yellow-400 rounded-xl shadow-sm p-4 flex items-center justify-center font-medium text-gray-800 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
                          <div>
                            <span className="text-xs text-yellow-700 block mb-1 font-bold">Answer</span>
                            <p className="text-sm">{card.back}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : detailedResult ? (
              <div className="bg-white p-5 rounded-xl shadow-sm prose prose-blue max-w-none text-gray-800 whitespace-pre-wrap font-sans">{detailedResult}</div>
            ) : !topicSummary ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-12">
                <span className="text-5xl mb-3">💡</span>
                <p>Upload a file to start studying.</p>
              </div>
            ) : null}

            {chatMessages.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white shadow-md" : "bg-white border text-gray-800 shadow-sm"}`}>{msg.content}</div>
                  </div>
                ))}
                {isChatLoading && <div className="text-gray-400 text-xs animate-pulse pl-2">Typing response...</div>}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {topicSummary && (
            <div className="p-4 bg-white border-t rounded-b-2xl flex-shrink-0">
              <form onSubmit={handleSendChatMessage} className="flex gap-3">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything about the lecture..." className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-black text-sm" />
                <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-all">Send</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}