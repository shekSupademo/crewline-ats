import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cx } from "../lib/format";
import { useApplyTheme } from "../lib/theme";
import { useDispatch, useStore } from "../state/store";
import { useUI } from "../state/ui";
import { CommandPalette } from "./CommandPalette";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/interviews", label: "Interviews", icon: CalendarDays },
];

export function Layout() {
  const { jobs, candidates, settings } = useStore();
  const dispatch = useDispatch();
  const ui = useUI();
  const navigate = useNavigate();
  const [palette, setPalette] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useApplyTheme(settings.theme);

  useEffect(() => setMobileNav(false), [location.pathname]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    if (!createMenu) return;
    const h = (e: MouseEvent) =>
      !menuRef.current?.contains(e.target as Node) && setCreateMenu(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [createMenu]);

  const newApplicants = candidates.filter(
    (c) => c.stage === "applied" && !c.rejected,
  ).length;
  const openJobs = jobs.filter((j) => j.status === "open");
  const dark = document.documentElement.classList.contains("dark");

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 p-4" aria-label="Main">
      <div className="flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-bold text-white shadow-sm shadow-teal-600/30">
          C
        </span>
        <span className="font-semibold tracking-tight">
          {settings.companyName}
        </span>
        <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800">
          ATS
        </span>
      </div>
      <ul className="space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900",
                )
              }
            >
              <Icon className="size-4" />
              {label}
              {to === "/candidates" && newApplicants > 0 && (
                <span
                  className="ml-auto rounded-full bg-teal-100 px-1.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  data-testid="nav-new-count"
                >
                  {newApplicants}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div>
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          Open jobs
        </p>
        <ul className="space-y-0.5">
          {openJobs.map((j) => (
            <li key={j.id}>
              <NavLink
                to={`/jobs/${j.id}`}
                className={({ isActive }) =>
                  cx(
                    "flex justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                    isActive
                      ? "bg-zinc-200/70 dark:bg-zinc-800"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                  )
                }
              >
                <span className="truncate">{j.title}</span>
                <span className="tabular text-xs text-zinc-400">
                  {
                    candidates.filter((c) => c.jobId === j.id && !c.rejected)
                      .length
                  }
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cx(
              "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium",
              isActive
                ? "bg-zinc-200/70 dark:bg-zinc-800"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
            )
          }
        >
          <Settings className="size-4" /> Settings
        </NavLink>
      </div>
    </nav>
  );

  const menuItem =
    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800";
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white lg:block dark:border-zinc-800 dark:bg-zinc-950">
        {sidebar}
      </aside>
      {mobileNav && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setMobileNav(false)
          }
        >
          <aside className="h-full w-64 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur lg:px-8 dark:border-zinc-800 dark:bg-zinc-950/80">
          <button
            className="rounded p-1.5 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setPalette(true)}
            data-testid="open-search"
            className="flex h-9 max-w-sm flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-400 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate text-left">
              Search candidates, jobs…
            </span>
            <kbd className="hidden rounded border border-zinc-200 px-1.5 text-[10px] sm:inline dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Toggle dark mode"
              data-testid="theme-toggle"
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              onClick={() =>
                dispatch({
                  type: "settings/update",
                  patch: { theme: dark ? "light" : "dark" },
                })
              }
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setCreateMenu((m) => !m)}
                data-testid="create-menu"
                aria-expanded={createMenu}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-teal-600 px-4 text-sm font-medium text-white shadow-sm shadow-teal-600/30 hover:bg-teal-500"
              >
                <Plus className="size-4" /> Create{" "}
                <ChevronDown className="size-4" />
              </button>
              {createMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <button
                    role="menuitem"
                    className={menuItem}
                    onClick={() => {
                      setCreateMenu(false);
                      ui.openAddCandidate();
                    }}
                  >
                    Add candidate
                  </button>
                  <button
                    role="menuitem"
                    className={menuItem}
                    onClick={() => {
                      setCreateMenu(false);
                      navigate("/jobs?new=1");
                    }}
                  >
                    Post a job
                  </button>
                  <button
                    role="menuitem"
                    className={menuItem}
                    onClick={() => {
                      setCreateMenu(false);
                      ui.openSchedule();
                    }}
                  >
                    Schedule interview
                  </button>
                </div>
              )}
            </div>
            <span
              className="ml-1 hidden size-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold sm:flex dark:bg-zinc-800"
              title={settings.userName}
            >
              {settings.userName
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
