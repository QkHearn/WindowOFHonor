import { TaskStatus } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

export function isAfterDue(dueAt: Date | null | undefined, now = new Date()) {
  return !!dueAt && dueAt.getTime() <= now.getTime();
}

/** 截止前：进行中 ↔ 已完成；截止后：已逾期 ↔ 已完成 */
export function allowedManualStatuses(dueAt: Date | null | undefined): TaskStatus[] {
  if (isAfterDue(dueAt)) {
    return [TaskStatus.expired, TaskStatus.completed];
  }
  return [TaskStatus.in_progress, TaskStatus.completed];
}

export async function refreshTaskStatuses(prisma: PrismaClient) {
  await prisma.taskOrder.updateMany({
    where: { status: TaskStatus.pending },
    data: { status: TaskStatus.in_progress },
  });

  await prisma.taskOrder.updateMany({
    where: {
      status: TaskStatus.in_progress,
      dueAt: { lt: new Date() },
    },
    data: { status: TaskStatus.expired },
  });
}

export function buildTaskStatusFilter(status?: string) {
  if (!status || status === 'all') return null;
  if (status === 'active' || status === 'in_progress') {
    return { in: [TaskStatus.pending, TaskStatus.in_progress] };
  }
  if (status === 'completed') return TaskStatus.completed;
  if (status === 'expired') return TaskStatus.expired;
  return null;
}
