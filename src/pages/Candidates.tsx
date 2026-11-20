import {
  ArrowDown,
  ArrowUp,
  Download,
  Tag,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StageBadge, Stars, stageOptions } from "../components/ats";
import { Dropdown } from "../components/Dropdown";
import {
  Avatar,
  Button,
  Empty,
  Input,
  PageHeader,
  Panel,
} from "../components/ui";
import { type Candidate, SOURCES, STAGES, type Stage } from "../data/types";
import { cx, downloadCsv, shortDate } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";
import { useUI } from "../state/ui";
import { RejectModal } from "./JobPipeline";

type SortKey = "name" | "appliedAt" | "rating" | "stage";
const PAGE = 15;
const TAGS = [
  "Fast track",
  "Silver medalist",
  "Visa needed",
  "Relocating",
  "Strong portfolio",
  "Ex-founder",
  "Part-time ok",
];

export function Candidates() {
  const { candidates, jobs } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const ui = useUI();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "appliedAt",
    dir: -1,
  });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<string[] | null>(null);

  const stage = (params.get("stage") ?? "") as Stage | "";
  const job = params.get("job") ?? "";
  const source = params.get("source") ?? "";
  const status = params.get("status") ?? "active";
  const setFilter = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
    setPage(0);
    setSelected(new Set());
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = candidates.filter(
      (c) =>
        (!stage || c.stage === stage) &&
        (!job || c.jobId === job) &&
        (!source || c.source === source) &&
        (status === "all" ||
          (status === "rejected" ? c.rejected : !c.rejected)) &&
        (!term ||
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.currentCompany.toLowerCase().includes(term) ||
          c.tags.some((t) => t.toLowerCase().includes(term))),
    );
    const val = (c: Candidate) =>
      sort.key === "stage" ? STAGES.indexOf(c.stage) : c[sort.key];
    return [...filtered].sort(
      (a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * sort.dir,
    );
  }, [candidates, q, stage, job, source, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice(page * PAGE, page * PAGE + PAGE);
  const allOnPage =
    visible.length > 0 && visible.every((c) => selected.has(c.id));
  const ids = [...selected];
  const jobTitle = (id: string) => jobs.find((j) => j.id === id)?.title ?? "—";
  const clearSel = () => setSelected(new Set());

  const th = (key: SortKey, label: string) => (
    <th
      className="px-3 py-3 font-medium"
      aria-sort={
        sort.key === key
          ? sort.dir === 1
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
        onClick={() =>
          setSort({
            key,
            dir: sort.key === key ? (sort.dir === 1 ? -1 : 1) : 1,
          })
        }
      >
        {label}
        {sort.key === key &&
          (sort.dir === 1 ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          ))}
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle={`${rows.length} matching candidates`}
        actions={
          <>
            <Button
              onClick={() =>
                downloadCsv("candidates.csv", [
                  [
                    "Name",
                    "Email",
                    "Job",
                    "Stage",
                    "Source",
                    "Rating",
                    "Applied",
                  ],
                  ...rows.map((c) => [
                    c.name,
                    c.email,
                    jobTitle(c.jobId),
                    c.stage,
                    c.source,
                    c.rating,
                    c.appliedAt,
                  ]),
                ])
              }
              data-testid="export-csv"
            >
              <Download className="size-4" /> Export
            </Button>
            <Button variant="primary" onClick={() => ui.openAddCandidate()}>
              <UserPlus className="size-4" /> Add candidate
            </Button>
          </>
        }
      />
      <div
        className="mb-4 flex flex-wrap gap-2"
        data-testid="candidate-filters"
      >
        <Input
          placeholder="Search name, email, company, tag…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="w-72"
          aria-label="Search candidates"
          data-testid="candidate-search"
        />
        <Dropdown
          label="Job"
          className="w-56"
          value={job}
          onChange={(v) => setFilter("job", v)}
          options={[
            { value: "", label: "All jobs" },
            ...jobs.map((j) => ({ value: j.id, label: j.title })),
          ]}
          placeholder="All jobs"
          testId="filter-job"
        />
        <Dropdown
          label="Stage"
          className="w-40"
          value={stage}
          onChange={(v) => setFilter("stage", v)}
          searchable={false}
          options={[
            { value: "" as Stage | "", label: "All stages" },
            ...stageOptions,
          ]}
          placeholder="All stages"
          testId="filter-stage"
        />
        <Dropdown
          label="Source"
          className="w-40"
          value={source}
          onChange={(v) => setFilter("source", v)}
          searchable={false}
          options={[
            { value: "", label: "All sources" },
            ...SOURCES.map((s) => ({ value: s, label: s })),
          ]}
          placeholder="All sources"
          testId="filter-source"
        />
        <Dropdown
          label="Status"
          className="w-36"
          value={status}
          onChange={(v) => setFilter("status", v === "active" ? "" : v)}
          searchable={false}
          options={[
            { value: "active", label: "Active" },
            { value: "rejected", label: "Rejected" },
            { value: "all", label: "All" },
          ]}
          testId="filter-status"
        />
      </div>

      {selected.size > 0 && (
        <div
          className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
          data-testid="bulk-bar"
        >
          <span className="font-medium">{selected.size} selected</span>
          <Dropdown
            label="Move to stage"
            className="w-44 text-zinc-900"
            value=""
            placeholder="Move to stage…"
            searchable={false}
            options={stageOptions}
            onChange={(s) => {
              dispatch({ type: "candidate/bulkMove", ids, stage: s });
              toast(`${ids.length} moved`);
              clearSel();
            }}
            testId="bulk-move"
          />
          <Dropdown
            label="Add tag"
            className="w-44 text-zinc-900"
            value=""
            placeholder="Add tag…"
            options={TAGS.map((t) => ({
              value: t,
              label: t,
              icon: <Tag className="size-3" />,
            }))}
            onChange={(t) => {
              dispatch({ type: "candidate/bulkTag", ids, tag: t });
              toast(`Tagged ${ids.length} with “${t}”`);
              clearSel();
            }}
            testId="bulk-tag"
          />
          <Button size="sm" variant="danger" onClick={() => setRejecting(ids)}>
            <XCircle className="size-4" /> Reject
          </Button>
          <button className="ml-auto text-xs underline" onClick={clearSel}>
            Clear selection
          </button>
        </div>
      )}

      <Panel padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="candidates-table">
            <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allOnPage}
                    onChange={() => {
                      const n = new Set(selected);
                      visible.forEach((c) =>
                        allOnPage ? n.delete(c.id) : n.add(c.id),
                      );
                      setSelected(n);
                    }}
                    className="accent-teal-600"
                  />
                </th>
                {th("name", "Candidate")}
                <th className="px-3 py-3 font-medium">Job</th>
                {th("stage", "Stage")}
                <th className="px-3 py-3 font-medium">Source</th>
                {th("rating", "Rating")}
                {th("appliedAt", "Applied")}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visible.map((c) => (
                <tr
                  key={c.id}
                  className={cx(
                    "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                    selected.has(c.id) && "bg-teal-50/60 dark:bg-teal-950/30",
                  )}
                  onClick={() => navigate(`/candidates/${c.id}`)}
                  data-testid={`row-${c.id}`}
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${c.name}`}
                      checked={selected.has(c.id)}
                      onChange={() => {
                        const n = new Set(selected);
                        if (n.has(c.id)) n.delete(c.id);
                        else n.add(c.id);
                        setSelected(n);
                      }}
                      className="accent-teal-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to={`/candidates/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">
                          {c.currentTitle} at {c.currentCompany}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-48 truncate px-3 py-3 text-zinc-600 dark:text-zinc-400">
                    {jobTitle(c.jobId)}
                  </td>
                  <td className="px-3 py-3">
                    <StageBadge c={c} />
                  </td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.source}
                  </td>
                  <td className="px-3 py-3">
                    <Stars value={c.rating} />
                  </td>
                  <td className="px-3 py-3 text-zinc-500">
                    {shortDate(c.appliedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <Empty
              title="No candidates match"
              body="Clear a filter or try a different search."
              action={
                <Button
                  onClick={() => {
                    setParams({});
                    setQ("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800">
          <span>
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              data-testid="prev-page"
            >
              Previous
            </Button>
            <Button
              size="sm"
              disabled={page >= pages - 1}
              onClick={() => setPage(page + 1)}
              data-testid="next-page"
            >
              Next
            </Button>
          </div>
        </footer>
      </Panel>
      <RejectModal
        ids={rejecting}
        onClose={() => {
          setRejecting(null);
          clearSel();
        }}
      />
    </>
  );
}
