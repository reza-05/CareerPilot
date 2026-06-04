import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobDescription = body.jobDescription || "";
    const candidateData = body.candidateData || body.userId || "Software Developer";

    if (!GEMINI_KEY) {
      return NextResponse.json({ 
        error: "Missing API Key", 
        details: "Please make sure GOOGLE_API_KEY is configured." 
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    // OLD SDK version friendly model name used here to fix the 404 error
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      You are an expert ATS and Resume Analyzer. 
      Analyze this candidate data: ${typeof candidateData === 'object' ? JSON.stringify(candidateData) : candidateData}
      Against this job description: ${jobDescription}
      
      Return ONLY a raw, valid JSON object matching this schema perfectly. No markdown, no triple backticks:
      {
        "success": true,
        "matchPercentage": 85,
        "matchingReason": "Write a 3-sentence dynamic comparison based on the actual input skills and job requirements.",
        "missingSkills": ["Required Skill 1", "Required Skill 2"],
        "recommendations": ["Action item 1", "Action item 2"],
        "coverLetter": "Write a 2-paragraph professional cover letter dynamically tailored for this position."
      }
    `;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.includes("```")) {
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    const parsedJSON = JSON.parse(text);
    return NextResponse.json(parsedJSON);
    
  } catch (error: unknown) {
    console.error("Gemini Live Error:", error);
    return NextResponse.json({ 
      error: "Live AI Generation Failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
