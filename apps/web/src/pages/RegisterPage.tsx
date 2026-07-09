import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { defaultHomePath } from '../auth/storage';
import { Button } from '../components/ui/Button';
import { GoldDivider } from '../components/ui/Card';
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
    <div className="min-h-screen bg-ink text-ivory flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_30%,#C9A96233,transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <p className="tracking-[0.35em] text-xs text-champagne uppercase mb-4">Window of Honor</p>
        <h1 className="font-display text-5xl font-semibold">加入荣耀之窗</h1>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-ivory/95 backdrop-blur-xl text-ink p-10 rounded-sm border border-champagne/20 shadow-2xl relative z-10"
      >
        <Input label="显示名称" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <div className="mt-6">
          <Input label="用户名" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="mt-6">
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
        <label className="block mt-6">
          <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">所属团队</span>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne"
          >
            <option value="">请选择团队</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-bronze mt-4 border-b border-bronze/40 pb-2">{error}</p>}
        <div className="mt-8 flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? '注册中…' : '创建账号'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/login')}>
            返回登录
          </Button>
        </div>
        <GoldDivider className="mt-8" />
        <p className="text-xs text-graphite text-center mt-4">注册后将以员工身份加入所选团队</p>
      </motion.form>
    </div>
  );
}
