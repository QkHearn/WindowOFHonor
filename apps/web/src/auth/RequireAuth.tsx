import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { defaultHomePath, isAdmin, isMember, isSuperAdmin } from './storage';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !isSuperAdmin(user.role)) {
    return <Navigate to={defaultHomePath(user?.role ?? 'employee')} replace />;
  }
  return <>{children}</>;
}

export function RequireSupervisor({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !isAdmin(user.role)) {
    return <Navigate to={defaultHomePath(user?.role ?? 'employee')} replace />;
  }
  return <>{children}</>;
}

/** 管理员或员工（非系统管理员） */
export function RequireMember({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !isMember(user.role)) {
    return <Navigate to={defaultHomePath(user?.role ?? 'employee')} replace />;
  }
  return <>{children}</>;
}

/** @deprecated use RequireSupervisor */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return <RequireSupervisor>{children}</RequireSupervisor>;
}
