import { createContext, type ReactNode, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleInterviewModal } from "../components/ScheduleInterview";

type UI = {
  openSchedule: (candidateId?: string) => void;
  openAddCandidate: (jobId?: string) => void;
};
const UICtx = createContext<UI>({
  openSchedule: () => {},
  openAddCandidate: () => {},
});

export function UIProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<{
    open: boolean;
    candidateId?: string;
    key: number;
  }>({ open: false, key: 0 });
  return (
    <UICtx.Provider
      value={{
        openSchedule: (candidateId) =>
          setSchedule((s) => ({ open: true, candidateId, key: s.key + 1 })),
        openAddCandidate: (jobId) =>
          navigate(jobId ? `/candidates/new?job=${jobId}` : "/candidates/new"),
      }}
    >
      {children}
      <ScheduleInterviewModal
        key={`s${schedule.key}`}
        open={schedule.open}
        candidateId={schedule.candidateId}
        onClose={() => setSchedule((s) => ({ ...s, open: false }))}
      />
    </UICtx.Provider>
  );
}

export const useUI = () => useContext(UICtx);
