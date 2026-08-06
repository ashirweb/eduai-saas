"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Standard Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();
  }, []);

  // Secure Logout Function
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const handleStartLearning = (e: any) => {
    e.preventDefault();
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-200">
      
      {/* 1. Mobile-Friendly Navbar */}
      <header className="fixed w-full top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700 tracking-tight">
              EduAI.
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-4 items-center">
            {loading ? (
              <div className="w-24 sm:w-32 h-9 sm:h-10 bg-gray-100 animate-pulse rounded-xl"></div>
            ) : user ? (
              // LOGGED IN VIEW (Mobile Optimized)
              <>
                <Link href="/dashboard" className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md">
                  Dashboard ✨
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="px-3 sm:px-5 py-2 sm:py-2.5 bg-red-50 text-red-600 border border-red-100 text-xs sm:text-sm font-bold rounded-xl hover:bg-red-100 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              // LOGGED OUT VIEW (Mobile Optimized)
              <>
                <Link href="/auth" className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
                  Log In
                </Link>
                <Link href="/auth" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md">
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 2. Massive Hero Section with Gradients */}
      <main className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-4 sm:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] sm:h-[500px] bg-gradient-to-r from-blue-400/30 to-purple-400/30 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs sm:text-sm font-semibold mb-6 sm:mb-8 shadow-sm">
            <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-blue-500"></span>
            </span>
            Next-Gen University Companion is Live
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6 sm:mb-8">
            Master your exams with <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Superpowered AI.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Upload your lectures, generate interactive 3D flashcards, chat with your PDFs, and track your GPA all in one highly intelligent workspace.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button 
              onClick={handleStartLearning} 
              className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-blue-600 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-1 text-base sm:text-lg"
            >
              Start Learning for Free
            </button>
            <a href="#features" className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-white text-gray-800 font-bold rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all border border-gray-200 shadow-sm text-base sm:text-lg">
              Explore Features
            </a>
          </div>
        </div>
      </main>

      {/* 3. Breathtaking Features Grid */}
      <section id="features" className="py-16 sm:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Everything you need to get a 4.0 GPA</h2>
            <p className="text-sm sm:text-base text-gray-600">Built specifically for modern students to study smarter, not harder.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 shadow-sm">🧠</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Smart AI Tutor</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Stuck on a complex concept? Chat with our AI tutor that explains coding, math, and logic perfectly step-by-step.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 shadow-sm">📄</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Lecture Analyzer</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Upload a PDF and watch the AI extract summaries, create visual flowcharts, and build complete MCQ quizzes instantly.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 shadow-sm">🃏</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">3D Flashcards</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Turn any lecture into interactive 3D flipping flashcards to master definitions and core concepts using active recall.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 shadow-sm">⏱️</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Pomodoro Focus</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Link your upcoming assignments to our dedicated focus timer. Work in deep 25-minute sprints without distractions.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 shadow-sm">📈</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">GPA Tracker</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Never guess your grades again. Add your courses, credit hours, and let our system calculate your accurate CGPA.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-5 sm:mb-6 shadow-sm">📅</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Study Planner</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">A clean, optimistic-UI driven task manager to keep all your project deadlines and exam schedules perfectly organized.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Elegant Footer with Legal & Policy Links */}
      <footer className="bg-gray-900 py-10 sm:py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">EduAI.</span>
            </div>
            
            {/* PayFast Required Links */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-gray-400">
              <Link href="/services" className="hover:text-white transition-colors">Services</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 sm:pt-8 border-t border-gray-800 text-xs sm:text-sm text-gray-500 gap-3 sm:gap-4 text-center md:text-left">
            <p>
              Developed & Designed by <span className="font-bold text-white tracking-wide">Hashi Venture</span>
            </p>
            <p>© {new Date().getFullYear()} EduAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}