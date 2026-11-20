import { Building2, CalendarCheck, Clock, Phone, Video } from "lucide-react";
import { useMemo, useState } from "react";
import {
  INTERVIEW_KINDS,
  type InterviewKind,
  STAGE_LABEL,
} from "../data/types";
import { cx, uid } from "../lib/format";
import { nextWeekdays, slotsForDay } from "../lib/schedule";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { Dropdown } from "./Dropdown";
import { Avatar, Badge, Button, Input, Modal } from "./ui";

const DURATIONS = [30, 45, 60, 90];
const LOCATIONS = [
  { value: "video", label: "Video call", icon: Video },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "onsite", label: "On-site", icon: Building2 },
] as const;
type LocationKind = (typeof LOCATIONS)[number]["value"];
const ROOMS = [
  "Room 1 — Harbor",
  "Room 2 — Summit",
  "Room 3 — Grove",
  "Lobby lounge",
];

const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T12:00`).toLocaleDateString("en-US", opts);
const fmtTime = (day: string, time: string, plus = 0) =>
  new Date(
    new Date(`${day}T${time}`).getTime() + plus * 60000,
  ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function ScheduleInterviewModal({
  open,
  onClose,
  candidateId,
}: {
  open: boolean;
  onClose: () => void;
  candidateId?: string;
}) {
  const { candidates, members, jobs, interviews } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const days = useMemo(() => nextWeekdays(new Date(), 10), []);
  const [cand, setCand] = useState(candidateId ?? "");
  const [kind, setKind] = useState<InterviewKind>("Technical");
  const [duration, setDuration] = useState(45);
  const [who, setWho] = useState<string[]>([]);
  const [where, setWhere] = useState<LocationKind>("video");
  const [room, setRoom] = useState(ROOMS[0]);
  const [day, setDay] = useState(days[0]);
  const [time, setTime] = useState("");
  const [notify, setNotify] = useState(true);
  const [tried, setTried] = useState(false);

  const c = candidates.find((x) => x.id === cand);
  const slots = slotsForDay(day, duration, interviews, who, new Date());
  const picked = slots.find((s) => s.time === time);
  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name.split(" ")[0] ?? "";
  const errors = {
    cand: !cand ? "Choose a candidate" : undefined,
    who: who.length === 0 ? "Add at least one interviewer" : undefined,
    time: !time
      ? "Pick a time"
      : !picked?.available
        ? "That time is no longer free — pick another"
        : undefined,
  };
  const location =
    where === "video"
      ? "Google Meet"
      : where === "phone"
        ? "Phone"
        : `Office — ${room}`;

  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    dispatch({
      type: "interview/create",
      interview: {
        id: uid("int"),
        candidateId: cand,
        interviewerIds: who,
        start: new Date(`${day}T${time}`).toISOString(),
        durationMin: duration,
        kind,
        location,
      },
    });
    toast(
      `Interview scheduled with ${c?.name}${notify ? " · invites sent" : ""}`,
    );
    onClose();
  };

  const seg = (on: boolean) =>
    cx(
      "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
      on
        ? "border-teal-600 bg-teal-600 text-white"
        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
    );
  const label =
    "mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400";
  const err = (m?: string) =>
    tried && m ? <p className="mt-1 text-xs text-rose-600">{m}</p> : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule interview"
      wide="xl"
      testId="schedule-modal"
      footer={
        <div className="flex w-full flex-wrap items-center gap-3">
          <p
            className="mr-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
            data-testid="schedule-summary"
          >
            <CalendarCheck className="size-4 text-teal-600" />
            {time && picked?.available
              ? `${fmtDay(day, { weekday: "short", month: "short", day: "numeric" })}, ${fmtTime(day, time)} – ${fmtTime(day, time, duration)}`
              : "No time selected"}
          </p>
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="accent-teal-600"
              data-testid="schedule-notify"
            />{" "}
            Email invites
          </label>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={submit}
            data-testid="schedule-submit"
          >
            Schedule interview
          </Button>
        </div>
      }
    >
      <div>
        <span className={label}>Candidate</span>
        {c ? (
          <div
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
            data-testid="schedule-candidate-card"
          >
            <Avatar name={c.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {jobs.find((j) => j.id === c.jobId)?.title}
              </p>
            </div>
            <Badge tone="blue">{STAGE_LABEL[c.stage]}</Badge>
            {!candidateId && (
              <Button size="sm" variant="ghost" onClick={() => setCand("")}>
                Change
              </Button>
            )}
          </div>
        ) : (
          <Dropdown
            label="Candidate"
            value={cand}
            onChange={setCand}
            testId="schedule-candidate"
            placeholder="Search candidates…"
            options={candidates
              .filter((x) => !x.rejected && x.stage !== "hired")
              .map((x) => ({
                value: x.id,
                label: x.name,
                hint: jobs.find((j) => j.id === x.jobId)?.title,
              }))}
          />
        )}
        {err(errors.cand)}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <div>
            <span className={label}>Interview type</span>
            <div
              className="flex flex-wrap gap-1"
              role="radiogroup"
              aria-label="Interview type"
              data-testid="schedule-kind"
            >
              {INTERVIEW_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={seg(kind === k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Duration</span>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-label="Duration"
              data-testid="schedule-duration"
            >
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={duration === d}
                  onClick={() => setDuration(d)}
                  className={seg(duration === d)}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Interviewers</span>
            <ul
              className="space-y-1"
              role="group"
              aria-label="Interviewers"
              data-testid="schedule-interviewers"
            >
              {members.map((m) => {
                const on = who.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setWho(
                          on ? who.filter((x) => x !== m.id) : [...who, m.id],
                        )
                      }
                      className={cx(
                        "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left",
                        on
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
                          : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      )}
                    >
                      <Avatar name={m.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{m.name}</span>
                        <span className="block truncate text-[11px] text-zinc-500">
                          {m.title}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        readOnly
                        tabIndex={-1}
                        checked={on}
                        className="pointer-events-none accent-teal-600"
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            {err(errors.who)}
          </div>
          <div>
            <span className={label}>Location</span>
            <div
              className="grid grid-cols-3 gap-1"
              role="radiogroup"
              aria-label="Location"
              data-testid="schedule-location"
            >
              {LOCATIONS.map(({ value, label: l, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={where === value}
                  onClick={() => setWhere(value)}
                  className={cx(
                    seg(where === value),
                    "flex flex-col items-center gap-1 py-2",
                  )}
                >
                  <Icon className="size-4" /> {l}
                </button>
              ))}
            </div>
            {where === "onsite" && (
              <Dropdown
                className="mt-2"
                label="Room"
                value={room}
                onChange={setRoom}
                searchable={false}
                options={ROOMS.map((r) => ({ value: r, label: r }))}
                testId="schedule-room"
              />
            )}
            {where === "video" && (
              <Input
                className="mt-2"
                readOnly
                value="A Google Meet link is added to the invite"
                aria-label="Video link"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <div
            className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1 pb-1"
            role="radiogroup"
            aria-label="Date"
            data-testid="schedule-days"
          >
            {days.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={day === d}
                onClick={() => {
                  setDay(d);
                  setTime("");
                }}
                className={cx(
                  "flex w-14 shrink-0 flex-col items-center rounded-lg border py-1.5",
                  day === d
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
                )}
              >
                <span className="text-[10px] uppercase opacity-80">
                  {fmtDay(d, { weekday: "short" })}
                </span>
                <span className="text-base font-semibold">
                  {fmtDay(d, { day: "numeric" })}
                </span>
                <span className="text-[10px] opacity-80">
                  {fmtDay(d, { month: "short" })}
                </span>
              </button>
            ))}
          </div>
          <p className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="size-3.5" />
            {who.length
              ? `Showing when ${who.map(nameOf).join(", ")} ${who.length > 1 ? "are" : "is"} free`
              : "Pick interviewers to see their availability"}
          </p>
          <div
            className="grid max-h-64 grid-cols-3 gap-1.5 overflow-y-auto pr-1"
            role="radiogroup"
            aria-label="Start time"
            data-testid="schedule-slots"
          >
            {slots.map((s) => (
              <button
                key={s.time}
                type="button"
                role="radio"
                aria-checked={time === s.time}
                disabled={!s.available}
                title={
                  s.past
                    ? "In the past"
                    : s.busy.length
                      ? `Busy: ${s.busy.map(nameOf).join(", ")}`
                      : undefined
                }
                onClick={() => setTime(s.time)}
                data-testid={`slot-${s.time}`}
                className={cx(
                  "rounded-lg border py-2 text-xs font-medium tabular-nums",
                  time === s.time && s.available
                    ? "border-teal-600 bg-teal-600 text-white"
                    : s.available
                      ? "border-zinc-200 hover:border-teal-400 hover:bg-teal-50 dark:border-zinc-700 dark:hover:bg-teal-950/40"
                      : "cursor-not-allowed border-dashed border-zinc-200 bg-zinc-50 text-zinc-300 line-through dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600",
                )}
              >
                {fmtTime(day, s.time)}
              </button>
            ))}
            {slots.every((s) => !s.available) && (
              <p className="col-span-3 py-4 text-center text-xs text-zinc-500">
                No free times this day
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded border border-zinc-300" /> Free
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded border border-dashed border-zinc-300 bg-zinc-100" />{" "}
              Busy or past
            </span>
          </div>
          {err(errors.time)}
        </div>
      </div>
    </Modal>
  );
}
