# 5-Minute Demo Video Script

## 0:00-0:25 - Opening Hook

Hi, I am presenting CareerPilot, an AI-powered career workspace for job seekers.

Most job platforms make users search first and think later. CareerPilot reverses that flow. It starts with the candidate's CV, understands their profile, ranks opportunities by fit, explains the match, and helps them track every application from one focused workspace.

## 0:25-0:55 - Welcome and Authentication

This is the CareerPilot welcome page. The interface is designed as a clean SaaS workspace with light and dark mode support.

Users can sign in with Google or create an account with email and password. Authentication is powered by Firebase, so each user gets a separate workspace. Their CV, profile, job activity, saved tracker data, and dashboard state are isolated from other users.

## 0:55-1:35 - CV Upload and Profile Memory

After login, the user starts by uploading a CV or building one manually.

CareerPilot saves the active CV and shows file metadata, so the user does not need to upload the same resume again every time they return. If they upload a new CV, the old profile context is replaced and the assistant/job hunter reset for the new profile.

The profile dashboard is connected with the manual CV builder, so information entered in one place can pre-fill the other while staying editable.

## 1:35-2:35 - Job Hunter and Match Scores

Now I will move to Job Hunter.

Instead of only keyword matching, CareerPilot compares job requirements against the user's CV context. Results are ranked from the strongest match to the weakest match by default, and users can adjust sorting.

Each job card shows a match index and a plain-English explanation. This is important because the system is not just saying "this is a good job"; it explains why the role fits or where the candidate may have gaps.

The result is a more transparent job search experience where the candidate can make better decisions faster.

## 2:35-3:20 - Ask AI With Selected Job Context

For any role, the user can click Ask AI.

The assistant opens with the selected job context already attached: title, company, location, deadline, match score, and the fit explanation. The assistant also uses the saved CV profile, so the conversation is personalized.

For example, I can ask: "Analyze this role against my CV and suggest the strongest next steps." The assistant gives practical guidance such as alignment, strengths, gaps, and application strategy.

This chat is connected to the assistant workspace and can persist until the user clears it.

## 3:20-4:10 - Tracker, Goals, Deadlines, and Progress

Next is the tracker.

When a user tracks a job, it moves into an application pipeline with statuses like Applied, Interviewing, Offer, and Rejected. If a deadline is available, it appears in the deadline calendar. If no deadline is found, CareerPilot asks the user to add it manually so they do not lose important follow-up timing.

The tracker also includes weekly goals, progress analytics, and AI nudges. This turns CareerPilot from a one-time search tool into a daily career operating system.

## 4:10-4:40 - Architecture, Reliability, and Security

Under the hood, CareerPilot uses Next.js and React on the frontend, FastAPI on the backend, Firebase for authentication, Firestore for user-scoped state, ChromaDB for CV retrieval, Tavily for job search, Gemini as the primary AI model, and Groq as a fallback provider.

The system includes validation, secure file handling, user-scoped data rules, generic error responses, security headers, and optional backend Firebase token verification.

## 4:40-5:00 - Closing

CareerPilot is built for a real job seeker's workflow: understand the CV, find better-fit opportunities, explain every recommendation, assist with decisions, and keep applications organized.

The final outcome is not just another job board. It is a personalized career workspace that helps candidates act with clarity and consistency.

Thank you.
