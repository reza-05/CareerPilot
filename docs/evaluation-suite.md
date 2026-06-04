# Evaluation Suite

These test cases can be run during local QA and used as the documented evaluation suite for submission.

## Test Case 1 - CV Upload and Profile Gate

| Field | Value |
| --- | --- |
| Objective | Verify that the app requires a profile before job search or assistant use |
| Input | Open `/job-hunter` or `/assistant` in a fresh session without uploading a CV |
| Expected Output | The page explains that a CV/profile is required and provides actions to upload or build a profile |
| Actual Output | Profile-required message appears on Job Hunter and Assistant |
| Verdict | Pass |

## Test Case 2 - CV Ingestion

| Field | Value |
| --- | --- |
| Objective | Verify that a CV can be uploaded and prepared |
| Input | Upload a valid PDF CV from the home page |
| Expected Output | The app shows a friendly preparation message, stores the profile, and redirects to Job Hunter |
| Actual Output | CV upload completes and the user is redirected to `/job-hunter` |
| Verdict | Pass |

## Test Case 3 - Live Job Search and Structured Cards

| Field | Value |
| --- | --- |
| Objective | Verify external job search and structured job presentation |
| Input | `Find me ML internships in Dhaka open this month` |
| Expected Output | Job cards show title, source/company, location, salary/deadline fallback, match score, and match reason |
| Actual Output | Job Hunter returns structured cards with fit score and explanation |
| Verdict | Pass |

## Test Case 4 - Assistant Grounded Response

| Field | Value |
| --- | --- |
| Objective | Verify that assistant uses profile context |
| Input | `What skills am I missing for a Google internship?` |
| Expected Output | Assistant returns a skill gap analysis and avoids inventing experience not present in the CV |
| Actual Output | Assistant answers using retrieved CV context |
| Verdict | Pass |

## Test Case 5 - Tracker, Deadline Calendar, and Delete Behavior

| Field | Value |
| --- | --- |
| Objective | Verify tracker persistence and calendar state |
| Input | Track a job with a deadline, open Tracker, then delete the job |
| Expected Output | Job appears in Applied, deadline appears on the calendar, and the deadline marker disappears after deletion |
| Actual Output | Job can be tracked, moved, and deleted; calendar marker reflects current tracked jobs |
| Verdict | Pass |

## Test Case 6 - Cover Letter Draft

| Field | Value |
| --- | --- |
| Objective | Verify selected-job cover letter workflow |
| Input | Click `Draft Cover Letter` from a job card |
| Expected Output | Assistant opens with a job-specific prompt and drafts a personalized letter grounded in the user's profile |
| Actual Output | Assistant receives the selected-job prompt and generates a tailored draft |
| Verdict | Pass |

## Test Case 7 - Responsive Layout

| Field | Value |
| --- | --- |
| Objective | Verify app usability across screen sizes |
| Input | Test pages at mobile, tablet, laptop, and desktop widths |
| Expected Output | Navigation, forms, job cards, assistant chat, and tracker remain readable without horizontal overflow |
| Actual Output | Main pages use responsive layouts and production build passes |
| Verdict | Pass |
