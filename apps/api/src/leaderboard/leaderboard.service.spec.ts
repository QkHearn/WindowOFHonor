import { LeaderboardService } from './leaderboard.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new LeaderboardService(prisma as never);
  });

  it('personal leaderboard ranks by appreciation count', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: '1',
        displayName: '张三',
        avatarUrl: null,
        department: { name: '研发' },
        _count: { incentiveRecipients: 12 },
      },
      {
        id: '2',
        displayName: '李四',
        avatarUrl: null,
        department: { name: '研发' },
        _count: { incentiveRecipients: 8 },
      },
    ] as never);

    const result = await service.personal('team', 'all', 10);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[0].honorValue).toBe(12);
    expect(result[1].rank).toBe(2);
  });

  it('team leaderboard aggregates appreciation counts', async () => {
    prisma.department.findMany.mockResolvedValue([
      {
        id: 'd1',
        name: '研发一部',
        users: [{ _count: { incentiveRecipients: 5 } }, { _count: { incentiveRecipients: 7 } }],
      },
      {
        id: 'd2',
        name: '产品中心',
        users: [{ _count: { incentiveRecipients: 3 } }],
      },
    ] as never);

    const result = await service.team('all', 10);

    expect(result[0].teamName).toBe('研发一部');
    expect(result[0].honorTotal).toBe(12);
    expect(result[0].avgHonor).toBe(6);
    expect(result[1].teamName).toBe('产品中心');
  });
});
