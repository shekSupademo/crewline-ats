import type { Source, Stage } from "../data/types";

export const STEPS = ["resume", "details", "job", "review"] as const;
export type Step = (typeof STEPS)[number];

export type Draft = {
  resumeName: string;
  manual: boolean;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  linkedin: string;
  jobId: string;
  stage: Stage;
  source: Source;
  referrerId: string;
  tags: string[];
};

export const emptyDraft = (jobId = ""): Draft => ({
  resumeName: "",
  manual: false,
  name: "",
  email: "",
  phone: "",
  location: "",
  currentTitle: "",
  currentCompany: "",
  linkedin: "",
  jobId,
  stage: "applied",
  source: "Sourced",
  referrerId: "",
  tags: [],
});

const NOISE = new Set(["resume", "cv", "final", "updated", "new"]);
export function nameFromResume(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .split(/[\s_-]+/)
    .filter((w) => w && !NOISE.has(w.toLowerCase()) && !/\d/.test(w))
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function validateStep(
  step: Step,
  d: Draft,
  existingEmails: string[],
): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === "resume" && !d.resumeName && !d.manual)
    e.resume = "Upload a resume or choose to enter details manually";
  if (step === "details") {
    if (d.name.trim().split(/\s+/).length < 2)
      e.name = "Enter a first and last name";
    if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Enter a valid email";
    else if (
      existingEmails.some(
        (x) => x.toLowerCase() === d.email.trim().toLowerCase(),
      )
    )
      e.email = "A candidate with this email already exists";
    if (d.linkedin && !/^https:\/\/\S+$/.test(d.linkedin))
      e.linkedin = "Enter a full https:// URL";
  }
  if (step === "job") {
    if (!d.jobId) e.jobId = "Choose a job";
    if (d.source === "Referral" && !d.referrerId)
      e.referrer = "Choose who referred them";
  }
  return e;
}
