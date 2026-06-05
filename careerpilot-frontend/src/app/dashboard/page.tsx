"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, GraduationCap, LogOut, Mail, Save, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { CareerProfile, loadCareerProfile, saveCareerProfile } from "@/lib/profileData";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<CareerProfile>(() => loadCareerProfile(user?.uid, user));
  const [saved, setSaved] = useState(false);

  const completion = useMemo(() => {
    const importantFields: (keyof CareerProfile)[] = [
      "firstName",
      "headline",
      "email",
      "phone",
      "address",
      "sscSchool",
      "hscCollege",
      "skills",
    ];
    const completed = importantFields.filter((field) => {
      const value = profile[field];
      return typeof value === "string" && value.trim().length > 0;
    }).length;

    return Math.round((completed / importantFields.length) * 100);
  }, [profile]);

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || user?.displayName || "CareerPilot User";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setSaved(false);
    setProfile((current) => ({
      ...current,
      [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;
    saveCareerProfile(user.uid, profile);
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 grid gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 md:grid-cols-[1fr_auto] md:items-center md:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-xl font-black text-white shadow-lg shadow-blue-900/20">
              {profile.firstName ? profile.firstName.slice(0, 1).toUpperCase() : <UserRound size={28} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E3A8A]">Dashboard</p>
              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{displayName}</h1>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Mail size={15} />
                <span className="truncate">{profile.email || user?.email || "Add your email"}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
            <p className="text-3xl font-black text-[#1E3A8A]">{completion}%</p>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Profile Ready</p>
          </div>
        </section>

        {saved && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={18} />
            Profile saved. Your manual CV builder will use this information automatically.
          </div>
        )}

        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Panel title="Personal Profile" icon={<UserRound size={20} />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" name="firstName" value={profile.firstName} onChange={handleChange} />
                <Field label="Last Name" name="lastName" value={profile.lastName} onChange={handleChange} />
                <Field label="Headline" name="headline" value={profile.headline} onChange={handleChange} className="sm:col-span-2" />
                <Field label="Email" name="email" type="email" value={profile.email} onChange={handleChange} />
                <Field label="Phone" name="phone" value={profile.phone} onChange={handleChange} />
                <Field label="Address" name="address" value={profile.address} onChange={handleChange} className="sm:col-span-2" />
                <Field label="Date of Birth" name="dob" type="date" value={profile.dob} onChange={handleChange} />
                <Field label="LinkedIn" name="linkedIn" value={profile.linkedIn} onChange={handleChange} />
                <Field label="GitHub" name="github" value={profile.github} onChange={handleChange} className="sm:col-span-2" />
              </div>
              <Area label="Summary" name="summary" value={profile.summary} onChange={handleChange} />
            </Panel>

            <Panel title="Education" icon={<GraduationCap size={20} />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SSC School" name="sscSchool" value={profile.sscSchool} onChange={handleChange} />
                <Select label="SSC Group" name="sscGroup" value={profile.sscGroup} options={["Science", "Commerce", "Arts"]} onChange={handleChange} />
                <Field label="SSC Passing Year" name="sscYear" type="number" value={profile.sscYear} onChange={handleChange} />
                <Field label="SSC GPA" name="sscGpa" value={profile.sscGpa} onChange={handleChange} />
                <Field label="HSC College" name="hscCollege" value={profile.hscCollege} onChange={handleChange} />
                <Select label="HSC Group" name="hscGroup" value={profile.hscGroup} options={["Science", "Commerce", "Arts"]} onChange={handleChange} />
                <Field label="HSC Passing Year" name="hscYear" type="number" value={profile.hscYear} onChange={handleChange} />
                <Field label="HSC GPA" name="hscGpa" value={profile.hscGpa} onChange={handleChange} />
                <Field label="University Degree" name="uniDegree" value={profile.uniDegree} onChange={handleChange} />
                <Field label="University Name" name="uniName" value={profile.uniName} onChange={handleChange} />
                <Field label="Department / Major" name="uniMajor" value={profile.uniMajor} onChange={handleChange} />
                <Field label="Graduation Year" name="uniYear" type="number" value={profile.uniYear} onChange={handleChange} />
                <Field label="University CGPA" name="uniGpa" value={profile.uniGpa} onChange={handleChange} />
              </div>
            </Panel>

            <Panel title="Career Details" icon={<BriefcaseBusiness size={20} />}>
              <label className="mb-4 flex items-center gap-3 text-sm font-black text-[#1E3A8A]">
                <input type="checkbox" name="isWorkEnabled" checked={profile.isWorkEnabled} onChange={handleChange} className="h-4 w-4 accent-[#1E3A8A]" />
                Add work experience
              </label>
              {profile.isWorkEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Role / Title" name="workTitle" value={profile.workTitle} onChange={handleChange} />
                  <Field label="Organization" name="workCompany" value={profile.workCompany} onChange={handleChange} />
                  <Field label="Timeline" name="workYear" value={profile.workYear} onChange={handleChange} className="sm:col-span-2" />
                  <Area label="Description" name="workDesc" value={profile.workDesc} onChange={handleChange} className="sm:col-span-2" />
                </div>
              )}
              <div className="mt-4 grid gap-4">
                <Field label="Skills" name="skills" value={profile.skills} onChange={handleChange} placeholder="React, Python, SQL, Communication" />
                <Field label="Languages" name="languages" value={profile.languages} onChange={handleChange} placeholder="Bangla, English" />
                <Area label="Projects" name="projects" value={profile.projects} onChange={handleChange} />
                <Area label="Certifications" name="certs" value={profile.certs} onChange={handleChange} />
              </div>
            </Panel>
          </div>

          <aside className="h-fit rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 lg:sticky lg:top-24">
            <h2 className="text-lg font-black text-slate-950">Profile Actions</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Saved details will fill your CV builder.
            </p>
            <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#173074]">
              <Save size={18} />
              Save Profile
            </button>
            <Link href="/cv-builder" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-[#1E3A8A] transition hover:bg-blue-100">
              Open CV Builder
              <ArrowRight size={18} />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-blue-200 hover:bg-slate-50 hover:text-[#1E3A8A]"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60 sm:p-6">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#1E3A8A]">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function Field({ label, className = "", ...props }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A]"
      />
    </label>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

function Area({ label, className = "", ...props }: AreaProps) {
  return (
    <label className={`mt-4 block ${className}`}>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <textarea
        {...props}
        className="min-h-28 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A]"
      />
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
};

function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1E3A8A]"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
