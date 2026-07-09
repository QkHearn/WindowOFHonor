import { QueriesService } from './queries.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('QueriesService', () => {
  let service: QueriesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new QueriesService(prisma as never);
  });

  it('returns latest honor or null', async () => {
    prisma.incentiveRecord.findFirst.mockResolvedValue(null);
    const res = await service.latestHonor();
    expect(res.honor).toBeNull();
    expect(res.definition).toContain('荣誉');
  });

  it('summarizes today honors and tasks', async () => {
    prisma.incentiveRecord.findMany.mockResolvedValue([
      {
        id: 'h1',
        title: '测试荣誉',
        description: null,
        honorValue: 10,
        issuedAt: new Date(),
        issuedBy: { id: 'u1', displayName: '主管' },
        recipients: [{ user: { id: 'u2', displayName: '张三' } }],
      },
    ] as never);
    prisma.taskOrder.findMany.mockResolvedValue([]);

    const res = await service.todaySummary();
    expect(res.hasNewHonors).toBe(true);
    expect(res.hasNewTasks).toBe(false);
    expect(res.summary.honors).toContain('测试荣誉');
  });
});
