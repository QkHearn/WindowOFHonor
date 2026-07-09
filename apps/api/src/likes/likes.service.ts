import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async like(
    fromUserId: string,
    dto: { toUserId: string; targetType: string; targetId?: string },
  ) {
    if (fromUserId === dto.toUserId) {
      throw new BadRequestException('Cannot like yourself');
    }

    const like = await this.prisma.like.create({
      data: {
        fromUserId,
        toUserId: dto.toUserId,
        targetType: dto.targetType,
        targetId: dto.targetId,
      },
    });

    await this.prisma.user.update({
      where: { id: dto.toUserId },
      data: { likeCount: { increment: 1 } },
    });

    return { success: true, like };
  }
}
