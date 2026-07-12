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

export default function MeTeamTasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskOrder[]>([]);
  const [deptName, setDeptName] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TaskStatusFilterValue>('in_progress');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .teamTasks(token, status === 'all' ? undefined : status)
      .then((res) => {
        setTasks(res.tasks);
        setDeptName(res.department?.name ?? '');
      })
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
        title="团队任务令"
        subtitle={deptName ? `${deptName} 成员任务` : '暂无组织'}
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
              showAssigner
              teamManage
              onUpdated={patchTask}
            />
          ))}
          {!tasks.length && <p className="text-graphite">暂无团队任务</p>}
        </div>
      )}
    </div>
  );
}
