import { createContext, type ReactNode, useContext, useState } from "react";
import { AddCandidateModal, ScheduleInterviewModal } from "../components/ats";

type UI = {
  openSchedule: (candidateId?: string) => void;
  openAddCandidate: (jobId?: string) => void;
};
const UICtx = createContext<UI>({
  openSchedule: () => {},
  openAddCandidate: () => {},
});

export function UIProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<{
    open: boolean;
    candidateId?: string;
    key: number;
  }>({ open: false, key: 0 });
  const [add, setAdd] = useState<{
    open: boolean;
    jobId?: string;
    key: number;
  }>({ open: false, key: 0 });
  return (
    <UICtx.Provider
      value={{
        openSchedule: (candidateId) =>
          setSchedule((s) => ({ open: true, candidateId, key: s.key + 1 })),
        openAddCandidate: (jobId) =>
          setAdd((s) => ({ open: true, jobId, key: s.key + 1 })),
      }}
    >
      {children}
      <ScheduleInterviewModal
        key={`s${schedule.key}`}
        open={schedule.open}
        candidateId={schedule.candidateId}
        onClose={() => setSchedule((s) => ({ ...s, open: false }))}
      />
      <AddCandidateModal
        key={`a${add.key}`}
        open={add.open}
        jobId={add.jobId}
        onClose={() => setAdd((s) => ({ ...s, open: false }))}
      />
    </UICtx.Provider>
  );
}

export const useUI = () => useContext(UICtx);
