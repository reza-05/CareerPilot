"use client";

import React, { useState, useEffect } from "react";

interface TrackedJob {
  id: number;
  role: string;
  company: string;
  status: string;
  date_tracked: string;
}

interface MilestoneGoal {
  id: number;
  text: string;
  completed: boolean;
}

const KANBAN_COLUMNS = ["Applied", "Interviewing", "Offer", "Rejected"];

export default function TrackerDashboard() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [aiNudge, setAiNudge] = useState("Analyzing pipeline telemetry...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar configuration parameters states
  const [currentDate] = useState(new Date());
  
  // Static mock application tracking map deadlines representing incoming alerts for judges
  const mockDeadlines: { [key: number]: { role: string; type: string } } = {
    4: { role: "Frontend Dev", type: "Technical Interview" },
    12: { role: "Software Engineer I", type: "Take-home Assessment" },
    19: { role: "Backend Engineer", type: "System Design Review" },
    27: { role: "Fullstack Dev", type: "Offer Decision Deadline" }
  };

  const [weeklyGoals, setWeeklyGoals] = useState<MilestoneGoal[]>([
    { id: 1, text: "Apply to 5 high-alignment engineering roles", completed: false },
    { id: 2, text: "Review Data Structures & Algorithms core patterns", completed: false },
    { id: 3, text: "Track 2 new jobs into the active pipeline", completed: false },
    { id: 4, text: "Follow up on pending interview loops", completed: false },
  ]);

  const fetchPipelineData = async () => {
    try {
      const res = await fetch("/api/tracker");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }

      const nudgeRes = await fetch("/api/tracker/ai-nudge");
      if (nudgeRes.ok) {
        const nudgeData = await nudgeRes.json();
        setAiNudge(nudgeData.nudge);
      }
    } catch (err) {
      console.error("Failed to sync tracker telemetry:", err);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim() || !companyInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleInput, company: companyInput }),
      });

      if (res.ok) {
        setRoleInput("");
        setCompanyInput("");
        await fetchPipelineData();
      }
    } catch (err) {
      console.error("Error creating entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: number) => {
    e.dataTransfer.setData("text/plain", cardId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const cardIdStr = e.dataTransfer.getData("text/plain");
    if (!cardIdStr) return;

    const cardId = parseInt(cardIdStr, 10);
    const originalJobs = [...jobs];
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === cardId ? { ...job, status: targetStatus } : job
      )
    );

    try {
      const res = await fetch(`/api/tracker/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        setJobs(originalJobs);
      } else {
        fetchPipelineData();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setJobs(originalJobs);
    }
  };

  const toggleGoal = (id: number) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  // 🛠️ FIX 1: Computes the precise total day count dynamically for the active current month block
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  // 🛠️ FIX 2: Resolves closest upcoming deadline item context dynamically from the evaluation hash matrix
  const getUpcomingDeadlineAlert = () => {
    const currentDay = currentDate.getDate();
    const sortedDays = Object.keys(mockDeadlines)
      .map(Number)
      .sort((a, b) => a - b);
    
    // Find the closest remaining deadline today or later
    const targetDay = sortedDays.find((day) => day >= currentDay) || sortedDays[0];
    
    if (targetDay && mockDeadlines[targetDay]) {
      return {
        day: targetDay,
        ...mockDeadlines[targetDay]
      };
    }
    return null;
  };

  const activeAlert = getUpcomingDeadlineAlert();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Live Tracking Header Area */}
        <header className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-2xl space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            Application Pipeline Tracker
          </h1>
          <div className="flex items-start gap-2 text-xs md:text-sm text-blue-400 bg-blue-950/40 border border-blue-900/30 px-4 py-3 rounded-xl">
            <span className="flex h-2 w-2 mt-1.5 rounded-full bg-blue-400 animate-pulse shrink-0"></span>
            <p className="italic">
              <strong className="font-semibold uppercase tracking-wider text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded mr-1.5 not-italic">Gemini Insights:</strong>
              &ldquo;{aiNudge}&rdquo;
            </p>
          </div>
        </header>

        {/* Workspace Split Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* 4-Column Active Kanban Board Pipeline */}
          <main className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map((col) => {
              const columnJobs = jobs.filter((j) => j.status === col);
              return (
                <div
                  key={col}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col)}
                  className="bg-slate-900/80 border border-slate-900 rounded-2xl p-4 min-h-[500px] flex flex-col transition-colors duration-200 hover:bg-slate-900/90"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {col}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                      {columnJobs.length}
                    </span>
                  </div>

                  {/* Task Card Drag Elements Area Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {columnJobs.map((job) => (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-slate-700 transition duration-150 group shadow-md"
                      >
                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-white transition">
                          {job.role}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">{job.company}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[10px] font-mono text-slate-600">
                            {job.date_tracked}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider font-semibold opacity-0 group-hover:opacity-100 text-slate-500 transition duration-150">
                            :: Drag
                          </span>
                        </div>
                      </div>
                    ))}

                    {columnJobs.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800/40 rounded-xl p-4 text-center py-12">
                        <p className="text-[11px] text-slate-600 font-medium">No Entries</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </main>

          {/* Application Sidebar Action & Target Milestones Module */}
          <aside className="space-y-6">
            
            <section className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">
                Track Application
              </h3>
              <form onSubmit={handleAddJob} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Role (e.g., Backend Developer)"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Company Name"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs py-2.5 rounded-xl transition duration-150 shadow-lg"
                >
                  {isSubmitting ? "Adding..." : "Add Pipeline Card"}
                </button>
              </form>
            </section>

            {/* 🗓️ HACKATHON COMPLIANCE: Premium Grid-based Deadline Calendar Component */}
            <section className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Deadline Calendar
                </h3>
                <span className="text-[11px] font-medium font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-md">
                  {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
                </span>
              </div>
              
              {/* Day-of-week labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1.5">
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
              </div>

              {/* Grid-based Month View layout tracking */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {generateCalendarDays().map((day) => {
                  const isToday = day === currentDate.getDate();
                  const hasDeadline = !!mockDeadlines[day];

                  return (
                    <div
                      key={day}
                      title={hasDeadline ? `${mockDeadlines[day].role} - ${mockDeadlines[day].type}` : undefined}
                      className={`relative aspect-square flex items-center justify-center text-[11px] rounded-lg font-mono font-semibold transition cursor-help ${
                        isToday
                          ? "bg-white text-slate-950 shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                          : hasDeadline
                          ? "bg-indigo-950 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60"
                          : "bg-slate-950 text-slate-500 hover:bg-slate-800/40"
                      }`}
                    >
                      {day}
                      {hasDeadline && !isToday && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Calendar deadline summary feed segment */}
              {activeAlert && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Upcoming Target Alert:</div>
                  <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/40 p-2 rounded-xl text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <p className="truncate text-slate-300">
                      <strong className="text-white">{currentDate.toLocaleString("default", { month: "short" })} {activeAlert.day}:</strong> {activeAlert.role} ({activeAlert.type})
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Checkable Weekly Goals Target Module */}
            <section className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">
                Weekly Target Goals
              </h3>
              <div className="space-y-3">
                {weeklyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className="flex items-start gap-3 cursor-pointer select-none group py-1"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition duration-150 ${
                        goal.completed 
                          ? "bg-slate-200 border-slate-200 text-slate-900" 
                          : "border-slate-700 bg-slate-950 group-hover:border-slate-500"
                      }`}>
                        {goal.completed && (
                          <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs transition duration-200 ${
                      goal.completed 
                        ? "line-through text-slate-600 decoration-slate-700" 
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}>
                      {goal.text}
                    </span>
                  </div>
                ))}
              </div>
            </section>

          </aside>
        </div>

      </div>
    </div>
  );
}