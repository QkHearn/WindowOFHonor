import { LeaderboardService } from './leaderboard.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new LeaderboardService(prisma as never);
  });

  it('personal leaderboard ranks by honor points', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: '1', displayName: '张三', avatarUrl: null, honorPoints: 300, department: { name: '研发' } },
      { id: '2', displayName: '李四', avatarUrl: null, honorPoints: 200, department: { name: '研发' } },
    ] as never);

    const result = await service.personal('team', 'all', 10);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[0].honorValue).toBe(300);
    expect(result[1].rank).toBe(2);
  });

  it('team leaderboard aggregates department honor', async () => {
    prisma.department.findMany.mockResolvedValue([
      {
        id: 'd1',
        name: '研发一部',
        users: [{ honorPoints: 100 }, { honorPoints: 200 }],
      },
      {
        id: 'd2',
        name: '产品中心',
        users: [{ honorPoints: 50 }],
      },
    ] as never);

    const result = await service.team('all', 10);

    expect(result[0].teamName).toBe('研发一部');
    expect(result[0].honorTotal).toBe(300);
    expect(result[0].avgHonor).toBe(150);
    expect(result[1].teamName).toBe('产品中心');
  });
});
