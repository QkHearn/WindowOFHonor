import { BadRequestException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('LikesService', () => {
  let service: LikesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new LikesService(prisma as never);
  });

  it('should reject self-like', async () => {
    await expect(
      service.like('user-1', { toUserId: 'user-1', targetType: 'user_profile' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create like and increment count', async () => {
    const like = { id: 'like-1', fromUserId: 'a', toUserId: 'b' };
    prisma.like.create.mockResolvedValue(like as never);
    prisma.user.update.mockResolvedValue({} as never);

    const result = await service.like('a', {
      toUserId: 'b',
      targetType: 'honor_event',
      targetId: 'evt-1',
    });

    expect(result.success).toBe(true);
    expect(prisma.like.create).toHaveBeenCalledWith({
      data: {
        fromUserId: 'a',
        toUserId: 'b',
        targetType: 'honor_event',
        targetId: 'evt-1',
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'b' },
      data: { likeCount: { increment: 1 } },
    });
  });
});
