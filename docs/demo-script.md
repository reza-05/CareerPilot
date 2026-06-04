# 5-Minute Demo Script

## Goal

Show the required flow clearly:

```text
CV upload -> job search -> fit score -> assistant query -> cover letter draft -> tracker update
```

## 0:00-0:30 - Problem and Product

Say:

> Job seekers usually jump between job boards, resume tools, AI chat apps, and spreadsheets. CareerPilot brings these into one CV-grounded career workspace. The key idea is that every recommendation starts from the user's real CV, so the assistant does not invent background information.

Show:

- CareerPilot home/profile screen
- Navigation: CV, Jobs, Assistant, Tracker

## 0:30-1:15 - CV Upload or Manual Profile

Action:

1. Upload a CV PDF or open the manual CV builder.
2. Submit the profile.
3. Wait for the profile preparation message.
4. Show redirect to Job Hunter.

Say:

> CareerPilot first prepares the candidate profile. Job search and assistant access are locked until the user provides a CV or profile, because all downstream features depend on this data.


## 1:15-2:10 - Job Hunter Agent

Action:

1. Search: `Find me ML internships in Dhaka open this month`.
2. Show structured job cards.
3. Highlight role, company/source, salary, deadline, location, match score.

Say:

> The Job Hunter uses a live external search tool, then CareerPilot scores every result against the uploaded CV. The fit score is computed programmatically and explained using the candidate's own CV context.

## 2:10-2:55 - Fit Score and Reasoning

Action:

1. Pick one job card.
2. Point to match percentage.
3. Read the match explanation briefly.

Say:

> This is not just a generic AI answer. The explanation references evidence from the candidate profile, so the user can understand why the role is or is not a good match.

## 2:55-3:40 - Assistant Query

Action:

1. Open Assistant.
2. Ask: `What skills am I missing for a Google internship?`
3. Ask or click: `Build me a 3-month roadmap to become job-ready.`

Say:

> The assistant retrieves relevant CV context before answering. It can evaluate readiness, identify skill gaps, produce learning roadmaps, and draft personalized application content.

## 3:40-4:15 - Cover Letter Draft

Action:

1. Go back to a job card.
2. Click `Draft Cover Letter`.
3. Show assistant prompt and generated draft.

Say:

> The cover letter is personalized from the selected job and the candidate's actual profile, which makes it more useful than a generic template.

## 4:15-4:50 - Tracker

Action:

1. Click `Track Job` from a job card.
2. Open Tracker.
3. Show the job in Applied.
4. Drag it to Interviewing.
5. Show deadline calendar and goal setting.

Say:

> CareerPilot also helps with accountability. Applications move through a kanban board, deadlines appear on the calendar, and weekly goals help the user keep making progress.

## 4:50-5:00 - Closing

Say:

> CareerPilot is an end-to-end career co-pilot: it understands the user, hunts jobs, scores fit, drafts applications, and keeps the user accountable until they get hired.

## Backup Demo Query Set

- `Find me frontend developer internships in Dhaka`
- `Am I ready for this data engineer role?`
- `What skills am I missing for a Google internship?`
- `Build me a 3-month roadmap to become job-ready.`
- `Draft a personalized cover letter for this role.`
