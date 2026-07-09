import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    return this.listMembersInternal(undefined, q, 20);
  }

  /** 主管发放激励 / 任务令：列出可选团队成员 */
  async listMembers(
    currentUser: { id: string; role: string; departmentId?: string | null },
    q?: string,
  ) {
    const scopeDept =
      currentUser.role === 'super_admin' ? undefined : currentUser.departmentId ?? undefined;
    return this.listMembersInternal(scopeDept, q?.trim() || undefined, 100);
  }

  private listMembersInternal(departmentId: string | undefined, q: string | undefined, take: number) {
    return this.prisma.user.findMany({
      where: {
        status: 'active',
        ...(departmentId ? { departmentId } : {}),
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
        honorPoints: true,
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
        honorPoints: true,
        likeCount: true,
        department: { select: { name: true } },
      },
    });

    const records = await this.prisma.incentiveRecord.findMany({
      where: { recipients: { some: { userId } } },
      orderBy: { issuedAt: 'desc' },
      take: 30,
      include: { issuedBy: { select: { displayName: true } } },
    });

    return {
      user,
      summary: { honorPoints: user?.honorPoints ?? 0, incentiveCount: records.length },
      records: records.map((r) => ({
        id: r.id,
        title: r.title,
        honorValue: r.honorValue,
        issuedAt: r.issuedAt,
        issuedBy: r.issuedBy.displayName,
      })),
    };
  }
}
