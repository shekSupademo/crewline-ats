import { Copy, Lock, MapPin, Plus, Trash2, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { departmentOptions } from "../components/ats";
import { Dropdown } from "../components/Dropdown";
import { HoverMenu } from "../components/HoverMenu";
import {
  Badge,
  Button,
  Empty,
  Field,
  Input,
  Modal,
  PageHeader,
  Panel,
  Tabs,
} from "../components/ui";
import { isoDay } from "../data/seed";
import type { Department, EmploymentType, Job, JobStatus } from "../data/types";
import { cx, shortDate, uid } from "../lib/format";
import { salary } from "../lib/theme";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

export function Jobs() {
  const { jobs, candidates, members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<JobStatus>("open");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<Department | "">("");

  const rows = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status === tab &&
          (!dept || j.department === dept) &&
          j.title.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [jobs, tab, dept, q],
  );
  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Requisitions and their hiring pipelines."
        actions={
          <Button
            variant="primary"
            data-testid="new-job"
            onClick={() => setParams({ new: "1" })}
          >
            <Plus className="size-4" /> Post a job
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "open", label: "Open", count: count("open") },
            { value: "draft", label: "Drafts", count: count("draft") },
            { value: "closed", label: "Closed", count: count("closed") },
          ]}
        />
        <div className="flex gap-2">
          <Input
            placeholder="Search jobs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-56"
            aria-label="Search jobs"
          />
          <Dropdown
            label="Department"
            className="w-48"
            value={dept}
            onChange={(v) => setDept(v === dept ? "" : v)}
            options={departmentOptions}
            placeholder="All departments"
            testId="dept-filter"
          />
          {dept && (
            <Button variant="ghost" onClick={() => setDept("")}>
              Clear
            </Button>
          )}
        </div>
      </div>
      <Panel padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="jobs-table">
            <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Hiring manager</th>
                <th className="px-3 py-3 font-medium">Pipeline</th>
                <th className="px-3 py-3 font-medium">Salary</th>
                <th className="px-3 py-3 font-medium">Opened</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((j) => {
                const cs = candidates.filter(
                  (c) => c.jobId === j.id && !c.rejected,
                );
                return (
                  <tr
                    key={j.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    onClick={() => navigate(`/jobs/${j.id}`)}
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/jobs/${j.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {j.title}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="size-3" />
                        {j.location}
                        {j.remote && " · Remote OK"} · {j.department} · {j.type}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {members.find((m) => m.id === j.hiringManagerId)?.name}
                    </td>
                    <td className="px-3 py-3">
                      <span className="tabular font-medium">{cs.length}</span>{" "}
                      <span className="text-xs text-zinc-500">
                        active ·{" "}
                        {cs.filter((c) => c.stage === "applied").length} new
                      </span>
                    </td>
                    <td className="tabular px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {salary(j.salaryMin)}–{salary(j.salaryMax)}
                    </td>
                    <td className="px-3 py-3 text-zinc-500">
                      {shortDate(j.openedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <HoverMenu
                        label={`Actions for ${j.title}`}
                        testId={`job-menu-${j.id}`}
                        items={[
                          {
                            label: "Duplicate",
                            icon: <Copy className="size-4" />,
                            onSelect: () => {
                              dispatch({ type: "job/duplicate", id: j.id });
                              toast("Job duplicated as draft");
                            },
                          },
                          j.status === "open"
                            ? {
                                label: "Close job",
                                icon: <Lock className="size-4" />,
                                onSelect: () => {
                                  dispatch({
                                    type: "job/setStatus",
                                    id: j.id,
                                    status: "closed",
                                  });
                                  toast(`${j.title} closed`);
                                },
                              }
                            : {
                                label: "Publish",
                                icon: <Unlock className="size-4" />,
                                onSelect: () => {
                                  dispatch({
                                    type: "job/setStatus",
                                    id: j.id,
                                    status: "open",
                                  });
                                  toast(`${j.title} is live`);
                                },
                              },
                          ...(j.status === "draft"
                            ? [
                                {
                                  label: "Move to closed",
                                  icon: <Trash2 className="size-4" />,
                                  danger: true,
                                  onSelect: () =>
                                    dispatch({
                                      type: "job/setStatus",
                                      id: j.id,
                                      status: "closed",
                                    }),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <Empty
              title="No jobs here"
              body="Try another tab or clear the filters."
            />
          )}
        </div>
      </Panel>
      {params.get("new") && (
        <NewJobWizard
          onClose={() => setParams({})}
          onCreated={(j) => {
            setParams({});
            setTab(j.status);
            navigate(`/jobs/${j.id}`);
          }}
        />
      )}
    </>
  );
}

const STEPS = [
  "Details",
  "Compensation",
  "Application form",
  "Review",
] as const;

function NewJobWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (j: Job) => void;
}) {
  const { members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [type, setType] = useState<EmploymentType>("Full-time");
  const [hm, setHm] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([
    "Why are you interested in this role?",
  ]);

  const errs: Record<string, string | undefined>[] = [
    {
      title: title.trim().length < 3 ? "Enter a job title" : undefined,
      department: !department ? "Choose a department" : undefined,
      location: !location.trim() ? "Enter a location" : undefined,
      hm: !hm ? "Choose a hiring manager" : undefined,
    },
    {
      min: !(Number(min) > 0) ? "Enter a minimum salary" : undefined,
      max: !(Number(max) > 0)
        ? "Enter a maximum salary"
        : Number(max) < Number(min)
          ? "Maximum must be at least the minimum"
          : undefined,
    },
    {
      questions: questions.some((q) => !q.trim())
        ? "Fill in or remove empty questions"
        : undefined,
    },
    {},
  ];
  const e = tried ? errs[step] : {};
  const next = () => {
    setTried(true);
    if (Object.values(errs[step]).some(Boolean)) return;
    setTried(false);
    setStep(step + 1);
  };
  const create = (status: JobStatus) => {
    const job: Job = {
      id: uid("job"),
      title: title.trim(),
      department: department as Department,
      location,
      remote,
      type,
      status,
      hiringManagerId: hm,
      openedAt: isoDay(new Date()),
      salaryMin: Number(min) * 1000,
      salaryMax: Number(max) * 1000,
      description,
      questions,
    };
    dispatch({ type: "job/create", job });
    toast(
      status === "open"
        ? `${job.title} published`
        : `${job.title} saved as draft`,
    );
    onCreated(job);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Post a job"
      wide
      testId="new-job-wizard"
      footer={
        <>
          {step > 0 && (
            <Button onClick={() => setStep(step - 1)} className="mr-auto">
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button variant="primary" onClick={next} data-testid="wizard-next">
              Continue
            </Button>
          ) : (
            <>
              <Button
                onClick={() => create("draft")}
                data-testid="wizard-draft"
              >
                Save draft
              </Button>
              <Button
                variant="primary"
                onClick={() => create("open")}
                data-testid="wizard-publish"
              >
                Publish job
              </Button>
            </>
          )}
        </>
      }
    >
      <ol className="flex gap-2 text-xs" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={cx(
              "flex flex-1 items-center gap-2 border-t-2 pt-2 font-medium",
              i <= step
                ? "border-teal-600 text-teal-700 dark:text-teal-300"
                : "border-zinc-200 text-zinc-400 dark:border-zinc-700",
            )}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      {step === 0 && (
        <>
          <Field label="Job title" error={e.title}>
            <Input
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              name="title"
              placeholder="e.g. Senior Data Engineer"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" error={e.department}>
              <Dropdown
                label="Department"
                value={department}
                onChange={setDepartment}
                options={departmentOptions}
                testId="wizard-department"
              />
            </Field>
            <Field label="Hiring manager" error={e.hm}>
              <Dropdown
                label="Hiring manager"
                value={hm}
                onChange={setHm}
                options={members.map((m) => ({
                  value: m.id,
                  label: m.name,
                  hint: m.title,
                }))}
                testId="wizard-hm"
              />
            </Field>
            <Field label="Location" error={e.location}>
              <Input
                value={location}
                onChange={(ev) => setLocation(ev.target.value)}
                name="location"
              />
            </Field>
            <Field label="Employment type">
              <Dropdown
                label="Employment type"
                value={type}
                onChange={setType}
                searchable={false}
                options={(["Full-time", "Part-time", "Contract"] as const).map(
                  (t) => ({ value: t, label: t }),
                )}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remote}
              onChange={(ev) => setRemote(ev.target.checked)}
              className="size-4 accent-teal-600"
            />{" "}
            Open to remote candidates
          </label>
        </>
      )}
      {step === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum salary (thousands, USD)" error={e.min}>
              <Input
                inputMode="numeric"
                value={min}
                onChange={(ev) => setMin(ev.target.value.replace(/\D/g, ""))}
                name="salaryMin"
              />
            </Field>
            <Field label="Maximum salary (thousands, USD)" error={e.max}>
              <Input
                inputMode="numeric"
                value={max}
                onChange={(ev) => setMax(ev.target.value.replace(/\D/g, ""))}
                name="salaryMax"
              />
            </Field>
          </div>
          <Field label="Description" hint="Shown on the careers page.">
            <textarea
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={5}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </Field>
        </>
      )}
      {step === 2 && (
        <div className="space-y-2" data-testid="wizard-questions">
          <p className="text-sm text-zinc-500">
            Name, email and resume are always collected. Add screening
            questions:
          </p>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input
                aria-label={`Question ${i + 1}`}
                value={q}
                onChange={(ev) =>
                  setQuestions(
                    questions.map((x, j) => (j === i ? ev.target.value : x)),
                  )
                }
              />
              <Button
                variant="ghost"
                aria-label={`Remove question ${i + 1}`}
                onClick={() =>
                  setQuestions(questions.filter((_, j) => j !== i))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {e.questions && (
            <p className="text-xs text-rose-600">{e.questions}</p>
          )}
          <Button size="sm" onClick={() => setQuestions([...questions, ""])}>
            <Plus className="size-4" /> Add question
          </Button>
        </div>
      )}
      {step === 3 && (
        <dl
          className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm"
          data-testid="wizard-review"
        >
          <dt className="text-zinc-500">Title</dt>
          <dd className="font-medium">{title}</dd>
          <dt className="text-zinc-500">Department</dt>
          <dd>{department}</dd>
          <dt className="text-zinc-500">Location</dt>
          <dd>
            {location}
            {remote && " · Remote OK"} · {type}
          </dd>
          <dt className="text-zinc-500">Hiring manager</dt>
          <dd>{members.find((m) => m.id === hm)?.name}</dd>
          <dt className="text-zinc-500">Salary</dt>
          <dd>
            ${min}k – ${max}k
          </dd>
          <dt className="text-zinc-500">Questions</dt>
          <dd>
            {questions.length
              ? questions.map((q) => <Badge key={q}>{q}</Badge>)
              : "None"}
          </dd>
        </dl>
      )}
    </Modal>
  );
}
