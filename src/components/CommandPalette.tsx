import { ArrowRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STAGE_LABEL } from "../data/types";
import { cx } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useUI } from "../state/ui";

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { candidates, jobs } = useStore();
  const dispatch = useDispatch();
  const ui = useUI();

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (path: string) => () => navigate(path);
    const dark = document.documentElement.classList.contains("dark");
    const base: Item[] = [
      { id: "dash", label: "Go to Dashboard", group: "Navigate", run: go("/") },
      { id: "jobs", label: "Go to Jobs", group: "Navigate", run: go("/jobs") },
      {
        id: "cands",
        label: "Go to Candidates",
        group: "Navigate",
        run: go("/candidates"),
      },
      {
        id: "ints",
        label: "Go to Interviews",
        group: "Navigate",
        run: go("/interviews"),
      },
      {
        id: "set",
        label: "Go to Settings",
        group: "Navigate",
        run: go("/settings"),
      },
      {
        id: "add",
        label: "Add candidate",
        group: "Actions",
        run: () => ui.openAddCandidate(),
      },
      {
        id: "post",
        label: "Post a job",
        group: "Actions",
        run: go("/jobs?new=1"),
      },
      {
        id: "sched",
        label: "Schedule interview",
        group: "Actions",
        run: () => ui.openSchedule(),
      },
      {
        id: "theme",
        label: `Switch to ${dark ? "light" : "dark"} mode`,
        group: "Actions",
        run: () =>
          dispatch({
            type: "settings/update",
            patch: { theme: dark ? "light" : "dark" },
          }),
      },
    ];
    const term = q.trim().toLowerCase();
    if (!term) return base;
    const candHits = candidates
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term),
      )
      .slice(0, 6)
      .map((c) => ({
        id: c.id,
        label: c.name,
        hint: STAGE_LABEL[c.stage],
        group: "Candidates",
        run: go(`/candidates/${c.id}`),
      }));
    const jobHits = jobs
      .filter((j) => j.title.toLowerCase().includes(term))
      .slice(0, 4)
      .map((j) => ({
        id: j.id,
        label: j.title,
        hint: j.department,
        group: "Jobs",
        run: go(`/jobs/${j.id}`),
      }));
    return [
      ...base.filter((i) => i.label.toLowerCase().includes(term)),
      ...candHits,
      ...jobHits,
    ];
  }, [q, candidates, jobs, navigate, ui, dispatch]);

  if (!open) return null;
  const runAt = (i: number) => {
    items[i]?.run();
    onClose();
  };
  let lastGroup = "";
  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-zinc-950/40 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        data-testid="command-palette"
        className="h-fit w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-4 dark:border-zinc-800">
          <Search className="size-4 text-zinc-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter") runAt(active);
            }}
            placeholder="Search candidates, jobs, actions…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-zinc-200 px-1.5 text-[10px] text-zinc-400 dark:border-zinc-700">
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.id}>
                {header && (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    {header}
                  </p>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runAt(i)}
                  className={cx(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm",
                    i === active &&
                      "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
                  )}
                >
                  <span>{it.label}</span>
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    {it.hint}
                    {i === active && <ArrowRight className="size-3.5" />}
                  </span>
                </button>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="px-2 py-8 text-center text-sm text-zinc-500">
              No results
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
