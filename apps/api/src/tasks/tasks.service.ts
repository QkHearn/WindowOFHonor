import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.taskOrder.findMany({
      where: { assigneeId: userId },
      orderBy: { createdAt: 'desc' },
      include: { assignedBy: { select: { displayName: true } } },
    });
  }

  async create(
    supervisor: { id: string; role: string; departmentId: string | null },
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

    const assignees = await this.prisma.user.findMany({
      where: { id: { in: ids }, status: 'active' },
    });
    if (assignees.length !== ids.length) {
      throw new BadRequestException('部分接收人不存在或已停用');
    }

    for (const assignee of assignees) {
      if (
        supervisor.role !== 'super_admin' &&
        assignee.departmentId !== supervisor.departmentId
      ) {
        throw new ForbiddenException(`只能向本团队成员分配任务（${assignee.displayName}）`);
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
            dueAt,
          },
          include: { assignee: { select: { id: true, displayName: true } } },
        }),
      ),
    );

    return { count: created.length, tasks: created };
  }

  listBySupervisor(supervisor: { id: string; role: string }) {
    return this.prisma.taskOrder.findMany({
      where: supervisor.role === 'super_admin' ? {} : { assignedById: supervisor.id },
      orderBy: { createdAt: 'desc' },
      include: { assignee: { select: { id: true, displayName: true } } },
    });
  }
}
