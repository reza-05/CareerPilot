"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Sparkles, Briefcase, ArrowRight, FolderPlus, Check, FileEdit, MapPin, DollarSign, Calendar, MessageSquareText, X, SlidersHorizontal } from "lucide-react";
import { DM_Sans } from 'next/font/google';
import AIChat, { type JobAssistantContext } from "@/components/AIChat";
import { useAuth } from "@/components/AuthProvider";
import { getJobHunterStateKey, hasProfileReady, syncCvUploadStateFromServer } from "@/lib/userSession";

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const PROFILE_REQUIRED_MESSAGE =
  "Please upload your CV or complete your profile first to receive suitable job recommendations and fit scores.";

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

type JobHunterSavedState = {
  jobs: JobResult[];
  searchQuery: string;
  statusMessage: string;
  trackingStates: { [key: string]: string };
  sortMode: SortMode;
};

type SortMode = "best-match" | "match-low" | "salary-high" | "salary-low" | "deadline-nearest";

const emptyJobHunterState: JobHunterSavedState = {
  jobs: [],
  searchQuery: "",
  statusMessage: "",
  trackingStates: {},
  sortMode: "best-match",
};

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "best-match", label: "Best match" },
  { value: "match-low", label: "Match: low to high" },
  { value: "salary-high", label: "Salary: high to low" },
  { value: "salary-low", label: "Salary: low to high" },
  { value: "deadline-nearest", label: "Deadline: nearest first" },
];

function parseSalaryValue(salary?: string) {
  if (!salary || /not specified|n\/a|negotiable/i.test(salary)) return null;
  const normalized = salary.toLowerCase().replace(/,/g, "");
  const values = Array.from(normalized.matchAll(/(?:৳|tk\.?|bdt|\$)?\s*(\d+(?:\.\d+)?)\s*(k|lakh|lac)?/gi)).map((match) => {
    const amount = Number(match[1]);
    const suffix = match[2]?.toLowerCase();
    if (!Number.isFinite(amount)) return 0;
    if (suffix === "k") return amount * 1_000;
    if (suffix === "lakh" || suffix === "lac") return amount * 100_000;
    return amount;
  });
  return values.length ? Math.max(...values) : null;
}

