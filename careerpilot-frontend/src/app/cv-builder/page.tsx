"use client";

import React, { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, X, Plus } from "lucide-react";
import Link from "next/link";

export default function CVBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    school: "",
    sscGrade: "",
    college: "",
    hscGrade: "",
    isUniversityApplicable: false,
    university: "",
    major: "",
    yearOfPassing: "",
    uniGrade: "",
    hasExperience: false,
    experienceDetails: "",
    skills: [] as string[],
    languages: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");

  const handleTagAdd = (type: "skills" | "languages", value: string, setter: Function) => {
    if (!value.trim()) return;
    setFormData((prev) => ({ ...prev, [type]: [...prev[type], value.trim()] }));
    setter("");
  };

  const removeTag = (type: "skills" | "languages", index: number) => {
    setFormData((prev) => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/cv-processor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "hackathon_session_user" },
        body: JSON.stringify(formData),
      });
      if ((await response.json()).success) router.push("/job-hunter");
      else alert("Submission failed.");
    } catch { alert("System communication error."); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] text-[#1E3A8A]">
      <Loader2 size={64} className="animate-spin mb-8" />
      <h2 className="text-3xl font-bold tracking-tight">Synthesizing Profile Markdown Dossier...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-16 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center text-[#1E3A8A] font-semibold text-lg hover:underline mb-12">
          <ArrowLeft size={24} className="mr-3" /> Back
        </Link>

        <form onSubmit={handleSubmit} className="space-y-12">
          <Section title="Personal Identification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="Given Name" value={formData.firstName} onChange={(e:any) => setFormData({...formData, firstName: e.target.value})} />
              <Input label="Surname" value={formData.lastName} onChange={(e:any) => setFormData({...formData, lastName: e.target.value})} />
              <Input label="Date of Birth" type="date" value={formData.dob} onChange={(e:any) => setFormData({...formData, dob: e.target.value})} />
            </div>
          </Section>

          <Section title="Academic History">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="SSC Institution" value={formData.school} onChange={(e:any) => setFormData({...formData, school: e.target.value})} />
              <Input label="SSC Grade/GPA (Out of 5.00)" value={formData.sscGrade} onChange={(e:any) => setFormData({...formData, sscGrade: e.target.value})} />
              <Input label="HSC Institution" value={formData.college} onChange={(e:any) => setFormData({...formData, college: e.target.value})} />
              <Input label="HSC Grade/GPA (Out of 5.00)" value={formData.hscGrade} onChange={(e:any) => setFormData({...formData, hscGrade: e.target.value})} />
            </div>
            
            <div className="mt-10 pt-10 border-t border-slate-200">
              <label className="flex items-center space-x-4 cursor-pointer text-xl font-bold text-[#1E3A8A]">
                <input type="checkbox" checked={formData.isUniversityApplicable} onChange={(e) => setFormData({...formData, isUniversityApplicable: e.target.checked})} className="w-6 h-6 accent-[#1E3A8A]" />
                <span>Add University / Higher Education Credentials</span>
              </label>
              {formData.isUniversityApplicable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <Input label="University Name" value={formData.university} onChange={(e:any) => setFormData({...formData, university: e.target.value})} />
                  <Input label="Core Major" value={formData.major} onChange={(e:any) => setFormData({...formData, major: e.target.value})} />
                  <Input label="Graduation Year" type="number" value={formData.yearOfPassing} onChange={(e:any) => setFormData({...formData, yearOfPassing: e.target.value})} />
                  <Input label="University CGPA (Out of 4.00)" value={formData.uniGrade} onChange={(e:any) => setFormData({...formData, uniGrade: e.target.value})} />
                </div>
              )}
            </div>
          </Section>

          <Section title="Competencies">
            <TagInput label="Core Technical Competencies" tags={formData.skills} input={skillInput} setInput={setSkillInput} onAdd={() => handleTagAdd("skills", skillInput, setSkillInput)} onRemove={(i: number) => removeTag("skills", i)} />
            <TagInput label="Linguistic Proficiencies" tags={formData.languages} input={langInput} setInput={setLangInput} onAdd={() => handleTagAdd("languages", langInput, setLangInput)} onRemove={(i: number) => removeTag("languages", i)} />
          </Section>

          <button type="submit" className="w-full bg-[#1E3A8A] text-white text-2xl font-bold py-6 rounded-2xl hover:bg-[#153073] transition-all shadow-xl">
            Process
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-3xl font-extrabold tracking-tight text-[#1E3A8A] mb-10">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-lg font-semibold text-slate-800 mb-3">{label}</label>
      <input {...props} className="w-full p-5 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all" />
    </div>
  );
}

function TagInput({ label, tags, input, setInput, onAdd, onRemove }: any) {
  return (
    <div className="mb-8">
      <label className="block text-lg font-semibold text-slate-800 mb-3">{label}</label>
      <div className="flex flex-wrap gap-3 mb-4">
        {tags.map((t: string, i: number) => (
          <span key={i} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-full font-medium">
            {t} <X size={16} className="cursor-pointer" onClick={() => onRemove(i)} />
          </span>
        ))}
      </div>
      <div className="flex gap-4">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && (e.preventDefault(), onAdd())} className="flex-grow p-5 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-[#1E3A8A]" placeholder="Type and press Enter..." />
        <button type="button" onClick={onAdd} className="p-5 bg-slate-800 text-white rounded-xl"><Plus /></button>
      </div>
    </div>
  );
}