import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  buildTaskStatusFilter,
  allowedManualStatuses,
  isAfterDue,
  refreshTaskStatuses,
} from './task-status-filter';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  private async syncStatuses() {
    await refreshTaskStatuses(this.prisma);
  }

  async listForUser(userId: string, status?: string) {
    await this.syncStatuses();
    const statusFilter = buildTaskStatusFilter(status);

    return this.prisma.taskOrder.findMany({
      where: {
        assigneeId: userId,
        ...(statusFilter != null ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { assignedBy: { select: { id: true, displayName: true } } },
    });
  }

  async updateStatus(
    user: { id: string; role: string },
    taskId: string,
    status: TaskStatus,
  ) {
    await this.syncStatuses();

    const task = await this.prisma.taskOrder.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('任务令不存在');
    }

    let allowed = task.assigneeId === user.id || task.assignedById === user.id;

    if (!allowed && user.role === UserRole.supervisor) {
      const managedIds = await this.users.getManagedDepartmentIds(user.id);
      const assignee = await this.prisma.user.findUnique({
        where: { id: task.assigneeId },
        select: { departmentId: true },
      });
      allowed = !!assignee?.departmentId && managedIds.includes(assignee.departmentId);
    }

    if (!allowed) {
      throw new ForbiddenException('无权修改此任务令状态');
    }

    if (!allowedManualStatuses(task.dueAt).includes(status)) {
      const phase = isAfterDue(task.dueAt) ? '已过截止时间' : '未到截止时间';
      throw new BadRequestException(
        `${phase}，仅可在「${allowedManualStatuses(task.dueAt)
          .map((s) =>
            s === TaskStatus.in_progress
              ? '进行中'
              : s === TaskStatus.completed
                ? '已完成'
                : '已逾期',
          )
          .join('」与「')}」之间切换`,
      );
    }

    return this.prisma.taskOrder.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignee: { select: { id: true, displayName: true } },
        assignedBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async create(
    supervisor: { id: string; role: string },
    dto: {
      title: string;
      description?: string;
      assigneeIds: string[];
      dueAt?: string;
    },
  ) {
    const ids = [...new Set(dto.assigneeIds)];
    if (!ids.length) {
      throw new BadRequestException('请至少选择一名接收人');
    }

    const managedDeptIds = await this.users.getManagedDepartmentIds(supervisor.id);
    if (!managedDeptIds.length) {
      throw new ForbiddenException('您尚未被分配管理组织');
    }

    const assignees = await this.prisma.user.findMany({
      where: {
        id: { in: ids },
        status: 'active',
        role: { not: UserRole.super_admin },
      },
    });
    if (assignees.length !== ids.length) {
      throw new BadRequestException('部分接收人不存在、已停用或不可分配');
    }

    for (const assignee of assignees) {
      if (assignee.role === UserRole.supervisor) {
        if (assignee.id !== supervisor.id) {
          throw new ForbiddenException('只能向员工或本人分配任务');
        }
        continue;
      }

      if (assignee.role !== UserRole.employee) {
        throw new BadRequestException('部分接收人不可分配');
      }

      if (!assignee.departmentId || !managedDeptIds.includes(assignee.departmentId)) {
        throw new ForbiddenException(`只能向所管组织的员工分配任务（${assignee.displayName}）`);
      }
    }

    const dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;
    const created = await this.prisma.$transaction(
      ids.map((assigneeId) =>
        this.prisma.taskOrder.create({
          data: {
            title: dto.title,
            description: dto.description,
            assigneeId,
            assignedById: supervisor.id,
            status: TaskStatus.in_progress,
            dueAt,
          },
          include: { assignee: { select: { id: true, displayName: true } } },
        }),
      ),
    );

    return { count: created.length, tasks: created };
  }

  async listIssuedByUser(userId: string, status?: string) {
    await this.syncStatuses();
    const statusFilter = buildTaskStatusFilter(status);

    return this.prisma.taskOrder.findMany({
      where: {
        assignedById: userId,
        ...(statusFilter != null ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, displayName: true } },
        assignedBy: { select: { id: true, displayName: true } },
      },
    });
  }
}