function getSortedJobs(jobs: JobResult[], sortMode: SortMode) {
  const sorted = [...jobs];

  return sorted.sort((a, b) => {
    if (sortMode === "match-low") {
      return (a.matchPercent ?? 0) - (b.matchPercent ?? 0);
    }
    if (sortMode === "salary-high" || sortMode === "salary-low") {
      const aSalary = parseSalaryValue(a.salaryRange);
      const bSalary = parseSalaryValue(b.salaryRange);
      if (aSalary === null && bSalary === null) return (b.matchPercent ?? 0) - (a.matchPercent ?? 0);
      if (aSalary === null) return 1;
      if (bSalary === null) return -1;
      return sortMode === "salary-high" ? bSalary - aSalary : aSalary - bSalary;
    }
    if (sortMode === "deadline-nearest") {
      const aDate = a.deadlineDate ? new Date(`${a.deadlineDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
      const bDate = b.deadlineDate ? new Date(`${b.deadlineDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
      if (aDate === bDate) return (b.matchPercent ?? 0) - (a.matchPercent ?? 0);
      return aDate - bDate;
    }
    return (b.matchPercent ?? 0) - (a.matchPercent ?? 0);
  });
}

function loadJobHunterState(userId?: string | null): JobHunterSavedState {
  if (!userId || typeof window === "undefined") return emptyJobHunterState;

  try {
    const saved = window.localStorage.getItem(getJobHunterStateKey(userId));
    if (!saved) return emptyJobHunterState;

    return {
      ...emptyJobHunterState,
      ...(JSON.parse(saved) as Partial<JobHunterSavedState>),
    };
  } catch {
    return emptyJobHunterState;
  }
}

export default function JobHunter() {
  const { user } = useAuth();
  const userId = user?.uid || "";
  const initialSavedState = loadJobHunterState(userId);
  const [jobs, setJobs] = useState<JobResult[]>(initialSavedState.jobs);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSavedState.searchQuery);
  const [profileReady, setProfileReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState(initialSavedState.statusMessage);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedAssistantJob, setSelectedAssistantJob] = useState<JobAssistantContext | null>(null);
  const [assistantPrompt, setAssistantPrompt] = useState({ text: "", version: 0 });
  const [sortMode, setSortMode] = useState<SortMode>(initialSavedState.sortMode || "best-match");
  const queryParamHandledRef = useRef(false);
  const sortedJobs = getSortedJobs(jobs, sortMode);
  
  // Clean string index signature matching tracking states safely
  const [trackingStates, setTrackingStates] = useState<{ [key: string]: string }>(initialSavedState.trackingStates);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const updateProfileAccess = async () => {
        const syncedState = hasProfileReady(user?.uid)
          ? null
          : await syncCvUploadStateFromServer(user?.uid);
        const isReady = hasProfileReady(user?.uid) || Boolean(syncedState?.uploaded);

        setProfileReady(isReady);
        setStatusMessage((current) => (isReady ? (current === PROFILE_REQUIRED_MESSAGE ? "" : current) : PROFILE_REQUIRED_MESSAGE));
      };

      void updateProfileAccess();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user?.uid]);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId) return;

    const syncTrackedJobs = async () => {
      try {
        const response = await fetch("/api/tracker", {
          headers: { "x-user-id": userId },
        });
        if (!response.ok) return;

        const trackedJobs = await response.json();
        const activeUrls = new Set(
          trackedJobs
            .map((job: { source_url?: string | null }) => job.source_url)
            .filter(Boolean)
        );

        setTrackingStates((prev) => {
          let changed = false;
          const next = { ...prev };

          Object.entries(next).forEach(([url, status]) => {
            if (status === "tracked" && !activeUrls.has(url)) {
              next[url] = "";
              changed = true;
            }
          });

          jobs.forEach((job) => {
            if (job.url && activeUrls.has(job.url) && next[job.url] !== "tracked") {
              next[job.url] = "tracked";
              changed = true;
            }
          });

          return changed ? next : prev;
        });
      } catch (error) {
        console.error("Failed to sync tracked job buttons:", error);
      }
    };

    const timer = window.setTimeout(syncTrackedJobs, 0);
    window.addEventListener("focus", syncTrackedJobs);
    window.addEventListener("pageshow", syncTrackedJobs);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", syncTrackedJobs);
      window.removeEventListener("pageshow", syncTrackedJobs);
    };
  }, [jobs, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    window.localStorage.setItem(
      getJobHunterStateKey(user.uid),
      JSON.stringify({ jobs, searchQuery, statusMessage, trackingStates, sortMode }),
    );
  }, [jobs, searchQuery, sortMode, statusMessage, trackingStates, user?.uid]);

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

  const buildJobAssistantContext = (job: JobResult, displayCompany: string): JobAssistantContext => ({
    title: job.title,
    company: displayCompany,
    location: job.location || "Remote",
    salaryRange: job.salaryRange || "Not specified",
    applicationDeadline: job.applicationDeadline || "Open until filled",
    matchPercent: job.matchPercent,
    matchReason: job.matchReason,
    url: job.url,
  });

  const openAssistantForJob = (job: JobResult, displayCompany: string, prompt?: string) => {
    const context = buildJobAssistantContext(job, displayCompany);
    setSelectedAssistantJob(context);
    setAssistantOpen(true);
    if (prompt) {
      setAssistantPrompt((current) => ({
        text: prompt,
        version: current.version + 1,
      }));
    }
  };

  // Core execution block shared by both form submissions and interactive suggestion tag clicks
  const executeSearch = useCallback(async (targetQuery: string) => {
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
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ query: targetQuery }),
      });
      let data;
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(rawText || "Search service returned an invalid response.");
      }

      if (data.results) {
        setJobs(getSortedJobs(data.results, "best-match"));
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
      setStatusMessage("Search is temporarily unavailable. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [profileReady, userId]);

  useEffect(() => {
    if (queryParamHandledRef.current || !profileReady) return;

    const queryFromUrl = new URLSearchParams(window.location.search).get("query")?.trim();
    if (!queryFromUrl) return;

    queryParamHandledRef.current = true;
    const timer = window.setTimeout(() => {
      setSearchQuery(queryFromUrl);
      void executeSearch(queryFromUrl);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [executeSearch, profileReady]);

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
          "x-user-id": user?.uid || "",
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
    <div className={`min-h-screen bg-white text-slate-800 antialiased selection:bg-[#1E3A8A]/10 selection:text-[#1E3A8A] dark:bg-slate-950 dark:text-slate-100 ${dmSans.className}`}>
      
      {/* Soft Premium Top Mesh Layer Tinted to Coordinate Ecosystem */}
      <div className="absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b from-blue-50/30 via-transparent to-transparent pointer-events-none z-0" />

      <div className="relative z-10 mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
        <header className="mb-7 text-center sm:mb-9">
          
          {/* Solid Deep Blue Hero Heading (Absolutely No Gradients) */}
          <h1 className="text-[#1E3A8A] font-semibold text-2xl sm:text-4xl md:text-5xl lg:text-5xl tracking-tight text-center mb-4 leading-tight">
            Navigate Your Next Career Transition
          </h1>
          <p className="text-slate-500 font-normal text-xs sm:text-sm md:text-base text-center max-w-2xl mx-auto leading-relaxed px-1 sm:px-4">
            Stop endless scrolling. Enter your ideal role, tech stack, or location, and let our intelligent engine surface tailored high-fit opportunities for you.
          </p>

          {!profileReady && (
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-left shadow-sm">
              <p className="text-sm font-bold text-[#1E3A8A]">Profile required before job matching</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {PROFILE_REQUIRED_MESSAGE} CareerPilot uses your profile as the source of truth before searching and ranking opportunities.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href="/cv-upload" className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#1D4ED8]">
                  Upload CV
                </Link>
                <Link href="/cv-builder" className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-center text-sm font-bold text-[#1E3A8A] hover:bg-blue-50">
                  Build Profile
                </Link>
              </div>
            </div>
          )}
          
          {/* Responsive Command Console Container */}
          <form onSubmit={huntJobs} className="mt-6 max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white border-2 border-slate-200/80 shadow-2xl shadow-slate-200/40 rounded-2xl p-2.5 transition-all focus-within:border-[#1E3A8A] focus-within:ring-4 focus-within:ring-[#1E3A8A]/5 duration-200 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50 sm:mt-7 sm:p-4">
            <div className="flex items-center gap-2 w-full px-2 sm:gap-3 sm:px-3">
              <Briefcase size={20} className="text-slate-400 shrink-0 sm:w-6 sm:h-6" />
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
                className="w-full text-sm sm:text-xl py-2 px-2 sm:px-3 text-slate-800 placeholder-slate-400 font-medium bg-transparent outline-none disabled:cursor-not-allowed disabled:text-slate-400"
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
          <div className="flex flex-wrap justify-center items-center gap-2 mt-5 sm:mt-6 max-w-2xl mx-auto px-2">
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

          {jobs.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-lg shadow-slate-200/40 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1E3A8A]">Search results</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{jobs.length} opportunities found. Sorted for your review.</p>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-blue-100 bg-[#EFF6FF] px-3 py-2 text-sm font-bold text-[#1E3A8A] shadow-inner shadow-blue-100/60">
                <SlidersHorizontal size={17} />
                <span className="hidden sm:inline">Sort</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="min-w-[180px] bg-transparent text-sm font-bold text-[#1E3A8A] outline-none"
                  aria-label="Sort job results"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {sortedJobs.map((job, i) => {
            const currentStatus = trackingStates[job.url];
            const displayCompany = job.company || getSourceName(job.url);

            return (
              <div key={i} className="group relative bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl p-4 sm:p-7 lg:p-10 mb-6 sm:mb-8 max-w-4xl mx-auto hover:border-[#1E3A8A]/40 transition-all duration-200">
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

                  <button
                    type="button"
                    onClick={() => openAssistantForJob(job, displayCompany, "Analyze this role against my CV and suggest the strongest next steps.")}
                    className="bg-white border border-blue-200 text-[#1E3A8A] hover:bg-blue-50 text-sm sm:text-base font-bold w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Image src="/brand/assist.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                    Ask AI
                  </button>

                  <button
                    type="button"
                    onClick={() => openAssistantForJob(job, displayCompany, "Draft a concise, personalized cover letter for this role.")}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm sm:text-base font-bold w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-center transition-all flex items-center justify-center gap-2"
                  >
                    <FileEdit size={16} className="text-[#1E3A8A]" />
                    Draft Cover Letter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {jobs.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setAssistantOpen(true);
            if (!selectedAssistantJob) {
              const firstJob = jobs[0];
              setSelectedAssistantJob(buildJobAssistantContext(firstJob, firstJob.company || getSourceName(firstJob.url)));
            }
          }}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center gap-2 rounded-full border border-blue-200 bg-white text-sm font-black text-[#1E3A8A] shadow-2xl shadow-blue-950/20 transition hover:-translate-y-1 hover:bg-blue-50 sm:w-auto sm:px-5"
          aria-label="Open CareerPilot Assistant"
        >
          <Image src="/brand/assist.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      )}

      {assistantOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/30 px-2 py-2 backdrop-blur-sm sm:items-center sm:justify-end sm:px-5 sm:py-5">
          <div className="flex h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.35rem] border border-blue-100 bg-white shadow-2xl shadow-slate-950/20 transition-all duration-200 sm:h-[min(88vh,820px)] sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-white px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Image src="/brand/assist.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950">Ask CareerPilot</p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {selectedAssistantJob ? `${selectedAssistantJob.title} at ${selectedAssistantJob.company}` : "Choose a job to discuss"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-[#1E3A8A]"
                aria-label="Close assistant"
              >
                <X size={18} />
              </button>
            </div>

            {selectedAssistantJob ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                <AIChat
                  compact
                  jobContext={selectedAssistantJob}
                  initialPrompt={assistantPrompt.text}
                  promptVersion={assistantPrompt.version}
                />
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1E3A8A]">
                  <MessageSquareText size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">Pick a job card and choose Ask AI.</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">CareerPilot will use that job with your saved CV profile.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
