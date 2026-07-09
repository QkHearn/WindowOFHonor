import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, GoldDivider, LoadingLine, PageHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { Department } from '../types';

export default function SupervisorTeamsPage() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reload() {
    setLoading(true);
    api
      .listDepartments()
      .then(setDepartments)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const dept = await api.createDepartment(token, name.trim());
      setName('');
      setSuccess(`团队「${dept.name}」已创建`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="团队管理" subtitle="创建团队，供员工注册时选择加入" />
      <div className="grid md:grid-cols-2 gap-10">
        <Card>
          <h2 className="font-display text-xl mb-2">创建新团队</h2>
          <p className="text-sm text-graphite mb-6">
            新建团队后，员工可在注册页选择该团队。您也可以将新成员引导至对应团队注册。
          </p>
          <form onSubmit={handleCreate} className="space-y-6">
            <Input
              label="团队名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：研发二部、市场部"
              required
            />
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? '创建中…' : '创建团队'}
            </Button>
            {error && <p className="text-bronze text-sm">{error}</p>}
            {success && <p className="text-champagne text-sm">{success}</p>}
          </form>
        </Card>

        <section>
          <h2 className="font-display text-xl mb-4">全部团队</h2>
          {loading ? (
            <LoadingLine />
          ) : (
            <div className="space-y-3">
              {departments.map((d) => (
                <Card key={d.id} className="!p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg">{d.name}</h3>
                    <p className="text-xs text-graphite mt-1 tracking-wider">
                      {d.memberCount ?? 0} 名成员
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-champagne/70 border border-champagne/20 px-3 py-1">
                    Team
                  </span>
                </Card>
              ))}
              {!departments.length && <p className="text-graphite">暂无团队，请先创建</p>}
            </div>
          )}
          <GoldDivider className="mt-8" />
          <p className="text-xs text-graphite mt-4 leading-relaxed">
            提示：主管账号本身隶属于某个团队；创建新团队不会自动迁移现有成员，新员工需在注册时选择对应团队。
          </p>
        </section>
      </div>
    </div>
  );
}
