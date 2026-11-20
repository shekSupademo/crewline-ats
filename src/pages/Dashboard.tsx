import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StageBadge } from "../components/ats";
import { Avatar, Button, PageHeader, Panel } from "../components/ui";
import { SOURCES, STAGE_LABEL, STAGES } from "../data/types";
import { dayLabel, timeLabel } from "../lib/theme";
import { useStore } from "../state/store";
import { useUI } from "../state/ui";

export function Dashboard() {
  const { jobs, candidates, interviews, settings } = useStore();
  const ui = useUI();
  const active = candidates.filter((c) => !c.rejected);
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const upcoming = interviews
    .filter((i) => new Date(i.start) >= now)
    .sort((a, b) => a.start.localeCompare(b.start));
  const stats = [
    {
      label: "Open jobs",
      value: jobs.filter((j) => j.status === "open").length,
      to: "/jobs",
    },
    { label: "Active candidates", value: active.length, to: "/candidates" },
    {
      label: "Interviews next 7 days",
      value: upcoming.filter((i) => new Date(i.start) < weekEnd).length,
      to: "/interviews",
    },
    {
      label: "Offers out",
      value: active.filter((c) => c.stage === "offer").length,
      to: "/candidates?stage=offer",
    },
  ];
  const funnel = STAGES.map((s) => ({
    stage: STAGE_LABEL[s],
    count: active.filter((c) => STAGES.indexOf(c.stage) >= STAGES.indexOf(s))
      .length,
  }));
  const bySource = SOURCES.map((s) => ({
    source: s,
    count: candidates.filter((c) => c.source === s).length,
  }));
  const needsReview = active
    .filter((c) => c.stage === "applied" && c.rating === 0)
    .slice(0, 6);
  const max = funnel[0]?.count || 1;

  return (
    <>
      <PageHeader
        title={`Good morning, ${settings.userName.split(" ")[0]}`}
        subtitle="Here's what's happening across your hiring pipeline."
        actions={
          <Button variant="primary" onClick={() => ui.openSchedule()}>
            Schedule interview
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 transition hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="tabular mt-2 text-3xl font-bold tracking-tight">
              {s.value}
            </p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Pipeline funnel"
          className="lg:col-span-2"
          data-testid="funnel"
        >
          <ul className="space-y-3">
            {funnel.map((f) => (
              <li key={f.stage} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-zinc-600 dark:text-zinc-400">
                  {f.stage}
                </span>
                <span className="h-6 flex-1 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <span
                    className="block h-full rounded-md bg-gradient-to-r from-teal-500 to-emerald-500"
                    style={{ width: `${(f.count / max) * 100}%` }}
                  />
                </span>
                <span className="tabular w-10 text-right font-medium">
                  {f.count}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Upcoming interviews" padded={false}>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {upcoming.slice(0, 5).map((i) => {
              const c = candidates.find((x) => x.id === i.candidateId);
              return (
                <li key={i.id}>
                  <Link
                    to={`/candidates/${i.candidateId}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <Avatar name={c?.name ?? "?"} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {c?.name}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {i.kind}
                      </span>
                    </span>
                    <span className="text-right text-xs text-zinc-500">
                      {dayLabel(i.start)}
                      <br />
                      {timeLabel(i.start)}
                    </span>
                  </Link>
                </li>
              );
            })}
            {upcoming.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-zinc-500">
                Nothing scheduled
              </li>
            )}
          </ul>
        </Panel>
        <Panel title="Applicants by source" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={bySource}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 11 }}
                  stroke="#a1a1aa"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="#a1a1aa"
                  width={28}
                />
                <Tooltip cursor={{ fill: "rgba(20,184,166,0.08)" }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Needs review" padded={false} data-testid="needs-review">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {needsReview.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/candidates/${c.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="truncate">{c.name}</span>
                  <StageBadge c={c} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
