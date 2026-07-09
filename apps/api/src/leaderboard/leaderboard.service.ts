import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async personal(_scope: string, _period: string, limit: number) {
    const users = await this.prisma.user.findMany({
      where: { status: 'active' },
      orderBy: { honorPoints: 'desc' },
      take: limit,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        honorPoints: true,
        department: { select: { name: true } },
      },
    });

    return users.map((u, i) => ({
      rank: i + 1,
      ...u,
      honorValue: u.honorPoints,
    }));
  }

  async team(_period: string, limit: number) {
    const departments = await this.prisma.department.findMany({
      include: {
        users: {
          where: { status: 'active' },
          select: { honorPoints: true },
        },
      },
    });

    const ranked = departments
      .map((d) => ({
        teamId: d.id,
        teamName: d.name,
        memberCount: d.users.length,
        honorTotal: d.users.reduce((s, u) => s + u.honorPoints, 0),
        avgHonor: d.users.length
          ? Math.round(d.users.reduce((s, u) => s + u.honorPoints, 0) / d.users.length)
          : 0,
      }))
      .sort((a, b) => b.honorTotal - a.honorTotal)
      .slice(0, limit)
      .map((t, i) => ({ rank: i + 1, ...t }));

    return ranked;
  }
}
