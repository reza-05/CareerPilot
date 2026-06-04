"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, FileText } from "lucide-react";

export default function MatchResultPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("jobAnalysis");
    if (!data) {
      router.push("/cv-builder");
    } else {
      setAnalysis(JSON.parse(data));
    }
  }, [router]);

  if (!analysis) return (
    <div className="min-h-screen flex items-center justify-center text-slate-600">Loading analysis...</div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16 px-4 max-w-4xl mx-auto">
      {/* Back Button with dark contrast */}
      <button 
        onClick={() => router.push("/cv-builder")} 
        className="text-[#1E3A8A] font-bold mb-8 flex items-center hover:underline"
      >
        <ArrowLeft className="mr-2" /> Back to Builder
      </button>
      
      {/* Headings in Slate-900 for high readability */}
      <h1 className="text-4xl font-extrabold mb-6 text-slate-900">
        Match Score: {analysis.matchPercentage}%
      </h1>
      
      {/* Reasoning Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm mb-8 border border-slate-100">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Reasoning</h2>
        <p className="text-slate-700 leading-relaxed">{analysis.matchingReason}</p>
      </div>

      {/* Missing Skills Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm mb-8 border border-slate-100">
        <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center">
            <AlertCircle className="mr-2"/> Missing Skills
        </h2>
        <ul className="list-disc ml-5 space-y-1">
            {analysis.missingSkills?.map((s: string, i: number) => (
                <li key={i} className="text-slate-700 font-medium">{s}</li>
            ))}
        </ul>
      </div>

      {/* Cover Letter Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm mb-8 border border-slate-100">
        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-900">
            <FileText className="mr-2"/> Tailored Cover Letter
        </h2>
        <div className="whitespace-pre-line bg-slate-50 p-6 rounded-xl border border-slate-200 text-slate-700">
            {analysis.coverLetter}
        </div>
      </div>
    </div>
  );
}