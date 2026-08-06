"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  is_completed: boolean;
}

export default function StudyPlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔥 AI PLANNER STATES
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchTasks(user.id);
      }
    };
    initData();
  }, []);

  const fetchTasks = async (uid: string) => {
    const { data, error } = await supabase
      .from("study_planner")
      .select("*")
      .eq("user_id", uid)
      .order("due_date", { ascending: true }); 

    if (!error && data) {
      setTasks(data);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage("Error: User is not logged in.");
      return;
    }
    
    setLoading(true);
    setMessage(""); 

    const { error } = await supabase.from("study_planner").insert([
      {
        user_id: userId,
        title,
        description,
        due_date: dueDate,
      }
    ]);

    if (error) {
      setMessage("Error: " + error.message);
      console.error("Supabase Error:", error);
    } else {
      setMessage("Task added successfully! 🎉");
      setTitle("");
      setDescription("");
      setDueDate("");
      fetchTasks(userId); 
      // Naya task add hone par purana AI plan clear kar do taake user naya generate kare
      setAiPlan(null); 
    }
    setLoading(false);
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: boolean) => {
    setMessage(""); 
    setTasks((prevTasks) => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
      )
    );
    const { error } = await supabase
      .from("study_planner")
      .update({ is_completed: !currentStatus })
      .eq("id", taskId);

    if (error) {
      setMessage("Error updating task: " + error.message);
      if (userId) fetchTasks(userId); 
    }
  };

  const deleteTask = async (taskId: string) => {
    setMessage(""); 
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    const { error } = await supabase
      .from("study_planner")
      .delete()
      .eq("id", taskId);

    if (error) {
      setMessage("Error deleting task: " + error.message);
      if (userId) fetchTasks(userId); 
    } else {
      setMessage("Task deleted successfully! 🗑️");
    }
  };

  // 🔥 THE AI MAGIC: GENERATE SMART SCHEDULE
  const generateSmartPlan = async () => {
    if (tasks.filter(t => !t.is_completed).length === 0) {
      alert("Please add some pending tasks or exams first!");
      return;
    }

    setIsGenerating(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Pending tasks ki list banate hain AI ko bhejne ke liye
      const pendingTasks = tasks.filter(t => !t.is_completed).map(t => 
        `- ${t.title} (Due: ${new Date(t.due_date).toLocaleDateString()}) - Details: ${t.description || 'None'}`
      ).join("\n");

      const prompt = `You are an expert academic planner and time-management coach.
      Here are the student's upcoming deadlines and exams:
      ${pendingTasks}
      
      Create a smart, professional 7-day study schedule starting from today. 
      Distribute the workload logically so the student doesn't burn out.
      Format the response cleanly using bold headings for days (e.g., **Monday**, **Tuesday**) and use emojis. 
      Keep it actionable, highly structured, and encouraging.`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      setAiPlan(text);
      
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate AI plan. Please check your internet or API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI Study Planner 📅</h1>
          <p className="text-gray-500 font-medium mt-1">Organize deadlines and let AI build your perfect weekly schedule.</p>
        </div>
        
        {/* 🔥 AI GENERATE BUTTON */}
        <button 
          onClick={generateSmartPlan}
          disabled={isGenerating || tasks.length === 0}
          className={`px-6 py-3 rounded-xl font-black text-sm shadow-lg flex items-center gap-2 transition-all ${
            isGenerating 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 hover:shadow-purple-500/30"
          }`}
        >
          {isGenerating ? (
            <><span className="animate-spin inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></span> Planning...</>
          ) : (
            <>✨ Generate Smart Schedule</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Tasks (Takes 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Add Task Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Deadline</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Task Title</label>
                <input required type="text" placeholder="e.g. C++ Project Submission" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Due Date</label>
                <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Details (Optional)</label>
                <textarea rows={2} placeholder="e.g. Include class diagrams..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-black resize-none" />
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg text-sm font-bold ${message.includes("Error") ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md mt-2 text-sm">
                {loading ? "Saving..." : "+ Add to List"}
              </button>
            </form>
          </div>

          {/* Tasks List */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              Pending Tasks 
              <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">{tasks.filter(t => !t.is_completed).length}</span>
            </h2>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {tasks.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center">
                  <span className="text-4xl block mb-2">📋</span>
                  <p className="text-sm font-medium text-gray-500">No deadlines yet. Add some above!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={`bg-white p-4 rounded-xl border ${task.is_completed ? 'border-green-200 bg-green-50/50' : 'border-gray-100 shadow-sm'} transition-all flex flex-col gap-2 group`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => toggleTaskStatus(task.id, task.is_completed)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-500'}`}
                        >
                          {task.is_completed && <span className="text-white text-xs font-black">✓</span>}
                        </button>
                        <div>
                          <h3 className={`font-bold text-sm ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: The AI Schedule Result (Takes 7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-1 shadow-sm border border-gray-100 h-full min-h-[500px] flex flex-col">
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[22px] p-6 flex-1 flex flex-col relative overflow-hidden">
              
              {/* Background Glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none"></div>

              <div className="relative z-10 flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl backdrop-blur-md border border-white/20">
                  🧠
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Your Smart Schedule</h2>
                  <p className="text-xs text-indigo-200 font-medium">AI-generated optimized study plan</p>
                </div>
              </div>

              <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar text-white/90 pr-2">
                {!aiPlan && !isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                    <span className="text-6xl mb-4 grayscale opacity-50">🤖</span>
                    <p className="text-sm font-medium text-indigo-100 max-w-xs">
                      Add your upcoming exams and assignments, then click "Generate" to let AI plan your week.
                    </p>
                  </div>
                ) : isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-bold text-indigo-200 animate-pulse">Calculating optimal study times...</p>
                  </div>
                ) : (
                  <div 
                    className="text-sm leading-relaxed whitespace-pre-wrap font-medium"
                    // AI markdown return karta hai, usay thora khoobsurat dikhane ke liye hum CSS lagayenge
                    style={{ 
                      wordBreak: 'break-word',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* Gemini's text contains ** for bold, we can do a simple replace to make it slightly cleaner if we want, but whitespace-pre-wrap handles markdown beautifully if we use a specific font. */}
                    {aiPlan?.replace(/\*\*/g, '')}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}