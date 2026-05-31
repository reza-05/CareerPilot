"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CVBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", headline: "", email: "", phone: "", address: "", dob: "", linkedIn: "", github: "",
    summary: "",
    sscSchool: "", sscGroup: "", sscYear: "", sscGpa: "",
    hscCollege: "", hscGroup: "", hscYear: "", hscGpa: "",
    isUniEnabled: false, uniDegree: "", uniName: "", uniMajor: "", uniYear: "", uniGpa: "",
    isWorkEnabled: false, workTitle: "", workCompany: "", workYear: "", workDesc: "",
    skills: "", languages: "", projects: "", certs: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
      languages: formData.languages.split(",").map(l => l.trim()).filter(Boolean),
    };

    try {
      const response = await fetch("/api/cv-processor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "hackathon_session_user" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) router.push("/job-hunter");
    } catch { alert("Error connecting to server."); }
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

        <form onSubmit={handleSubmit} className="space-y-10">
          <Card title="Personal Identification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="First Name" name="firstName" required placeholder="e.g., John" value={formData.firstName} onChange={handleChange} />
              <InputField label="Last Name" name="lastName" placeholder="e.g., Doe" value={formData.lastName} onChange={handleChange} />
              <InputField label="Headline" name="headline" required placeholder="e.g., Undergraduate Student / Full Stack Developer" value={formData.headline} onChange={handleChange} />
              <InputField label="Email Address" name="email" required type="email" placeholder="e.g., john.doe@example.com" value={formData.email} onChange={handleChange} />
              <InputField label="Phone Number" name="phone" required placeholder="e.g., +880 1XXXXXXXXX" value={formData.phone} onChange={handleChange} />
              <InputField label="Address" name="address" required placeholder="e.g., Dhaka, Bangladesh" value={formData.address} onChange={handleChange} />
              <InputField label="Date of Birth" name="dob" required type="date" value={formData.dob} onChange={handleChange} />
              <InputField label="LinkedIn URL" name="linkedIn" placeholder="e.g., linkedin.com/in/johndoe" value={formData.linkedIn} onChange={handleChange} />
              <InputField label="GitHub URL" name="github" placeholder="e.g., github.com/johndoe" value={formData.github} onChange={handleChange} />
            </div>
          </Card>

          <Card title="Professional Summary">
            <TextArea name="summary" placeholder="Briefly describe your career objectives and corporate ambitions..." value={formData.summary} onChange={handleChange} />
          </Card>

          <Card title="Academic History">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="SSC School Name" name="sscSchool" required placeholder="e.g., Notre Dame College" value={formData.sscSchool} onChange={handleChange} />
              <SelectField label="SSC Group" name="sscGroup" required options={["Science", "Commerce", "Arts"]} onChange={handleChange} />
              <InputField label="SSC Passing Year" name="sscYear" required type="number" placeholder="e.g., 2020" value={formData.sscYear} onChange={handleChange} />
              <InputField label="Result / GPA (Out of 5.00)" name="sscGpa" required placeholder="e.g., 5.00" value={formData.sscGpa} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <InputField label="HSC College Name" name="hscCollege" required placeholder="e.g., Notre Dame College" value={formData.hscCollege} onChange={handleChange} />
              <SelectField label="HSC Group" name="hscGroup" required options={["Science", "Commerce", "Arts"]} onChange={handleChange} />
              <InputField label="HSC Passing Year" name="hscYear" required type="number" placeholder="e.g., 2022" value={formData.hscYear} onChange={handleChange} />
              <InputField label="Result / GPA (Out of 5.00)" name="hscGpa" required placeholder="e.g., 5.00" value={formData.hscGpa} onChange={handleChange} />
            </div>
            <div className="mt-10 border-t pt-8">
              <label className="flex items-center space-x-3 cursor-pointer text-[#1E3A8A] font-bold text-lg">
                <input type="checkbox" name="isUniEnabled" checked={formData.isUniEnabled} onChange={handleChange} className="w-6 h-6 accent-[#1E3A8A]" />
                <span>Add University / Higher Education Credentials</span>
              </label>
              {formData.isUniEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 p-8 bg-slate-50 rounded-xl border border-slate-200">
                  <InputField label="Degree" name="uniDegree" required={formData.isUniEnabled} placeholder="e.g., B.Sc." value={formData.uniDegree} onChange={handleChange} />
                  <InputField label="University Name" name="uniName" required={formData.isUniEnabled} placeholder="e.g., BUET" value={formData.uniName} onChange={handleChange} />
                  <InputField label="Department / Major" name="uniMajor" required={formData.isUniEnabled} placeholder="e.g., Computer Science" value={formData.uniMajor} onChange={handleChange} />
                  <InputField label="Graduation Year" name="uniYear" required={formData.isUniEnabled} type="number" placeholder="e.g., 2026" value={formData.uniYear} onChange={handleChange} />
                  <InputField label="Result / CGPA (Out of 4.00)" name="uniGpa" required={formData.isUniEnabled} placeholder="e.g., 3.85" value={formData.uniGpa} onChange={handleChange} />
                </div>
              )}
            </div>
          </Card>

          <Card title="Experience & Achievements">
            <label className="flex items-center space-x-3 cursor-pointer text-[#1E3A8A] font-bold text-lg mb-6">
              <input type="checkbox" name="isWorkEnabled" checked={formData.isWorkEnabled} onChange={handleChange} className="w-6 h-6 accent-[#1E3A8A]" />
              <span>Add Professional Work History</span>
            </label>
            {formData.isWorkEnabled && (
              <div className="space-y-6">
                <InputField label="Title / Role" name="workTitle" required={formData.isWorkEnabled} placeholder="e.g., Junior Developer" value={formData.workTitle} onChange={handleChange} />
                <InputField label="Organization" name="workCompany" required={formData.isWorkEnabled} placeholder="e.g., Tech Corp" value={formData.workCompany} onChange={handleChange} />
                <InputField label="Year / Date" name="workYear" required={formData.isWorkEnabled} placeholder="e.g., 2024-Present" value={formData.workYear} onChange={handleChange} />
                <TextArea label="Description" name="workDesc" value={formData.workDesc} onChange={handleChange} />
              </div>
            )}
          </Card>

          <Card title="Technical Competencies">
            <InputField label="Skills" name="skills" required placeholder="e.g., React, Python, Node.js, PostgreSQL" value={formData.skills} onChange={handleChange} />
            <InputField label="Languages" name="languages" placeholder="e.g., English, Bengali" value={formData.languages} onChange={handleChange} />
          </Card>

          <Card title="Additional Specifications">
            <TextArea label="Projects" name="projects" value={formData.projects} onChange={handleChange} />
            <TextArea label="Certifications" name="certs" value={formData.certs} onChange={handleChange} />
          </Card>

          <button type="submit" className="w-full bg-[#1E3A8A] text-white text-2xl font-bold py-6 rounded-2xl hover:bg-[#153073] transition-all shadow-xl">
            Process
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-3xl font-extrabold tracking-tight text-[#1E3A8A] mb-10">{title}</h2>
      {children}
    </div>
  );
}

function InputField({ label, required, ...props }: any) {
  return (
    <div>
      <label className="block text-lg font-semibold text-slate-800 mb-3">{label} {required && <span className="text-red-500">*</span>}</label>
      <input {...props} className="w-full p-5 text-lg text-slate-900 bg-white border-2 border-slate-200 rounded-xl placeholder:text-slate-400 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all" />
    </div>
  );
}

function SelectField({ label, required, options, ...props }: any) {
  return (
    <div>
      <label className="block text-lg font-semibold text-slate-800 mb-3">{label} {required && <span className="text-red-500">*</span>}</label>
      <select {...props} className="w-full p-5 text-lg text-slate-900 bg-white border-2 border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-all">
        <option value="">Select...</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, ...props }: any) {
  return (
    <div className="mt-4">
      {label && <label className="block text-lg font-semibold text-slate-800 mb-3">{label}</label>}
      <textarea {...props} className="w-full p-5 text-lg text-slate-900 bg-white border-2 border-slate-200 rounded-xl placeholder:text-slate-400 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition-all h-32" />
    </div>
  );
}