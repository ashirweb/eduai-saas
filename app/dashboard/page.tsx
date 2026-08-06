"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../../lib/supabase";
interface CourseTask {
  id: string;
  title: string;
  date: string;
  urgency: "High" | "Medium" | "Low";
}

interface Course {
  id: string;
  name: string;
  instructor: string;
  credits: number;
  targetGrade: string;
  progress: number;
  tasks?: CourseTask[];
  dynamicHealth?: number; 
  topics?: string; 
}

export default function CopilotDashboard() {
  // 🔥 Default naam blank/Student rakha hai, Ashir nahi.
  const [profileName, setProfileName] = useState("Student");
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 🔥 Real GPA States
  const [currentGpa, setCurrentGpa] = useState("0.00");
  const [targetGpa, setTargetGpa] = useState("4.00");
  const [predictedGpa, setPredictedGpa] = useState("0.00");

  const [aiRoadmap, setAiRoadmap] = useState<any[]>([]);
  const [coachMessage, setCoachMessage] = useState(
    "Ready for today's session? Click 'Re-generate Plan' above and I will analyze your upcoming deadlines to build your schedule."
  );

  useEffect(() => {
    setIsMounted(true);
    
    // 🔥 LIVE SYNC FUNCTION
    const syncDashboardData = () => {
      // 1. Profile Name Load
      const savedName = localStorage.getItem("eduai_name");
      if (savedName) {
        setProfileName(savedName);
      }

      // 2. Current GPA Load
      const savedGpa = localStorage.getItem("eduai_gpa");
      const currGpaNum = savedGpa && !isNaN(parseFloat(savedGpa)) ? parseFloat(savedGpa) : 0.00;
      setCurrentGpa(savedGpa && savedGpa.trim() !== "" ? parseFloat(savedGpa).toFixed(2) : "0.00");

      // AI States from memory
      const savedRoadmap = localStorage.getItem("eduai_roadmap");
      const savedCoachMsg = localStorage.getItem("eduai_coachMessage");
      if (savedRoadmap) setAiRoadmap(JSON.parse(savedRoadmap));
      if (savedCoachMsg) setCoachMessage(savedCoachMsg);

      const savedCourses = localStorage.getItem("eduai_courses");
      let parsedCourses: Course[] = [];
      let extractedDeadlines: any[] = [];
      const today = new Date().getTime();
      
      let totalTargetPoints = 0;
      let totalHealth = 0;
      const gradeToPoint: Record<string, number> = { "A+": 4.0, "A": 4.0, "B+": 3.3, "B": 3.0, "C": 2.0 };

      if (savedCourses) {
        parsedCourses = JSON.parse(savedCourses);
      } else {
        // 🔥 Demo Data for new users (Generic, not Ashir's data)
        parsedCourses = [
          { id: "1", name: "Programming Fundamentals", instructor: "TBA", credits: 4, targetGrade: "A+", progress: 50, dynamicHealth: 80, topics: "Loops, Functions" }
        ];
        localStorage.setItem("eduai_courses", JSON.stringify(parsedCourses));
      }

      parsedCourses = parsedCourses.map((course: Course) => {
        let healthScore = 100; 

        if (course.tasks && course.tasks.length > 0) {
          course.tasks.forEach((task) => {
            const dateObj = new Date(task.date);
            const timeDiff = dateObj.getTime() - today;
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            
            if (daysLeft < 0) {
              healthScore -= 5;
            } else if (daysLeft <= 3) {
              if (task.urgency === 'High') healthScore -= 35;
              else if (task.urgency === 'Medium') healthScore -= 20;
              else healthScore -= 10;
            } else if (daysLeft <= 7) {
              if (task.urgency === 'High') healthScore -= 20;
              else if (task.urgency === 'Medium') healthScore -= 10;
            } else {
              if (task.urgency === 'High') healthScore -= 10;
            }

            extractedDeadlines.push({
              title: `${course.name}: ${task.title}`,
              dateStr: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              urgency: task.urgency,
              icon: task.urgency === 'High' ? '🚨' : task.urgency === 'Medium' ? '⚠️' : 'ℹ️',
              day: dateObj.getDate(),
              timestamp: dateObj.getTime(),
              courseName: course.name
            });
          });
        }
        
        const finalHealth = Math.max(20, Math.min(100, healthScore));
        totalTargetPoints += (gradeToPoint[course.targetGrade] || 4.0);
        totalHealth += finalHealth;

        return { ...course, dynamicHealth: finalHealth };
      });
      
      extractedDeadlines.sort((a, b) => a.timestamp - b.timestamp);
      setDeadlines(extractedDeadlines);
      setCourses(parsedCourses); 

      const avgTarget = parsedCourses.length > 0 ? (totalTargetPoints / parsedCourses.length).toFixed(2) : "4.00";
      setTargetGpa(avgTarget);

      const avgHealth = parsedCourses.length > 0 ? totalHealth / parsedCourses.length : 100;
      let pred = currGpaNum;
      
      if (currGpaNum > 0) {
        if (avgHealth >= 80) pred = Math.min(4.0, currGpaNum + 0.12);
        else if (avgHealth >= 60) pred = Math.min(4.0, currGpaNum + 0.02);
        else pred = Math.max(0, currGpaNum - 0.15); // Drop if health is bad!
      } else {
        pred = parseFloat(avgTarget) - 0.2; 
      }
      setPredictedGpa(pred.toFixed(2));
    };

    // First time component load ho toh run karo
    syncDashboardData();

    // Jab layout mein koi nayi profile setting save ho, toh automatically isay dobara run karo
    window.addEventListener("storage", syncDashboardData);
    return () => {
      window.removeEventListener("storage", syncDashboardData);
    };
  }, []);

  if (!isMounted) return null;

  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const blankDays = Array.from({ length: 3 }, (_, i) => i);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an AI Academic Copilot for an IT student named ${profileName}.
      Current time is afternoon/evening. Create a highly realistic study roadmap for tonight.

      Student Data:
      Courses, Health Score, and CURRENT TOPICS (Crucial!):
      ${courses.map(c => `- ${c.name} | Topics: ${c.topics || 'General review'} | Health: ${c.dynamicHealth}/100`).join("\n")}
      
      Upcoming Deadlines: 
      ${deadlines.slice(0, 5).map(d => `- ${d.title} (Due: ${d.dateStr}, Urgency: ${d.urgency})`).join("\n")}

      INSTRUCTIONS:
      1. Create exactly 3 study tasks for tonight starting from 06:00 PM onwards.
      2. Prioritize subjects that have Low Health Scores (< 70) or Upcoming High Urgency deadlines.
      3. CRITICAL: Use the "Current Topics" provided by the student for each subject.
      4. Provide a 2-sentence motivating message for the 'coachMessage' explaining WHY you chose this plan based on the topics and deadlines.
      5. CRITICAL REQUIREMENT: You MUST start the 'coachMessage' by addressing the student directly by their name. Example: "Hey ${profileName}, ..."

      RESPOND STRICTLY IN THIS JSON FORMAT (No markdown, no extra text):
      {
        "roadmap": [
          { "time": "06:00 PM", "task": "Specific actionable task including the exact topic", "type": "Study or Project or Revision", "duration": "e.g., 45 mins" }
        ],
        "coachMessage": "Your advice here starting with the student's name."
      }`;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);

      if (parsedData.roadmap) {
        setAiRoadmap(parsedData.roadmap);
        localStorage.setItem("eduai_roadmap", JSON.stringify(parsedData.roadmap));
      }
      if (parsedData.coachMessage) {
        setCoachMessage(parsedData.coachMessage);
        localStorage.setItem("eduai_coachMessage", parsedData.coachMessage);
      }

    } catch (error) {
      console.error("AI Error:", error);
      setCoachMessage(`Oops ${profileName}! I had trouble connecting to my brain. Please check your internet or API key and try again.`);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] relative">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{profileName}</span> 👋
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Your AI Semester Copilot is active. Here is your academic brief for today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/assignment" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
            <span>📝</span> Solve Assignment
          </Link>
          <Link href="/dashboard/timer" className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
            <span>⚡</span> Start Focus
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-medium text-sm">Current GPA</span><span className="text-xl">🎓</span></div>
          <span className="text-3xl font-black text-gray-900">{currentGpa}</span>
          <span className="text-xs text-gray-400 font-bold mt-2">Saved in Profile</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10"></div>
          <div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-medium text-sm">AI Predicted GPA</span><span className="text-xl">🔮</span></div>
          <span className="text-3xl font-black text-indigo-600">{predictedGpa}</span>
          <span className="text-xs text-indigo-500 font-bold mt-2">Target Grade Avg: {targetGpa}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-medium text-sm">Active Courses</span><span className="text-xl">📚</span></div>
          <span className="text-3xl font-black text-gray-900">{courses.length}</span>
          <span className="text-xs text-blue-500 font-bold mt-2">Synced from My Courses</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-2"><span className="text-gray-500 font-medium text-sm">Upcoming Deadlines</span><span className="text-xl">📅</span></div>
          <span className="text-3xl font-black text-gray-900">{deadlines.length}</span>
          <span className="text-xs text-orange-500 font-bold mt-2">Marked on calendar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span>🤖</span> Today's AI Roadmap</h2>
              <button 
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait shadow-sm"
              >
                {isRegenerating ? (
                  <><span className="animate-spin inline-block">⏳</span> Analyzing Data...</>
                ) : (
                  <><span>✨</span> {aiRoadmap.length > 0 ? "Re-generate Plan" : "Generate Plan"}</>
                )}
              </button>
            </div>
            
            <div className={`space-y-4 flex-1 transition-opacity duration-300 ${isRegenerating ? 'opacity-40' : 'opacity-100'}`}>
              {aiRoadmap.length === 0 && !isRegenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <span className="text-4xl mb-3">🧭</span>
                  <p className="text-gray-500 font-medium">Your schedule is clear.</p>
                  <p className="text-sm text-gray-400 mt-1">Click Generate to let AI plan your evening based on deadlines.</p>
                </div>
              ) : (
                aiRoadmap.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                    <div className="text-sm font-bold text-gray-400 mt-1 w-20 flex-shrink-0 group-hover:text-indigo-500">{item.time}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.task}</h3>
                      <div className="flex gap-3 mt-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md tracking-wide">{item.type}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md tracking-wide">⏱️ {item.duration}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6"><span>📈</span> Subject Health Analysis</h2>
            <div className="space-y-6">
              {courses.map((sub) => {
                const health = sub.dynamicHealth || 100;
                return (
                  <div key={sub.id}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-800 block">{sub.name}</span>
                        {sub.topics && (
                          <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">📌 Topics: {sub.topics}</span>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${health >= 80 ? 'bg-green-100 text-green-700' : health >= 60 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {health >= 80 ? 'Excellent' : health >= 60 ? 'Good' : 'Needs Focus'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1">
                      <div className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${health >= 80 ? 'bg-green-500' : health >= 60 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${health}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <div className="space-y-8">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[300px]">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6"><span>📅</span> AI Deadline Manager</h2>
            <div className="space-y-4 flex-1">
              {deadlines.length === 0 ? (
                <p className="text-sm text-gray-400 text-center italic py-4">No upcoming deadlines. You are all caught up!</p>
              ) : (
                deadlines.slice(0, 4).map((deadline, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="text-2xl">{deadline.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{deadline.title}</p>
                      <p className={`text-xs font-bold mt-0.5 ${deadline.urgency === 'High' ? 'text-red-500' : deadline.urgency === 'Medium' ? 'text-orange-500' : 'text-gray-500'}`}>
                        {deadline.dateStr}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="w-full mt-6 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors"
            >
              View Full Calendar
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 text-8xl transform translate-x-4 -translate-y-4">🤖</div>
            <h2 className="text-xl font-bold mb-2 relative z-10">AI Learning Coach</h2>
            <p className="text-indigo-100 text-sm mb-6 relative z-10 leading-relaxed font-medium">
              "{coachMessage}"
            </p>
            <Link href="/dashboard/tutor" className="block w-full text-center py-2.5 bg-white text-indigo-900 font-black text-sm rounded-xl hover:bg-indigo-50 transition-colors relative z-10">
              Chat with Coach
            </Link>
          </div>

        </div>

      </div>

      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Academic Calendar</h2>
                <p className="text-sm text-indigo-600 font-bold mt-1">July 2026 • AI Live Tracker</p>
              </div>
              <button onClick={() => setIsCalendarOpen(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center font-bold">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {blankDays.map((b) => <div key={`blank-${b}`} className="h-12"></div>)}
                
                {calendarDays.map((day) => {
                  const tasksForDay = deadlines.filter(d => d.day === day);
                  // 🔥 BONUS FIX: Calendar ab current computer date detect karega (Not hardcoded 4)
                  const isToday = day === new Date().getDate();

                  return (
                    <div 
                      key={`day-${day}`} 
                      className={`h-12 rounded-xl flex flex-col items-center justify-center relative text-sm font-bold border transition-all group
                        ${isToday ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30' : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'}
                        ${tasksForDay.length > 0 && !isToday ? 'border-orange-300 bg-orange-50' : ''}
                      `}
                    >
                      <span>{day}</span>
                      
                      {tasksForDay.length > 0 && (
                        <div className="flex gap-1 absolute bottom-1.5">
                          {tasksForDay.map((t, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full ${t.urgency === 'High' ? 'bg-red-500 animate-pulse' : t.urgency === 'Medium' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                          ))}
                        </div>
                      )}

                      {tasksForDay.length > 0 && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[11px] py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl font-medium min-w-max">
                          {tasksForDay.map((t, i) => (
                            <div key={i} className="mb-1 last:mb-0">{t.icon} {t.title}</div>
                          ))}
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-indigo-600"></span><span>Today</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-red-500 animate-pulse"></span><span>High Priority</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-orange-400"></span><span>Standard Task</span></div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}