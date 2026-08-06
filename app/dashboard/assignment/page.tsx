"use client";

import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 🎨 Premium Text Formatter (Luxury Academic Look)
const formatInline = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => 
    i % 2 === 1 ? <strong key={i} className="text-slate-900 font-extrabold">{part}</strong> : part
  );
};

const renderFormattedText = (text: string) => {
  const blocks = text.split('\n\n');
  return blocks.map((block, index) => {
    if (block.startsWith('# ')) return <h1 key={index} className="text-4xl font-black mt-10 mb-6 text-slate-900 tracking-tight border-b-2 border-slate-200 pb-4">{formatInline(block.replace(/^# /, ''))}</h1>;
    if (block.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-slate-800 tracking-tight">{formatInline(block.replace(/^## /, ''))}</h2>;
    if (block.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-slate-700">{formatInline(block.replace(/^### /, ''))}</h3>;
    
    if (block.startsWith('* ') || block.startsWith('- ')) {
      const items = block.split('\n').filter(line => line.trim() !== '');
      return (
        <ul key={index} className="list-none pl-2 mb-6 space-y-3 text-slate-700 text-lg">
          {items.map((item, i) => (
            <li key={i} className="flex items-start">
              <span className="text-indigo-500 mr-3 mt-1 text-xl leading-none">•</span>
              <span>{formatInline(item.replace(/^[\*\-]\s/, ''))}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (/^\d+\.\s/.test(block)) {
        const items = block.split('\n').filter(line => line.trim() !== '');
        return (
          <ol key={index} className="list-decimal pl-6 mb-6 space-y-3 text-slate-700 text-lg marker:text-indigo-600 marker:font-bold">
            {items.map((item, i) => (
              <li key={i} className="pl-2">{formatInline(item.replace(/^\d+\.\s/, ''))}</li>
            ))}
          </ol>
        );
    }

    return <p key={index} className="mb-6 text-slate-700 leading-relaxed text-lg text-justify">{formatInline(block)}</p>;
  });
};

export default function AssignmentSolverPage() {
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  
  const [resultContent, setResultContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const resultEndRef = useRef<HTMLDivElement>(null);
  // 🔥 NAYA: Native Fullscreen ke liye Ref
  const documentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isChatLoading) {
      resultEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [resultContent, chatMessages.length, isLoading, isChatLoading]);

  // 🔥 NAYA: Native Fullscreen Listener (Taake agar user ESC dabaye toh state update ho)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMimeType(file.type);
    
    setResultContent("");
    setChatMessages([]);
    setCurrentAction(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async (actionType: "explain" | "solve") => {
    if (!fileBase64) return;
    setIsLoading(true);
    setCurrentAction(actionType);
    setResultContent("");
    setChatMessages([]);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const filePart = { inlineData: { data: fileBase64, mimeType: fileMimeType } };

      let prompt = "";
      if (actionType === "explain") {
        prompt = `You are a friendly and helpful tutor. Analyze this assignment document and explain it in VERY SIMPLE, plain language. 
        Do NOT use any difficult jargon. Explain it as if you are talking to an absolute beginner.
        1. Break down exactly what needs to be done in 3-4 easy steps. 
        2. Provide a simple checklist. 
        Format using '# ' for main title, '## ' for sections, and '* ' for lists.`;
      } else if (actionType === "solve") {
        prompt = `You are an expert academic solver and doer. Your ONLY job is to EXECUTE and DO the assignment based on the provided document.
        STRICT RULES:
        1. DO NOT explain how to do the assignment.
        2. DO NOT give advice, tips, or meta-commentary (e.g., avoid saying "Here is your solution" or "Note to student").
        3. If the assignment asks for an essay, write the full essay.
        4. If it asks for code, write the full working code.
        5. If it asks for a PowerPoint presentation, write the exact text, titles, and bullet points for every single slide (e.g., Slide 1: Title, Slide 2: Introduction, etc.).
        6. Give me the final, ready-to-submit solution directly.
        Format the output beautifully using standard Markdown. Use '# ' for main title, '## ' for sections, and '* ' or '1. ' for lists. Use '**bold**' for key terms. Make it highly professional.`;
      }

      const result = await model.generateContent([filePart, prompt]);
      const response = await result.response;
      setResultContent(response.text());
    } catch (error) {
      console.error("AI Error:", error);
      setResultContent("Something went wrong. Please check your API quota or try again.");
    } finally {
      setIsLoading(false);
    }
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
      const historyContext = chatMessages.map(msg => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`).join("\n");
      
      const prompt = `You are an Assignment Assistant. Based on the uploaded assignment and the solution provided, answer the student's question directly and implement any requested changes.
      History: ${historyContext}
      Student: ${userMessage}
      Assistant:`;

      const result = await model.generateContent([filePart, prompt]);
      const response = await result.response;
      setChatMessages((prev) => [...prev, { role: "assistant", content: response.text() }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // 🔥 NAYA: Native Toggle Fullscreen Function
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      documentContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />

      <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] relative print:p-0 print:h-auto print:block print:bg-white">
        
        <div className="mb-6 flex-shrink-0 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900">Smart Assignment Solver</h1>
          <p className="text-gray-600 mt-1">Upload your assignment instructions. Let AI explain it simply, or solve it into a Premium PDF!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 print:block">
          
          {/* Left Controls */}
          <div className="lg:col-span-4 flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-0 print:hidden">
            <h2 className="text-xl font-semibold text-blue-600 mb-4 flex-shrink-0">1. Upload Assignment</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-gray-50/50 flex-shrink-0">
              <input type="file" accept=".pdf,.txt,.docx" id="assignment-file" className="hidden" onChange={handleFileUpload} />
              <label htmlFor="assignment-file" className="cursor-pointer block">
                <span className="text-4xl mb-2 block">📄</span>
                <span className="text-gray-700 font-medium block">{fileName ? fileName : "Upload Assignment PDF"}</span>
              </label>
            </div>
            
            {fileBase64 && (
              <div className="mt-8 flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-gray-800 flex-shrink-0">2. Choose Action</h2>
                
                <button 
                  onClick={() => handleAction("explain")} 
                  disabled={isLoading} 
                  className="w-full bg-blue-50 border border-blue-200 text-blue-700 py-4 rounded-xl font-bold hover:bg-blue-100 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>🔍</span> Explain it Simply
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button 
                  onClick={() => handleAction("solve")} 
                  disabled={isLoading} 
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>✨</span> Solve it for me
                </button>
              </div>
            )}
          </div>

          {/* Right Document View (Native Fullscreen Wrapper) */}
          <div 
            ref={documentContainerRef} 
            className={`lg:col-span-8 flex flex-col bg-gray-100 border border-gray-200 shadow-inner relative min-h-0 print:border-none print:shadow-none print:bg-white print:block ${isFullscreen ? 'rounded-none' : 'rounded-2xl'}`}
          >
            
            <div className={`flex justify-between items-center p-4 border-b border-gray-200 bg-white flex-shrink-0 print:hidden ${isFullscreen ? 'rounded-none' : 'rounded-t-2xl'}`}>
              <h2 className="font-semibold text-gray-800">
                {isFullscreen ? "Focus Mode: Document Preview" : "Document Preview"}
              </h2>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleFullscreen}
                  className="text-gray-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-1.5 transition-colors"
                >
                  {isFullscreen ? (
                    <><span>↙️</span> Exit Full Screen</>
                  ) : (
                    <><span>🔲</span> Full Screen</>
                  )}
                </button>

                {resultContent && (
                  <button 
                    onClick={handlePrintPDF} 
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <span>📥</span> Export PDF
                  </button>
                )}
              </div>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:overflow-visible print:p-0 bg-[#E8ECEF] print:bg-white custom-scrollbar ${isFullscreen ? 'rounded-none' : 'rounded-b-2xl'}`}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-indigo-500 animate-pulse font-medium py-8 print:hidden">
                  <span className="text-4xl mb-3">⚙️</span>
                  {currentAction === "explain" ? "Simplifying requirements for you..." : "Crafting your premium document..."}
                </div>
              ) : resultContent ? (
                
                <div className="bg-[#FAF9F6] p-10 md:p-14 rounded-xl shadow-2xl border-t-8 border-t-indigo-600 border border-gray-200 max-w-4xl mx-auto print:shadow-none print:border-t-0 print:border-none print:p-0 print:m-0 print:max-w-none">
                  
                  <div className="mb-12 border-b-2 border-slate-200 pb-8 flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Solution Report
                      </h1>
                      <p className="text-indigo-600 font-bold mt-2 tracking-wide uppercase text-sm">Ref: {fileName}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Generated</p>
                      <p className="text-slate-800 font-bold">{new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  <div className="font-sans">
                    {renderFormattedText(resultContent)}
                  </div>

                  <div className="mt-16 pt-8 border-t-2 border-dashed border-slate-200 text-center text-sm font-semibold text-slate-400">
                    Generated confidently via Hashi Venture & EduAI Platform
                  </div>

                </div>

              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-12 print:hidden">
                  <span className="text-5xl mb-3">📄</span>
                  <p>Upload a file and choose an action to see the magic.</p>
                </div>
              )}

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-gray-300 print:hidden max-w-4xl mx-auto">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Follow-up Revisions</h3>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === "user" ? "bg-indigo-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-800 shadow-sm"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && <div className="text-gray-400 text-xs animate-pulse pl-2">AI is modifying the document...</div>}
                </div>
              )}
              <div ref={resultEndRef} className="print:hidden" />
            </div>

            {/* Chat Input */}
            {resultContent && (
              <div className={`p-4 bg-white border-t border-gray-200 flex-shrink-0 print:hidden ${isFullscreen ? 'rounded-none' : 'rounded-b-2xl'}`}>
                <form onSubmit={handleSendChatMessage} className="flex gap-3 max-w-4xl mx-auto">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Need changes? Ask the AI to adjust the document..." className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black text-sm shadow-sm bg-gray-50" />
                  <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md">Update</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}