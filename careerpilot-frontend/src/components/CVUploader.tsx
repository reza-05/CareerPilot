"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { loadCvUploadState, markCvUploaded, syncCvUploadStateFromServer } from '@/lib/userSession';
import { loadCareerProfile, normalizeSkillList, saveCareerProfile } from '@/lib/profileData';

// Explicit interface to fix the "IntrinsicAttributes" error in page.tsx
interface CVUploaderProps {
  onUploadSuccess: (msg: string) => void;
}

export default function CVUploader({ onUploadSuccess }: CVUploaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [cvState, setCvState] = useState(() => loadCvUploadState(user?.uid));
  const hasSavedResume = Boolean(cvState.uploaded);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCvState(loadCvUploadState(user?.uid));
      if (user?.uid) {
        void syncCvUploadStateFromServer(user.uid).then((syncedState) => {
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
      setErrorNotification(null);
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
      const response = await fetch('/api/cv-processor', {
        method: 'POST',
        headers: { 'x-user-id': user.uid },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        const detectedSkills = normalizeSkillList(data.skills);
        const profile = loadCareerProfile(user.uid, user);
        saveCareerProfile(user.uid, {
          ...profile,
          skills: detectedSkills.join(", "),
        });
        markCvUploaded(user.uid, file.name, detectedSkills);
        setCvState(loadCvUploadState(user.uid));
        onUploadSuccess("Resume saved successfully");
        router.push('/job-hunter');
      } else {
        setErrorNotification(data?.detail || "We could not prepare your resume right now. Please try again.");
      }
    } catch {
      setErrorNotification("We could not prepare your resume right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#f8f9fa] min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mb-4"></div>
        <p className="text-slate-800 font-medium text-base text-center">
          Preparing your personalized career profile...
        </p>
        <p className="text-slate-400 text-xs mt-1 text-center">This should only take a moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f9fa] py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto">
        {errorNotification && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-sm">
            <span className="font-semibold">Error:</span> {errorNotification}
          </div>
        )}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-10 shadow-sm">
          <h2 className="text-[#1E3A8A] font-semibold text-2xl tracking-tight text-center mb-2">
            {hasSavedResume ? "Your Resume Is Ready" : "Upload Your Resume"}
          </h2>
          {hasSavedResume && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-bold text-[#1E3A8A]">Saved CV active.</span> Upload a new PDF when you want to replace it.
            </div>
          )}
          <div className="border-2 border-dashed border-slate-200 hover:border-[#1E3A8A] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer relative">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            <p className="text-slate-700 font-medium text-sm">
              {file ? file.name : hasSavedResume ? "Upload a new PDF to replace your saved CV" : "Drag and drop PDF here"}
            </p>
          </div>
          {file && (
            <button onClick={handleUpload} className="mt-6 bg-[#1E3A8A] text-white font-bold py-3 px-6 rounded-xl w-full">
              {hasSavedResume ? "Replace Saved Resume" : "Process Resume"}
            </button>
          )}
          {hasSavedResume && !file && (
            <Link href="/job-hunter" className="mt-6 block rounded-xl bg-[#1E3A8A] px-6 py-3 text-center text-sm font-bold text-white">
              Continue to Job Search
            </Link>
          )}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <Link href="/cv-builder" className="text-[#1E3A8A] hover:underline font-semibold text-sm">
              {hasSavedResume ? "Update Profile Manually" : "Create CV Manually"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
