import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async personal(_scope: string, _period: string, limit: number) {
    const users = await this.prisma.user.findMany({
      where: { status: 'active', role: { not: UserRole.super_admin } },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        department: { select: { name: true } },
        _count: { select: { incentiveRecipients: true } },
      },
    });

    return users
      .sort((a, b) => b._count.incentiveRecipients - a._count.incentiveRecipients)
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        id: u.id,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        department: u.department,
        appreciationCount: u._count.incentiveRecipients,
        honorValue: u._count.incentiveRecipients,
        honorPoints: u._count.incentiveRecipients,
      }));
  }

  async team(_period: string, limit: number) {
    const departments = await this.prisma.department.findMany({
      include: {
        users: {
          where: { status: 'active' },
          select: { _count: { select: { incentiveRecipients: true } } },
        },
      },
    });

    const ranked = departments
      .map((d) => {
        const total = d.users.reduce((s, u) => s + u._count.incentiveRecipients, 0);
        return {
          teamId: d.id,
          teamName: d.name,
          memberCount: d.users.length,
          honorTotal: total,
          avgHonor: d.users.length ? Math.round(total / d.users.length) : 0,
        };
      })
      .sort((a, b) => b.honorTotal - a.honorTotal)
      .slice(0, limit)
      .map((t, i) => ({ rank: i + 1, ...t }));

    return ranked;
  }

  async partners(limit: number) {
    const edges = await this.prisma.coHonorEdge.findMany({
      include: {
        userA: { select: { id: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: [{ coCount: 'desc' }, { lastCoAt: 'desc' }],
      take: limit,
    });

    return edges.map((e, i) => ({
      rank: i + 1,
      userA: e.userA,
      userB: e.userB,
      coCount: e.coCount,
      totalHonorValue: e.coCount,
      lastCoAt: e.lastCoAt,
    }));
  }
}
