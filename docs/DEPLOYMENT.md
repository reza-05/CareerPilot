# CareerPilot Deployment Guide

This guide explains how to deploy CareerPilot for the live deployment bonus point.

## Recommended Deployment Architecture

CareerPilot has two deployable services:

- Frontend: Next.js app
- Backend: FastAPI app

Recommended setup:

- Frontend on Vercel
- Backend on Render, Railway, Fly.io, or another Python/container host
- Firebase Authentication and Firestore as managed cloud services

## Step 1 - Deploy Backend First

The frontend uses `BACKEND_SERVICE_URL`, so deploy the backend first and copy its public URL.

Backend start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

If the host does not provide `$PORT`, use:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend environment variables:

```env
GOOGLE_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
TAVILY_API_KEY=your_tavily_api_key
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
REQUIRE_FIREBASE_AUTH=true
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GEMINI_BUDGET_SECONDS=6
GROQ_TIMEOUT_SECONDS=8
```

For first smoke test only, `REQUIRE_FIREBASE_AUTH=false` can be used temporarily. For final judging, use `true` if Firebase Admin credentials are configured.

## Step 2 - Deploy Frontend on Vercel

In Vercel:

```text
Framework Preset: Next.js
Root Directory: careerpilot-frontend
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Frontend environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
BACKEND_SERVICE_URL=https://your-backend-public-url
```

## Step 3 - Firebase Configuration

Enable Authentication providers:

- Google
- Email/password

Add authorized domains:

- `localhost`
- your Vercel domain

Enable Firestore and use this rule:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /careerpilot_users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4 - Smoke Test

After deployment:

1. Open the Vercel URL.
2. Sign in with Google.
3. Upload a CV.
4. Search for jobs.
5. Open `Ask AI` on a selected job.
6. Track a job.
7. Open Tracker and verify dashboard/deadline data.

## Step 5 - Submission

Submit the Vercel URL only if the hosted version is stable. If the backend is not stable before the deadline, submit the documented Docker/local setup instead of a broken deployment link.
