"use client";

import React, { useEffect, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import ProfileAvatar from "@/components/ProfileAvatar";
import { buildAuthHeaders } from "@/lib/authHeaders";
import { markCvUploaded } from "@/lib/userSession";
import { loadCareerProfile, mergeProfileSkills, normalizeSkillList, saveCareerProfile } from "@/lib/profileData";

export default function CVBuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState(() => loadCareerProfile(user?.uid, user));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFormData(loadCareerProfile(user?.uid, user));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handlePhotoChange = (photoDataUrl: string) => {
    if (!user?.uid) return;
    const nextProfile = { ...formData, photoDataUrl };
    setFormData(nextProfile);
    saveCareerProfile(user.uid, nextProfile);
  };

  const handleFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      setValidationError("Please sign in before creating your CV profile.");
      return;
    }

    const requiredFields: { name: keyof typeof formData; label: string }[] = [
      { name: "firstName", label: "First Name" },
      { name: "headline", label: "Headline" },
      { name: "email", label: "Email Address" },
      { name: "phone", label: "Phone Number" },
      { name: "address", label: "Address" },
      { name: "dob", label: "Date of Birth" },
      { name: "sscSchool", label: "SSC School" },
      { name: "sscGroup", label: "SSC Group" },
      { name: "sscYear", label: "SSC Passing Year" },
      { name: "sscGpa", label: "SSC GPA" },
      { name: "hscCollege", label: "HSC College" },
      { name: "hscGroup", label: "HSC Group" },
      { name: "hscYear", label: "HSC Passing Year" },
      { name: "hscGpa", label: "HSC GPA" },
      { name: "skills", label: "Skills" },
    ];

    if (formData.isWorkEnabled) {
      requiredFields.push(
        { name: "workTitle", label: "Work Title" },
        { name: "workCompany", label: "Work Organization" },
        { name: "workYear", label: "Work Timeline" }
      );
    }

    const missingField = requiredFields.find((field) => {
      const value = formData[field.name];
      return typeof value === "string" && !value.trim();
    });

    if (missingField) {
      setValidationError(`${missingField.label} is required before processing your CV.`);
      const field = document.querySelector<HTMLElement>(`[name="${missingField.name}"]`);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus();
      return;
    }

    setValidationError("");
    setLoading(true);

    const payload = {
      ...formData,
      photoDataUrl: undefined,
      skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
      languages: formData.languages.split(",").map(l => l.trim()).filter(Boolean),
    };

    try {
      saveCareerProfile(user.uid, formData);
      const response = await fetch("/api/cv-processor", {
        method: "POST",
        headers: await buildAuthHeaders(user, { "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        const detectedSkills = normalizeSkillList(data.skills);
        const savedProfile = mergeProfileSkills(formData, detectedSkills.length > 0 ? detectedSkills : payload.skills);
        saveCareerProfile(user.uid, savedProfile);
        markCvUploaded(user.uid, "Manual CV profile", normalizeSkillList(savedProfile.skills));
        router.push("/job-hunter");
      }
      else alert("Submission failed.");
    } catch { alert("Error connecting to server."); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] px-4 text-center text-[#1E3A8A] dark:bg-slate-950">
      <Loader2 size={56} className="animate-spin mb-6 sm:mb-8" />
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl font-[Urbanist]">Preparing Your Profile...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-5 dark:bg-slate-950 sm:py-6 md:px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/cv-upload" className="inline-flex items-center text-[#1E3A8A] font-bold text-sm hover:underline mb-5 font-[Urbanist]">
          <ArrowLeft size={18} className="mr-2" /> Back
        </Link>

        {validationError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {validationError}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-5 sm:space-y-6">
          <Card title="Personal Identification">
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-400/20 dark:bg-slate-950/60">
              <ProfileAvatar profile={formData} fallbackName={user?.displayName || user?.email} size="md" editable onPhotoChange={handlePhotoChange} />
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">Profile photo</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-500 dark:text-slate-400">
                  Optional. This stays visual only and is not used for job matching.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="First Name *" name="firstName" required placeholder="e.g., John" value={formData.firstName} onChange={handleChange} />
              <InputField label="Surname (Optional)" name="lastName" placeholder="e.g., Doe" value={formData.lastName} onChange={handleChange} />
              <InputField label="Headline *" name="headline" required placeholder="e.g., Undergraduate Student / Full Stack Developer" value={formData.headline} onChange={handleChange} />
              <InputField label="Email Address *" name="email" required type="email" placeholder="e.g., john.doe@example.com" value={formData.email} onChange={handleChange} />
              <InputField label="Phone Number *" name="phone" required placeholder="e.g., +880 1XXXXXXXXX" value={formData.phone} onChange={handleChange} />
              <InputField label="Address *" name="address" required placeholder="e.g., Dhaka, Bangladesh" value={formData.address} onChange={handleChange} />
              <InputField label="Date of Birth *" name="dob" required type="date" value={formData.dob} onChange={handleChange} />
              <InputField label="LinkedIn URL (Optional)" name="linkedIn" placeholder="e.g., linkedin.com/in/johndoe" value={formData.linkedIn} onChange={handleChange} />
              <InputField label="GitHub URL (Optional)" name="github" placeholder="e.g., github.com/johndoe" value={formData.github} onChange={handleChange} />
            </div>
          </Card>

          <Card title="Professional Summary">
            <TextArea label="Summary / Objective (Optional)" name="summary" placeholder="Briefly describe your career objectives and corporate ambitions..." value={formData.summary} onChange={handleChange} />
          </Card>

          <Card title="Academic History">
            <div className="space-y-6">
              <AcademicSubSection title="Secondary School (SSC)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="School *" name="sscSchool" required placeholder="e.g., Rajshahi Collegiate School" value={formData.sscSchool} onChange={handleChange} />
                  <SelectField label="SSC Group *" name="sscGroup" required value={formData.sscGroup} options={["Science", "Commerce", "Arts"]} onChange={handleChange} />
                  <InputField label="SSC Passing Year *" name="sscYear" required type="number" placeholder="e.g., 2020" value={formData.sscYear} onChange={handleChange} />
                  <InputField label="Result / GPA (Out of 5.00) *" name="sscGpa" required placeholder="e.g., 5.00" value={formData.sscGpa} onChange={handleChange} />
                </div>
              </AcademicSubSection>
              <AcademicSubSection title="Higher Secondary (HSC)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="College *" name="hscCollege" required placeholder="e.g., Dhaka College" value={formData.hscCollege} onChange={handleChange} />
                  <SelectField label="HSC Group *" name="hscGroup" required value={formData.hscGroup} options={["Science", "Commerce", "Arts"]} onChange={handleChange} />
                  <InputField label="HSC Passing Year *" name="hscYear" required type="number" placeholder="e.g., 2022" value={formData.hscYear} onChange={handleChange} />
                  <InputField label="Result / GPA (Out of 5.00) *" name="hscGpa" required placeholder="e.g., 5.00" value={formData.hscGpa} onChange={handleChange} />
                </div>
              </AcademicSubSection>
              <AcademicSubSection title="University (If Applicable)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Degree (If Applicable)" name="uniDegree" placeholder="e.g., B.Sc." value={formData.uniDegree} onChange={handleChange} />
                  <InputField label="Institution / University Name (If Applicable)" name="uniName" placeholder="e.g., Islamic University of Technology" value={formData.uniName} onChange={handleChange} />
                  <InputField label="Department / Major (If Applicable)" name="uniMajor" placeholder="e.g., Computer Science and Engineering" value={formData.uniMajor} onChange={handleChange} />
                  <InputField label="Graduation Year (If Applicable)" name="uniYear" type="number" placeholder="e.g., 2026" value={formData.uniYear} onChange={handleChange} />
                  <InputField label="University CGPA (Out of 4.00) (If Applicable)" name="uniGpa" placeholder="e.g., 3.85" value={formData.uniGpa} onChange={handleChange} />
                </div>
              </AcademicSubSection>
            </div>
          </Card>

          <Card title="Experience & Achievements">
            <label className="flex items-center space-x-3 cursor-pointer text-[#1E3A8A] font-bold text-sm mb-5 font-[Urbanist]">
              <input type="checkbox" name="isWorkEnabled" checked={formData.isWorkEnabled} onChange={handleChange} className="w-4 h-4 accent-[#1E3A8A]" />
              <span>Add Professional Work History</span>
            </label>
            {formData.isWorkEnabled && (
              <div className="space-y-5">
                <InputField label="Title / Role *" name="workTitle" required={formData.isWorkEnabled} placeholder="e.g., Junior Developer" value={formData.workTitle} onChange={handleChange} />
                <InputField label="Organization *" name="workCompany" required={formData.isWorkEnabled} placeholder="e.g., Tech Corp" value={formData.workCompany} onChange={handleChange} />
                <InputField label="Year / Date *" name="workYear" required={formData.isWorkEnabled} placeholder="e.g., 2024-Present" value={formData.workYear} onChange={handleChange} />
                <TextArea label="Description (Optional)" name="workDesc" value={formData.workDesc} onChange={handleChange} />
              </div>
            )}
          </Card>

          <Card title="Technical Competencies">
            <div className="grid grid-cols-1 gap-5">
              <InputField label="Skills *" name="skills" required placeholder="e.g., React, Node.js, Python, PostgreSQL" value={formData.skills} onChange={handleChange} />
              <InputField label="Languages (Optional)" name="languages" placeholder="e.g., English, Bengali" value={formData.languages} onChange={handleChange} />
            </div>
          </Card>

          <Card title="Additional Specifications">
            <TextArea label="Projects (Optional)" name="projects" placeholder="e.g.,&#10;- CareerPilot: AI-driven career planning platform...&#10;- SafeRide: Cross-platform ride-sharing application..." value={formData.projects} onChange={handleChange} />
            <TextArea label="Certifications (Optional)" name="certs" placeholder="e.g.,&#10;- AWS Certified Cloud Practitioner (2025)&#10;- Cisco Certified Network Associate (CCNA)..." value={formData.certs} onChange={handleChange} />
          </Card>

          <button type="submit" className="w-full bg-[#1E3A8A] text-white text-base sm:text-lg font-bold py-3.5 sm:py-4 rounded-xl hover:bg-[#153073] transition-all shadow-lg font-[Urbanist]">
            Process
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-5 sm:p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100 dark:border-blue-400/20 dark:bg-slate-900 dark:shadow-slate-950/50">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-5 sm:mb-6 font-[Urbanist]">{title}</h2>
      {children}
    </div>
  );
}

function AcademicSubSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-blue-400/20 dark:bg-slate-950/60">
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A] mb-4 sm:mb-5 font-[Urbanist]">{title}</h3>
      {children}
    </div>
  );
}

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
};

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  options: string[];
};

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

