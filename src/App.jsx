import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { SiteProvider } from "@/context/SiteContext";
import {
  clearToken,
  getToken,
  getTokenExpiry,
  isSessionActive,
  subscribeSession,
} from "@/lib/api";
import EntriesPage from "@/pages/EntriesPage";
import LoginPage from "@/pages/LoginPage";
import OverviewPage from "@/pages/OverviewPage";

function useSessionActive() {
  const [active, setActive] = useState(isSessionActive);

  useEffect(() => subscribeSession(() => setActive(isSessionActive())), []);

  return active;
}

function SessionExpiry() {
  const active = useSessionActive();

  useEffect(() => {
    if (!active) {
      getToken() && clearToken();
      return undefined;
    }

    const exp = getTokenExpiry();
    if (exp == null) return undefined;
    const id = setTimeout(clearToken, Math.max(exp - Date.now(), 0));
    return () => clearTimeout(id);
  }, [active]);

  return null;
}

function GuestLogin() {
  const active = useSessionActive();
  if (active) {
    return <Navigate to="/overview" replace />;
  }
  return <LoginPage />;
}

function ProtectedApp() {
  const active = useSessionActive();
  if (!active) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SiteProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </SiteProvider>
  );
}

export default function App() {
  return (
    <>
      <SessionExpiry />
      <Routes>
        <Route path="/login" element={<GuestLogin />} />
        <Route element={<ProtectedApp />}>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/entries" element={<EntriesPage />} />
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </>
  );
}
