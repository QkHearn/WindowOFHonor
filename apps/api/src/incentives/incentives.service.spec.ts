import { IncentivesService } from './incentives.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('IncentivesService', () => {
  let service: IncentivesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new IncentivesService(prisma as never);
  });

  it('issue creates incentive and updates co-honor edges for multiple recipients', async () => {
    const txMock = {
      incentiveRecord: {
        create: jest.fn().mockResolvedValue({
          id: 'inc-1',
          title: '月度之星',
          recipients: [],
          issuedBy: { displayName: '主管' },
        }),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      coHonorEdge: { upsert: jest.fn().mockResolvedValue({}) },
    };

    prisma.$transaction.mockImplementation((async (fn: (tx: unknown) => unknown) =>
      fn(txMock)) as never);

    const result = await service.issue('supervisor-1', {
      title: '月度之星',
      recipientIds: ['user-a', 'user-b'],
      honorValue: 20,
    });

    expect(result.success).toBe(true);
    expect(txMock.user.update).toHaveBeenCalledTimes(2);
    expect(txMock.coHonorEdge.upsert).toHaveBeenCalledTimes(1);
  });

  it('list filters by recipient for employees', async () => {
    prisma.incentiveRecord.findMany.mockResolvedValue([] as never);

    await service.list({ id: 'emp-1', role: 'employee' });

    expect(prisma.incentiveRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipients: { some: { userId: 'emp-1' } } },
      }),
    );
  });
});