function InputField({ label, required, ...props }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm md:text-base font-bold text-slate-800 mb-2 font-[Urbanist]">
        {label.includes("*") ? label.split("*")[0] : label}
        {required && <span className="text-red-500 font-bold"> *</span>}
      </label>
      <input {...props} className="w-full py-3 px-4 text-sm md:text-base font-[DM_Sans] text-slate-900 bg-white border-2 border-slate-200 rounded-lg placeholder:text-slate-400 placeholder:text-sm md:placeholder:text-base focus:border-[#1E3A8A] outline-none transition-all" />
    </div>
  );
}

function SelectField({ label, required, options, ...props }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm md:text-base font-bold text-slate-800 mb-2 font-[Urbanist]">
        {label.includes("*") ? label.split("*")[0] : label}
        {required && <span className="text-red-500 font-bold"> *</span>}
      </label>
      <select {...props} className="w-full py-3 px-4 text-sm md:text-base font-[DM_Sans] text-slate-900 bg-white border-2 border-slate-200 rounded-lg focus:border-[#1E3A8A] outline-none transition-all">
        <option value="">Select...</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, ...props }: TextAreaProps) {
  return (
    <div className="mt-3">
      <label className="block text-sm md:text-base font-bold text-slate-800 mb-2 font-[Urbanist]">{label}</label>
      <textarea {...props} className="w-full py-3 px-4 text-sm md:text-base font-[DM_Sans] text-slate-900 bg-white border-2 border-slate-200 rounded-lg placeholder:text-slate-400 placeholder:text-sm md:placeholder:text-base focus:border-[#1E3A8A] outline-none transition-all h-28" />
    </div>
  );
}
