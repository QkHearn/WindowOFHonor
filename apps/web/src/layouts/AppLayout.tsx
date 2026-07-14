import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { defaultHomePath } from '../auth/storage';
import { GoldDivider } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
    >
      {children}
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout, isSuperAdmin, isAdmin, isMember, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function goHome() {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    navigate(defaultHomePath(user.role));
  }

  return (
    <div className="page-shell">
      <nav className="app-nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={goHome}
            className="font-display text-xl font-semibold text-ivory tracking-wide shrink-0 hover:text-champagne transition-colors"
          >
            荣耀之窗
          </button>
          <div className="flex items-center justify-center gap-7 min-w-0">
            {isSuperAdmin && <NavItem to="/system">系统管理</NavItem>}
            {isMember && (
              <>
                <NavItem to="/me">个人中心</NavItem>
                <NavItem to="/appreciation">发放赞赏</NavItem>
                {isAdmin && <NavItem to="/tasks/issue">发放任务令</NavItem>}
                <NavItem to="/leaderboard">排行榜</NavItem>
                <NavItem to="/broadcast">荣誉殿堂</NavItem>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-ivory/65 hidden md:inline font-medium">
                  {user?.displayName}
                </span>
                <Button
                  variant="ghost"
                  onDark
                  className="!px-4 !py-2 !text-sm"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  退出
                </Button>
              </>
            ) : (
              <Button variant="outline" onDark className="!px-4 !py-2" onClick={() => navigate('/login')}>
                登录
              </Button>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-10 md:py-12 min-h-[calc(100vh-11rem)]">
        <Outlet />
      </main>
      <footer className="max-w-6xl mx-auto px-6 pb-10">
        <GoldDivider />
        <p className="text-center section-label opacity-50 mt-6">Window of Honor</p>
      </footer>
    </div>
  );
}
