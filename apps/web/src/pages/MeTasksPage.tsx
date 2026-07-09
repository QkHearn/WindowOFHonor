import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Card, LoadingLine, PageHeader } from '../components/ui/Card';
import type { TaskOrder } from '../types';

const statusLabel: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  expired: '已过期',
};

export default function MeTasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.myTasks(token).then(setTasks).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingLine />;

  return (
    <div>
      <PageHeader title="我的任务令" subtitle="主管分配的任务与挑战" />
      <div className="space-y-4">
        {tasks.map((t) => (
          <Card key={t.id} className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-widest border border-champagne/40 px-2 py-0.5 text-champagne">
                {statusLabel[t.status] ?? t.status}
              </span>
              <h3 className="font-display text-xl mt-3">{t.title}</h3>
              {t.description && <p className="text-graphite mt-1">{t.description}</p>}
              {t.assignedBy && <p className="text-xs text-graphite mt-2">分配人：{t.assignedBy.displayName}</p>}
            </div>
            {t.dueAt && (
              <time className="text-xs text-graphite">截止 {new Date(t.dueAt).toLocaleDateString('zh-CN')}</time>
            )}
          </Card>
        ))}
        {!tasks.length && <p className="text-graphite">暂无任务令</p>}
      </div>
    </div>
  );
}
