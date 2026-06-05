"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DM_Sans } from "next/font/google";
import {
  Briefcase,
  CalendarCheck2,
  CalendarDays,
  Check,
  Flame,
  GripVertical,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getTrackerGoalsKey } from "@/lib/userSession";
import { loadCareerProfile } from "@/lib/profileData";

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
const COLUMN_COPY: Record<string, string> = {
  Applied: "Newly tracked opportunities",
  Interviewing: "Active interview loops",
  Offer: "Final decisions and offers",
  Rejected: "Closed or declined roles",
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShortWeekday = (date: Date) =>
  date.toLocaleDateString("default", { weekday: "short" }).slice(0, 3);

export default function TrackerDashboard() {
  const { user } = useAuth();
  const userId = user?.uid || "";
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

  const fetchPipelineData = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch("/api/tracker", {
        headers: { "x-user-id": userId },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }

      const nudgeRes = await fetch("/api/tracker/ai-nudge", {
        headers: { "x-user-id": userId },
      });
      if (nudgeRes.ok) {
        const nudgeData = await nudgeRes.json();
        setAiNudge(nudgeData.nudge);
      }
    } catch (err) {
      console.error("Failed to sync tracker data:", err);
      setNotice("Tracker data could not be synced. Please make sure the app services are running.");
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!userId) return;

      goalsHydratedRef.current = false;
      const savedGoals = window.localStorage.getItem(getTrackerGoalsKey(userId));
      if (savedGoals) {
        try {
          setWeeklyGoals(JSON.parse(savedGoals));
        } catch {
          setWeeklyGoals([]);
        }
      } else {
        setWeeklyGoals([]);
      }
      goalsHydratedRef.current = true;
      fetchPipelineData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPipelineData, userId]);

  useEffect(() => {
    if (goalsHydratedRef.current && userId) {
      window.localStorage.setItem(getTrackerGoalsKey(userId), JSON.stringify(weeklyGoals));
    }
  }, [userId, weeklyGoals]);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim() || !companyInput.trim()) return;

    setIsSubmitting(true);
    setNotice("");
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
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
      const res = await fetch(`/api/tracker/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
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
        headers: { "Content-Type": "application/json", "x-user-id": userId },
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
  const weeklyGoalPercent = weeklyGoals.length > 0 ? Math.round((completedGoals / weeklyGoals.length) * 100) : 0;

  const weeklyApplications = useMemo(() => {
    const weekStart = new Date(currentDate);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    return jobs.filter((job) => {
      if (!job.date_tracked) return false;
      const trackedDate = new Date(`${job.date_tracked}T00:00:00`);
      return trackedDate >= weekStart;
    }).length;
  }, [currentDate, jobs]);

  const skillCount = useMemo(() => {
    if (!userId) return 0;
    const profile = loadCareerProfile(userId, user);
    return profile.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean).length;
  }, [user, userId]);

  const applicationProgress = useMemo(() => {
    if (jobs.length === 0) return 0;
    const weightedTotal = jobs.reduce((total, job) => {
      const score =
        job.status === "Offer"
          ? 100
          : job.status === "Interviewing"
          ? 70
          : job.status === "Applied"
          ? 40
          : 20;
      return total + score;
    }, 0);

    return Math.round(weightedTotal / jobs.length);
  }, [jobs]);

  const roadmapPercent = Math.round((applicationProgress + weeklyGoalPercent) / (weeklyGoals.length > 0 ? 2 : 1));

  const streakCount = useMemo(() => {
    const trackedDays = new Set(jobs.map((job) => job.date_tracked).filter(Boolean));
    let streak = 0;
    const cursor = new Date(currentDate);
    cursor.setHours(0, 0, 0, 0);

    while (trackedDays.has(toLocalDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [currentDate, jobs]);

  const progressCards = [
    {
      label: "This Week",
      value: weeklyApplications,
      unit: "apps",
      helper: "Applications sent",
      icon: CalendarCheck2,
    },
    {
      label: "Profile Skills",
      value: skillCount,
      unit: "skills",
      helper: "Detected from CV/profile",
      icon: ListChecks,
    },
    {
      label: "Roadmap",
      value: roadmapPercent,
      unit: "%",
      helper: "Applications + goals",
      icon: TrendingUp,
    },
    {
      label: "Streak",
      value: streakCount,
      unit: streakCount === 1 ? "day" : "days",
      helper: streakCount > 0 ? "Active momentum" : "Track today to start",
      icon: Flame,
    },
  ];

  const statusDistribution = useMemo(() => {
    const maxCount = Math.max(1, ...KANBAN_COLUMNS.map((column) => jobs.filter((job) => job.status === column).length));

    return KANBAN_COLUMNS.map((column) => {
      const count = jobs.filter((job) => job.status === column).length;
      return {
        label: column,
        count,
        percentage: Math.round((count / maxCount) * 100),
      };
    });
  }, [jobs]);

  const weeklyActivity = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(currentDate);
      date.setHours(0, 0, 0, 0);
      date.setDate(currentDate.getDate() - (6 - index));
      const key = toLocalDateKey(date);

      return {
        key,
        label: formatShortWeekday(date),
        count: jobs.filter((job) => job.date_tracked === key).length,
      };
    });
  }, [currentDate, jobs]);

  const weeklyActivityMax = Math.max(1, ...weeklyActivity.map((day) => day.count));
  const lineChartPoints = weeklyActivity
    .map((day, index) => {
      const x = 18 + index * 44;
      const y = 104 - (day.count / weeklyActivityMax) * 76;
      return `${x},${y}`;
    })
    .join(" ");

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

        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-slate-200/60 sm:mb-8 sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1E3A8A]">
                Progress Dashboard
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Weekly momentum at a glance
              </h2>
            </div>
            {activeAlert && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#1E3A8A]">
                Next: {formatDeadline(activeAlert.deadline_date)} deadline
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {progressCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E3A8A] ring-1 ring-blue-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {card.label}
                    </p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold tracking-tight text-[#1E3A8A]">{card.value}</span>
                    <span className="pb-1 text-xs font-bold uppercase text-slate-500">{card.unit}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{card.helper}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Application Status</h3>
                  <p className="text-xs font-semibold text-slate-500">Status counts from your tracker</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1E3A8A] ring-1 ring-blue-100">
                  {jobs.length} total
                </span>
              </div>

              <div className="space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">{item.label}</span>
                      <span className="font-bold text-[#1E3A8A]">{item.count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-blue-100">
                      <div
                        className="h-full rounded-full bg-[#1E3A8A] transition-all"
                        style={{ width: `${item.percentage}%` }}
                        aria-label={`${item.label}: ${item.count} applications`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Weekly Activity</h3>
                  <p className="text-xs font-semibold text-slate-500">Applications tracked over the last 7 days</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1E3A8A] ring-1 ring-blue-100">
                  {weeklyApplications} this week
                </span>
              </div>

              <div className="rounded-xl bg-white p-3 ring-1 ring-blue-100">
                <svg viewBox="0 0 300 132" role="img" aria-label="Line chart of applications tracked during the last 7 days" className="h-36 w-full">
                  {[28, 66, 104].map((line) => (
                    <line key={line} x1="14" y1={line} x2="286" y2={line} stroke="#E2E8F0" strokeWidth="1" />
                  ))}
                  <polyline points={lineChartPoints} fill="none" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  {weeklyActivity.map((day, index) => {
                    const x = 18 + index * 44;
                    const y = 104 - (day.count / weeklyActivityMax) * 76;

                    return (
                      <g key={day.key}>
                        <circle cx={x} cy={y} r="5" fill="#1E3A8A" />
                        <text x={x} y="124" textAnchor="middle" className="fill-slate-500 text-[9px] font-bold">
                          {day.label}
                        </text>
                        <text x={x} y={Math.max(14, y - 10)} textAnchor="middle" className="fill-[#1E3A8A] text-[9px] font-bold">
                          {day.count}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </section>

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
