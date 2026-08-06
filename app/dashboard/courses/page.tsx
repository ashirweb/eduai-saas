"use client";

import { useState, useEffect } from "react";

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
  topics?: string; // 🔥 NAYA: Topics field
}

export default function CoursesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const [newCredits, setNewCredits] = useState("3");
  const [newTarget, setNewTarget] = useState("A");
  const [newTopics, setNewTopics] = useState(""); // 🔥 State for topics

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskUrgency, setTaskUrgency] = useState<"High" | "Medium" | "Low">("Medium");

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("eduai_courses");
    if (saved) {
      setCourses(JSON.parse(saved));
    } else {
      setCourses([
        { id: "1", name: "Full-Stack Web Dev", instructor: "Shahid Wazir", credits: 4, targetGrade: "A+", progress: 90, tasks: [], topics: "React, Next.js, Auth" },
        { id: "2", name: "Object Oriented Programming", instructor: "TBA", credits: 3, targetGrade: "A", progress: 65, tasks: [], topics: "Classes, Objects" }
      ]);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("eduai_courses", JSON.stringify(courses));
    }
  }, [courses, isMounted]);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCourse: Course = {
      id: Date.now().toString(),
      name: newName,
      instructor: newInstructor || "TBA",
      credits: parseInt(newCredits),
      targetGrade: newTarget,
      progress: 0,
      tasks: [],
      topics: newTopics // 🔥 Add topics to course
    };

    setCourses([...courses, newCourse]);
    setIsCourseModalOpen(false);
    setNewName(""); setNewInstructor(""); setNewCredits("3"); setNewTarget("A"); setNewTopics("");
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDate || !selectedCourseId) return;

    const newTask: CourseTask = {
      id: Date.now().toString(),
      title: taskTitle,
      date: taskDate,
      urgency: taskUrgency
    };

    setCourses(courses.map(course => {
      if (course.id === selectedCourseId) {
        return { ...course, tasks: [...(course.tasks || []), newTask] };
      }
      return course;
    }));

    setIsTaskModalOpen(false);
    setTaskTitle(""); setTaskDate(""); setTaskUrgency("Medium");
  };

  const openTaskModal = (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsTaskModalOpen(true);
  };

  if (!isMounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] relative">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Courses & Dates 📚</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your semester subjects and add important deadlines.</p>
        </div>
        <button 
          onClick={() => setIsCourseModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <span>➕</span> Add New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <span className="text-5xl mb-4">📭</span>
          <h3 className="text-lg font-bold text-gray-800">No courses added yet</h3>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Add your subjects to let the AI plan your semester.</p>
          <button onClick={() => setIsCourseModalOpen(true)} className="text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100">
            Add your first course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group flex flex-col hover:border-indigo-100 transition-all">
              <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gradient-to-br from-white to-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{course.name}</h3>
                  <div className="flex items-center text-xs font-bold text-gray-500 gap-3">
                    <span>👨‍🏫 {course.instructor}</span>
                    <span>•</span>
                    <span>⭐ Target: {course.targetGrade}</span>
                  </div>
                  {/* 🔥 NAYA: Show current topics under course name */}
                  {course.topics && (
                     <p className="text-xs text-indigo-600 font-semibold mt-2">📌 Current Topics: {course.topics}</p>
                  )}
                </div>
                <button onClick={() => handleDeleteCourse(course.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">🗑️</button>
              </div>
              
              <div className="p-4 flex-1 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Upcoming Dates</h4>
                  <button onClick={() => openTaskModal(course.id)} className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
                    <span>+</span> Add Date
                  </button>
                </div>
                
                <div className="space-y-2">
                  {(!course.tasks || course.tasks.length === 0) ? (
                    <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">No dates added yet.</p>
                  ) : (
                    course.tasks.map(task => (
                      <div key={task.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${task.urgency === 'High' ? 'bg-red-500' : task.urgency === 'Medium' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">{new Date(task.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD COURSE MODAL --- */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add New Course</h2>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Course Name</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-black font-medium" />
              </div>
              
              {/* 🔥 NAYA: Topics input field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Current Topics (Optional)</label>
                <input type="text" value={newTopics} onChange={e => setNewTopics(e.target.value)} placeholder="e.g. Inheritance, Arrays, SQL" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-black font-medium" />
                <p className="text-[10px] text-gray-400 mt-1">AI will use this to plan your study sessions.</p>
              </div>

              {/* 🔥 FIX: Added Credit Hours input side-by-side with Instructor Name */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Instructor Name</label>
                  <input type="text" value={newInstructor} onChange={e => setNewInstructor(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-black font-medium" />
                </div>
                <div className="w-24 flex-shrink-0">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Credits</label>
                  <input required type="number" min="1" max="6" value={newCredits} onChange={e => setNewCredits(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-black font-medium text-center" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD DATE MODAL --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <h2 className="text-lg font-bold text-indigo-900">📅 Add Deadline</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">What is it?</label>
                <input required type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="e.g. Midterm Exam" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-black bg-white" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                <input 
                  required 
                  type="date" 
                  value={taskDate} 
                  onChange={e => setTaskDate(e.target.value)} 
                  style={{ color: 'black' }} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold bg-white text-black" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Urgency Level</label>
                <select value={taskUrgency} onChange={e => setTaskUrgency(e.target.value as "High" | "Medium" | "Low")} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-white text-black">
                  <option value="High">🚨 High (Exams/Major Projects)</option>
                  <option value="Medium">⚠️ Medium (Assignments/Quizzes)</option>
                  <option value="Low">ℹ️ Low (Reading/Homework)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="w-full px-4 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                  Add to Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}