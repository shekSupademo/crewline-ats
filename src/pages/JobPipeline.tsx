import {
  ArrowRightLeft,
  CalendarPlus,
  MapPin,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Stars } from "../components/ats";
import { Dropdown } from "../components/Dropdown";
import { HoverMenu } from "../components/HoverMenu";
import {
  Avatar,
  Badge,
  Button,
  Field,
  Modal,
  PageHeader,
  Tabs,
} from "../components/ui";
import { type Candidate, STAGE_LABEL, STAGES, type Stage } from "../data/types";
import { cx, shortDate } from "../lib/format";
import { salary } from "../lib/theme";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { useUI } from "../state/ui";

export function JobPipeline() {
  const { id } = useParams();
  const { jobs, candidates, members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const ui = useUI();
  const [tab, setTab] = useState<"pipeline" | "details">("pipeline");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ stage: Stage; beforeId?: string } | null>(
    null,
  );
  const [showRejected, setShowRejected] = useState(false);
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  const job = jobs.find((j) => j.id === id);
  if (!job) return <Navigate to="/jobs" replace />;

  const pool = candidates.filter((c) => c.jobId === job.id);
  const move = (cid: string, stage: Stage, beforeId?: string) => {
    const c = candidates.find((x) => x.id === cid);
    dispatch({ type: "candidate/move", id: cid, stage, beforeId });
    if (c && c.stage !== stage)
      toast(`${c.name} moved to ${STAGE_LABEL[stage]}`);
  };
  const drop = (stage: Stage) => {
    if (dragId) move(dragId, stage, over?.beforeId);
    setDragId(null);
    setOver(null);
  };

  return (
    <>
      <nav className="mb-2 text-xs text-zinc-500">
        <Link to="/jobs" className="hover:underline">
          Jobs
        </Link>{" "}
        / {job.department}
      </nav>
      <PageHeader
        title={job.title}
        subtitle={`${job.location}${job.remote ? " · Remote OK" : ""} · ${job.type} · ${salary(job.salaryMin)}–${salary(job.salaryMax)}`}
        actions={
          <>
            <Badge
              tone={
                job.status === "open"
                  ? "green"
                  : job.status === "draft"
                    ? "amber"
                    : "gray"
              }
            >
              {job.status}
            </Badge>
            <Button
              onClick={() => ui.openAddCandidate(job.id)}
              data-testid="pipeline-add"
            >
              <UserPlus className="size-4" /> Add candidate
            </Button>
          </>
        }
      />
      <div className="mb-4 flex items-end justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "pipeline",
              label: "Pipeline",
              count: pool.filter((c) => !c.rejected).length,
            },
            { value: "details", label: "Job details" },
          ]}
        />
        {tab === "pipeline" && (
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={showRejected}
              onChange={(e) => setShowRejected(e.target.checked)}
              className="accent-teal-600"
              data-testid="show-rejected"
            />
            Show rejected ({pool.filter((c) => c.rejected).length})
          </label>
        )}
      </div>

      {tab === "details" ? (
        <div className="max-w-2xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="flex items-center gap-1 text-zinc-500">
            <MapPin className="size-4" /> {job.location}
          </p>
          <p>{job.description}</p>
          <p>
            <span className="text-zinc-500">Hiring manager:</span>{" "}
            {members.find((m) => m.id === job.hiringManagerId)?.name}
          </p>
          <p>
            <span className="text-zinc-500">Opened:</span>{" "}
            {shortDate(job.openedAt)}
          </p>
          <div>
            <p className="mb-1 text-zinc-500">Screening questions</p>
            <ol className="list-decimal space-y-1 pl-5">
              {job.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div
          className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:-mx-8 lg:px-8"
          data-testid="pipeline-board"
        >
          {STAGES.map((stage) => {
            const cards = pool.filter(
              (c) => c.stage === stage && (showRejected || !c.rejected),
            );
            return (
              <section
                key={stage}
                aria-label={STAGE_LABEL[stage]}
                data-testid={`column-${stage}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (
                    over?.stage !== stage ||
                    (e.target as HTMLElement).dataset.column
                  )
                    setOver({
                      stage,
                      beforeId: (e.target as HTMLElement).dataset.column
                        ? undefined
                        : over?.beforeId,
                    });
                }}
                onDrop={() => drop(stage)}
                className={cx(
                  "flex w-72 shrink-0 flex-col rounded-2xl border bg-zinc-100/70 p-2 dark:bg-zinc-900/60",
                  over?.stage === stage
                    ? "border-teal-400 ring-2 ring-teal-400/30"
                    : "border-transparent",
                )}
              >
                <header className="flex items-center justify-between px-2 py-2">
                  <h2 className="text-sm font-semibold">
                    {STAGE_LABEL[stage]}
                  </h2>
                  <span className="tabular rounded-full bg-white px-2 text-xs text-zinc-500 dark:bg-zinc-800">
                    {cards.length}
                  </span>
                </header>
                <ul
                  className="flex min-h-24 flex-1 flex-col gap-2"
                  data-column="1"
                >
                  {cards.map((c) => (
                    <PipelineCard
                      key={c.id}
                      c={c}
                      dragging={dragId === c.id}
                      dropBefore={over?.beforeId === c.id && dragId !== c.id}
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      onDragOverCard={() => setOver({ stage, beforeId: c.id })}
                      onMove={(s) => move(c.id, s)}
                      onReject={() => setRejecting([c.id])}
                      onRestore={() => {
                        dispatch({ type: "candidate/restore", id: c.id });
                        toast(`${c.name} restored`);
                      }}
                      onSchedule={() => ui.openSchedule(c.id)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <RejectModal ids={rejecting} onClose={() => setRejecting(null)} />
    </>
  );
}

function PipelineCard({
  c,
  dragging,
  dropBefore,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onMove,
  onReject,
  onRestore,
  onSchedule,
}: {
  c: Candidate;
  dragging: boolean;
  dropBefore: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverCard: () => void;
  onMove: (s: Stage) => void;
  onReject: () => void;
  onRestore: () => void;
  onSchedule: () => void;
}) {
  return (
    <li
      draggable
      data-testid={`card-${c.id}`}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", c.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDragOverCard();
      }}
      className={cx(
        "group cursor-grab rounded-xl border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900",
        dragging && "opacity-40",
        dropBefore && "border-t-4 border-t-teal-500",
        c.rejected && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <Avatar name={c.name} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            to={`/candidates/${c.id}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {c.name}
          </Link>
          <p className="truncate text-xs text-zinc-500">
            {c.currentTitle} · {c.currentCompany}
          </p>
        </div>
        <HoverMenu
          label={`Actions for ${c.name}`}
          testId={`card-menu-${c.id}`}
          items={[
            {
              label: "Move to…",
              icon: <ArrowRightLeft className="size-4" />,
              submenu: STAGES.map((s) => ({
                label: STAGE_LABEL[s],
                active: s === c.stage,
                onSelect: () => onMove(s),
              })),
            },
            {
              label: "Schedule interview",
              icon: <CalendarPlus className="size-4" />,
              onSelect: onSchedule,
            },
            c.rejected
              ? { label: "Restore", onSelect: onRestore }
              : {
                  label: "Reject",
                  icon: <XCircle className="size-4" />,
                  danger: true,
                  onSelect: onReject,
                },
          ]}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Stars value={c.rating} />
        <span className="text-[11px] text-zinc-400">
          {shortDate(c.appliedAt)}
        </span>
      </div>
      {(c.tags.length > 0 || c.rejected) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {c.rejected && <Badge tone="red">Rejected</Badge>}
          {c.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      )}
    </li>
  );
}

const REASONS = [
  "Not enough experience",
  "Salary mismatch",
  "Position filled",
  "Withdrew",
  "Culture fit",
  "Other",
] as const;

export function RejectModal({
  ids,
  onClose,
}: {
  ids: string[] | null;
  onClose: () => void;
}) {
  const { candidates, jobs, settings } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [reason, setReason] = useState<string>("");
  const [send, setSend] = useState(true);
  const first = candidates.find((c) => c.id === ids?.[0]);
  const preview = settings.rejectTemplate
    .replace("{{first_name}}", first?.name.split(" ")[0] ?? "")
    .replace(
      "{{job_title}}",
      jobs.find((j) => j.id === first?.jobId)?.title ?? "",
    )
    .replace("{{sender}}", settings.userName);
  const submit = () => {
    if (!ids || !reason) return;
    dispatch({ type: "candidate/reject", ids, reason });
    toast(
      `${ids.length === 1 ? first?.name : `${ids.length} candidates`} rejected${send ? " · email queued" : ""}`,
    );
    setReason("");
    onClose();
  };
  return (
    <Modal
      open={!!ids}
      onClose={onClose}
      title={
        ids && ids.length > 1
          ? `Reject ${ids.length} candidates`
          : `Reject ${first?.name ?? ""}`
      }
      testId="reject-modal"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!reason}
            onClick={submit}
            data-testid="reject-submit"
          >
            Reject
          </Button>
        </>
      }
    >
      <Field label="Reason">
        <Dropdown
          label="Reason"
          value={reason}
          onChange={setReason}
          searchable={false}
          options={REASONS.map((r) => ({ value: r, label: r }))}
          testId="reject-reason"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={send}
          onChange={(e) => setSend(e.target.checked)}
          className="accent-teal-600"
        />{" "}
        Send rejection email
      </label>
      {send && (
        <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-sans text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {preview}
        </pre>
      )}
    </Modal>
  );
}
