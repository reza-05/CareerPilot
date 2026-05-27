"use client";
import { useState } from "react";
import { Loader2, Sparkles, Briefcase, ArrowRight } from "lucide-react";

export default function JobHunter() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const huntJobs = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const res = await fetch("http://127.0.0.1:8000/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Software Engineer" }),
      });
      const data = await res.json();
      if (data.results) setJobs(data.results);
    } catch (e) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
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
          <button 
            onClick={huntJobs} 
            className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 mx-auto"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Briefcase size={20} /> Find Opportunities</>}
          </button>
        </header>

        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="group relative bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl hover:border-neutral-700 transition-all duration-300">
              <div className="flex justify-between items-center gap-6">
                <h3 className="text-xl font-semibold text-neutral-100 group-hover:text-white transition-colors">
                  {job.title}
                </h3>
                <div className="text-right">
                  <div className="text-4xl font-black text-emerald-400 tracking-tighter">
                    {(job.matchScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Match</div>
                </div>
              </div>
              
              <div className="mt-8">
                <a href={job.url} target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors shadow-lg">
                  Apply Now <ArrowRight size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}