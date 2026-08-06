"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Standard Supabase Client Setup (Yeh kabhi fail nahi hota)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Nayi States UX behtar karne ke liye
  const [isSignUp, setIsSignUp] = useState(false); // Toggle check karne ke liye
  const [isSubmitted, setIsSubmitted] = useState(false); // Email check message ke liye
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Page refresh hone se roko
    setLoading(true);
    setErrorMsg("");

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`, // Email verify hone ke baad wapas yahan aaye
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        // Sign up theek ho gaya, ab "Check Email" ka message dikhao
        setIsSubmitted(true);
        setLoading(false);
      }
    } else {
      // --- LOGIN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg("Invalid email or password. Please try again.");
        setLoading(false);
      } else {
        // Login theek ho gaya, seedha dashboard par le jao
        router.push("/dashboard");
      }
    }
  };

  return (
    <main className="flex min-h-screen bg-white font-sans">
      
      {/* LEFT SIDE - Branding Image & Text (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        {/* Background Glowing Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-70"></div>
        
        <div className="relative z-10 p-12 text-center max-w-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30">
            <span className="text-white font-black text-3xl">E</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-6 leading-tight">
            Your Ultimate <br /> University Companion.
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            Join thousands of students studying smarter with AI. Upload lectures, generate flashcards, and track your GPA effortlessly.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - The Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          
          {/* Logo & Back button for mobile */}
          <div className="lg:hidden mb-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-xl">E</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EduAI</h1>
          </div>

          {/* Conditional Rendering: Agar Signup ho gaya toh message dikhao, warna Form dikhao */}
          {isSubmitted ? (
            
            // --- SUCCESS MESSAGE UI ---
            <div className="text-center bg-green-50 p-8 rounded-2xl border border-green-100 shadow-sm animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✉️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We've sent a verification link to <span className="font-semibold text-gray-800">{email}</span>. Please click the link to activate your account.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setIsSignUp(false); // Wapas login screen par le jao
                }}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                ← Back to Login
              </button>
            </div>

          ) : (
            
            // --- AUTH FORM UI ---
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </h1>
                <p className="text-gray-600">
                  {isSignUp 
                    ? "Enter your details to get started with EduAI." 
                    : "Enter your credentials to access your account."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all placeholder-gray-400"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex justify-center items-center"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isSignUp ? (
                    "Sign Up"
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMsg("");
                    }}
                    className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {isSignUp ? "Log in instead" : "Sign up for free"}
                  </button>
                </p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                 <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    ← Back to Website
                 </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}