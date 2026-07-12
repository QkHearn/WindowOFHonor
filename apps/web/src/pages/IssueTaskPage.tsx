import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MemberPicker } from '../components/MemberPicker';
import { TaskOrderCard } from '../components/TaskOrderCard';
import { TaskStatusHint } from '../components/TaskStatusEditor';
import {
  TaskStatusFilter,
  TASK_STATUS_FILTERS,
  type TaskStatusFilterValue,
} from '../components/TaskStatusFilter';
import { Button } from '../components/ui/Button';
import { LoadingLine, PageHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { TaskOrder, TeamMember } from '../types';

export default function IssueTaskPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TaskStatusFilterValue>('in_progress');
  const [selected, setSelected] = useState<Map<string, TeamMember>>(new Map());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .listTasks(token, status === 'all' ? undefined : status)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [token, status]);

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
      if (status === 'all' || status === 'in_progress') {
        setLoading(true);
        api
          .listTasks(token, status === 'all' ? undefined : status)
          .then(setTasks)
          .finally(() => setLoading(false));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发放失败');
    } finally {
      setSubmitting(false);
    }
  }

  const sectionTitle =
    TASK_STATUS_FILTERS.find((f) => f.value === status)?.label ?? '任务';

  return (
    <div>
      <PageHeader title="发放任务令" subtitle="向所管理组织的员工分配任务" />
      <div className="grid md:grid-cols-2 gap-10">
        <form onSubmit={submit}>
          <MemberPicker
            token={token!}
            selected={selected}
            onChange={setSelected}
            label="选择组织成员（可多选）"
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
          <h2 className="font-display text-xl mb-2">已发放任务</h2>
          <TaskStatusHint />
          <TaskStatusFilter value={status} onChange={setStatus} />
          {loading ? (
            <LoadingLine />
          ) : (
            <div className="space-y-4">
              {tasks.map((t) => (
                <TaskOrderCard
                  key={t.id}
                  task={t}
                  token={token}
                  showAssignee
                  onUpdated={(updated) =>
                    setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                  }
                />
              ))}
              {!tasks.length && <p className="text-graphite">暂无{sectionTitle === '全部' ? '' : sectionTitle}任务</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
