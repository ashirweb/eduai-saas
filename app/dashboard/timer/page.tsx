"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

interface Task {
  id: string;
  title: string;
}

export default function PomodoroTimerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  // Database se planner ke tasks mangwana
  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("study_planner")
          .select("id, title")
          .eq("user_id", user.id)
          .eq("is_completed", false);
        if (data) setTasks(data);
      }
    };
    fetchTasks();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === "focus") {
        alert("Focus session complete! Time for a short break. 🎉");
        setMode("break");
        setTimeLeft(5 * 60); // 5 minute break
      } else {
        alert("Break over! Ready to focus again? 💪");
        setMode("focus");
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode("focus");
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Circular progress percentage calculation
  const totalDuration = mode === "focus" ? 25 * 60 : 5 * 60;
  const strokeDashoffset = 440 - (440 * (timeLeft / totalDuration));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pomodoro Focus Timer</h1>
        <p className="text-gray-600 mt-1">Select a task from your planner and dive into deep work.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Left Control Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-left md:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Task to Complete:</label>
          <select
            className="w-full px-3 py-2 border rounded-xl text-black font-medium focus:ring-2 focus:ring-blue-500 mb-4"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
          >
            <option value="">-- General Study Session --</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
            💡 <strong>Tip:</strong> 25 minutes tak bina ruke focus karein, phir 5 minute ka break lein. Is se dimaagh thakta nahi hai.
          </div>
        </div>

        {/* Center Animated Timer Column */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 md:col-span-2 flex flex-col items-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="100" stroke="#E5E7EB" strokeWidth="10" fill="transparent" />
              <circle
                cx="128"
                cy="128"
                r="100"
                stroke={mode === "focus" ? "#2563EB" : "#10B981"}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="628"
                strokeDashoffset={(628 - (628 * (timeLeft / totalDuration))).toString()}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-5xl font-black text-gray-900 block">{formatTime(timeLeft)}</span>
              <span className={`text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${mode === "focus" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                {mode === "focus" ? "Focus Mode" : "Break Time"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-4 w-full max-w-sm">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all ${isActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isActive ? "Pause" : "Start Focus"}
            </button>
            <button
              onClick={resetTimer}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all border border-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}