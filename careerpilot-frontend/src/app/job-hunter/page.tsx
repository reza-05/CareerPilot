"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Briefcase, ArrowRight, FolderPlus, Check, FileEdit, MapPin, DollarSign, Calendar } from "lucide-react";
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const PROFILE_REQUIRED_MESSAGE =
  "Please upload your CV or complete your profile first to receive suitable job recommendations and fit scores.";
const PROFILE_READY_KEY = "careerpilot_profile_ready_session";

interface JobResult {
  title: string;
  url: string;
  company?: string;
  location?: string;
  salaryRange?: string;
  applicationDeadline?: string;
  deadlineDate?: string;
  matchPercent?: number;
  matchReason?: string;
}

const hasPreparedProfile = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(PROFILE_READY_KEY) === "true";
};

export default function JobHunter() {
  // Maintaining a clean empty initial state on page mount
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileReady] = useState(() => hasPreparedProfile());
  const [statusMessage, setStatusMessage] = useState(() =>
    hasPreparedProfile() ? "" : PROFILE_REQUIRED_MESSAGE
  );
  
  // Clean string index signature matching tracking states safely
  const [trackingStates, setTrackingStates] = useState<{ [key: string]: string }>({});

  const getSourceName = (url?: string) => {
    if (!url) return "Job Source";
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host
        .split(".")
        .slice(0, -1)
        .join(" ")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    } catch {
      return "Job Source";
    }
  };

  // Core execution block shared by both form submissions and interactive suggestion tag clicks
  const executeSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    if (!profileReady) {
      setJobs([]);
      setStatusMessage(PROFILE_REQUIRED_MESSAGE);
      return;
    }

    setLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery }),
      });
      const data = await res.json();
      if (data.results) {
        setJobs(data.results);
        if (data.results.length === 0) {
          setStatusMessage(data.error || "No jobs found. Try a broader search like 'Software Engineering internships in Dhaka'.");
        }
      } else {
        setJobs([]);
        setStatusMessage(data.error || "Search failed. Please try again.");
      }
    } catch (e) {
      console.error("Fetch failed", e);
      setJobs([]);
      setStatusMessage("Search failed. Please make sure the app services are running and try again.");
    } finally {
      setLoading(false);
    }
  };

  const huntJobs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeSearch(searchQuery);
  };

  const trackJobOnKanban = async (
    jobTitle: string,
    rawCompany: string,
    jobUrl: string,
    applicationDeadline?: string,
    deadlineDate?: string
  ) => {
    const companyName = rawCompany || "Target Company";
    
    setTrackingStates(prev => ({ ...prev, [jobUrl]: "saving" }));

    try {
      const response = await fetch("/api/tracker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: jobTitle,
          company: companyName,
          application_deadline: applicationDeadline || "Open until filled",
          deadline_date: deadlineDate || null,
          source_url: jobUrl,
        }),
      });

      if (response.ok) {
        setTrackingStates(prev => ({ ...prev, [jobUrl]: "tracked" }));
      } else {
        setTrackingStates(prev => ({ ...prev, [jobUrl]: "error" }));
        setTimeout(() => {
          setTrackingStates(prev => ({ ...prev, [jobUrl]: "" }));
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to sync job tracking payload:", error);
      setTrackingStates(prev => ({ ...prev, [jobUrl]: "" }));
    }
  };

  return (
    <div className={`min-h-screen bg-white text-slate-800 antialiased selection:bg-[#1E3A8A]/10 selection:text-[#1E3A8A] ${dmSans.className}`}>
      
      {/* Soft Premium Top Mesh Layer Tinted to Coordinate Ecosystem */}
      <div className="absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b from-blue-50/30 via-transparent to-transparent pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 relative z-10">
        <header className="mb-14 text-center">
          
          {/* Solid Deep Blue Hero Heading (Absolutely No Gradients) */}
          <h1 className="text-[#1E3A8A] font-semibold text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-center mb-4 leading-tight">
            Navigate Your Next Career Transition
          </h1>
          <p className="text-slate-500 font-normal text-xs sm:text-sm md:text-base text-center max-w-2xl mx-auto leading-relaxed px-4">
            Stop endless scrolling. Enter your ideal role, tech stack, or location, and let our intelligent engine surface tailored high-fit opportunities for you.
          </p>

          {!profileReady && (
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-left shadow-sm">
              <p className="text-sm font-bold text-[#1E3A8A]">Profile required before job matching</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {PROFILE_REQUIRED_MESSAGE} CareerPilot uses your profile as the source of truth before searching and ranking opportunities.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href="/" className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#1D4ED8]">
                  Upload CV
                </Link>
                <Link href="/cv-builder" className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-center text-sm font-bold text-[#1E3A8A] hover:bg-blue-50">
                  Build Profile
                </Link>
              </div>
            </div>
          )}
          
          {/* Responsive Command Console Container */}
          <form onSubmit={huntJobs} className="mt-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white border-2 border-slate-200/80 shadow-2xl shadow-slate-200/40 rounded-2xl p-2.5 sm:p-4 transition-all focus-within:border-[#1E3A8A] focus-within:ring-4 focus-within:ring-[#1E3A8A]/5 duration-200">
            <div className="flex items-center gap-3 w-full px-3">
              <Briefcase size={22} className="text-slate-400 shrink-0 sm:w-6 sm:h-6" />
              <input 
                type="text"
                required
                disabled={!profileReady}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  profileReady
                    ? "e.g., Find me ML internships in Dhaka open this month"
                    : "Upload your CV first to unlock personalized job search"
                }
                className="w-full text-base sm:text-xl py-2 px-3 text-slate-800 placeholder-slate-400 font-medium bg-transparent outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading || !searchQuery.trim() || !profileReady}
              className="bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm sm:text-lg font-bold px-5 sm:px-8 py-3 sm:py-4 rounded-xl shadow-md transition-all text-center w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 active:scale-[0.99] disabled:bg-slate-100 disabled:text-slate-400"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Search Opportunities"}
            </button>
          </form>

          {/* Interactive Minimalist Blue Suggestion Pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6 sm:mt-8 max-w-2xl mx-auto px-2">
            {[
              { label: "Govt. job", query: "Government circular jobs in Bangladesh" },
              { label: "Internship", query: "Software Engineering internships in Dhaka" },
              { label: "Remote", query: "Remote developer jobs open to Bangladesh" },
              { label: "Fresher", query: "Entry level software engineer jobs for freshers" },
              { label: "In Dhaka", query: "Tech and developer jobs in Dhaka" }
            ].map((pill, index) => (
              <button
                key={index}
                type="button"
                disabled={!profileReady}
                onClick={() => {
                  setSearchQuery(pill.query);
                  executeSearch(pill.query);
                }}
                className="bg-[#EFF6FF] border border-[#BFDBFE]/50 text-[#1E3A8A] font-semibold text-xs rounded-lg px-4 py-1.5 hover:bg-[#DBEAFE] transition-all shadow-sm cursor-pointer active:scale-95 select-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </header>

        {/* Shades Of Blue Component Ecosystem (Job Cards) */}
        <div className="space-y-6 sm:space-y-8">
          {statusMessage && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-[#1E3A8A]">
              {statusMessage}
            </div>
          )}

          {jobs.map((job, i) => {
            const currentStatus = trackingStates[job.url];
            const displayCompany = job.company || getSourceName(job.url);
            const coverLetterPrompt = encodeURIComponent(`Draft a personalized cover letter for this ${job.title} role at ${displayCompany} grounded in my CV.`);
            const chatRedirectUrl = `/assistant?prompt=${coverLetterPrompt}`;

            return (
              <div key={i} className="group relative bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl p-5 sm:p-10 mb-6 sm:mb-8 max-w-4xl mx-auto hover:border-[#1E3A8A]/40 transition-all duration-200">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
                  <div className="space-y-4 sm:space-y-5 w-full">
                    <div>
                      <h3 className="text-slate-900 font-bold text-xl sm:text-2xl tracking-tight mb-2 leading-snug group-hover:text-[#1E3A8A] transition-colors duration-150">
                        {job.title}
                      </h3>
                      <p className="text-sm sm:text-base font-semibold text-slate-500">
                        {displayCompany}
                      </p>
                    </div>

                    {/* Meta Info Indicators - Soft Blue Tint Chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE]/60 rounded-xl text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#1E3A8A]/70" />
                        {job.location || "Remote"}
                      </span>
                      <span className="bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE]/60 rounded-xl text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-[#1E3A8A]/70" />
                        {job.salaryRange || "Not Specified"}
                      </span>
                      <span className="bg-[#EFF6FF] text-[#1E3A8A] border border-[#BFDBFE]/60 rounded-xl text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#1E3A8A]/70" />
                        Deadline: {job.applicationDeadline || "Open"}
                      </span>
                    </div>
                    
                    {/* The AI Reasoning Insight Dossier Container */}
                    {job.matchReason && (
                      <div className="bg-[#F8FAFC] border-l-4 border-l-[#1E3A8A] border-y-slate-200/50 border-r-slate-200/50 rounded-r-xl rounded-l-sm p-4 sm:p-6 mt-4 sm:mt-6 text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
                        <p className="text-xs font-bold text-[#1E3A8A] tracking-wider uppercase mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#1E3A8A]" />
                          Why This Matches Your Profile
                        </p>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                          {job.matchReason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Performance Alignment Metric Block */}
                  <div className="self-start md:self-start shrink-0 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 sm:px-5 sm:py-4 min-w-[5.5rem] sm:min-w-[6rem] flex flex-col items-center justify-center shadow-inner mt-2 md:mt-0">
                    <div className="text-2xl sm:text-3xl font-bold text-[#1E3A8A] tracking-tight">
                      {job.matchPercent ?? 0}%
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Match Index</div>
                  </div>
                </div>
                
                {/* Primary Responsive Action Calls Stack Grid */}
                <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-6 pt-4 border-t border-slate-100">
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-sm sm:text-base font-bold w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
                  >
                    Apply Now <ArrowRight size={16} />
                  </a>

                  <button
                    disabled={currentStatus === "saving" || currentStatus === "tracked"}
                    onClick={() =>
                      trackJobOnKanban(
                        job.title,
                        displayCompany,
                        job.url,
                        job.applicationDeadline,
                        job.deadlineDate
                      )
                    }
                    className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl text-center border transition-all flex items-center justify-center gap-2 ${
                      currentStatus === "tracked"
                        ? "bg-blue-50 text-blue-700 border-blue-200/60 cursor-not-allowed"
                        : currentStatus === "saving"
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-wait"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    }`}
                  >
                    {currentStatus === "saving" && (
                      <>
                        <Loader2 className="animate-spin text-slate-400" size={16} />
                        Tracking...
                      </>
                    )}
                    {currentStatus === "tracked" && (
                      <>
                        <Check className="text-blue-600" size={16} />
                        Tracked
                      </>
                    )}
                    {(currentStatus === "" || !currentStatus || currentStatus === "error") && (
                      <>
                        <FolderPlus size={16} className="text-slate-400" />
                        {currentStatus === "error" ? "Retry Tracking" : "Track Job"}
                      </>
                    )}
                  </button>

                  <a
                    href={chatRedirectUrl}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm sm:text-base font-bold w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-center transition-all flex items-center justify-center gap-2"
                  >
                    <FileEdit size={16} className="text-[#1E3A8A]" />
                    Draft Cover Letter
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
