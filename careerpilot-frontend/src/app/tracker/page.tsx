"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DM_Sans } from "next/font/google";
import {
  Briefcase,
  CalendarDays,
  Check,
  GripVertical,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface TrackedJob {
  id: number;
  role: string;
  company: string;
  status: string;
  date_tracked: string;
  application_deadline?: string | null;
  deadline_date?: string | null;
  source_url?: string | null;
}

interface MilestoneGoal {
  id: number;
  text: string;
  completed: boolean;
}

const KANBAN_COLUMNS = ["Applied", "Interviewing", "Offer", "Rejected"];
const GOALS_STORAGE_KEY = "careerpilot_tracker_goals";

const COLUMN_COPY: Record<string, string> = {
  Applied: "Newly tracked opportunities",
  Interviewing: "Active interview loops",
  Offer: "Final decisions and offers",
  Rejected: "Closed or declined roles",
};

export default function TrackerDashboard() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [aiNudge, setAiNudge] = useState("Analyzing application progress...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [currentDate] = useState(new Date());
  const goalsHydratedRef = useRef(false);

  const [weeklyGoals, setWeeklyGoals] = useState<MilestoneGoal[]>([]);

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
      console.error("Failed to sync tracker data:", err);
      setNotice("Tracker data could not be synced. Please make sure the app services are running.");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedGoals = window.localStorage.getItem(GOALS_STORAGE_KEY);
      if (savedGoals) {
        try {
          setWeeklyGoals(JSON.parse(savedGoals));
        } catch {
          setWeeklyGoals([]);
        }
      }
      goalsHydratedRef.current = true;
      fetchPipelineData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (goalsHydratedRef.current) {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(weeklyGoals));
    }
  }, [weeklyGoals]);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim() || !companyInput.trim()) return;

    setIsSubmitting(true);
    setNotice("");
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: roleInput.trim(),
          company: companyInput.trim(),
          application_deadline: deadlineInput || null,
          deadline_date: deadlineInput || null,
        }),
      });

      if (res.ok) {
        setRoleInput("");
        setCompanyInput("");
        setDeadlineInput("");
        await fetchPipelineData();
      } else {
        setNotice("Application could not be added. Please try again.");
      }
    } catch (err) {
      console.error("Error creating entry:", err);
      setNotice("Application could not be added. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: number) => {
    const originalJobs = [...jobs];
    setJobs((prev) => prev.filter((job) => job.id !== id));
    setNotice("");

    try {
      const res = await fetch(`/api/tracker/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setJobs(originalJobs);
        setNotice("Application could not be removed. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      setJobs(originalJobs);
      setNotice("Application could not be removed. Please try again in a moment.");
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
        setNotice("Status could not be updated. Please try again.");
      } else {
        fetchPipelineData();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setJobs(originalJobs);
      setNotice("Status could not be updated. Please try again in a moment.");
    }
  };

  const toggleGoal = (id: number) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleAddGoal = (goalText?: string) => {
    const text = (goalText || goalInput).trim();
    if (!text) return;

    setWeeklyGoals((prev) => [
      ...prev,
      { id: Date.now(), text, completed: false },
    ]);
    setGoalInput("");
  };

  const handleDeleteGoal = (id: number) => {
    setWeeklyGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const generateCalendarCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const cells: Array<number | null> = Array(firstWeekday).fill(null);

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(day);
    }

    return cells;
  };

  const parseDeadlineParts = (deadline?: string | null) => {
    if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
    const [year, month, day] = deadline.split("-").map(Number);
    return { year, month, day };
  };

  const formatDeadline = useCallback((deadline?: string | null) => {
    const parts = parseDeadlineParts(deadline);
    if (!parts) return null;

    return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString("default", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const deadlineJobsByDay = useMemo(() => {
    const map = new Map<number, TrackedJob[]>();
    jobs.forEach((job) => {
      const parts = parseDeadlineParts(job.deadline_date);
      if (!parts) return;
      if (parts.year !== currentDate.getFullYear() || parts.month !== currentDate.getMonth() + 1) return;
      map.set(parts.day, [...(map.get(parts.day) || []), job]);
    });
    return map;
  }, [jobs, currentDate]);

  const activeAlert = useMemo(() => {
    const todayKey = currentDate.toISOString().slice(0, 10);
    return jobs
      .filter((job) => job.deadline_date && job.deadline_date >= todayKey)
      .sort((a, b) => String(a.deadline_date).localeCompare(String(b.deadline_date)))[0];
  }, [jobs, currentDate]);

  const suggestedGoals = useMemo(() => {
    const appliedCount = jobs.filter((job) => job.status === "Applied").length;
    const interviewingCount = jobs.filter((job) => job.status === "Interviewing").length;
    const suggestions = [
      jobs.length === 0
        ? "Track your first application from Job Hunter"
        : `Review and update ${jobs.length} tracked application${jobs.length > 1 ? "s" : ""}`,
      appliedCount > 0
        ? `Follow up on ${appliedCount} applied role${appliedCount > 1 ? "s" : ""}`
        : "",
      interviewingCount > 0
        ? `Prepare notes for ${interviewingCount} active interview${interviewingCount > 1 ? "s" : ""}`
        : "",
      activeAlert
        ? `Prepare before the ${formatDeadline(activeAlert.deadline_date)} deadline for ${activeAlert.role}`
        : "",
    ].filter(Boolean);

    const existing = new Set(weeklyGoals.map((goal) => goal.text.toLowerCase()));
    return suggestions.filter((goal) => !existing.has(goal.toLowerCase())).slice(0, 3);
  }, [activeAlert, formatDeadline, jobs, weeklyGoals]);

  const completedGoals = weeklyGoals.filter((goal) => goal.completed).length;

  return (
    <div className={`min-h-screen bg-[#f8f9fa] text-slate-900 antialiased ${dmSans.className}`}>
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-blue-50 via-white to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <header className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-slate-200/60 sm:mb-8 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#1E3A8A]">
                CareerPilot Tracker
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Application Tracker
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Track applications, deadlines, and personal goals from one focused workspace.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 min-[520px]:gap-3 lg:min-w-[360px]">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tracked</p>
                <p className="mt-1 text-2xl font-bold text-[#1E3A8A]">{jobs.length}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active</p>
                <p className="mt-1 text-2xl font-bold text-[#1E3A8A]">
                  {jobs.filter((job) => job.status !== "Rejected").length}
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Goals</p>
                <p className="mt-1 text-2xl font-bold text-[#1E3A8A]">
                  {completedGoals}/{weeklyGoals.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-[#EFF6FF] px-4 py-3 text-sm text-slate-600">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
            <p>
              <span className="font-bold text-[#1E3A8A]">Progress insight:</span> {aiNudge}
            </p>
          </div>

          {notice && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {notice}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
          <main className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {KANBAN_COLUMNS.map((col) => {
              const columnJobs = jobs.filter((j) => j.status === col);

              return (
                <section
                  key={col}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col)}
                  className="flex min-h-[340px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 sm:min-h-[420px] xl:min-h-[520px]"
                >
                  <div className="mb-4 border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A8A]">
                        {col}
                      </h2>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1E3A8A]">
                        {columnJobs.length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{COLUMN_COPY[col]}</p>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {columnJobs.map((job) => (
                      <article
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        className="group rounded-xl border border-blue-100 bg-[#F8FBFF] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="line-clamp-3 text-sm font-bold leading-5 text-slate-950">
                              {job.role}
                            </h3>
                            <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                              {job.company}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${job.role}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(job.id);
                            }}
                            className="rounded-lg border border-transparent p-1.5 text-slate-300 opacity-100 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{job.date_tracked}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                            <GripVertical className="h-3.5 w-3.5" />
                            Drag
                          </span>
                        </div>

                        {(job.deadline_date || job.application_deadline) && (
                          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[11px] font-semibold text-[#1E3A8A] ring-1 ring-blue-100">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>
                              Deadline: {formatDeadline(job.deadline_date) || job.application_deadline}
                            </span>
                          </div>
                        )}
                      </article>
                    ))}

                    {columnJobs.length === 0 && (
                      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-blue-100 bg-blue-50/40 p-4 text-center">
                        <p className="text-xs font-semibold text-slate-400">Drop applications here</p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </main>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A8A] text-white">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Track Application</h3>
                  <p className="text-xs text-slate-500">Add a role manually</p>
                </div>
              </div>

              <form onSubmit={handleAddJob} className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Role</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Backend Developer"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Company</span>
                  <input
                    type="text"
                    required
                    placeholder="Company name"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Deadline</span>
                  <input
                    type="date"
                    value={deadlineInput}
                    onChange={(e) => setDeadlineInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <Briefcase className="h-4 w-4" />
                  {isSubmitting ? "Adding..." : "Add Application"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
              <div className="mb-4 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-[#1E3A8A]" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Deadline Calendar</h3>
                    <p className="text-xs text-slate-500">Tracked deadlines appear here.</p>
                  </div>
                </div>
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-[#1E3A8A]">
                  {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {generateCalendarCells().map((day, index) => {
                  if (!day) {
                    return <div key={`blank-${index}`} className="aspect-square" />;
                  }

                  const isToday = day === currentDate.getDate();
                  const deadlineJobs = deadlineJobsByDay.get(day) || [];
                  const hasDeadline = deadlineJobs.length > 0;

                  return (
                    <div
                      key={day}
                      title={hasDeadline ? deadlineJobs.map((job) => job.role).join(", ") : undefined}
                      className={`relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition ${
                        hasDeadline
                          ? "border border-blue-200 bg-[#1E3A8A] text-white shadow-md"
                          : isToday
                          ? "border border-[#1E3A8A] bg-white text-[#1E3A8A] ring-2 ring-blue-100"
                          : "bg-slate-50 text-slate-500 hover:bg-blue-50"
                      }`}
                    >
                      {day}
                      {hasDeadline && (
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
                      )}
                    </div>
                  );
                })}
              </div>

              {activeAlert && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                    Upcoming Deadline
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    <span className="font-bold text-slate-900">
                      {formatDeadline(activeAlert.deadline_date)}:
                    </span>{" "}
                    {activeAlert.role} at {activeAlert.company}
                  </p>
                </div>
              )}

              {!activeAlert && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  No upcoming deadlines yet. Track jobs with deadline information or add a deadline manually.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#1E3A8A]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Goal Setting</h3>
                  <p className="text-xs text-slate-500">Plan weekly application and learning targets.</p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddGoal();
                }}
                className="mb-4 flex gap-2"
              >
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g., Apply to 5 jobs this week"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!goalInput.trim()}
                  className="rounded-xl bg-[#1E3A8A] px-3 text-white transition hover:bg-[#1D4ED8] disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Add goal"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {suggestedGoals.length > 0 && (
                <div className="mb-4 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                    Suggested from your tracker
                  </p>
                  {suggestedGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleAddGoal(goal)}
                      className="block w-full rounded-lg bg-white px-3 py-2 text-left text-xs font-semibold text-slate-600 ring-1 ring-blue-100 transition hover:text-[#1E3A8A]"
                    >
                      + {goal}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {weeklyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="group flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-100 hover:bg-blue-50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGoal(goal.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        goal.completed
                          ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <span
                      onClick={() => toggleGoal(goal.id)}
                      className={`min-w-0 flex-1 cursor-pointer text-xs leading-5 transition ${
                        goal.completed
                          ? "text-slate-400 line-through"
                          : "font-medium text-slate-600"
                      }`}
                    >
                      {goal.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="rounded-lg p-1 text-slate-300 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Delete goal: ${goal.text}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {weeklyGoals.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs leading-5 text-slate-500">
                    No goals yet. Add your own targets or use a tracker suggestion.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
