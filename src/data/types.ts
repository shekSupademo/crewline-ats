export const STAGES = [
  "applied",
  "screen",
  "interview",
  "offer",
  "hired",
] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  applied: "Applied",
  screen: "Phone screen",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
};

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Sales",
  "Marketing",
  "Customer Success",
  "People",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const SOURCES = [
  "LinkedIn",
  "Referral",
  "Careers page",
  "Indeed",
  "Agency",
  "Sourced",
] as const;
export type Source = (typeof SOURCES)[number];

export type JobStatus = "open" | "draft" | "closed";
export type EmploymentType = "Full-time" | "Part-time" | "Contract";

export type Job = {
  id: string;
  title: string;
  department: Department;
  location: string;
  remote: boolean;
  type: EmploymentType;
  status: JobStatus;
  hiringManagerId: string;
  openedAt: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  questions: string[];
};

export type Note = { id: string; author: string; at: string; body: string };
export type Recommendation = "strong_yes" | "yes" | "no" | "strong_no";
export type Scorecard = {
  id: string;
  interviewer: string;
  rating: number;
  recommendation: Recommendation;
  comment: string;
  at: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  jobId: string;
  stage: Stage;
  rejected: boolean;
  rejectReason?: string;
  source: Source;
  tags: string[];
  rating: number;
  appliedAt: string;
  notes: Note[];
  scorecards: Scorecard[];
};

export const INTERVIEW_KINDS = [
  "Phone screen",
  "Technical",
  "Onsite",
  "Culture fit",
  "Final",
] as const;
export type InterviewKind = (typeof INTERVIEW_KINDS)[number];
export type Interview = {
  id: string;
  candidateId: string;
  interviewerIds: string[];
  start: string;
  durationMin: number;
  kind: InterviewKind;
  location: string;
};

export type Role = "admin" | "recruiter" | "interviewer";
export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
};

export type Settings = {
  companyName: string;
  userName: string;
  theme: "light" | "dark" | "system";
  notifyNewApplicant: boolean;
  notifyScorecard: boolean;
  notifyDigest: boolean;
  rejectTemplate: string;
};

export type AppState = {
  jobs: Job[];
  candidates: Candidate[];
  interviews: Interview[];
  members: Member[];
  settings: Settings;
};
