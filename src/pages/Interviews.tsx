import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown } from "../components/Dropdown";
import { Button, PageHeader, Panel } from "../components/ui";
import { cx } from "../lib/format";
import { timeLabel } from "../lib/theme";
import { useStore } from "../state/store";
import { useUI } from "../state/ui";

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i);
const ROW = 56;

export function Interviews() {
  const { interviews, candidates, members } = useStore();
  const ui = useUI();
  const [offset, setOffset] = useState(0);
  const [who, setWho] = useState("");

  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7);
  const days = Array.from(
    { length: 5 },
    (_, i) =>
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
  const today = new Date().toDateString();
  const shown = interviews.filter(
    (i) => !who || i.interviewerIds.includes(who),
  );
  const range = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[4].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle="Your team's interview schedule."
        actions={
          <Button
            variant="primary"
            onClick={() => ui.openSchedule()}
            data-testid="interviews-schedule"
          >
            <Plus className="size-4" /> Schedule
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          aria-label="Previous week"
          onClick={() => setOffset(offset - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button size="sm" onClick={() => setOffset(0)} disabled={offset === 0}>
          This week
        </Button>
        <Button
          size="sm"
          aria-label="Next week"
          onClick={() => setOffset(offset + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <h2 className="ml-2 font-semibold" data-testid="week-range">
          {range}
        </h2>
        <Dropdown
          label="Interviewer"
          className="ml-auto w-52"
          value={who}
          onChange={setWho}
          placeholder="All interviewers"
          options={[
            { value: "", label: "All interviewers" },
            ...members.map((m) => ({ value: m.id, label: m.name })),
          ]}
          testId="filter-interviewer"
        />
      </div>
      <Panel padded={false} className="overflow-x-auto">
        <div
          className="grid min-w-[720px] grid-cols-[56px_repeat(5,1fr)]"
          data-testid="calendar"
        >
          <div />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className={cx(
                "border-b border-l border-zinc-100 px-3 py-2 text-xs dark:border-zinc-800",
                d.toDateString() === today &&
                  "bg-teal-50 font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
              )}
            >
              {d.toLocaleDateString("en-US", { weekday: "short" })}{" "}
              <span className="text-base">{d.getDate()}</span>
            </div>
          ))}
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: ROW }}
                className="pr-2 pt-1 text-right text-[10px] text-zinc-400"
              >
                {h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}
              </div>
            ))}
          </div>
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="relative border-l border-zinc-100 dark:border-zinc-800"
              style={{ height: ROW * HOURS.length }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ top: (h - 8) * ROW }}
                  className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-800"
                />
              ))}
              {shown
                .filter(
                  (i) => new Date(i.start).toDateString() === d.toDateString(),
                )
                .map((i) => {
                  const s = new Date(i.start);
                  const c = candidates.find((x) => x.id === i.candidateId);
                  return (
                    <Link
                      key={i.id}
                      to={`/candidates/${i.candidateId}`}
                      data-testid={`event-${i.id}`}
                      title={`${c?.name} — ${i.kind} with ${i.interviewerIds.map((m) => members.find((x) => x.id === m)?.name).join(", ")}`}
                      style={{
                        top: (s.getHours() + s.getMinutes() / 60 - 8) * ROW + 2,
                        height: (i.durationMin / 60) * ROW - 4,
                      }}
                      className={cx(
                        "absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-xs shadow-sm hover:brightness-95",
                        i.kind === "Phone screen"
                          ? "border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
                          : "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
                      )}
                    >
                      <p className="truncate font-medium">{c?.name}</p>
                      <p className="truncate opacity-75">
                        {timeLabel(i.start)} · {i.kind}
                      </p>
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
