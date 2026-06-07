# Submission Checklist

## Required Links

- Stack Report and Justification: upload `docs/STACK_REPORT.md` as PDF or inside the submission zip to Google Drive.
- Dependencies and Documentation: upload `README.md`, `docs/DEPENDENCIES.md`, `docs/architecture.md`, `docs/SECURITY.md`, and `docs/DEMO_SCRIPT_5_MIN.md`.
- GitHub Repository: make the repository public and submit the public GitHub URL.
- Demonstration Video: record a 5-minute demo using `docs/DEMO_SCRIPT_5_MIN.md`, upload to YouTube or Google Drive, and set it public/unlisted.
- Deployment Link: optional. If unavailable, local + Docker instructions are documented.
- Bonus System Design: include `docs/system-design.md`.
- Bonus Evaluation Suite: include `docs/evaluation-suite.md`.
- Bonus Deployment Guide: include `docs/DEPLOYMENT.md`.

## Before Uploading

- Make every Google Drive link: "Anyone with the link can view."
- Do not upload `.env`, `.env.local`, API keys, service account JSON, `node_modules`, `venv`, `.next`, or `chroma_db`.
- Confirm the GitHub repository is public.
- Run local demo once from a fresh browser.

## Recommended Demo Order

1. Welcome page and login.
2. Upload or show saved CV.
3. Job Hunter search and ranked jobs.
4. Ask AI for selected job.
5. Track job and show deadline/tracker.
6. Show dashboard/profile persistence.
7. End with architecture/security/reliability.

## Firestore Setup

1. Firebase Console -> Firestore Database.
2. Create database.
3. Choose Standard edition.
4. Start in production mode.
5. Region: nearest practical region.
6. Add rules:

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

## Packaging

Run:

```bash
./scripts/package-submission.sh
```

Upload the generated `CareerPilot-submission.zip` to Google Drive for the documentation link.
