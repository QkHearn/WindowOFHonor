import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface IssueDto {
  title: string;
  description?: string;
  recipientIds: string[];
  honorValue?: number;
}

@Injectable()
export class IncentivesService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(issuerId: string, dto: IssueDto) {
    const honorValue = dto.honorValue ?? 10;

    const record = await this.prisma.$transaction(async (tx) => {
      const incentive = await tx.incentiveRecord.create({
        data: {
          title: dto.title,
          description: dto.description,
          honorValue,
          issuedById: issuerId,
          recipients: {
            create: dto.recipientIds.map((userId) => ({ userId })),
          },
        },
        include: {
          recipients: { include: { user: true } },
          issuedBy: true,
        },
      });

      for (const userId of dto.recipientIds) {
        await tx.user.update({
          where: { id: userId },
          data: { honorPoints: { increment: honorValue } },
        });
      }

      if (dto.recipientIds.length >= 2) {
        for (let i = 0; i < dto.recipientIds.length; i++) {
          for (let j = i + 1; j < dto.recipientIds.length; j++) {
            const [userAId, userBId] = [dto.recipientIds[i], dto.recipientIds[j]].sort();
            await tx.coHonorEdge.upsert({
              where: { userAId_userBId: { userAId, userBId } },
              create: {
                userAId,
                userBId,
                coCount: 1,
                totalHonorValue: honorValue,
                lastCoAt: new Date(),
              },
              update: {
                coCount: { increment: 1 },
                totalHonorValue: { increment: honorValue },
                lastCoAt: new Date(),
              },
            });
          }
        }
      }

      return incentive;
    });

    return { success: true, incentive: record };
  }

  async list(user: { id: string; role: string }) {
    if (user.role === 'employee') {
      return this.prisma.incentiveRecord.findMany({
        where: { recipients: { some: { userId: user.id } } },
        include: { recipients: { include: { user: true } }, issuedBy: true },
        orderBy: { issuedAt: 'desc' },
        take: 50,
      });
    }

    return this.prisma.incentiveRecord.findMany({
      include: { recipients: { include: { user: true } }, issuedBy: true },
      orderBy: { issuedAt: 'desc' },
      take: 50,
    });
  }
}
