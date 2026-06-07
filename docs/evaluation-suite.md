# CareerPilot Evaluation Suite

This suite documents test cases with input, expected output, actual output, and pass/fail verdicts.

## Test Case 1 - Authentication Gate

| Field | Value |
| --- | --- |
| Objective | Verify protected pages require a signed-in user |
| Input | Open `/cv-upload`, `/job-hunter`, `/assistant`, or `/tracker` while signed out |
| Expected Output | User is guided to login before accessing app features |
| Actual Output | Protected app flow requires authentication |
| Verdict | Pass |

## Test Case 2 - Google Sign-In

| Field | Value |
| --- | --- |
| Objective | Verify Firebase Google login |
| Input | Click login and continue with Google |
| Expected Output | User signs in and reaches CareerPilot workspace |
| Actual Output | Google login works and app navigation appears |
| Verdict | Pass |

## Test Case 3 - Email Signup Validation

| Field | Value |
| --- | --- |
| Objective | Verify secure email/password account creation |
| Input | Enter email, weak password, then strong matching passwords |
| Expected Output | Weak password is blocked; valid password enables account creation |
| Actual Output | Password and confirm-password validation control the signup button |
| Verdict | Pass |

## Test Case 4 - Saved CV State

| Field | Value |
| --- | --- |
| Objective | Verify uploaded CV remains available after reload |
| Input | Upload a PDF CV, reload the website, restart servers |
| Expected Output | Same user sees saved CV metadata and can continue without re-upload |
| Actual Output | Saved CV card appears for the authenticated user |
| Verdict | Pass |

## Test Case 5 - CV Replacement Reset

| Field | Value |
| --- | --- |
| Objective | Verify new CV replaces old profile context |
| Input | Upload CV A, use Job Hunter/Assistant, then upload CV B |
| Expected Output | Old job/chat context resets and app uses CV B |
| Actual Output | Workspace resets for the new CV context |
| Verdict | Pass |

## Test Case 6 - Job Search Results

| Field | Value |
| --- | --- |
| Objective | Verify live job search returns multiple structured results |
| Input | Search `Remote developer jobs open to Bangladesh` |
| Expected Output | Multiple job cards appear with title, company, location, deadline/salary fallback, match score, and explanation |
| Actual Output | Job Hunter returns structured fit-ranked cards |
| Verdict | Pass |

## Test Case 7 - Match Score Explanation

| Field | Value |
| --- | --- |
| Objective | Verify match score is explainable and CV-aware |
| Input | Compare a strong technical CV against software/internship jobs |
| Expected Output | Explanation references relevant CV skills, experience, and gaps |
| Actual Output | Explanation describes alignment and missing evidence |
| Verdict | Pass |

## Test Case 8 - Selected-Job AI Chat

| Field | Value |
| --- | --- |
| Objective | Verify job context reaches the assistant |
| Input | Click `Ask AI` on a job and ask for next steps |
| Expected Output | Assistant references selected role and CV/profile context |
| Actual Output | Assistant provides role-specific guidance |
| Verdict | Pass |

## Test Case 9 - Chat Auto Scroll

| Field | Value |
| --- | --- |
| Objective | Verify newest messages remain visible |
| Input | Send a message and wait for AI response |
| Expected Output | Chat scrolls to user message, loading state, and AI reply |
| Actual Output | Chat automatically scrolls to the latest content |
| Verdict | Pass |

## Test Case 10 - Tracker Deadline Behavior

| Field | Value |
| --- | --- |
| Objective | Verify tracked job deadlines appear and disappear correctly |
| Input | Track a job with deadline, then delete it |
| Expected Output | Calendar marker appears after tracking and disappears after deletion |
| Actual Output | Calendar reflects current tracked jobs |
| Verdict | Pass |

## Test Case 11 - Missing Deadline Prompt

| Field | Value |
| --- | --- |
| Objective | Verify user gets guidance when no deadline is detected |
| Input | Track a job without deadline information |
| Expected Output | App asks user to add a deadline manually |
| Actual Output | Short formal warning appears |
| Verdict | Pass |

## Test Case 12 - Progress Dashboard

| Field | Value |
| --- | --- |
| Objective | Verify dashboard uses real tracker/profile data |
| Input | Track, move, and delete applications |
| Expected Output | Status counts, weekly activity, and profile skills update from real state |
| Actual Output | Dashboard reflects tracked application data |
| Verdict | Pass |

## Test Case 13 - Responsive UI

| Field | Value |
| --- | --- |
| Objective | Verify pages work across mobile, laptop, and desktop |
| Input | Test at mobile, tablet, 13-inch laptop, and 22-inch desktop sizes |
| Expected Output | No core workflow requires awkward horizontal scrolling |
| Actual Output | Main pages are responsive and readable |
| Verdict | Pass |

## Test Case 14 - AI Fallback

| Field | Value |
| --- | --- |
| Objective | Verify app handles AI provider limits |
| Input | Trigger AI when Gemini is unavailable or rate-limited |
| Expected Output | Backend attempts Groq fallback or returns friendly unavailable response |
| Actual Output | Fallback path keeps app stable |
| Verdict | Pass |

## Test Case 15 - User Data Separation

| Field | Value |
| --- | --- |
| Objective | Verify two users do not share CV/profile/tracker data |
| Input | User A uploads CV, signs out; User B signs in |
| Expected Output | User B does not see User A data |
| Actual Output | Workspace state is scoped by Firebase UID |
| Verdict | Pass |
