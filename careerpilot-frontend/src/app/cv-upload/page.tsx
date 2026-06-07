"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DM_Sans } from 'next/font/google';
import { ArrowRight, CheckCircle2, Clock3, CloudUpload, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { buildAuthHeaders } from '@/lib/authHeaders';
import { loadCvUploadState, markCvUploaded, syncCvUploadStateFromServer } from '@/lib/userSession';
import { loadCareerProfile, normalizeSkillList, saveCareerProfile } from '@/lib/profileData';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

interface CVUploaderProps {
  onUploadSuccess?: (msg: string) => void;
}

export default function CVUploader({ onUploadSuccess }: CVUploaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [cvState, setCvState] = useState(() => loadCvUploadState(user?.uid));
  const hasSavedResume = Boolean(cvState.uploaded);
  const savedTimestamp = cvState.updatedAt
    ? new Date(Number.isNaN(Number(cvState.updatedAt)) ? cvState.updatedAt : Number(cvState.updatedAt) * 1000).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Recently saved";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCvState(loadCvUploadState(user?.uid));
      if (user?.uid) {
        void syncCvUploadStateFromServer(user.uid, user).then((syncedState) => {
          if (!syncedState.uploaded) return;

          setCvState(syncedState);
          const syncedSkills = normalizeSkillList(syncedState.skills);
          if (syncedSkills.length > 0) {
            const profile = loadCareerProfile(user.uid, user);
            const existingSkills = normalizeSkillList(profile.skills);
            if (existingSkills.join("|") !== syncedSkills.join("|")) {
              saveCareerProfile(user.uid, {
                ...profile,
                skills: syncedSkills.join(", "),
              });
            }
          }
        });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorNotification(null); // নতুন ফাইল সিলেক্ট করলে আগের এরর রিমুভ হবে
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!user?.uid) {
      setErrorNotification("Please sign in before uploading your resume.");
      return;
    }
    setLoading(true);
    setErrorNotification(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // পয়েন্ট করছি আমাদের সুরক্ষিত নেক্সটজেএস প্রক্সি এপিআই রুটে
      const response = await fetch('/api/cv-processor', {
        method: 'POST',
        headers: await buildAuthHeaders(user),
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
        const detectedSkills = normalizeSkillList(data.skills);
        const profile = loadCareerProfile(user.uid, user);
        saveCareerProfile(user.uid, {
          ...profile,
          skills: detectedSkills.join(", "),
        });
        markCvUploaded(user.uid, file.name, detectedSkills);
        setCvState(loadCvUploadState(user.uid));
        if (onUploadSuccess) {
          onUploadSuccess("Resume saved successfully");
        }
        // সাকসেসফুলি ক্রোমাডিবি-তে জমা হলে সরাসরি জব হান্টারে রিডাইরেক্ট
        router.push('/job-hunter');
      } else {
        const rawError = data?.error || data?.detail || "We could not prepare your resume right now.";
        const friendlyError = String(rawError).includes("429") || String(rawError).includes("RESOURCE_EXHAUSTED")
          ? "The profile service is currently busy. Please click Process Resume again in a moment."
          : rawError;
        setErrorNotification(friendlyError);
      }
    } catch (error: unknown) {
      console.error("Upload workflow captured an exception:", error);
      const rawError = error instanceof Error ? error.message : "We could not prepare your resume right now.";
      const friendlyError = String(rawError).includes("429") || String(rawError).includes("RESOURCE_EXHAUSTED")
        ? "The profile service is currently busy. Please click Process Resume again in a moment."
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
      <div className="flex min-h-[320px] flex-col items-center justify-center bg-[#f8f9fa] px-4 py-10 dark:bg-slate-950 sm:py-12">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-100/70">
          <Loader2 className="h-6 w-6 animate-spin text-[#1E3A8A]" />
        </div>
        <p className="text-center text-base font-bold text-slate-800">
          Preparing your personalized career profile...
        </p>
        <p className="mt-1 text-center text-xs font-medium text-slate-400">This should only take a moment.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-4rem)] w-full bg-[#f8f9fa] px-4 py-4 dark:bg-slate-950 sm:px-6 sm:py-6 md:py-8 ${dmSans.className}`}>
      <div className="mx-auto max-w-2xl">
        
        {/* এরর নোটিফিকেশন ব্যানার */}
        {errorNotification && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm transition-all duration-200">
            <span className="font-semibold">Error:</span> {errorNotification}
          </div>
        )}

        {/* মেইন আপলোডার কার্ড */}
        <div className="group rounded-[28px] border border-blue-100/80 bg-white p-6 shadow-xl shadow-blue-100/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-100/70 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50 sm:p-8 md:p-10">
          <div className="mx-auto max-w-xl text-center">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#1E3A8A]">
              CareerPilot CV Workspace
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {hasSavedResume ? "Your Resume Is Ready" : "Upload Your Resume"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
              {hasSavedResume
                ? "Your saved CV stays connected to job matching, assistant guidance, and application tracking."
                : "Add a PDF resume once and CareerPilot will prepare your personalized job workspace."}
            </p>
          </div>

          {hasSavedResume && (
            <div className="mt-8 animate-in fade-in duration-200 rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4 shadow-sm shadow-blue-100/60 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#1E3A8A] shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1E3A8A]">Saved CV</p>
                      <p className="mt-1 truncate text-sm font-black text-slate-900 sm:text-base">
                        {cvState.fileName || "Your saved resume"}
                      </p>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-black text-[#1E3A8A]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-[#1E3A8A]" />
                      {savedTimestamp}
                    </span>
                    {cvState.skills.length > 0 && (
                      <span>{cvState.skills.length} skills detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ড্রপ-জোন এরিয়া */}
          <div className="group/drop relative mt-8 flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-blue-100 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1E3A8A] hover:bg-[#F8FBFF] sm:min-h-[240px] sm:p-10">
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange} 
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" 
            />
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-[#F8FBFF] text-[#1E3A8A] shadow-sm transition-all duration-200 group-hover/drop:bg-white group-hover/drop:shadow-md">
              <CloudUpload className="h-7 w-7" />
            </div>
            <p className="mb-1 max-w-sm text-center text-base font-black text-slate-900">
              {file
                ? file.name
                : hasSavedResume
                  ? "Upload a New PDF to Replace Your Saved CV"
                  : "Drop your PDF here, or click to browse"}
            </p>
            <p className="text-center text-sm font-medium text-slate-500">
              PDF only. Recommended file size up to 10MB.
            </p>
          </div>

          {/* প্রসেস বাটন */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {file && (
              <button 
                onClick={handleUpload} 
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 text-center text-sm font-black text-white shadow-lg shadow-blue-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
              >
                {hasSavedResume ? "Replace Saved Resume" : "Process Resume"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {hasSavedResume && !file && (
              <Link
                href="/job-hunter"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 text-center text-sm font-black text-white shadow-lg shadow-blue-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8]"
              >
                Continue to Job Search
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {hasSavedResume && (
              <Link
                href="/cv-builder"
                className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 text-center text-sm font-black text-[#1E3A8A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Edit Profile Manually
              </Link>
            )}
          </div>

          {/* ম্যানুয়াল সিভি মেকিং লিংক */}
          {!hasSavedResume && (
            <div className="mt-8 border-t border-blue-50 pt-5 text-center">
              <p className="text-sm font-medium text-slate-500">
                Don&apos;t have a resume?
                <Link href="/cv-builder" className="ml-1 font-black text-[#1E3A8A] transition-colors duration-200 hover:text-[#1D4ED8] hover:underline">
                  Create your CV manually
                </Link>
              </p>
            </div>
          )}

          {hasSavedResume && file && (
            <div className="mt-5 text-center">
              <Link href="/cv-builder" className="text-[#1E3A8A] hover:underline font-semibold ml-1">
                Update profile manually instead
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
