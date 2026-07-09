import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BroadcastService {
  constructor(private readonly prisma: PrismaService) {}

  async getHonors() {
    const records = await this.prisma.incentiveRecord.findMany({
      include: {
        recipients: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
        issuedBy: { select: { displayName: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 20,
    });

    return records.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      honorValue: r.honorValue,
      issuedAt: r.issuedAt,
      issuedBy: r.issuedBy.displayName,
      recipients: r.recipients.map((rec) => rec.user),
    }));
  }
}
