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
        const errorText = await backendResponse.text();
        return NextResponse.json(
          { success: false, error: `Python service pipeline failure: ${errorText}` },
          { status: backendResponse.status }
        );
      }

      // Return definitive operational flag and targeted dashboard redirect
      return NextResponse.json(
        { success: true, redirectUrl: "/job-hunter" }, 
        { status: 200 }
      );
    }

    // ==========================================================
    // BRANCH 2: MANUAL_FORM_SUBMISSION (Handles Structured Forms)
    // ==========================================================
    if (contentType.includes("application/json")) {
      const payload = await req.json();

      const {
        firstName, lastName, dob, school, college, university,
        yearOfPassing, sscGrade, hscGrade, uniGrade, major,
        hasExperience, experienceDetails, skills
      } = payload;

      // Synthesize raw form data fields into a clean corporate Markdown dossier block
      const synthesizedMarkdown = `
# Professional Profile Summary: ${firstName} ${lastName}
- **Date of Birth:** ${dob}
- **Core Specialization/Major:** ${major}
- **Technical Competencies & Skills:** ${Array.isArray(skills) ? skills.join(", ") : skills}

## Academic Dossier
- **University:** ${university} (Graduation/Passing Year: ${yearOfPassing}) | **CGPA:** ${uniGrade}
- **Higher Secondary (College):** ${college} | **HSC GPA:** ${hscGrade}
- **Secondary School:** ${school} | **SSC GPA:** ${sscGrade}

## Professional Experience Portfolio
- **Active Field Experience:** ${hasExperience ? "Yes" : "No"}
- **Engagement Specifics:** ${hasExperience && experienceDetails ? experienceDetails : "Entry-level candidate optimizing core engineering proficiencies."}
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
        const errorText = await backendResponse.text();
        return NextResponse.json(
          { success: false, error: `Python service text embedding failure: ${errorText}` },
          { status: backendResponse.status }
        );
      }

      return NextResponse.json(
        { success: true, redirectUrl: "/job-hunter" }, 
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unsupported Media Pipeline Target Type" }, 
      { status: 415 }
    );

  } catch (error: any) {
    console.error("Critical Proxy Exception during CV Processing:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Vector database synchronization failed. Please check your backend service.", 
        details: error?.message || error 
      }, 
      { status: 500 }
    );
  }
}