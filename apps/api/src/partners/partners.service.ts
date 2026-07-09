import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPartners(userId: string) {
    const edges = await this.prisma.coHonorEdge.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, displayName: true, avatarUrl: true } },
        userB: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { coCount: 'desc' },
    });

    return edges.map((e) => {
      const partner = e.userAId === userId ? e.userB : e.userA;
      return {
        partner,
        coCount: e.coCount,
        totalHonorValue: e.totalHonorValue,
        lastCoAt: e.lastCoAt,
      };
    });
  }

  async getNetwork(userId: string) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, avatarUrl: true, honorPoints: true },
    });

    const partners = await this.getPartners(userId);

    const nodes = [
      { id: me!.id, label: me!.displayName, avatarUrl: me!.avatarUrl, honorPoints: me!.honorPoints, isCenter: true },
      ...partners.map((p) => ({
        id: p.partner.id,
        label: p.partner.displayName,
        avatarUrl: p.partner.avatarUrl,
        isCenter: false,
      })),
    ];

    const edges = partners.map((p) => ({
      source: userId,
      target: p.partner.id,
      weight: p.coCount,
      totalHonorValue: p.totalHonorValue,
    }));

    const bestPartner = partners[0] ?? null;

    return { nodes, edges, bestPartner };
  }
}
