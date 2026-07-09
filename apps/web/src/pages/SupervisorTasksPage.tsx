import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MemberPicker } from '../components/MemberPicker';
import { Button } from '../components/ui/Button';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { TaskOrder, TeamMember } from '../types';

const statusLabel: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  expired: '已过期',
};

export default function SupervisorTasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Map<string, TeamMember>>(new Map());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reload() {
    if (!token) return;
    setLoading(true);
    api
      .listTasks(token)
      .then(setTasks)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !title.trim() || selected.size === 0) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.createTask(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeIds: Array.from(selected.keys()),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      setTitle('');
      setDescription('');
      setDueAt('');
      setSelected(new Map());
      setSuccess(`已向 ${res.count} 人发放任务令`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发放失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="任务令管理" subtitle="向一名或多名成员分配任务与挑战" />
      <div className="grid md:grid-cols-2 gap-10">
        <form onSubmit={submit}>
          <h2 className="font-display text-xl mb-4">发放任务令</h2>
          <MemberPicker
            token={token!}
            selected={selected}
            onChange={setSelected}
            label="选择接收人（可多选）"
          />
          <div className="mt-8 space-y-6">
            <Input label="任务标题" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="block">
              <span className="text-xs tracking-[0.2em] uppercase text-graphite mb-2 block">任务说明</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-graphite/30 pb-2 focus:outline-none focus:border-champagne min-h-[80px]"
              />
            </label>
            <Input
              label="截止日期（可选）"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <Button className="mt-8" type="submit" disabled={submitting || !title.trim() || selected.size === 0}>
            {submitting ? '发放中…' : `发放给 ${selected.size || 0} 人`}
          </Button>
          {error && <p className="text-bronze mt-4">{error}</p>}
          {success && <p className="text-champagne mt-4">{success}</p>}
        </form>

        <section>
          <h2 className="font-display text-xl mb-4">已发放任务</h2>
          {loading ? (
            <LoadingLine />
          ) : (
            <div className="space-y-4">
              {tasks.map((t) => (
                <Card key={t.id} className="!p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest border border-champagne/40 px-2 py-0.5 text-champagne">
                        {statusLabel[t.status] ?? t.status}
                      </span>
                      <h3 className="font-display text-lg mt-2">{t.title}</h3>
                      {t.description && <p className="text-sm text-graphite mt-1">{t.description}</p>}
                      {t.assignee && (
                        <p className="text-xs text-graphite mt-2">接收人：{t.assignee.displayName}</p>
                      )}
                    </div>
                    {t.dueAt && (
                      <time className="text-xs text-graphite shrink-0">
                        截止 {new Date(t.dueAt).toLocaleDateString('zh-CN')}
                      </time>
                    )}
                  </div>
                </Card>
              ))}
              {!tasks.length && <p className="text-graphite">暂无已发放任务</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
