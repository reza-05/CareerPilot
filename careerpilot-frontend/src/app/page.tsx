"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CVUploaderProps {
  onUploadSuccess?: (msg: string) => void;
}

export default function CVUploader({ onUploadSuccess }: CVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorNotification(null); // নতুন ফাইল সিলেক্ট করলে আগের এরর রিমুভ হবে
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setErrorNotification(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // পয়েন্ট করছি আমাদের সুরক্ষিত নেক্সটজেএস প্রক্সি এপিআই রুটে
      const response = await fetch('/api/cv-processor', {
        method: 'POST',
        headers: {
          'x-user-id': 'hackathon_session_user',
        },
        body: formData,
      });

      let data;
      const contentType = response.headers.get("content-type") || "";
      
      // এপিআই রেসপন্স পার্সিং মেকানিজমকে বুলেটপ্রুফ করা হয়েছে
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(rawText || "Server responded with an invalid layout/status.");
        }
      }

      // রেসপন্স স্ট্যাটাস কোড এবং সাকসেস ফ্ল্যাগ ভ্যালিডেশন
      if (response.ok && data?.success) {
        localStorage.setItem("careerpilot_profile_ready", "true");
        if (onUploadSuccess) {
          onUploadSuccess("Resume Vectorized Successfully");
        }
        // সাকসেসফুলি ক্রোমাডিবি-তে জমা হলে সরাসরি জব হান্টারে রিডাইরেক্ট
        router.push('/job-hunter');
      } else {
        const rawError = data?.error || data?.detail || "Vector database synchronization failed.";
        const friendlyError = String(rawError).includes("429") || String(rawError).includes("RESOURCE_EXHAUSTED")
          ? "Gemini quota was busy. Local fallback is now enabled — please click Process Resume again."
          : rawError;
        setErrorNotification(friendlyError);
      }
    } catch (error: any) {
      console.error("Upload workflow captured an exception:", error);
      const rawError = error?.message || "Internal Server Error during data vector processing initialization.";
      const friendlyError = String(rawError).includes("429") || String(rawError).includes("RESOURCE_EXHAUSTED")
        ? "Gemini quota was busy. Local fallback is now enabled — please click Process Resume again."
        : rawError;
      setErrorNotification(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // কন্ডিশনাল রেন্ডারিং: প্রসেস করার সময় কোনো এআই এজেন্ট বা চ্যাটবট আসবে না
  // ==========================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#f8f9fa] min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mb-4"></div>
        <p className="text-slate-800 font-medium text-base text-center">
          AI Agent is compiling your skills and preparing your vector tracking pipeline...
        </p>
        <p className="text-slate-400 text-xs mt-1 text-center">Please wait.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f9fa] py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto">
        
        {/* এরর নোটিফিকেশন ব্যানার */}
        {errorNotification && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-sm transition-all">
            <span className="font-semibold">Error:</span> {errorNotification}
          </div>
        )}

        {/* মেইন আপলোডার কার্ড */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-10 shadow-sm transition-all">
          <h2 className="text-[#1E3A8A] font-semibold text-2xl tracking-tight text-center mb-2">
            Upload Your Resume to Begin
          </h2>
          <p className="text-slate-500 font-normal text-xs sm:text-sm text-center leading-relaxed mb-6 max-w-sm mx-auto">
            Our AI engine will parse your skills and experience to find high-match opportunities instantly.
          </p>

          {/* ড্রপ-জোন এরিয়া */}
          <div className="border-2 border-dashed border-slate-200 hover:border-[#1E3A8A] bg-slate-50/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all cursor-pointer group relative">
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <svg 
              className="text-slate-400 group-hover:text-[#1E3A8A] transition-colors mb-3 w-10 h-10" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-slate-700 font-medium text-sm text-center mb-0.5">
              {file ? file.name : "Drag and drop your PDF here, or click to browse"}
            </p>
            <p className="text-slate-400 text-xs text-center">Supports PDF formats up to 10MB</p>
          </div>

          {/* প্রসেস বাটন */}
          {file && (
            <button 
              onClick={handleUpload} 
              className="mt-6 bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white font-bold py-3 px-6 rounded-xl w-full shadow-sm transition-colors text-center text-sm sm:text-base"
            >
              Process Resume
            </button>
          )}

          {/* ম্যানুয়াল সিভি মেকিং লিংক */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-xs sm:text-sm">
              Don't have a resume? 
              <Link href="/cv-builder" className="text-[#1E3A8A] hover:underline font-semibold ml-1">
                Create your CV manually here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
