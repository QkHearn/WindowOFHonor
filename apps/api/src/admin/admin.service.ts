import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { status: 'active' },
      orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        department: { select: { id: true, name: true } },
        managedDepartments: {
          select: { department: { select: { id: true, name: true } } },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      department: u.department,
      managedDepartments: u.managedDepartments.map((m) => m.department),
    }));
  }

  async promoteToAdmin(userId: string, departmentIds: string[]) {
    const ids = [...new Set(departmentIds)];
    if (!ids.length) {
      throw new BadRequestException('请至少选择一个管理组织');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') {
      throw new NotFoundException('用户不存在');
    }
    if (user.role === UserRole.super_admin) {
      throw new BadRequestException('无法修改系统管理员角色');
    }
    if (user.role === UserRole.supervisor) {
      throw new BadRequestException('该用户已是管理员');
    }

    const depts = await this.prisma.department.findMany({
      where: { id: { in: ids } },
    });
    if (depts.length !== ids.length) {
      throw new BadRequestException('部分组织不存在');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.supervisor },
      }),
      this.prisma.adminDepartment.deleteMany({ where: { userId } }),
      this.prisma.adminDepartment.createMany({
        data: ids.map((departmentId) => ({ userId, departmentId })),
      }),
    ]);

    return { success: true, userId, role: UserRole.supervisor, departmentIds: ids };
  }

  async demoteFromAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') {
      throw new NotFoundException('用户不存在');
    }
    if (user.role !== UserRole.supervisor) {
      throw new BadRequestException('该用户不是管理员');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.employee },
      }),
      this.prisma.adminDepartment.deleteMany({ where: { userId } }),
    ]);

    return { success: true, userId, role: UserRole.employee };
  }

  async updateAdminDepartments(userId: string, departmentIds: string[]) {
    const ids = [...new Set(departmentIds)];
    if (!ids.length) {
      throw new BadRequestException('请至少选择一个管理组织');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.supervisor) {
      throw new BadRequestException('该用户不是管理员');
    }

    const depts = await this.prisma.department.findMany({
      where: { id: { in: ids } },
    });
    if (depts.length !== ids.length) {
      throw new BadRequestException('部分组织不存在');
    }

    await this.prisma.$transaction([
      this.prisma.adminDepartment.deleteMany({ where: { userId } }),
      this.prisma.adminDepartment.createMany({
        data: ids.map((departmentId) => ({ userId, departmentId })),
      }),
    ]);

    return { success: true, userId, departmentIds: ids };
  }

  async transferUsersDepartment(userIds: string[], departmentId: string | null) {
    const ids = [...new Set(userIds)];
    if (!ids.length) {
      throw new BadRequestException('请至少选择一名用户');
    }

    if (departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        throw new BadRequestException('目标组织不存在');
      }
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, status: 'active' },
      select: { id: true, role: true, displayName: true },
    });

    if (users.length !== ids.length) {
      throw new BadRequestException('部分用户不存在或已停用');
    }

    const blocked = users.filter((u) => u.role === UserRole.super_admin);
    if (blocked.length) {
      throw new BadRequestException('无法转移系统管理员');
    }

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { departmentId },
    });

    return {
      success: true,
      count: ids.length,
      departmentId,
      userIds: ids,
    };
  }
}
