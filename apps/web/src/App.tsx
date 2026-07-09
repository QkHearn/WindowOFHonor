import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireAuth, RequireSupervisor } from './auth/RequireAuth';
import { defaultHomePath } from './auth/storage';
import { AppLayout } from './layouts/AppLayout';
import BroadcastPage from './pages/BroadcastPage';
import IssueIncentivePage from './pages/IssueIncentivePage';
import IssueRecordsPage from './pages/IssueRecordsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MeDashboard from './pages/MeDashboard';
import MeHonorsPage from './pages/MeHonorsPage';
import MePartnersPage from './pages/MePartnersPage';
import MeTasksPage from './pages/MeTasksPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import SupervisorTasksPage from './pages/SupervisorTasksPage';
import SupervisorTeamsPage from './pages/SupervisorTeamsPage';
import TeamPage from './pages/TeamPage';

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={defaultHomePath(user.role)} replace />;
}

function SupervisorOnly({ children }: { children: React.ReactNode }) {
  return <RequireSupervisor>{children}</RequireSupervisor>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/broadcast" element={<BroadcastPage />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<RequireAuth><HomeRedirect /></RequireAuth>} />
            <Route path="/me" element={<RequireAuth><MeDashboard /></RequireAuth>} />
            <Route path="/me/honors" element={<RequireAuth><MeHonorsPage /></RequireAuth>} />
            <Route path="/me/partners" element={<RequireAuth><MePartnersPage /></RequireAuth>} />
            <Route path="/me/tasks" element={<RequireAuth><MeTasksPage /></RequireAuth>} />
            <Route path="/team" element={<RequireAuth><TeamPage /></RequireAuth>} />
            <Route path="/supervisor" element={<SupervisorOnly><SupervisorDashboard /></SupervisorOnly>} />
            <Route path="/supervisor/issue" element={<SupervisorOnly><IssueIncentivePage /></SupervisorOnly>} />
            <Route path="/supervisor/records" element={<SupervisorOnly><IssueRecordsPage /></SupervisorOnly>} />
            <Route path="/supervisor/tasks" element={<SupervisorOnly><SupervisorTasksPage /></SupervisorOnly>} />
            <Route path="/supervisor/teams" element={<SupervisorOnly><SupervisorTeamsPage /></SupervisorOnly>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
