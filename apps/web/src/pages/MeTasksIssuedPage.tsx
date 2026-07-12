import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MeBackLink } from '../components/MeBackLink';
import { TaskOrderCard } from '../components/TaskOrderCard';
import { TaskStatusHint } from '../components/TaskStatusEditor';
import {
  TaskStatusFilter,
  type TaskStatusFilterValue,
} from '../components/TaskStatusFilter';
import { LoadingLine, PageHeader } from '../components/ui/Card';
import type { TaskOrder } from '../types';

export default function MeTasksIssuedPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TaskStatusFilterValue>('all');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .myIssuedTasks(token, status === 'all' ? undefined : status)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [token, status]);

  function patchTask(updated: TaskOrder) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  if (loading && !tasks.length) return <LoadingLine />;

  return (
    <div>
      <MeBackLink />
      <PageHeader
        title="已发放任务令"
        subtitle={`共 ${tasks.length} 条${status === 'all' ? '' : '（当前筛选）'}`}
      />
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
              onUpdated={patchTask}
            />
          ))}
          {!tasks.length && <p className="text-graphite">暂无任务记录</p>}
        </div>
      )}
    </div>
  );
}
