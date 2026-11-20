import { describe, expect, it } from "vitest";
import { emptyDraft, nameFromResume, validateStep } from "./newCandidate";

describe("nameFromResume", () => {
  it("turns a resume file name into a title-cased name", () => {
    expect(nameFromResume("jane-doe_resume.pdf")).toBe("Jane Doe");
    expect(nameFromResume("CV Marco Rossi 2026.docx")).toBe("Marco Rossi");
  });

  it("returns an empty string when no name is left", () => {
    expect(nameFromResume("resume.pdf")).toBe("");
  });
});

describe("validateStep", () => {
  const filled = {
    ...emptyDraft(),
    name: "Jane Doe",
    email: "jane@mail.example",
    jobId: "job_1",
  };

  it("requires a resume or the manual-entry choice on the resume step", () => {
    expect(validateStep("resume", emptyDraft(), [])).toEqual({
      resume: "Upload a resume or choose to enter details manually",
    });
    expect(
      validateStep("resume", { ...emptyDraft(), manual: true }, []),
    ).toEqual({});
  });

  it("flags a missing name, bad email and duplicate email on the details step", () => {
    expect(validateStep("details", emptyDraft(), [])).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
    });
    expect(validateStep("details", filled, ["JANE@mail.example"])).toEqual({
      email: "A candidate with this email already exists",
    });
    expect(
      validateStep(
        "details",
        { ...filled, linkedin: "linkedin.com/in/jane" },
        [],
      ),
    ).toEqual({ linkedin: "Enter a full https:// URL" });
    expect(validateStep("details", filled, [])).toEqual({});
  });

  it("requires a job, and a referrer when the source is Referral", () => {
    expect(validateStep("job", { ...filled, jobId: "" }, [])).toEqual({
      jobId: "Choose a job",
    });
    expect(validateStep("job", { ...filled, source: "Referral" }, [])).toEqual({
      referrer: "Choose who referred them",
    });
    expect(
      validateStep(
        "job",
        { ...filled, source: "Referral", referrerId: "m_raj" },
        [],
      ),
    ).toEqual({});
  });
});
