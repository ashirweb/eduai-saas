"use client";

import { useState, useEffect } from "react";

// TypeScript ko structure batana
interface Course {
  id: string;
  name: string; // 🔥 FIX: "course_name" ko "name" kiya taake My Courses se match ho
  credits: number;
}

export default function GPACalculatorPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [gpa, setGpa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 FIX 1: Supabase ki bajaye Local Storage se My Courses ka data uthana
  useEffect(() => {
    const savedCourses = localStorage.getItem("eduai_courses");
    if (savedCourses) {
      const parsedCourses = JSON.parse(savedCourses);
      setCourses(parsedCourses);
    }
    setLoading(false);
  }, []);

  // Jab user dropdown se grade select kare
  const handleGradeChange = (courseId: string, grade: string) => {
    setGrades((prev) => ({ ...prev, [courseId]: grade }));
  };

  // GPA Calculate karne ka main logic
  const calculateGPA = () => {
    // 🔥 FIX 2: Standard Grade Points
    const gradePoints: Record<string, number> = {
      "A+": 4.0, "A": 4.0, "A-": 3.8, 
      "B+": 3.4, "B": 3.0, "B-": 2.8,
      "C+": 2.4, "C": 2.0, "C-": 1.8, 
      "D+": 1.4, "D": 1.0, "F": 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach((course) => {
      const grade = grades[course.id];
      // Agar user ne is course ka grade select kiya hai
      if (grade && gradePoints[grade] !== undefined) {
        // Agar ghalti se course mein credits save nahi hain, toh by default 3 samjho
        const courseCredits = course.credits || 3; 
        
        // Formula: (Grade Points * Credit Hours)
        totalPoints += gradePoints[grade] * courseCredits;
        totalCredits += courseCredits;
      }
    });

    // GPA = Sum(Points) / Sum(Credits)
    if (totalCredits === 0) {
      setGpa(0);
    } else {
      setGpa(Number((totalPoints / totalCredits).toFixed(2)));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-gray-500 animate-pulse">
        Loading your enrolled courses...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calculate Your GPA</h1>
        <p className="text-gray-600 mt-1">Select your expected grades for your enrolled courses.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <span className="text-4xl mb-4 block">📚</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Courses Found</h2>
          <p className="text-gray-500">Please add some courses in the "My Courses" tab first to calculate your GPA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Side: Courses List */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-blue-600 mb-6">Your Subjects</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    {/* Course ka actual naam display hoga */}
                    <h3 className="font-bold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.credits || 3} Credits</p>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <select
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black font-medium"
                      value={grades[course.id] || ""}
                      onChange={(e) => handleGradeChange(course.id, e.target.value)}
                    >
                      <option value="" disabled>Select Grade</option>
                      {/* 🔥 FIX 3: Standard Grading Options */}
                      <option value="A+">A+ (4.0) | 90-100</option>
                      <option value="A">A (4.0) | 80-89</option>
                      <option value="A-">A- (3.8) | 78-79</option>
                      <option value="B+">B+ (3.4) | 74-77</option>
                      <option value="B">B (3.0) | 70-73</option>
                      <option value="B-">B- (2.8) | 68-69</option>
                      <option value="C+">C+ (2.4) | 64-67</option>
                      <option value="C">C (2.0) | 60-63</option>
                      <option value="C-">C- (1.8) | 58-59</option>
                      <option value="D+">D+ (1.4) | 54-57</option>
                      <option value="D">D (1.0) | 50-53</option>
                      <option value="F">F (0.0) | Below 50</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={calculateGPA}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md"
            >
              Calculate My GPA
            </button>
          </div>

          {/* Right Side: Result Box */}
          <div className="h-fit bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100 text-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Estimated GPA</h2>
            
            {gpa === null ? (
              <div className="mt-4 py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p>Select grades & calculate</p>
              </div>
            ) : (
              <div className="mt-4">
                <span className={`text-6xl font-black ${
                  gpa >= 3.5 ? "text-green-500" : gpa >= 2.5 ? "text-blue-500" : gpa >= 2.0 ? "text-yellow-500" : "text-red-500"
                }`}>
                  {gpa.toFixed(2)}
                </span>
                <p className="text-gray-500 mt-2 font-medium">Out of 4.0</p>
                
                {gpa >= 3.5 && <p className="mt-4 text-sm text-green-600 bg-green-50 py-2 px-3 rounded-lg border border-green-100">Excellent work! Keep it up. 🌟</p>}
                {gpa < 2.0 && gpa > 0 && <p className="mt-4 text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg border border-red-100">You might need to focus more on your studies. 📚</p>}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}