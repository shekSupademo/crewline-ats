import { Star } from "lucide-react";
import { useState } from "react";
import { isoDay } from "../data/seed";
import {
  type Candidate,
  DEPARTMENTS,
  INTERVIEW_KINDS,
  type InterviewKind,
  SOURCES,
  type Source,
  STAGE_LABEL,
  STAGES,
  type Stage,
} from "../data/types";
import { cx, uid } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { Dropdown } from "./Dropdown";
import { Badge, Button, Field, Input, Modal } from "./ui";

const stageTone: Record<Stage, "gray" | "blue" | "amber" | "green"> = {
  applied: "gray",
  screen: "blue",
  interview: "blue",
  offer: "amber",
  hired: "green",
};
export function StageBadge({
  c,
}: {
  c: Pick<Candidate, "stage" | "rejected">;
}) {
  return c.rejected ? (
    <Badge tone="red">Rejected</Badge>
  ) : (
    <Badge tone={stageTone[c.stage]}>{STAGE_LABEL[c.stage]}</Badge>
  );
}

export function Stars({
  value,
  onChange,
  size = "sm",
  label = "Rating",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div
      role={onChange ? "radiogroup" : "img"}
      aria-label={`${label}: ${value} of 5`}
      className="inline-flex"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Star
            className={cx(
              size === "sm" ? "size-3.5" : "size-5",
              n <= shown
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-300 dark:text-zinc-600",
            )}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(value === n ? 0 : n)}
            className="p-0.5"
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

export const stageOptions = STAGES.map((s) => ({
  value: s,
  label: STAGE_LABEL[s],
}));
export const departmentOptions = DEPARTMENTS.map((d) => ({
  value: d,
  label: d,
}));

export function ScheduleInterviewModal({
  open,
  onClose,
  candidateId,
}: {
  open: boolean;
  onClose: () => void;
  candidateId?: string;
}) {
  const { candidates, members, jobs } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [cand, setCand] = useState(candidateId ?? "");
  const [kind, setKind] = useState<InterviewKind>("Technical");
  const [who, setWho] = useState<string[]>([]);
  const [date, setDate] = useState(isoDay(new Date(Date.now() + 86400000)));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("45");
  const [location, setLocation] = useState("Google Meet");
  const [tried, setTried] = useState(false);

  const start = new Date(`${date}T${time}`);
  const errors = {
    cand: !cand ? "Choose a candidate" : undefined,
    who: who.length === 0 ? "Add at least one interviewer" : undefined,
    date: Number.isNaN(start.getTime())
      ? "Enter a date and time"
      : start < new Date()
        ? "Pick a time in the future"
        : undefined,
  };
  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    dispatch({
      type: "interview/create",
      interview: {
        id: uid("int"),
        candidateId: cand,
        interviewerIds: who,
        start: start.toISOString(),
        durationMin: Number(duration),
        kind,
        location,
      },
    });
    toast(
      `Interview scheduled with ${candidates.find((c) => c.id === cand)?.name}`,
    );
    onClose();
  };
  const active = candidates.filter((c) => !c.rejected && c.stage !== "hired");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule interview"
      wide
      testId="schedule-modal"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={submit}
            data-testid="schedule-submit"
          >
            Schedule
          </Button>
        </>
      }
    >
      <Field label="Candidate" error={tried ? errors.cand : undefined}>
        <Dropdown
          label="Candidate"
          value={cand}
          onChange={setCand}
          testId="schedule-candidate"
          options={active.map((c) => ({
            value: c.id,
            label: c.name,
            hint: jobs.find((j) => j.id === c.jobId)?.title,
          }))}
          placeholder="Search candidates…"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Interview type">
          <Dropdown
            label="Interview type"
            value={kind}
            onChange={setKind}
            searchable={false}
            options={INTERVIEW_KINDS.map((k) => ({ value: k, label: k }))}
          />
        </Field>
        <Field label="Location">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Interviewers" error={tried ? errors.who : undefined}>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Interviewers"
          data-testid="schedule-interviewers"
        >
          {members.map((m) => {
            const on = who.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setWho(on ? who.filter((x) => x !== m.id) : [...who, m.id])
                }
                className={cx(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  on
                    ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300",
                )}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date" error={tried ? errors.date : undefined}>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Start time">
          <Input
            type="time"
            step={900}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <Field label="Duration">
          <Dropdown
            label="Duration"
            value={duration}
            onChange={setDuration}
            searchable={false}
            options={["30", "45", "60", "90"].map((d) => ({
              value: d,
              label: `${d} min`,
            }))}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function AddCandidateModal({
  open,
  onClose,
  jobId,
}: {
  open: boolean;
  onClose: () => void;
  jobId?: string;
}) {
  const { jobs } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [f, setF] = useState({
    name: "",
    email: "",
    currentTitle: "",
    currentCompany: "",
    location: "",
  });
  const [job, setJob] = useState(jobId ?? "");
  const [source, setSource] = useState<Source>("Sourced");
  const [tried, setTried] = useState(false);
  const errors = {
    name: f.name.trim().length < 2 ? "Enter a full name" : undefined,
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Enter a valid email" : undefined,
    job: !job ? "Choose a job" : undefined,
  };
  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    dispatch({
      type: "candidate/create",
      candidate: {
        id: uid("cand"),
        ...f,
        phone: "",
        jobId: job,
        stage: "applied",
        rejected: false,
        source,
        tags: [],
        rating: 0,
        appliedAt: isoDay(new Date()),
        notes: [],
        scorecards: [],
      },
    });
    toast(`${f.name} added`);
    setF({
      name: "",
      email: "",
      currentTitle: "",
      currentCompany: "",
      location: "",
    });
    setTried(false);
    onClose();
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add candidate"
      wide
      testId="add-candidate-modal"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={submit}
            data-testid="add-candidate-submit"
          >
            Add candidate
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={tried ? errors.name : undefined}>
          <Input value={f.name} onChange={set("name")} name="name" />
        </Field>
        <Field label="Email" error={tried ? errors.email : undefined}>
          <Input
            type="email"
            value={f.email}
            onChange={set("email")}
            name="email"
          />
        </Field>
        <Field label="Current title">
          <Input value={f.currentTitle} onChange={set("currentTitle")} />
        </Field>
        <Field label="Current company">
          <Input value={f.currentCompany} onChange={set("currentCompany")} />
        </Field>
        <Field label="Location">
          <Input value={f.location} onChange={set("location")} />
        </Field>
        <Field label="Source">
          <Dropdown
            label="Source"
            value={source}
            onChange={setSource}
            searchable={false}
            options={SOURCES.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      </div>
      <Field label="Job" error={tried ? errors.job : undefined}>
        <Dropdown
          label="Job"
          value={job}
          onChange={setJob}
          options={jobs
            .filter((j) => j.status === "open")
            .map((j) => ({ value: j.id, label: j.title, hint: j.department }))}
        />
      </Field>
    </Modal>
  );
}
