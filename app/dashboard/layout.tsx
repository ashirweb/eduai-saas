"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect } from "react"; 
import { supabase } from "../../lib/supabase"; // 🔥 Supabase Import

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); 
  const router = useRouter();

  // Profile & Mobile States
  const [isMounted, setIsMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  
  // 🔥 Default naam ab "Student" hai, AI khud email se naam banayega
  const [profileName, setProfileName] = useState("Student");
  const [profileRole, setProfileRole] = useState("IT Student");
  const [profileSemester, setProfileSemester] = useState("");
  const [profileGpa, setProfileGpa] = useState("");
  const [profileDob, setProfileDob] = useState("");

  // 🔥 SUPABASE ACCESS CONTROL STATES
  const [trialStatus, setTrialStatus] = useState<"loading" | "trial" | "expired" | "pro">("loading");
  const [trialDaysLeft, setTrialDaysLeft] = useState(2);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Load details & check subscription on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Check Profile Details
    setProfileRole(localStorage.getItem("eduai_role") || "IT Student");
    setProfileSemester(localStorage.getItem("eduai_semester") || "");
    setProfileGpa(localStorage.getItem("eduai_gpa") || "");
    setProfileDob(localStorage.getItem("eduai_dob") || "");

    // 🔥 REAL SUPABASE SUBSCRIPTION LOGIC
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrialStatus("expired");
        return;
      }

      // 🔥 BULLETPROOF IDENTITY LOCK 🔥
      const storedUserId = localStorage.getItem("eduai_user_id");
      if (storedUserId && storedUserId !== user.id) {
        // ID match nahi hui! Matlab yeh koi NAYA user hai, purana data saaf karo
        const keysToRemove = ["eduai_name", "eduai_role", "eduai_semester", "eduai_gpa", "eduai_dob", "eduai_courses", "eduai_roadmap", "eduai_coachMessage"];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      // Current user ki ID hamesha save rakho taake agli dafa check ho sake
      localStorage.setItem("eduai_user_id", user.id);

      // 🔥 SMART NAME GENERATOR (Email se naam nikalna)
      const emailPrefix = user.email ? user.email.split('@')[0] : "Student";
      const autoName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      
      const savedName = localStorage.getItem("eduai_name");
      if (savedName) {
        setProfileName(savedName);
      } else {
        setProfileName(autoName);
        localStorage.setItem("eduai_name", autoName); // Naye user ka naam save karo
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); 

      if (sub) {
        if (sub.status === "active") {
          setTrialStatus("pro");
        } else {
          const now = new Date();
          const endDate = new Date(sub.trial_end_date);
          
          if (now > endDate || sub.status === "expired") {
            setTrialStatus("expired");
            setTrialDaysLeft(0);
          } else {
            setTrialStatus("trial");
            const diffTime = endDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            setTrialDaysLeft(diffDays);
          }
        }
      } else {
        setTrialStatus("expired");
        setTrialDaysLeft(0);
      }
    };

    checkSubscription();
  }, []);

  const saveProfile = () => {
    localStorage.setItem("eduai_name", profileName);
    localStorage.setItem("eduai_role", profileRole);
    localStorage.setItem("eduai_semester", profileSemester);
    localStorage.setItem("eduai_gpa", profileGpa);
    localStorage.setItem("eduai_dob", profileDob);
    setIsEditing(false);
    // Page ko chota sa reload de taake dashboard overview wahan se new GPA parh le
    window.dispatchEvent(new Event("storage"));
  };

  // 🔥 SECURE LOGOUT (Ab yahan se data delete nahi hoga, taake same user apna data na kho de)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Redirect to home
    router.push("/");
  };

  // 🔥 CATEGORIZED NAVIGATION (Basic vs Premium)
  const navItems = [
    { name: "Overview", href: "/dashboard", icon: "📊", isPremium: false },
    { name: "My Courses", href: "/dashboard/courses", icon: "📚", isPremium: false },
    { name: "GPA Calculator", href: "/dashboard/gpa", icon: "🎯", isPremium: false },
    { name: "Study Planner", href: "/dashboard/planner", icon: "📅", isPremium: false },
    // Premium AI Features
    { name: "AI Memory Arena", href: "/dashboard/arena", icon: "🧠", isPremium: true },
    { name: "AI Study Group", href: "/dashboard/study-group", icon: "💬", isPremium: true },
    { name: "Lecture Analyzer", href: "/dashboard/lecture", icon: "🧠", isPremium: true },
    { name: "Voice AI Tutor", href: "/dashboard/voice", icon: "🎙️", isPremium: true },
    { name: "Focus Timer", href: "/dashboard/timer", icon: "⏱️", isPremium: true },
    { name: "Assignment Solver", href: "/dashboard/assignment", icon: "📝", isPremium: true },
    { name: "AI Tutor", href: "/dashboard/tutor", icon: "🤖", isPremium: true },
  ];

  // 🔥 INTERCEPT CLICKS FOR LOCKED ITEMS
  const handleNavigation = (e: React.MouseEvent, isPremium: boolean) => {
    if (isPremium && trialStatus === "expired") {
      e.preventDefault(); 
      setShowUpgradeModal(true); 
    }
  };

  // REUSABLE SIDEBAR CONTENT (For both Desktop & Mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Area */}
      <div className="p-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">
            EduAI
          </h2>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest">
            By Hashi Venture
          </p>
        </div>
        {/* Mobile Close Button */}
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
          ✕
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isLocked = item.isPremium && trialStatus === "expired";
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={(e) => handleNavigation(e, item.isPremium)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group relative overflow-hidden ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 translate-x-1" 
                  : isLocked 
                    ? "text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-not-allowed"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <span className={`text-xl ${isActive || isLocked ? "grayscale-0" : "grayscale opacity-80"}`}>
                {item.icon}
              </span>
              <span className={isLocked ? "line-through opacity-70" : ""}>{item.name}</span>

              {/* 🔥 The Lock Icon or New Tag */}
              {isLocked ? (
                <span className="ml-auto text-sm text-red-500">🔒</span>
              ) : (item.name === "AI Memory Arena" || item.name === "AI Study Group") && (
                <span className={`ml-auto text-[9px] uppercase px-1.5 py-0.5 rounded-md tracking-wider ${isActive ? 'bg-white/30 text-white' : 'bg-green-500 text-white'}`}>
                  Pro
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Smart Trial / Pro Banner */}
      <div className="px-4 mt-2">
        {trialStatus === "loading" ? (
            <div className="bg-gray-100 p-4 rounded-2xl animate-pulse h-16"></div>
        ) : trialStatus === "expired" ? (
            <div className="bg-red-50 p-3 rounded-2xl border border-red-200 shadow-sm text-center">
              <p className="text-[11px] font-black text-red-600 mb-2 uppercase tracking-wider">🔒 Trial Expired</p>
              <button onClick={() => router.push('/dashboard/pricing')} className="block w-full bg-red-600 text-white text-xs font-black py-2.5 rounded-xl shadow-md hover:bg-red-700 transition-colors">
                Unlock Full Access
              </button>
            </div>
        ) : trialStatus === "trial" ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-2xl border border-orange-200 shadow-sm">
            <p className="text-[11px] font-black text-orange-800 mb-2 flex items-center justify-between uppercase tracking-wider">
              <span>⚡ {trialDaysLeft} Days Left</span>
            </p>
            <Link href="/dashboard/pricing" className="block w-full text-center bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 text-xs font-black py-2.5 rounded-xl shadow-md hover:scale-[1.02] transition-transform">
              Upgrade to Pro 👑
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-3 rounded-2xl border border-indigo-700 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full"></div>
            <p className="text-xs font-black text-amber-400 flex items-center justify-center gap-2 relative z-10 uppercase tracking-widest">
              <span className="text-lg">👑</span> EduAI Pro Active
            </p>
          </div>
        )}
      </div>

      {/* User Profile Area (With Logout & Extra Fields) */}
      <div className="p-4 flex-shrink-0 border-t border-gray-100 bg-gray-50/50 m-2 mt-4 rounded-2xl transition-all duration-300">
        {isEditing ? (
          <div className="flex flex-col gap-2 p-3 bg-white rounded-xl shadow-md border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profile Settings</span>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500 text-xs font-bold">✕</button>
            </div>
            
            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="px-3 py-1.5 text-xs font-bold text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name" />
            <input type="text" value={profileRole} onChange={(e) => setProfileRole(e.target.value)} className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Role (e.g., IT Student)" />
            
            {/* 🔥 NEW FIELDS FOR SEMESTER & GPA */}
            <div className="flex gap-2">
              <input type="text" value={profileSemester} onChange={(e) => setProfileSemester(e.target.value)} className="w-1/2 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sem (e.g. 5)" />
              <input type="text" value={profileGpa} onChange={(e) => setProfileGpa(e.target.value)} className="w-1/2 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="GPA (e.g. 3.8)" />
            </div>

            <div className="flex gap-2 mt-1">
              <button onClick={saveProfile} className="flex-1 bg-blue-600 text-white text-[11px] font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save</button>
              <button onClick={handleLogout} className="flex-1 bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm">Logout</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm text-lg flex-shrink-0 relative">
              {isMounted && profileName ? profileName.charAt(0).toUpperCase() : "U"}
              {trialStatus === "pro" && <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center border border-white">👑</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{isMounted ? profileName : "..."}</p>
              <p className="text-[11px] text-blue-600 font-semibold truncate mb-0.5">{isMounted ? profileRole : "..."}</p>
              
              {/* 🔥 SHOW SEMESTER & GPA IN SIDEBAR */}
              {isMounted && (profileSemester || profileGpa) && (
                <div className="flex gap-1.5 mt-1">
                  {profileSemester && <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center">📚 Sem {profileSemester}</span>}
                  {profileGpa && <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center">🎯 GPA {profileGpa}</span>}
                </div>
              )}
            </div>
            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100 flex-shrink-0">⚙️</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden md:block h-screen sticky top-0 shadow-sm z-10">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR (Overlay) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Dark Background */}
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          {/* Sliding Menu Container */}
          <aside className="relative w-[80%] max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* MOBILE VIP TOP HEADER */}
        <header className="md:hidden flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 py-3 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-purple-700">EduAI.</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {isMounted && profileName ? profileName.charAt(0).toUpperCase() : "U"}
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-700 shadow-sm hover:bg-gray-100 active:scale-95 transition-all"
            >
              {/* Sleek Hamburger Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Dashboard Pages Injection */}
        <main className="flex-1 overflow-y-auto relative p-0 sm:p-4 pb-20">
          {children}
        </main>
      </div>

      {/* 🔥 THE ULTIMATE UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 text-center relative">
            <div className="bg-red-50 py-8 px-6 border-b border-red-100">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🔒
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Your Free Trial Has Ended</h2>
              <p className="text-gray-600 font-medium text-sm leading-relaxed max-w-sm mx-auto">
                Subscribe to EduAI Premium to unlock full access to all AI tools, voice tutors, smart study groups, and future updates.
              </p>
            </div>
            
            <div className="p-6 space-y-3 bg-white">
              <button 
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push('/dashboard/pricing');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-sm shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
              >
                Subscribe Now • Rs. 399/mo
              </button>
              <button 
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push('/dashboard/pricing');
                }}
                className="w-full py-3.5 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                View Plans
              </button>
            </div>
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 font-bold">
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}