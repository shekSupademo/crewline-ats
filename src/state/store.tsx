import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { createSeed, isoDay } from "../data/seed";
import type {
  AppState,
  Candidate,
  Interview,
  Job,
  JobStatus,
  Member,
  Role,
  Scorecard,
  Settings,
  Stage,
} from "../data/types";
import { uid } from "../lib/format";

const STORAGE_KEY = "crewline:v1";

export type Action =
  | { type: "candidate/move"; id: string; stage: Stage; beforeId?: string }
  | { type: "candidate/bulkMove"; ids: string[]; stage: Stage }
  | { type: "candidate/reject"; ids: string[]; reason: string }
  | { type: "candidate/restore"; id: string }
  | {
      type: "candidate/update";
      id: string;
      patch: Partial<
        Pick<
          Candidate,
          "rating" | "tags" | "jobId" | "email" | "phone" | "location"
        >
      >;
    }
  | { type: "candidate/bulkTag"; ids: string[]; tag: string }
  | { type: "candidate/create"; candidate: Candidate }
  | { type: "note/add"; candidateId: string; body: string }
  | { type: "scorecard/add"; candidateId: string; scorecard: Scorecard }
  | { type: "job/create"; job: Job }
  | { type: "job/setStatus"; id: string; status: JobStatus }
  | { type: "job/duplicate"; id: string }
  | { type: "interview/create"; interview: Interview }
  | { type: "interview/cancel"; id: string }
  | { type: "member/invite"; member: Member }
  | { type: "member/setRole"; id: string; role: Role }
  | { type: "member/remove"; id: string }
  | { type: "settings/update"; patch: Partial<Settings> }
  | { type: "reset" };

const mapCand = (
  s: AppState,
  ids: string[],
  fn: (c: Candidate) => Candidate,
) => {
  const set = new Set(ids);
  return {
    ...s,
    candidates: s.candidates.map((c) => (set.has(c.id) ? fn(c) : c)),
  };
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "candidate/move": {
      const c = state.candidates.find((x) => x.id === action.id);
      if (!c) return state;
      const moved = { ...c, stage: action.stage, rejected: false };
      const rest = state.candidates.filter((x) => x.id !== action.id);
      const at = action.beforeId
        ? rest.findIndex((x) => x.id === action.beforeId)
        : -1;
      return {
        ...state,
        candidates:
          at === -1
            ? [...rest, moved]
            : [...rest.slice(0, at), moved, ...rest.slice(at)],
      };
    }
    case "candidate/bulkMove":
      return mapCand(state, action.ids, (c) => ({
        ...c,
        stage: action.stage,
        rejected: false,
      }));
    case "candidate/reject":
      return mapCand(state, action.ids, (c) => ({
        ...c,
        rejected: true,
        rejectReason: action.reason,
      }));
    case "candidate/restore":
      return mapCand(state, [action.id], (c) => ({
        ...c,
        rejected: false,
        rejectReason: undefined,
      }));
    case "candidate/update":
      return mapCand(state, [action.id], (c) => ({ ...c, ...action.patch }));
    case "candidate/bulkTag":
      return mapCand(state, action.ids, (c) =>
        c.tags.includes(action.tag)
          ? c
          : { ...c, tags: [...c.tags, action.tag] },
      );
    case "candidate/create":
      return { ...state, candidates: [action.candidate, ...state.candidates] };
    case "note/add":
      return mapCand(state, [action.candidateId], (c) => ({
        ...c,
        notes: [
          {
            id: uid("n"),
            author: state.settings.userName,
            at: isoDay(new Date()),
            body: action.body,
          },
          ...c.notes,
        ],
      }));
    case "scorecard/add":
      return mapCand(state, [action.candidateId], (c) => ({
        ...c,
        scorecards: [action.scorecard, ...c.scorecards],
      }));
    case "job/create":
      return { ...state, jobs: [action.job, ...state.jobs] };
    case "job/setStatus":
      return {
        ...state,
        jobs: state.jobs.map((j) =>
          j.id === action.id ? { ...j, status: action.status } : j,
        ),
      };
    case "job/duplicate": {
      const j = state.jobs.find((x) => x.id === action.id);
      return j
        ? {
            ...state,
            jobs: [
              {
                ...j,
                id: uid("job"),
                title: `${j.title} (copy)`,
                status: "draft",
                openedAt: isoDay(new Date()),
              },
              ...state.jobs,
            ],
          }
        : state;
    }
    case "interview/create":
      return { ...state, interviews: [...state.interviews, action.interview] };
    case "interview/cancel":
      return {
        ...state,
        interviews: state.interviews.filter((i) => i.id !== action.id),
      };
    case "member/invite":
      return { ...state, members: [...state.members, action.member] };
    case "member/setRole":
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.id ? { ...m, role: action.role } : m,
        ),
      };
    case "member/remove":
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.id),
      };
    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "reset":
      return createSeed();
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // Storage can be blocked; fall back to fresh demo data.
  }
  return createSeed();
}

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota or privacy-mode errors.
    }
  }, [state]);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useStore() {
  const s = useContext(StateCtx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

export function useDispatch() {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error("useDispatch outside StoreProvider");
  return d;
}
