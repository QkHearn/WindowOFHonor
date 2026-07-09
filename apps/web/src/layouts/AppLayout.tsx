import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { defaultHomePath } from '../auth/storage';
import { GoldDivider } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm tracking-wider transition-colors whitespace-nowrap ${isActive ? 'text-champagne' : 'text-graphite hover:text-ink'}`;

export function AppLayout() {
  const { user, logout, isSupervisor, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function goHome() {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    navigate(defaultHomePath(user.role));
  }

  return (
    <div className="min-h-screen bg-[#F7F3ED] text-ink font-body">
      <nav className="border-b border-champagne/15 bg-ivory/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button type="button" onClick={goHome} className="font-display text-lg tracking-widest shrink-0">
            荣耀之窗
          </button>
          <div className="flex items-center gap-5 overflow-x-auto">
            {isSupervisor && (
              <>
                <NavLink to="/supervisor" className={linkClass}>工作台</NavLink>
                <NavLink to="/supervisor/issue" className={linkClass}>呈递荣誉</NavLink>
                <NavLink to="/supervisor/records" className={linkClass}>发放记录</NavLink>
                <NavLink to="/supervisor/tasks" className={linkClass}>任务令</NavLink>
                <NavLink to="/supervisor/teams" className={linkClass}>团队</NavLink>
              </>
            )}
            {isAuthenticated && (
              <>
                <NavLink to="/me" className={linkClass}>个人中心</NavLink>
                <NavLink to="/team" className={linkClass}>团队展播</NavLink>
              </>
            )}
            <NavLink to="/leaderboard" className={linkClass}>排行榜</NavLink>
            <NavLink to="/broadcast" className={linkClass}>荣誉展播</NavLink>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-graphite hidden md:inline">{user?.displayName}</span>
                <Button variant="ghost" onClick={() => { logout(); navigate('/login'); }}>退出</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => navigate('/login')}>登录</Button>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Outlet />
      </main>
      <footer className="max-w-6xl mx-auto px-6 pb-8">
        <GoldDivider />
        <p className="text-center text-xs text-graphite/60 tracking-[0.3em] uppercase mt-6">Window of Honor</p>
      </footer>
    </div>
  );
}
