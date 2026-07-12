import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { users: true } },
      },
    });
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      memberCount: d._count.users,
    }));
  }

  async create(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConflictException('组织名称不能为空');
    }

    const existing = await this.prisma.department.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('组织名称已存在');
    }

    const dept = await this.prisma.department.create({
      data: { name: trimmed },
      select: { id: true, name: true },
    });
    return { ...dept, memberCount: 0 };
  }

  async remove(id: string, transferToDepartmentId?: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!dept) {
      throw new NotFoundException('组织不存在');
    }

    const memberCount = dept._count.users;

    if (memberCount > 0) {
      if (!transferToDepartmentId) {
        throw new BadRequestException('该组织仍有成员，请选择转移目标组织');
      }
      if (transferToDepartmentId === id) {
        throw new BadRequestException('目标组织不能与待删除组织相同');
      }

      const target = await this.prisma.department.findUnique({
        where: { id: transferToDepartmentId },
      });
      if (!target) {
        throw new NotFoundException('目标组织不存在');
      }

      await this.prisma.$transaction([
        this.prisma.user.updateMany({
          where: { departmentId: id },
          data: { departmentId: transferToDepartmentId },
        }),
        this.prisma.department.delete({ where: { id } }),
      ]);

      return { success: true, transferredCount: memberCount, transferToDepartmentId };
    }

    await this.prisma.department.delete({ where: { id } });
    return { success: true, transferredCount: 0 };
  }
}
