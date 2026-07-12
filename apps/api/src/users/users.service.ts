import { Injectable } from '@nestjs/common';
import { TaskStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildTaskStatusFilter, refreshTaskStatuses } from '../tasks/task-status-filter';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagedDepartmentIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.adminDepartment.findMany({
      where: { userId },
      select: { departmentId: true },
    });
    return rows.map((r) => r.departmentId);
  }

  async search(q: string) {
    const trimmed = q?.trim();
    return this.listMembersInternal(
      undefined,
      trimmed || undefined,
      trimmed ? 50 : 100,
      undefined,
      true,
    );
  }

  /** 管理员发放任务令：所管组织员工 + 本人 */
  async listMembers(
    currentUser: { id: string; role: string },
    q?: string,
  ) {
    const managedIds =
      currentUser.role === 'supervisor'
        ? await this.getManagedDepartmentIds(currentUser.id)
        : undefined;

    if (currentUser.role === 'supervisor' && !managedIds?.length) {
      return [];
    }

    const employees = await this.listMembersInternal(
      managedIds,
      q?.trim() || undefined,
      100,
      'employee',
    );

    if (currentUser.role !== 'supervisor') {
      return employees;
    }

    const self = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        department: { select: { id: true, name: true } },
      },
    });

    if (self && !employees.some((m) => m.id === self.id)) {
      return [self, ...employees];
    }

    return employees;
  }

  private listMembersInternal(
    departmentIds: string | string[] | undefined,
    q: string | undefined,
    take: number,
    role?: 'employee',
    excludeSuperAdmin = false,
  ) {
    const deptFilter = Array.isArray(departmentIds)
      ? { departmentId: { in: departmentIds } }
      : departmentIds
        ? { departmentId: departmentIds }
        : {};

    return this.prisma.user.findMany({
      where: {
        status: 'active',
        ...(excludeSuperAdmin ? { role: { not: UserRole.super_admin } } : {}),
        ...(role ? { role } : {}),
        ...deptFilter,
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' as const } },
                { username: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { displayName: 'asc' },
      take,
    });
  }

  async getHonors(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        likeCount: true,
        department: { select: { name: true } },
      },
    });

    const incentiveCount = await this.prisma.incentiveRecipient.count({
      where: { userId },
    });

    const records = await this.prisma.incentiveRecord.findMany({
      where: { recipients: { some: { userId } } },
      orderBy: { issuedAt: 'desc' },
      take: 30,
      include: { issuedBy: { select: { displayName: true } } },
    });

    return {
      user,
      summary: { incentiveCount },
      records: records.map((r) => ({
        id: r.id,
        title: r.title,
        issuedAt: r.issuedAt,
        issuedBy: r.issuedBy.displayName,
      })),
    };
  }

  async getIssuedHonors(userId: string) {
    const count = await this.prisma.incentiveRecord.count({
      where: { issuedById: userId },
    });

    const records = await this.prisma.incentiveRecord.findMany({
      where: { issuedById: userId },
      orderBy: { issuedAt: 'desc' },
      take: 50,
      include: {
        recipients: {
          include: { user: { select: { displayName: true } } },
        },
      },
    });

    return {
      summary: { count },
      records: records.map((r) => ({
        id: r.id,
        title: r.title,
        issuedAt: r.issuedAt,
        recipients: r.recipients.map((x) => x.user.displayName).join('、'),
      })),
    };
  }

  async getOverview(userId: string, role: string) {
    const [appreciationCount, activeTasks, issuedAppreciationCount] =
      await Promise.all([
        this.prisma.incentiveRecipient.count({ where: { userId } }),
        this.prisma.taskOrder.count({
          where: {
            assigneeId: userId,
            status: TaskStatus.in_progress,
          },
        }),
        this.prisma.incentiveRecord.count({ where: { issuedById: userId } }),
      ]);

    const issuedTasks =
      role === 'supervisor'
        ? await this.prisma.taskOrder.count({ where: { assignedById: userId } })
        : undefined;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        department: { select: { id: true, name: true } },
      },
    });

    let team: {
      department: { id: string; name: string };
      memberCount: number;
      appreciationCount: number;
      activeTasks: number;
      partnerPairs: number;
    } | null = null;

    if (user?.department?.id) {
      const deptId = user.department.id;
      const members = await this.prisma.user.findMany({
        where: { departmentId: deptId, status: 'active' },
        select: { id: true },
      });
      const memberIds = members.map((m) => m.id);

      const [teamAppreciationCount, teamActiveTasks, teamPartnerPairs] =
        await Promise.all([
          this.prisma.incentiveRecipient.count({
            where: { userId: { in: memberIds } },
          }),
          this.prisma.taskOrder.count({
            where: {
              assigneeId: { in: memberIds },
              status: TaskStatus.in_progress,
            },
          }),
          this.prisma.coHonorEdge.count({
            where: {
              userA: { departmentId: deptId },
              userB: { departmentId: deptId },
            },
          }),
        ]);

      team = {
        department: user.department,
        memberCount: memberIds.length,
        appreciationCount: teamAppreciationCount,
        activeTasks: teamActiveTasks,
        partnerPairs: teamPartnerPairs,
      };
    }

    return {
      personal: {
        appreciationCount,
        activeTasks,
        issuedAppreciationCount,
        ...(issuedTasks !== undefined ? { issuedTasks } : {}),
      },
      team,
    };
  }

  private async getDepartmentMemberIds(departmentId: string) {
    const members = await this.prisma.user.findMany({
      where: { departmentId, status: 'active' },
      select: { id: true },
    });
    return members.map((m) => m.id);
  }

  async getTeamHonors(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: { select: { id: true, name: true } } },
    });
    if (!user?.department?.id) {
      return { department: null, summary: { count: 0 }, records: [] };
    }

    const memberIds = await this.getDepartmentMemberIds(user.department.id);
    const count = await this.prisma.incentiveRecipient.count({
      where: { userId: { in: memberIds } },
    });

    const records = await this.prisma.incentiveRecord.findMany({
      where: { recipients: { some: { userId: { in: memberIds } } } },
      orderBy: { issuedAt: 'desc' },
      take: 50,
      include: {
        issuedBy: { select: { displayName: true } },
        recipients: {
          where: { userId: { in: memberIds } },
          include: { user: { select: { displayName: true } } },
        },
      },
    });

    return {
      department: user.department,
      summary: { count },
      records: records.map((r) => ({
        id: r.id,
        title: r.title,
        issuedAt: r.issuedAt,
        issuedBy: r.issuedBy.displayName,
        recipients: r.recipients.map((x) => x.user.displayName).join('、'),
      })),
    };
  }

  async getTeamTasks(userId: string, status?: string) {
    await refreshTaskStatuses(this.prisma);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: { select: { id: true, name: true } } },
    });
    if (!user?.department?.id) {
      return { department: null, tasks: [] };
    }

    const memberIds = await this.getDepartmentMemberIds(user.department.id);
    const statusFilter = buildTaskStatusFilter(status);

    const tasks = await this.prisma.taskOrder.findMany({
      where: {
        assigneeId: { in: memberIds },
        ...(statusFilter != null ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        assignee: { select: { id: true, displayName: true } },
        assignedBy: { select: { id: true, displayName: true } },
      },
    });

    return { department: user.department, tasks };
  }

  async getTeamPartners(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: { select: { id: true, name: true } } },
    });
    if (!user?.department?.id) {
      return { department: null, pairs: [] };
    }

    const deptId = user.department.id;
    const edges = await this.prisma.coHonorEdge.findMany({
      where: {
        userA: { departmentId: deptId },
        userB: { departmentId: deptId },
      },
      include: {
        userA: { select: { id: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: [{ coCount: 'desc' }, { lastCoAt: 'desc' }],
      take: 30,
    });

    return {
      department: user.department,
      pairs: edges.map((e, i) => ({
        rank: i + 1,
        userA: e.userA,
        userB: e.userB,
        coCount: e.coCount,
        lastCoAt: e.lastCoAt,
      })),
    };
  }
}
