import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import {
  TaskStatusEditor,
  TaskStatusBadge,
} from './TaskStatusEditor';
import type { TaskStatusEditableValue } from './TaskStatusFilter';
import { Card } from './ui/Card';
import type { TaskOrder } from '../types';

function isAfterDue(dueAt?: string | null) {
  return !!dueAt && new Date(dueAt).getTime() <= Date.now();
}

function canEditTask(
  task: TaskOrder,
  userId?: string,
  options?: { teamManage?: boolean; isAdmin?: boolean },
) {
  if (!userId) return false;
  if (task.assignee?.id === userId || task.assignedBy?.id === userId) return true;
  if (options?.teamManage && options.isAdmin) return true;
  return false;
}

export function TaskOrderCard({
  task,
  token,
  onUpdated,
  showAssignee,
  showAssigner,
  teamManage,
}: {
  task: TaskOrder;
  token?: string | null;
  onUpdated?: (task: TaskOrder) => void;
  showAssignee?: boolean;
  showAssigner?: boolean;
  /** 团队页：管理员可调整所管组织成员的任务状态 */
  teamManage?: boolean;
}) {
  const { user, isAdmin } = useAuth();
  const [current, setCurrent] = useState(task);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editable =
    !!token && canEditTask(current, user?.id, { teamManage, isAdmin });

  useEffect(() => {
    setCurrent(task);
  }, [task]);

  async function handleStatusChange(status: TaskStatusEditableValue) {
    if (!token) return;
    const normalizedCurrent =
      current.status === 'completed'
        ? 'completed'
        : isAfterDue(current.dueAt)
          ? 'expired'
          : 'in_progress';
    if (status === normalizedCurrent) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateTaskStatus(token, current.id, status);
      setCurrent(updated);
      onUpdated?.(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="!p-5 lux-card-hover">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {editable ? (
              <TaskStatusEditor
                status={current.status}
                dueAt={current.dueAt}
                disabled={saving}
                onChange={handleStatusChange}
              />
            ) : (
              <TaskStatusBadge status={current.status} />
            )}
            {saving && <span className="text-xs text-graphite">保存中…</span>}
          </div>
          <h3 className="font-display text-lg mt-2">{current.title}</h3>
          {current.description && (
            <p className="text-sm text-graphite mt-1">{current.description}</p>
          )}
          <p className="text-xs text-graphite mt-2">
            {showAssignee && current.assignee && `接收人：${current.assignee.displayName}`}
            {showAssignee && showAssigner && current.assignee && current.assignedBy && ' · '}
            {showAssigner && current.assignedBy && `分配人：${current.assignedBy.displayName}`}
          </p>
          {error && <p className="text-xs text-bronze mt-2">{error}</p>}
        </div>
        {current.dueAt && (
          <time className="text-xs text-graphite shrink-0">
            截止 {new Date(current.dueAt).toLocaleDateString('zh-CN')}
          </time>
        )}
      </div>
    </Card>
  );
}
