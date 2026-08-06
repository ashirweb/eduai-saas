"use client";

import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  topics?: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  roast: string;
  praise: string;
}

export default function AIMemoryArena() {
  const [isMounted, setIsMounted] = useState(false);
  const [profileName, setProfileName] = useState("Ashir");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Arena Core States (🔥 NAYA: 'result' mode added)
  const [mode, setMode] = useState<"setup" | "flashcards" | "quiz" | "result">("setup");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  
  // Flashcard View States
  const [currentCardIdx, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Quiz View States
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [aiCoachFeedback, setAiFeedback] = useState("");
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedName = localStorage.getItem("eduai_name");
    if (savedName) setProfileName(savedName);

    const savedCourses = localStorage.getItem("eduai_courses");
    if (savedCourses) {
      const parsed = JSON.parse(savedCourses);
      setCourses(parsed);
      if (parsed.length > 0) setSelectedCourse(parsed[0].name);
    }
  }, []);

  const handleGenerateArena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setMode("setup");
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are the Master of the AI Memory Arena for an IT student named ${profileName}.
      The student wants to study the Subject: "${selectedCourse}" and specific Topic: "${topic}".

      Your job is to generate exactly 5 high-quality Flashcards for studying, and 5 multiple-choice Quiz questions to test their memory.
      CRITICAL: In the quiz questions, write a customized, funny, slightly sarcastic academic roast if they get it wrong, and a high-energy praise if they get it right. Address them as ${profileName} in the roast/praise.

      RESPOND STRICTLY IN THIS JSON FORMAT (No markdown, no extra text):
      {
        "flashcards": [
          { "question": "Clear educational question about the topic", "answer": "Detailed but simple answer" }
        ],
        "quiz": [
          {
            "question": "Conceptual multiple-choice question",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctIndex": 0,
            "praise": "Great job ${profileName}! You nailed it.",
            "roast": "Oh no ${profileName}! Did you skip this lecture? The correct concept is..."
          }
        ]
      }`;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);

      if (parsedData.flashcards && parsedData.quiz) {
        setFlashcards(parsedData.flashcards);
        setQuizQuestions(parsedData.quiz);
        setMode("flashcards"); 
        setCurrentCardIndex(0);
        setCurrentQuizIdx(0);
        setQuizScore(0);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error("Arena Generation Error:", error);
      alert("AI Arena session create karne mein masla hua. Please check your API Key or connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIdx(optionIdx);
    setIsAnswerSubmitted(true);

    const currentQuestion = quizQuestions[currentQuizIdx];
    if (optionIdx === currentQuestion.correctIndex) {
      setQuizScore((prev) => prev + 1);
      setAiFeedback(currentQuestion.praise);
    } else {
      setAiFeedback(currentQuestion.roast);
    }
  };

  const nextQuizQuestion = () => {
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setIsAnswerSubmitted(false);
      setAiFeedback("");
    } else {
      // 🔥 FIX 2: Proper Result Screen ki taraf route karna
      setMode("result");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* Top Breadcrumb Header */}
      <div className="mb-6 flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">🧠 AI Memory Arena</h1>
          <p className="text-gray-500 font-medium text-sm mt-0.5">Gamified Flashcards & Rapid-Fire Quiz Session</p>
        </div>
        {mode !== "setup" && (
          <button 
            onClick={() => setMode("setup")} 
            className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all"
          >
            ↩ Exit Arena
          </button>
        )}
      </div>

      {/* MODE 1: SETUP SCREEN */}
      {mode === "setup" && (
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 max-w-xl mx-auto w-full mt-6">
          <div className="text-center mb-8">
            <span className="text-5xl block mb-2">🏟️</span>
            <h2 className="text-2xl font-extrabold text-gray-950">Enter the Arena</h2>
            <p className="text-sm text-gray-400 mt-1">Select a subject and enter the topic you want to master today.</p>
          </div>

          <form onSubmit={handleGenerateArena} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Select Subject</label>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 bg-white outline-none"
              >
                {courses.length === 0 ? (
                  <option value="General Study">No courses found - Using General Tier</option>
                ) : (
                  courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Target Topic</label>
              <input 
                required
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Inheritance, Pointers, De Moivre's Theorem"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-black outline-none bg-white"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm tracking-wide shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><span className="animate-spin inline-block">⏳</span> Constructing Arena...</>
              ) : (
                <><span className="text-base">✨</span> Initialize Challenge</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* MODE 2: INTERACTIVE FLASHCARDS SCREEN */}
      {mode === "flashcards" && flashcards.length > 0 && (
        <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full mt-4">
          
          <div className="w-full flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-wider mb-4 px-2">
            <span>Stage 1: Flashcard Study</span>
            <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
          </div>

          {/* 🔥 FIX 1: Bright Green/Teal Flip Color */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full min-h-[320px] p-8 rounded-3xl border shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-center items-center text-center relative overflow-hidden select-none select-none
              ${isFlipped 
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20' 
                : 'bg-white text-gray-900 border-gray-100'}
            `}
          >
            <div className={`absolute top-4 right-5 text-[10px] font-black uppercase tracking-widest ${isFlipped ? 'text-emerald-900' : 'opacity-40'}`}>
              {isFlipped ? "🔄 Showing Answer" : "🔄 Click Card to Flip"}
            </div>

            {!isFlipped ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-indigo-500 uppercase bg-indigo-50 px-2.5 py-1 rounded-md mb-4 inline-block">Question</span>
                <h2 className="text-xl md:text-2xl font-black px-4 leading-snug">{flashcards[currentCardIdx].question}</h2>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-emerald-900 uppercase bg-emerald-400 px-2.5 py-1 rounded-md mb-4 inline-block">Answer Insight</span>
                <p className="text-base md:text-lg font-bold max-w-xl leading-relaxed text-white px-2 drop-shadow-sm">{flashcards[currentCardIdx].answer}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full mt-6">
            <button 
              disabled={currentCardIdx === 0}
              onClick={() => { setCurrentCardIndex(currentCardIdx - 1); setIsFlipped(false); }}
              className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-30"
            >
              Previous Card
            </button>

            {currentCardIdx < flashcards.length - 1 ? (
              <button 
                onClick={() => { setCurrentCardIndex(currentCardIdx + 1); setIsFlipped(false); }}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
              >
                Next Card →
              </button>
            ) : (
              <button 
                onClick={() => { setMode("quiz"); setIsFlipped(false); }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm tracking-wide hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10"
              >
                Enter Quiz Mode 🔥
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: RAPID-FIRE QUIZ SCREEN */}
      {mode === "quiz" && quizQuestions.length > 0 && (
        <div className="max-w-2xl mx-auto w-full mt-4 flex flex-col">
          
          <div className="w-full flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
            <span>Stage 2: Rapid Quiz</span>
            <span>Score: <strong className="text-indigo-600 text-sm">{quizScore}</strong> / {quizQuestions.length}</span>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-gray-100 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-widest">Question {currentQuizIdx + 1}</span>
              <h2 className="text-lg md:text-xl font-extrabold text-gray-900 mt-2 leading-snug">
                {quizQuestions[currentQuizIdx].question}
              </h2>
            </div>

            <div className="space-y-3 flex-1">
              {quizQuestions[currentQuizIdx].options.map((option, idx) => {
                const isSelected = selectedOptionIdx === idx;
                const isCorrectAnswer = idx === quizQuestions[currentQuizIdx].correctIndex;
                
                let buttonStyle = "border-gray-100 bg-gray-50 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50/50";
                if (isAnswerSubmitted) {
                  if (isCorrectAnswer) buttonStyle = "bg-green-500 text-white border-green-500 shadow-md";
                  else if (isSelected) buttonStyle = "bg-red-500 text-white border-red-500 shadow-sm";
                  else buttonStyle = "bg-gray-50 text-gray-400 opacity-50 border-gray-100";
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleQuizAnswer(idx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-bold transition-all duration-150 flex justify-between items-center ${buttonStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswerSubmitted && isCorrectAnswer && <span>✓ Correct</span>}
                    {isAnswerSubmitted && isSelected && !isCorrectAnswer && <span>✕ Wrong</span>}
                  </button>
                );
              })}
            </div>

            {isAnswerSubmitted && (
              <div className={`mt-6 p-4 rounded-2xl animate-in slide-in-from-bottom-3 duration-200 border flex items-start gap-3
                ${selectedOptionIdx === quizQuestions[currentQuizIdx].correctIndex 
                  ? 'bg-green-50 border-green-100 text-green-800' 
                  : 'bg-red-50 border-red-100 text-red-800'
                }
              `}>
                <span className="text-2xl mt-0.5">🤖</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider opacity-60">AI Coach Response</h4>
                  <p className="text-sm font-medium mt-0.5 leading-relaxed italic">"{aiCoachFeedback}"</p>
                </div>
              </div>
            )}

            {isAnswerSubmitted && (
              <button 
                onClick={nextQuizQuestion}
                className="w-full mt-6 py-3.5 bg-gray-950 text-white rounded-xl font-black text-sm hover:bg-gray-800 transition-all shadow-md"
              >
                {currentQuizIdx < quizQuestions.length - 1 ? "Next Challenge Question →" : "Finish Arena Challenge 🏁"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔥 FIX 2: MODE 4: FINAL RESULTS SCREEN */}
      {mode === "result" && (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 max-w-xl mx-auto w-full mt-6 text-center animate-in zoom-in-95 duration-300">
          <span className="text-6xl block mb-4">
            {quizScore === quizQuestions.length ? "🏆" : quizScore >= quizQuestions.length / 2 ? "👍" : "📚"}
          </span>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Arena Completed!</h2>
          <p className="text-gray-500 font-medium mb-8">
            You scored <strong className="text-indigo-600">{quizScore}</strong> out of {quizQuestions.length} on {topic}.
          </p>
          
          <div className="w-full bg-gray-100 rounded-full h-4 mb-8 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                quizScore === quizQuestions.length ? 'bg-green-500' : quizScore >= quizQuestions.length / 2 ? 'bg-indigo-500' : 'bg-orange-500'
              }`} 
              style={{ width: `${(quizScore / quizQuestions.length) * 100}%` }}
            ></div>
          </div>

          <button 
            onClick={() => setMode("setup")}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-sm tracking-wide shadow-md hover:bg-gray-800 transition-all"
          >
            Start New Arena Session
          </button>
        </div>
      )}

    </div>
  );
}