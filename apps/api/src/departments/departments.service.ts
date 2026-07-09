import { ConflictException, Injectable } from '@nestjs/common';
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
      throw new ConflictException('团队名称不能为空');
    }

    const existing = await this.prisma.department.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('团队名称已存在');
    }

    const dept = await this.prisma.department.create({
      data: { name: trimmed },
      select: { id: true, name: true },
    });
    return { ...dept, memberCount: 0 };
  }
}
