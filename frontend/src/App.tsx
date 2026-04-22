import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { useAuth } from "./auth";
import { AllTasksPage } from "./pages/AllTasksPage";
import { LoginPage } from "./pages/LoginPage";
import { TodayPage } from "./pages/TodayPage";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) {
    return <main className="centered-card">Restoring session...</main>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/today" element={<TodayPage />} />
        <Route path="/tasks" element={<AllTasksPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
