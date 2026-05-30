"use client";
import { useState } from "react";
import { Loader2, Sparkles, Briefcase, ArrowRight, FolderPlus, Check, FileEdit, MapPin, DollarSign, Calendar } from "lucide-react";
import { Kanit } from 'next/font/google';

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export default function JobHunter() {
  // Clean Empty State On Load - Initial state of the job results array is empty
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Clean string index signature matching tracking states safely
  const [trackingStates, setTrackingStates] = useState<{ [key: string]: string }>({});

  // Core execution block shared by both form submissions and interactive suggestion tag clicks
  const executeSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetQuery }),
      });
      const data = await res.json();
      if (data.results) setJobs(data.results);
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const huntJobs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeSearch(searchQuery);
  };

  const trackJobOnKanban = async (jobTitle: string, rawCompany: string, jobUrl: string) => {
    const companyName = rawCompany || "Target Company";
    
    setTrackingStates(prev => ({ ...prev, [jobUrl]: "saving" }));

    try {
      const response = await fetch("http://localhost:8000/api/tracker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: jobTitle,
          company: companyName,
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
    <div className={`min-h-screen bg-[#f8f9fa] text-slate-800 antialiased selection:bg-[#0D9488]/10 selection:text-[#0F766E] ${kanit.className}`}>
      
      {/* Soft Premium Top Gradient Mesh Layer */}
      <div className="absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b from-teal-50/20 via-transparent to-transparent pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 relative z-10">
        <header className="mb-14 text-center">
          
          {/* 5. THE GRADIENT HEADING RESPONSIVE SIZE */}
          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-teal-900 to-teal-700 font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-center mb-4 sm:mb-5 leading-tight">
            Navigate Your Next Career Transition
          </h1>
          <p className="text-slate-500 font-normal text-xs sm:text-sm md:text-base text-center max-w-2xl mx-auto leading-relaxed px-4">
            Stop endless scrolling. Enter your ideal role, tech stack, or location, and let our intelligent engine surface tailored high-fit opportunities for you.
          </p>
          
          {/* 1. DYNAMIC SEARCH CONSOLE (Mobile & Desktop Balance) */}
          <form onSubmit={huntJobs} className="mt-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-2xl p-2.5 sm:p-4 transition-all focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/5 duration-200">
            <div className="flex items-center gap-3 w-full px-3">
              <Briefcase size={22} className="text-slate-400 shrink-0 sm:w-6 sm:h-6" />
              <input 
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Find me ML internships in Dhaka open this month"
                className="w-full text-base sm:text-xl py-2 px-3 text-slate-800 placeholder-slate-400 font-medium bg-transparent outline-none"
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm sm:text-lg font-bold px-5 sm:px-8 py-3 sm:py-4 rounded-xl shadow-md transition-all text-center shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 active:scale-[0.99] disabled:bg-slate-100 disabled:text-slate-400"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Search Opportunities"}
            </button>
          </form>

          {/* Interactive Minimalist Teal Suggestion Pills */}
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
                onClick={() => {
                  setSearchQuery(pill.query);
                  executeSearch(pill.query);
                }}
                className="bg-teal-50 border border-teal-100/70 text-teal-800 font-medium text-xs rounded-lg px-4 py-1.5 hover:bg-teal-100 transition-all shadow-sm cursor-pointer active:scale-95 select-none"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </header>

        {/* 2. MASSIVE YET DYNAMIC JOB CARDS (Post-Search Display) */}
        <div className="space-y-6 sm:space-y-8">
          {jobs.map((job, i) => {
            const currentStatus = trackingStates[job.url];
            const displayCompany = job.company || "Verified Employer Portfolio";
            const coverLetterPrompt = encodeURIComponent(`Draft a personalized cover letter for this ${job.title} role at ${displayCompany} grounded in my CV.`);
            const chatRedirectUrl = `/?prompt=${coverLetterPrompt}`;

            return (
              <div key={i} className="group relative bg-white border border-slate-100 shadow-lg shadow-slate-200/40 rounded-2xl p-5 sm:p-10 mb-6 sm:mb-8 max-w-4xl mx-auto hover:border-teal-500/30 transition-all duration-200">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
                  <div className="space-y-4 sm:space-y-5 w-full">
                    <div>
                      <h3 className="text-slate-900 font-black text-xl sm:text-3xl tracking-tight mb-2 sm:mb-3 leading-snug group-hover:text-[#0D9488] transition-colors duration-150">
                        {job.title}
                      </h3>
                      <p className="text-sm sm:text-base font-bold text-slate-500">
                        {displayCompany}
                      </p>
                    </div>

                    {/* Meta Info Chips Wrapper & Individual Chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-[#F0FDF4] text-[#065F46] border border-[#BBF7D0] rounded-xl text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#0D9488]" />
                        {job.location || "Remote"}
                      </span>
                      <span className="bg-[#F0FDF4] text-[#065F46] border border-[#BBF7D0] rounded-xl text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-[#0D9488]" />
                        {job.salaryRange || "Not Specified"}
                      </span>
                      <span className="bg-[#F0FDF4] text-[#065F46] border border-[#BBF7D0] rounded-xl text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#0D9488]" />
                        Deadline: {job.applicationDeadline || "Open"}
                      </span>
                    </div>
                    
                    {/* 3. RESPONSIVE AI DOSSIER BOX (Reasoning Text) */}
                    {job.matchReason && (
                      <div className="bg-[#F0FDF4] border-l-4 border-l-[#0D9488] border-y-slate-100 border-r-slate-100 rounded-r-xl rounded-l-sm p-4 sm:p-6 mt-4 sm:mt-6 text-slate-700 text-sm sm:text-base font-semibold leading-relaxed shadow-sm">
                        <p className="text-xs font-bold text-[#0D9488] tracking-wider uppercase mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#0D9488]" />
                          Why This Matches Your Profile
                        </p>
                        <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                          {job.matchReason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Performance Alignment Metric Block */}
                  <div className="self-start md:self-start shrink-0 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 sm:px-5 sm:py-4 min-w-[5.5rem] sm:min-w-[6rem] flex flex-col items-center justify-center shadow-inner mt-2 md:mt-0">
                    <div className="text-2xl sm:text-3xl font-black text-[#0D9488] tracking-tight">
                      {job.matchScore ? (job.matchScore * 100).toFixed(0) : "75"}%
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Match Index</div>
                  </div>
                </div>
                
                {/* 4. CARD LOWER BUTTONS & ACTIONS CONTAINER */}
                <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-6 pt-4 border-t border-slate-100">
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl text-center bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    Apply Now <ArrowRight size={16} />
                  </a>

                  <button
                    disabled={currentStatus === "saving" || currentStatus === "tracked"}
                    onClick={() => trackJobOnKanban(job.title, displayCompany, job.url)}
                    className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl text-center border transition-colors duration-200 flex items-center justify-center gap-2 ${
                      currentStatus === "tracked"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 cursor-not-allowed"
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
                        <Check className="text-emerald-600" size={16} />
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
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl text-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
                  >
                    <FileEdit size={16} className="text-[#0D9488]" />
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