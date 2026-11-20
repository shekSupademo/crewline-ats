import {
  CalendarPlus,
  Mail,
  MapPin,
  Phone,
  Plus,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { StageBadge, Stars } from "../components/ats";
import { Dropdown } from "../components/Dropdown";
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Panel,
  Tabs,
} from "../components/ui";
import { isoDay } from "../data/seed";
import { type Recommendation, STAGE_LABEL, STAGES } from "../data/types";
import { cx, longDate, uid } from "../lib/format";
import { dayLabel, timeLabel } from "../lib/theme";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { useUI } from "../state/ui";
import { RejectModal } from "./JobPipeline";

const REC: Record<
  Recommendation,
  { label: string; tone: "green" | "blue" | "amber" | "red" }
> = {
  strong_yes: { label: "Strong yes", tone: "green" },
  yes: { label: "Yes", tone: "blue" },
  no: { label: "No", tone: "amber" },
  strong_no: { label: "Strong no", tone: "red" },
};

export function CandidateProfile() {
  const { id } = useParams();
  const { candidates, jobs, interviews, members, settings } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const ui = useUI();
  const [tab, setTab] = useState<
    "overview" | "activity" | "scorecards" | "interviews"
  >("overview");
  const [note, setNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [card, setCard] = useState<{
    rating: number;
    rec: Recommendation | "";
    comment: string;
  }>({ rating: 0, rec: "", comment: "" });
  const c = candidates.find((x) => x.id === id);
  if (!c) return <Navigate to="/candidates" replace />;
  const job = jobs.find((j) => j.id === c.jobId);
  const myInterviews = interviews
    .filter((i) => i.candidateId === c.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const idx = STAGES.indexOf(c.stage);

  const addTag = () => {
    const t = newTag.trim();
    if (t && !c.tags.includes(t))
      dispatch({
        type: "candidate/update",
        id: c.id,
        patch: { tags: [...c.tags, t] },
      });
    setNewTag("");
  };

  return (
    <>
      <nav className="mb-2 text-xs text-zinc-500">
        <Link to="/candidates" className="hover:underline">
          Candidates
        </Link>{" "}
        / {c.name}
      </nav>
      <PageHeader
        title={c.name}
        subtitle={`${c.currentTitle} at ${c.currentCompany} · Applied ${longDate(c.appliedAt)} via ${c.source}`}
        actions={
          <>
            <Button
              onClick={() => ui.openSchedule(c.id)}
              data-testid="profile-schedule"
            >
              <CalendarPlus className="size-4" /> Schedule
            </Button>
            {c.rejected ? (
              <Button
                onClick={() => {
                  dispatch({ type: "candidate/restore", id: c.id });
                  toast(`${c.name} restored`);
                }}
              >
                Restore
              </Button>
            ) : (
              <>
                <Button
                  variant="danger"
                  onClick={() => setRejecting(true)}
                  data-testid="profile-reject"
                >
                  <XCircle className="size-4" /> Reject
                </Button>
                {idx < STAGES.length - 1 && (
                  <Button
                    variant="primary"
                    data-testid="profile-advance"
                    onClick={() => {
                      dispatch({
                        type: "candidate/move",
                        id: c.id,
                        stage: STAGES[idx + 1],
                      });
                      toast(`Moved to ${STAGE_LABEL[STAGES[idx + 1]]}`);
                    }}
                  >
                    Advance to {STAGE_LABEL[STAGES[idx + 1]]}
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      <ol
        className="mb-6 flex gap-1"
        aria-label="Pipeline progress"
        data-testid="stage-progress"
      >
        {STAGES.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              onClick={() =>
                dispatch({ type: "candidate/move", id: c.id, stage: s })
              }
              aria-current={s === c.stage ? "step" : undefined}
              className={cx(
                "w-full rounded-md py-2 text-xs font-medium transition",
                c.rejected
                  ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  : i < idx
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                    : i === idx
                      ? "bg-teal-600 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800",
              )}
            >
              {STAGE_LABEL[s]}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Panel>
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size="lg" />
              <div>
                <StageBadge c={c} />
                {c.rejectReason && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Reason: {c.rejectReason}
                  </p>
                )}
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-zinc-400" />
                <a href={`mailto:${c.email}`} className="hover:underline">
                  {c.email}
                </a>
              </li>
              {c.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-zinc-400" />
                  {c.phone}
                </li>
              )}
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-zinc-400" />
                {c.location}
              </li>
            </ul>
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-zinc-500">
                Your rating
              </p>
              <Stars
                size="md"
                value={c.rating}
                onChange={(v) =>
                  dispatch({
                    type: "candidate/update",
                    id: c.id,
                    patch: { rating: v },
                  })
                }
                label="Your rating"
              />
            </div>
          </Panel>
          <Panel title="Applied for">
            <Field label="Job">
              <Dropdown
                label="Job"
                value={c.jobId}
                testId="profile-job"
                onChange={(v) => {
                  dispatch({
                    type: "candidate/update",
                    id: c.id,
                    patch: { jobId: v },
                  });
                  toast("Moved to another job");
                }}
                options={jobs
                  .filter((j) => j.status !== "closed")
                  .map((j) => ({ value: j.id, label: j.title }))}
              />
            </Field>
            {job && (
              <Link
                to={`/jobs/${job.id}`}
                className="mt-2 inline-block text-xs text-teal-700 hover:underline dark:text-teal-300"
              >
                View pipeline →
              </Link>
            )}
          </Panel>
          <Panel title="Tags" data-testid="profile-tags">
            <div className="flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                >
                  {t}
                  <button
                    aria-label={`Remove tag ${t}`}
                    onClick={() =>
                      dispatch({
                        type: "candidate/update",
                        id: c.id,
                        patch: { tags: c.tags.filter((x) => x !== t) },
                      })
                    }
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {c.tags.length === 0 && (
                <span className="text-xs text-zinc-500">No tags</span>
              )}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addTag();
              }}
            >
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                aria-label="New tag"
              />
              <Button type="submit" aria-label="Add tag">
                <Plus className="size-4" />
              </Button>
            </form>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "Notes", count: c.notes.length },
              {
                value: "scorecards",
                label: "Scorecards",
                count: c.scorecards.length,
              },
              {
                value: "interviews",
                label: "Interviews",
                count: myInterviews.length,
              },
            ]}
          />
          <div className="mt-4">
            {tab === "overview" && (
              <Panel title="Resume">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">{c.currentTitle}</p>
                    <p className="text-zinc-500">
                      {c.currentCompany} · 2021 – present
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Previous role</p>
                    <p className="text-zinc-500">Northwind · 2017 – 2021</p>
                  </div>
                  <div>
                    <p className="font-medium">Education</p>
                    <p className="text-zinc-500">BSc, Computer Science</p>
                  </div>
                  {job && (
                    <div>
                      <p className="mb-1 font-medium">Screening answers</p>
                      <dl className="space-y-2">
                        {job.questions.map((q) => (
                          <div key={q}>
                            <dt className="text-zinc-500">{q}</dt>
                            <dd>
                              I've followed the team's work for a while and the
                              role matches what I want to grow into.
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              </Panel>
            )}
            {tab === "activity" && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!note.trim()) return;
                    dispatch({
                      type: "note/add",
                      candidateId: c.id,
                      body: note.trim(),
                    });
                    setNote("");
                    toast("Note added");
                  }}
                >
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder={`Add a note about ${c.name.split(" ")[0]}… (visible to your team)`}
                    aria-label="New note"
                    data-testid="note-input"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!note.trim()}
                      data-testid="note-submit"
                    >
                      Add note
                    </Button>
                  </div>
                </form>
                <ul className="space-y-3" data-testid="notes-list">
                  {c.notes.map((n) => (
                    <li
                      key={n.id}
                      className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <Avatar name={n.author} size="sm" />
                      <div className="text-sm">
                        <p>
                          <span className="font-medium">{n.author}</span>{" "}
                          <span className="text-xs text-zinc-500">
                            · {longDate(n.at)}
                          </span>
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tab === "scorecards" && (
              <div className="space-y-4">
                <Panel title="Submit scorecard" data-testid="scorecard-form">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <Stars
                        size="md"
                        value={card.rating}
                        onChange={(v) => setCard({ ...card, rating: v })}
                        label="Overall rating"
                      />
                      <div
                        className="flex gap-1"
                        role="radiogroup"
                        aria-label="Recommendation"
                      >
                        {(Object.keys(REC) as Recommendation[]).map((r) => (
                          <button
                            key={r}
                            role="radio"
                            aria-checked={card.rec === r}
                            onClick={() => setCard({ ...card, rec: r })}
                            className={cx(
                              "rounded-full border px-3 py-1 text-xs",
                              card.rec === r
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-zinc-200 dark:border-zinc-700",
                            )}
                          >
                            {REC[r].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={card.comment}
                      onChange={(e) =>
                        setCard({ ...card, comment: e.target.value })
                      }
                      rows={3}
                      placeholder="Strengths, concerns, evidence…"
                      aria-label="Scorecard comment"
                      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-teal-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        disabled={!card.rating || !card.rec}
                        data-testid="scorecard-submit"
                        onClick={() => {
                          dispatch({
                            type: "scorecard/add",
                            candidateId: c.id,
                            scorecard: {
                              id: uid("s"),
                              interviewer: settings.userName,
                              rating: card.rating,
                              recommendation: card.rec as Recommendation,
                              comment: card.comment,
                              at: isoDay(new Date()),
                            },
                          });
                          setCard({ rating: 0, rec: "", comment: "" });
                          toast("Scorecard submitted");
                        }}
                      >
                        Submit scorecard
                      </Button>
                    </div>
                  </div>
                </Panel>
                {c.scorecards.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{s.interviewer}</p>
                      <Badge tone={REC[s.recommendation].tone}>
                        {REC[s.recommendation].label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <Stars value={s.rating} /> {longDate(s.at)}
                    </div>
                    {s.comment && <p className="mt-2">{s.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            {tab === "interviews" && (
              <div className="space-y-3">
                {myInterviews.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div>
                      <p className="font-medium">
                        {i.kind} · {i.durationMin} min
                      </p>
                      <p className="text-xs text-zinc-500">
                        {dayLabel(i.start)} at {timeLabel(i.start)} ·{" "}
                        {i.location} · with{" "}
                        {i.interviewerIds
                          .map((m) => members.find((x) => x.id === m)?.name)
                          .join(", ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        dispatch({ type: "interview/cancel", id: i.id });
                        toast("Interview cancelled");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
                {myInterviews.length === 0 && (
                  <p className="text-sm text-zinc-500">No interviews yet.</p>
                )}
                <Button onClick={() => ui.openSchedule(c.id)}>
                  <CalendarPlus className="size-4" /> Schedule interview
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <RejectModal
        ids={rejecting ? [c.id] : null}
        onClose={() => setRejecting(false)}
      />
    </>
  );
}

