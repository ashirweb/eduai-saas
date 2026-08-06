import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <Link href="/" className="text-blue-600 font-bold hover:underline mb-6 inline-block">← Back to Home</Link>
        <h1 className="text-4xl font-black text-gray-900 mb-8">Our Services</h1>
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">1. AI Smart Tutor</h2>
            <p>24/7 access to our intelligent AI tutor that helps you solve complex programming, math, and logic problems step-by-step.</p>
          </div>
          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">2. Lecture Analyzer & Flashcards</h2>
            <p>Upload your PDFs and let our AI automatically generate summaries, MCQ quizzes, and 3D interactive flashcards.</p>
          </div>
          <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">3. GPA Tracking & Study Planner</h2>
            <p>Advanced tools to predict your GPA, track your current academic health, and manage your study deadlines seamlessly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}