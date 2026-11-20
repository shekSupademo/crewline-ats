import { Check, FileText, Loader2, Pencil, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { stageOptions } from "../components/ats";
import { Dropdown } from "../components/Dropdown";
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Panel,
} from "../components/ui";
import { isoDay } from "../data/seed";
import { SOURCES, type Source, STAGE_LABEL } from "../data/types";
import { cx, uid } from "../lib/format";
import {
  type Draft,
  emptyDraft,
  nameFromResume,
  STEPS,
  type Step,
  validateStep,
} from "../lib/newCandidate";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { useUI } from "../state/ui";

const STEP_LABEL: Record<Step, { title: string; hint: string }> = {
  resume: { title: "Resume", hint: "Upload to prefill" },
  details: { title: "Contact details", hint: "Who they are" },
  job: { title: "Job & pipeline", hint: "Where they go" },
  review: { title: "Review", hint: "Check and add" },
};
const TAGS = [
  "Fast track",
  "Silver medalist",
  "Visa needed",
  "Relocating",
  "Strong portfolio",
  "Ex-founder",
  "Part-time ok",
];

export function NewCandidate() {
  const { candidates, jobs, members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const ui = useUI();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [d, setD] = useState<Draft>(() => emptyDraft(params.get("job") ?? ""));
  const [step, setStep] = useState<Step>("resume");
  const [tried, setTried] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const emails = candidates.map((c) => c.email);
  const errors = tried ? validateStep(step, d, emails) : {};
  const at = STEPS.indexOf(step);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((x) => ({ ...x, [k]: v }));
  const job = jobs.find((j) => j.id === d.jobId);

  const go = (target: Step) => {
    const blocked = STEPS.slice(0, STEPS.indexOf(target)).find(
      (s) => Object.keys(validateStep(s, d, emails)).length,
    );
    if (blocked && STEPS.indexOf(target) > at) {
      setStep(blocked);
      setTried(true);
      return;
    }
    setTried(false);
    setStep(target);
  };
  const next = () => {
    if (Object.keys(validateStep(step, d, emails)).length)
      return setTried(true);
    go(STEPS[at + 1]);
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!/\.(pdf|docx?)$/i.test(file.name))
      return toast("Upload a PDF or Word document");
    setParsing(true);
    set("resumeName", file.name);
    // ponytail: fake parse delay so the loading state is testable; no real resume parsing.
    window.setTimeout(() => {
      const name = nameFromResume(file.name);
      setD((x) => ({
        ...x,
        manual: false,
        name: x.name || name,
        currentTitle: x.currentTitle || "Software Engineer",
        currentCompany: x.currentCompany || "Globex",
        location: x.location || "Berlin",
      }));
      setParsing(false);
      toast("Resume parsed — check the prefilled details");
      setStep("details");
    }, 1200);
  };

  const submit = (schedule: boolean) => {
    const id = uid("cand");
    dispatch({
      type: "candidate/create",
      candidate: {
        id,
        name: d.name.trim(),
        email: d.email.trim(),
        phone: d.phone,
        location: d.location,
        currentTitle: d.currentTitle,
        currentCompany: d.currentCompany,
        jobId: d.jobId,
        stage: d.stage,
        rejected: false,
        source: d.source,
        tags: d.tags,
        rating: 0,
        appliedAt: isoDay(new Date()),
        notes:
          d.source === "Referral"
            ? [
                {
                  id: uid("n"),
                  author:
                    members.find((m) => m.id === d.referrerId)?.name ?? "",
                  at: isoDay(new Date()),
                  body: "Referred this candidate.",
                },
              ]
            : [],
        scorecards: [],
      },
    });
    toast(`${d.name.trim()} added to ${job?.title}`);
    navigate(`/candidates/${id}`);
    if (schedule) ui.openSchedule(id);
  };

  return (
    <>
      <nav className="mb-2 text-xs text-zinc-500">
        <Link to="/candidates" className="hover:underline">
          Candidates
        </Link>{" "}
        / New
      </nav>
      <PageHeader
        title="Add candidate"
        subtitle="Upload a resume to prefill their details, or enter them yourself."
        actions={
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            data-testid="new-candidate-cancel"
          >
            <X className="size-4" /> Cancel
          </Button>
        }
      />
      <div
        className="grid gap-6 lg:grid-cols-[220px_1fr]"
        data-testid="new-candidate"
      >
        <ol
          className="flex gap-2 overflow-x-auto lg:flex-col"
          aria-label="Steps"
        >
          {STEPS.map((s, i) => (
            <li key={s} className="shrink-0">
              <button type="button"
                onClick={() => go(s)}
                aria-current={s === step ? "step" : undefined}
                data-testid={`step-${s}`}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                  s === step
                    ? "bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900",
                )}
              >
                <span
                  className={cx(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    i < at
                      ? "bg-teal-600 text-white"
                      : s === step
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                        : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800",
                  )}
                >
                  {i < at ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {STEP_LABEL[s].title}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {STEP_LABEL[s].hint}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <Panel>
          {step === "resume" && (
            <div className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload resume"
                data-testid="resume-dropzone"
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  fileInput.current?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onFile(e.dataTransfer.files[0]);
                }}
                className={cx(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition",
                  dragOver
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
                    : "border-zinc-300 hover:border-teal-400 dark:border-zinc-700",
                )}
              >
                {parsing ? (
                  <Loader2 className="size-8 animate-spin text-teal-600" />
                ) : d.resumeName ? (
                  <FileText className="size-8 text-teal-600" />
                ) : (
                  <UploadCloud className="size-8 text-zinc-400" />
                )}
                <p className="font-medium">
                  {parsing
                    ? `Parsing ${d.resumeName}…`
                    : d.resumeName || "Drop a resume here, or click to browse"}
                </p>
                <p className="text-xs text-zinc-500">
                  PDF or Word, up to 10 MB
                </p>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  data-testid="resume-input"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </div>
              {errors.resume && (
                <p className="text-xs text-rose-600">{errors.resume}</p>
              )}
              <div className="flex items-center justify-between">
                <button type="button"
                  className="text-sm text-teal-700 hover:underline dark:text-teal-300"
                  data-testid="enter-manually"
                  onClick={() => {
                    setD((x) => ({ ...x, manual: true }));
                    setTried(false);
                    setStep("details");
                  }}
                >
                  Enter details manually instead
                </button>
                <Button variant="primary" onClick={next} disabled={parsing}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              {d.resumeName && (
                <p className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                  <FileText className="size-3.5" /> Prefilled from{" "}
                  {d.resumeName}. Check every field.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.name}>
                  <Input
                    name="name"
                    value={d.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <Input
                    name="email"
                    type="email"
                    value={d.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    name="phone"
                    type="tel"
                    value={d.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Location">
                  <Input
                    name="location"
                    value={d.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </Field>
                <Field label="Current title">
                  <Input
                    name="currentTitle"
                    value={d.currentTitle}
                    onChange={(e) => set("currentTitle", e.target.value)}
                  />
                </Field>
                <Field label="Current company">
                  <Input
                    name="currentCompany"
                    value={d.currentCompany}
                    onChange={(e) => set("currentCompany", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="LinkedIn profile"
                hint="Optional"
                error={errors.linkedin}
              >
                <Input
                  name="linkedin"
                  placeholder="https://linkedin.com/in/…"
                  value={d.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                />
              </Field>
              <StepNav onBack={() => go("resume")} onNext={next} />
            </div>
          )}

          {step === "job" && (
            <div className="space-y-4">
              <Field label="Job" error={errors.jobId}>
                <Dropdown
                  label="Job"
                  testId="new-candidate-job"
                  value={d.jobId}
                  onChange={(v) => set("jobId", v)}
                  options={jobs
                    .filter((j) => j.status === "open")
                    .map((j) => ({
                      value: j.id,
                      label: j.title,
                      hint: j.department,
                    }))}
                  placeholder="Search open jobs…"
                />
              </Field>
              <Field label="Starting stage">
                <div
                  className="flex flex-wrap gap-1"
                  role="radiogroup"
                  aria-label="Starting stage"
                  data-testid="new-candidate-stage"
                >
                  {stageOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={d.stage === o.value}
                      onClick={() => set("stage", o.value)}
                      className={cx(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        d.stage === o.value
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source">
                  <Dropdown
                    label="Source"
                    testId="new-candidate-source"
                    searchable={false}
                    value={d.source}
                    onChange={(v: Source) => set("source", v)}
                    options={SOURCES.map((s) => ({ value: s, label: s }))}
                  />
                </Field>
                {d.source === "Referral" && (
                  <Field label="Referred by" error={errors.referrer}>
                    <Dropdown
                      label="Referred by"
                      testId="new-candidate-referrer"
                      value={d.referrerId}
                      onChange={(v) => set("referrerId", v)}
                      options={members.map((m) => ({
                        value: m.id,
                        label: m.name,
                        hint: m.title,
                      }))}
                    />
                  </Field>
                )}
              </div>
              <Field label="Tags">
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Tags"
                >
                  {TAGS.map((t) => {
                    const on = d.tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          set(
                            "tags",
                            on ? d.tags.filter((x) => x !== t) : [...d.tags, t],
                          )
                        }
                        className={cx(
                          "rounded-full border px-2.5 py-0.5 text-xs",
                          on
                            ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                            : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <StepNav onBack={() => go("details")} onNext={next} />
            </div>
          )}

          {step === "review" && (
            <div className="space-y-5" data-testid="new-candidate-review">
              <ReviewSection
                title="Contact details"
                onEdit={() => go("details")}
              >
                <Row k="Name" v={d.name} />
                <Row k="Email" v={d.email} />
                <Row k="Phone" v={d.phone} />
                <Row k="Location" v={d.location} />
                <Row
                  k="Current role"
                  v={[d.currentTitle, d.currentCompany]
                    .filter(Boolean)
                    .join(" at ")}
                />
                <Row k="Resume" v={d.resumeName || "Not attached"} />
              </ReviewSection>
              <ReviewSection title="Job & pipeline" onEdit={() => go("job")}>
                <Row k="Job" v={job?.title} />
                <Row k="Stage" v={STAGE_LABEL[d.stage]} />
                <Row
                  k="Source"
                  v={
                    d.source === "Referral"
                      ? `Referral from ${members.find((m) => m.id === d.referrerId)?.name}`
                      : d.source
                  }
                />
                <div className="flex gap-6">
                  <dt className="w-28 shrink-0 text-zinc-500">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {d.tags.length
                      ? d.tags.map((t) => <Badge key={t}>{t}</Badge>)
                      : "—"}
                  </dd>
                </div>
              </ReviewSection>
              <div className="flex flex-wrap justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <Button onClick={() => go("job")}>Back</Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => submit(true)}
                    data-testid="add-and-schedule"
                  >
                    Add & schedule interview
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => submit(false)}
                    data-testid="add-candidate-submit"
                  >
                    Add candidate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function StepNav({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <Button onClick={onBack}>Back</Button>
      <Button variant="primary" onClick={onNext} data-testid="step-continue">
        Continue
      </Button>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </h2>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="size-3.5" /> Edit
        </Button>
      </header>
      <dl className="space-y-1.5 text-sm">{children}</dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex gap-6">
      <dt className="w-28 shrink-0 text-zinc-500">{k}</dt>
      <dd>{v || "—"}</dd>
    </div>
  );
}
