"use client";
import { useState } from "react";
import { Loader2, Sparkles, Briefcase, ArrowRight, FolderPlus, Check, FileEdit, MapPin, DollarSign, Calendar } from "lucide-react";

export default function JobHunter() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Clean string index signature matching tracking states safely
  const [trackingStates, setTrackingStates] = useState<{ [key: string]: string }>({});

  const huntJobs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Pointed explicitly to localhost to align with local development CORS architectures
      const res = await fetch("http://localhost:8000/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (data.results) setJobs(data.results);
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-16 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs tracking-widest uppercase">
            <Sparkles size={12} className="text-yellow-500" />
            AI Career Intelligence
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
            Your Next Career Move
          </h1>
          
          {/* Dynamic Natural Language Search Input Form Block */}
          <form onSubmit={huntJobs} className="mt-10 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3 bg-neutral-900/60 p-2 rounded-2xl border border-neutral-800 focus-within:border-neutral-700 transition-all duration-300">
            <input 
              type="text"
              required
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Find me ML internships in Dhaka open this month"
              className="w-full bg-transparent px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 outline-none"
            />
            <button 
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Briefcase size={16} /> Search</>}
            </button>
          </form>
        </header>

        <div className="space-y-4">
          {jobs.map((job, i) => {
            const currentStatus = trackingStates[job.url];
            const displayCompany = job.company || "Verified Employer Portfolio";
            
            // Build absolute redirection URI query containing target task context for our AI chat interface page
            const coverLetterPrompt = encodeURIComponent(`Draft a personalized cover letter for this ${job.title} role at ${displayCompany} grounded in my CV.`);
            const chatRedirectUrl = `/?prompt=${coverLetterPrompt}`;

            return (
              <div key={i} className="group relative bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl hover:border-neutral-700 transition-all duration-300">
                <div className="flex justify-between items-start gap-6">
                  <div className="space-y-3 w-full">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-100 group-hover:text-white transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-neutral-400 mt-0.5">
                        {displayCompany}
                      </p>
                    </div>

                    {/* Premium Metadata Badges Stack Section */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400">
                        <MapPin size={12} className="text-neutral-500" />
                        {job.location || "Remote"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400">
                        <DollarSign size={12} className="text-neutral-500" />
                        {job.salaryRange || "Not Specified"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400">
                        <Calendar size={12} className="text-neutral-500" />
                        Deadline: {job.applicationDeadline || "Open"}
                      </span>
                    </div>
                    
                    {/* Premium AI Insight Box Block */}
                    {job.matchReason && (
                      <div className="mt-3 bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-xl max-w-2xl">
                        <p className="text-xs font-semibold text-indigo-400 tracking-wide uppercase mb-1">
                          Why This Matches Your Profile (Reasoning):
                        </p>
                        <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                          {job.matchReason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-4xl font-black text-emerald-400 tracking-tighter">
                      {job.matchScore ? (job.matchScore * 100).toFixed(0) : "75"}%
                    </div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Match</div>
                  </div>
                </div>
                
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors shadow-lg"
                  >
                    Apply Now <ArrowRight size={18} />
                  </a>

                  <button
                    disabled={currentStatus === "saving" || currentStatus === "tracked"}
                    onClick={() => trackJobOnKanban(job.title, displayCompany, job.url)}
                    className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border transition-all duration-300 ${
                      currentStatus === "tracked"
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-400 cursor-not-allowed"
                        : currentStatus === "saving"
                        ? "bg-neutral-900 border-neutral-700 text-neutral-400 cursor-wait"
                        : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-emerald-500/50 hover:bg-neutral-900 shadow-[0_0_15px_rgba(16,185,129,0.02)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    }`}
                  >
                    {currentStatus === "saving" && (
                      <>
                        <Loader2 className="animate-spin text-neutral-400" size={18} />
                        Tracking...
                      </>
                    )}
                    {currentStatus === "tracked" && (
                      <>
                        <Check className="text-emerald-400" size={18} />
                        Tracked ✓
                      </>
                    )}
                    {(currentStatus === "" || !currentStatus || currentStatus === "error") && (
                      <>
                        <FolderPlus size={18} className="text-neutral-400" />
                        {currentStatus === "error" ? "Try Again" : "Track Job"}
                      </>
                    )}
                  </button>

                  {/* Premium 'Draft Cover Letter' actionable redirection link item */}
                  <a
                    href={chatRedirectUrl}
                    className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-indigo-500/50 hover:bg-neutral-900 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.02)] hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                  >
                    <FileEdit size={16} className="text-indigo-400" />
                    Draft Cover Letter 📝
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