import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { defaultHomePath, isSupervisor } from './storage';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function RequireSupervisor({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !isSupervisor(user.role)) {
    return <Navigate to={defaultHomePath(user?.role ?? 'employee')} replace />;
  }
  return <>{children}</>;
}
