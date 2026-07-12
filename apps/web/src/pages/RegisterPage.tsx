import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { defaultHomePath } from '../auth/storage';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Department } from '../types';

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(defaultHomePath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    api.listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departmentId) {
      setError('请选择所属团队');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const u = await register({ username, password, displayName, departmentId });
      navigate(defaultHomePath(u.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="加入荣耀之窗"
      subtitle="注册后将加入所选团队"
      footer={
        <p className="text-xs text-graphite text-center tracking-wide">
          注册后将以员工身份加入所选团队
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input label="显示名称" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <div className="mt-7">
          <Input label="用户名" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="mt-7">
          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>
        <label className="block mt-7 group">
          <span className="text-xs font-medium text-graphite mb-2 block group-focus-within:text-bronze transition-colors">
            所属团队
          </span>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className="w-full bg-transparent border-0 border-b-2 border-parchment pb-2.5 focus:outline-none focus:border-champagne transition-colors text-ink text-[15px]"
          >
            <option value="">请选择团队</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-bronze mt-5 border-l-2 border-bronze/50 pl-3">{error}</p>}
        <div className="mt-9 flex gap-3">
          <Button type="submit" variant="gold" disabled={loading} className="flex-1">
            {loading ? '注册中…' : '创建账号'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/login')}>
            返回登录
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
