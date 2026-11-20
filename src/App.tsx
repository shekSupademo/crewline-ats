import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CandidateProfile } from "./pages/CandidateProfile";
import { Candidates } from "./pages/Candidates";
import { Dashboard } from "./pages/Dashboard";
import { Interviews } from "./pages/Interviews";
import { JobPipeline } from "./pages/JobPipeline";
import { Jobs } from "./pages/Jobs";
import { Settings } from "./pages/Settings";
import { StoreProvider } from "./state/store";
import { ToastProvider } from "./state/toast";
import { UIProvider } from "./state/ui";

// HashRouter keeps deep links working on GitHub Pages, which has no SPA fallback.
export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <UIProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="jobs/:id" element={<JobPipeline />} />
                <Route path="candidates" element={<Candidates />} />
                <Route path="candidates/:id" element={<CandidateProfile />} />
                <Route path="interviews" element={<Interviews />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </UIProvider>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}
