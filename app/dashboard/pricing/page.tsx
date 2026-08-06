"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase"; 

export default function PricingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [profileName, setProfileName] = useState("Student");
  const [isPro, setIsPro] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Payment Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile">("mobile");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedName = localStorage.getItem("eduai_name");
    if (savedName) setProfileName(savedName);

    const fetchStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(); // 🔥 FIX: 406 error se bachne ke liye maybeSingle
          
        if (data && data.status === "active") {
          setIsPro(true);
        }
      }
    };
    fetchStatus();
  }, []);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert("User not logged in!");

    setIsProcessing(true);

    try {
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId: 'eduai_pro_399' })
      });
      const checkoutData = await checkoutRes.json();
      
      if (!checkoutRes.ok) throw new Error(checkoutData.error || "Checkout API failed");

      const webhookRes = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment.success', userId: userId })
      });
      const webhookData = await webhookRes.json();

      if (!webhookRes.ok) throw new Error(webhookData.error || "Webhook failed to update database");

      localStorage.setItem("eduai_pro_status", "active"); 
      setIsSuccess(true);
      setIsPro(true);
      
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.reload(); 
      }, 3000);

    } catch (error: any) {
      console.error("Payment flow error:", error);
      alert(`Payment Failed: ${error.message || "Server Error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 mt-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
          Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">EduAI Pro 👑</span>
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          Your 2-Day Free Trial is running out. Upgrade now to keep using the ultimate AI University Companion for less than the price of a fast-food meal!
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full relative">
        
        {/* Free Tier Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col opacity-80">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Basic Trial</h2>
            <p className="text-gray-500 mt-2 text-sm">To explore the dashboard.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-black text-gray-900">Rs. 0</span>
            <span className="text-gray-500 font-medium"> / 2 days</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
              <span className="text-green-500 text-lg">✓</span> Copilot Dashboard
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
              <span className="text-green-500 text-lg">✓</span> GPA Calculator & Course Sync
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
              <span className="text-green-500 text-lg">✓</span> Basic Text AI Tutor
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400 font-medium line-through">
              <span className="text-red-400 text-lg">✕</span> Voice AI Tutor
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400 font-medium line-through">
              <span className="text-red-400 text-lg">✕</span> PDF Lecture Analyzer
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-400 font-medium line-through">
              <span className="text-red-400 text-lg">✕</span> AI Virtual Study Group
            </li>
          </ul>

          <button disabled className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm">
            Currently Active
          </button>
        </div>

        {/* Pro Tier Card */}
        <div className="bg-gradient-to-b from-indigo-900 to-purple-900 rounded-3xl p-8 border border-indigo-700 shadow-2xl shadow-indigo-500/30 flex flex-col relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-bl-xl">
            Best for Pakistani Students
          </div>
          
          <div className="mb-6 relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">EduAI Pro <span className="text-amber-400">👑</span></h2>
            <p className="text-indigo-200 mt-2 text-sm">Unlock absolute academic dominance.</p>
          </div>
          <div className="mb-6 relative z-10">
            <span className="text-5xl font-black text-white">Rs. 399</span>
            <span className="text-indigo-300 font-medium"> / month</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            <li className="flex items-center gap-3 text-sm text-indigo-50 font-medium">
              <span className="text-amber-400 text-lg">★</span> Everything in Basic
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-50 font-medium">
              <span className="text-amber-400 text-lg">★</span> Unlimited Voice AI Tutor (English & Urdu)
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-50 font-medium">
              <span className="text-amber-400 text-lg">★</span> Smart Lecture Analyzer & Flashcards
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-50 font-medium">
              <span className="text-amber-400 text-lg">★</span> 24/7 AI Virtual Study Group
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-50 font-medium">
              <span className="text-amber-400 text-lg">★</span> No Ads & Priority Features
            </li>
          </ul>

          {isPro ? (
            <button className="w-full py-4 bg-green-500 text-white rounded-xl font-black text-sm relative z-10 shadow-lg cursor-default flex justify-center items-center gap-2">
              <span>🎉</span> Pro Active
            </button>
          ) : (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 rounded-xl font-black text-sm hover:scale-[1.02] transition-transform relative z-10 shadow-lg"
            >
              Upgrade Now
            </button>
          )}

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
        </div>

      </div>

      {/* --- PAYMENT MODAL --- */}
      {isModalOpen && !isPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 relative">
            
            {isSuccess ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mb-4 animate-bounce">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 font-medium">Welcome to EduAI Pro, {profileName}! 🚀</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Secure Checkout</h2>
                    <p className="text-xs text-indigo-600 font-bold mt-1">EduAI Pro • Rs. 399/mo</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center font-bold">
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
                  
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setPaymentMethod("mobile")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === "mobile" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>
                      EasyPaisa/JazzCash
                    </button>
                    <button type="button" onClick={() => setPaymentMethod("card")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentMethod === "card" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>
                      Debit/Credit Card
                    </button>
                  </div>

                  {paymentMethod === "mobile" ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Mobile Account Number</label>
                        <input required type="text" placeholder="03XX-XXXXXXX" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 outline-none" />
                      </div>
                      <p className="text-xs text-gray-400 font-medium">A payment prompt will be sent to your mobile app. Enter your PIN to approve.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Card Number</label>
                        <input required type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 outline-none" />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Expiry</label>
                          <input required type="text" placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 outline-none text-center" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">CVC</label>
                          <input required type="password" placeholder="•••" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-900 outline-none text-center" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 bg-gray-950 text-white rounded-xl font-black text-sm tracking-wide shadow-md hover:bg-gray-800 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                      {isProcessing ? (
                        <><span className="animate-spin inline-block border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> Processing...</>
                      ) : (
                        `Pay Rs. 399`
                      )}
                    </button>
                    <p className="text-center text-[10px] font-bold text-gray-400 mt-3 flex items-center justify-center gap-1">
                      <span>🔒</span> Secured by PayFast / Stripe
                    </p>
                  </div>

                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}