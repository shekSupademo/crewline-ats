# Crewline ATS

A frontend-only recruiting app (applicant tracking system) for testing tools that interact with a realistic, complex SaaS UI. Crewline is a fictional company, and every person and company in it is made up.

There's no backend. Sample data is generated from a fixed seed and kept in the browser's `localStorage`. **Settings → Company → Reset demo data** restores it.

## Pages and flows

| Route | What you can do |
|---|---|
| `#/` Dashboard | Stat tiles, pipeline funnel, upcoming interviews, applicants-by-source chart, a "Needs review" list |
| `#/jobs` | Open, Drafts and Closed tabs, search, department filter, a hover menu per row (duplicate, close, publish), and a four-step **Post a job** wizard (details, compensation, screening questions, review) with validation |
| `#/jobs/:id` | **Drag-and-drop kanban pipeline** (Applied → Phone screen → Interview → Offer → Hired). Drag across columns or reorder within one. Each card has a hover menu with a **Move to ▸** submenu, Schedule and Reject. "Show rejected" toggle, plus a Job details tab |
| `#/candidates` | Search, filters kept in the URL (job, stage, source, status), sortable columns, pagination, checkbox selection with a **bulk bar** (move stage, add tag, reject), CSV export |
| `#/candidates/:id` | Clickable stage progress bar, Advance and Reject, star rating, job reassignment, editable tags, and tabs for resume, notes, scorecards (stars plus recommendation) and interviews |
| `#/interviews` | Week calendar with previous and next week, an interviewer filter, and events linking to the candidate |
| `#/settings` | Company name and theme, team invites and roles (the last admin can't be demoted or removed), notification toggles, a rejection email template editor, and reset data |

Available everywhere:
- A **Create** menu: Add candidate, Post a job, Schedule interview (multi-field modal with a searchable candidate picker, interviewer chips, and date and time validation)
- A **Reject** modal with a reason dropdown and a live email preview from the template
- **⌘K / Ctrl+K**: a command palette that searches pages, actions, candidates and jobs
- Dark mode, mobile navigation, and toasts

Searchable dropdowns use `role="combobox"`. Key elements carry `data-testid` attributes for automated checks.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # type-check and build to dist/
```

## Deploy

`.github/workflows/pages.yml` builds every push to `main` and publishes it to GitHub Pages.

Stack: React 19, React Router 7 (hash routing for Pages), Tailwind CSS 4, Recharts, Vite 6, TypeScript.
