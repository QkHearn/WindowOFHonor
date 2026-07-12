import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { defaultHomePath } from '../auth/storage';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(defaultHomePath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(username, password);
      navigate(defaultHomePath(u.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="荣耀之窗"
      subtitle="让成就被看见 · 让激励有仪式感"
      footer={
        <p className="text-xs text-center">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-champagne hover:text-bronze tracking-[0.15em] transition-colors"
          >
            没有账号？立即注册
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input label="用户名" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        <div className="mt-7">
          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-bronze mt-5 border-l-2 border-bronze/50 pl-3">{error}</p>}
        <div className="mt-9 flex gap-3">
          <Button type="submit" variant="gold" disabled={loading} className="flex-1">
            {loading ? '进入中…' : '进入'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/broadcast')}>
            荣誉殿堂
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
