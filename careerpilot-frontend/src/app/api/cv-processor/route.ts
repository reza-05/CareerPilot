import { NextRequest, NextResponse } from "next/server";

// Points directly to your local Python backend service running ChromaDB
const BACKEND_SERVICE_URL = "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    // Dynamically fallback if x-user-id isn't injected yet by auth middleware
    const userId = req.headers.get("x-user-id") || "anonymous_session_user";

    // ==========================================================
    // BRANCH 1: FILE_UPLOAD_STREAM (Handles CV Uploader Component)
    // ==========================================================
    if (contentType.includes("multipart/form-data")) {
      const incomingFormData = await req.formData();
      const file = incomingFormData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "Missing payload stream key 'file'" }, 
          { status: 400 }
        );
      }

      // Re-package into a fresh FormData wrapper to safely stream over to Python FastAPI
      const outwardFormData = new FormData();
      outwardFormData.append("file", file);
      outwardFormData.append("userId", userId);
      outwardFormData.append("type", "resume_parsed");
      
      // Enforce your exact chunking strategy specs (Chunk: 500, Overlap: 50)
      outwardFormData.append("chunk_size", "500");
      outwardFormData.append("chunk_overlap", "50");

      const backendResponse = await fetch(`${BACKEND_SERVICE_URL}/api/cv-upload`, {
        method: "POST",
        body: outwardFormData,
      });

      if (!backendResponse.ok) {
        return NextResponse.json(
          { success: false, error: "We could not prepare your resume right now. Please try again." },
          { status: backendResponse.status }
        );
      }

      const backendData = await backendResponse.json();

      // Return definitive operational flag and targeted dashboard redirect
      return NextResponse.json(
        { success: true, redirectUrl: "/job-hunter", skills: backendData.skills || [] },
        { status: 200 }
      );
    }

    // ==========================================================
    // BRANCH 2: MANUAL_FORM_SUBMISSION (Handles Structured Forms)
    // ==========================================================
    if (contentType.includes("application/json")) {
      const payload = await req.json();

      const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim() || "Demo Candidate";
      const skills = Array.isArray(payload.skills) ? payload.skills.join(", ") : payload.skills || "Not specified";
      const languages = Array.isArray(payload.languages) ? payload.languages.join(", ") : payload.languages || "Not specified";
      const hasExperience = payload.isWorkEnabled || payload.hasExperience;

      // Synthesize raw form data fields into a clean corporate Markdown dossier block
      const synthesizedMarkdown = `
# Professional Profile Summary: ${fullName}
- **Headline:** ${payload.headline || "Career-focused candidate"}
- **Email:** ${payload.email || "Not specified"}
- **Phone:** ${payload.phone || "Not specified"}
- **Location:** ${payload.address || "Not specified"}
- **Date of Birth:** ${payload.dob || "Not specified"}
- **LinkedIn:** ${payload.linkedIn || "Not specified"}
- **GitHub:** ${payload.github || "Not specified"}
- **Core Specialization/Major:** ${payload.uniMajor || payload.major || "Not specified"}
- **Technical Competencies & Skills:** ${skills}
- **Languages:** ${languages}

## Career Summary
${payload.summary || "Entry-level candidate building practical career readiness."}

## Academic Dossier
- **University:** ${payload.uniName || payload.university || "Not specified"} | **Degree:** ${payload.uniDegree || "Not specified"} | **Major:** ${payload.uniMajor || "Not specified"} | **Year:** ${payload.uniYear || payload.yearOfPassing || "Not specified"} | **CGPA:** ${payload.uniGpa || payload.uniGrade || "Not specified"}
- **Higher Secondary:** ${payload.hscCollege || payload.college || "Not specified"} | **Group:** ${payload.hscGroup || "Not specified"} | **Year:** ${payload.hscYear || "Not specified"} | **GPA:** ${payload.hscGpa || payload.hscGrade || "Not specified"}
- **Secondary School:** ${payload.sscSchool || payload.school || "Not specified"} | **Group:** ${payload.sscGroup || "Not specified"} | **Year:** ${payload.sscYear || "Not specified"} | **GPA:** ${payload.sscGpa || payload.sscGrade || "Not specified"}

## Professional Experience Portfolio
- **Active Field Experience:** ${hasExperience ? "Yes" : "No"}
- **Role:** ${payload.workTitle || "Not specified"}
- **Organization:** ${payload.workCompany || "Not specified"}
- **Timeline:** ${payload.workYear || "Not specified"}
- **Engagement Specifics:** ${hasExperience && (payload.workDesc || payload.experienceDetails) ? (payload.workDesc || payload.experienceDetails) : "Entry-level candidate optimizing core engineering proficiencies."}

## Projects
${payload.projects || "Not specified"}

## Certifications
${payload.certs || "Not specified"}
      `.trim();

      // Forward synthesized profile summary string to Python backend data pipelines
      const backendResponse = await fetch(`${BACKEND_SERVICE_URL}/api/cv-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          text_chunk: synthesizedMarkdown,
          type: "resume_built",
          chunk_size: 500,
          chunk_overlap: 50
        }),
      });

      if (!backendResponse.ok) {
        return NextResponse.json(
          { success: false, error: "We could not prepare your profile right now. Please try again." },
          { status: backendResponse.status }
        );
      }

      const backendData = await backendResponse.json();

      return NextResponse.json(
        { success: true, redirectUrl: "/job-hunter", skills: backendData.skills || [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unsupported profile submission format." },
      { status: 415 }
    );

  } catch (error: unknown) {
    console.error("Critical Proxy Exception during CV Processing:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "We could not save your profile right now. Please try again.", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}
