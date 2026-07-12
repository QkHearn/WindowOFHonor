import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import {
  RequireAuth,
  RequireMember,
  RequireSuperAdmin,
  RequireSupervisor,
} from './auth/RequireAuth';
import { defaultHomePath } from './auth/storage';
import { AppLayout } from './layouts/AppLayout';
import BroadcastPage from './pages/BroadcastPage';
import IssueAppreciationPage from './pages/IssueAppreciationPage';
import IssueTaskPage from './pages/IssueTaskPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MeDashboard from './pages/MeDashboard';
import MeHonorsPage from './pages/MeHonorsPage';
import MeHonorsIssuedPage from './pages/MeHonorsIssuedPage';
import MePartnersPage from './pages/MePartnersPage';
import MeTasksPage from './pages/MeTasksPage';
import MeTasksIssuedPage from './pages/MeTasksIssuedPage';
import MeTeamHonorsPage from './pages/MeTeamHonorsPage';
import MeTeamTasksPage from './pages/MeTeamTasksPage';
import MeTeamPartnersPage from './pages/MeTeamPartnersPage';
import SystemAdminPage from './pages/SystemAdminPage';

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={defaultHomePath(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<RequireAuth><HomeRedirect /></RequireAuth>} />

            <Route path="/system" element={<RequireSuperAdmin><SystemAdminPage /></RequireSuperAdmin>} />

            <Route path="/me" element={<RequireMember><MeDashboard /></RequireMember>} />
            <Route path="/me/honors" element={<RequireMember><MeHonorsPage /></RequireMember>} />
            <Route path="/me/honors/issued" element={<RequireMember><MeHonorsIssuedPage /></RequireMember>} />
            <Route path="/me/partners" element={<RequireMember><MePartnersPage /></RequireMember>} />
            <Route path="/me/tasks" element={<RequireMember><MeTasksPage /></RequireMember>} />
            <Route path="/me/tasks/issued" element={<RequireSupervisor><MeTasksIssuedPage /></RequireSupervisor>} />
            <Route path="/me/tasks/history" element={<Navigate to="/me/tasks/issued" replace />} />
            <Route path="/me/team/honors" element={<RequireMember><MeTeamHonorsPage /></RequireMember>} />
            <Route path="/me/team/tasks" element={<RequireMember><MeTeamTasksPage /></RequireMember>} />
            <Route path="/me/team/partners" element={<RequireMember><MeTeamPartnersPage /></RequireMember>} />

            <Route path="/appreciation" element={<RequireMember><IssueAppreciationPage /></RequireMember>} />
            <Route path="/tasks/issue" element={<RequireSupervisor><IssueTaskPage /></RequireSupervisor>} />

            <Route path="/supervisor" element={<Navigate to="/me" replace />} />
            <Route path="/supervisor/tasks" element={<Navigate to="/tasks/issue" replace />} />
            <Route path="/supervisor/issue" element={<Navigate to="/appreciation" replace />} />
            <Route path="/supervisor/records" element={<Navigate to="/me" replace />} />
            <Route path="/supervisor/teams" element={<Navigate to="/system" replace />} />
            <Route path="/team" element={<Navigate to="/me" replace />} />
          </Route>

          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/broadcast" element={<BroadcastPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
