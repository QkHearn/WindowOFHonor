import { PartnersService } from './partners.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('PartnersService', () => {
  let service: PartnersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PartnersService(prisma as never);
  });

  it('getPartners returns partner on correct side of edge', async () => {
    prisma.coHonorEdge.findMany.mockResolvedValue([
      {
        userAId: 'me',
        userBId: 'partner-1',
        coCount: 5,
        totalHonorValue: 50,
        lastCoAt: new Date('2026-07-01'),
        userA: { id: 'me', displayName: '我', avatarUrl: null },
        userB: { id: 'partner-1', displayName: '拍档', avatarUrl: null },
      },
    ] as never);

    const result = await service.getPartners('me');

    expect(result).toHaveLength(1);
    expect(result[0].partner.displayName).toBe('拍档');
    expect(result[0].coCount).toBe(5);
  });

  it('getNetwork builds nodes and edges with best partner', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'me',
      displayName: '我',
      avatarUrl: null,
      honorPoints: 100,
    } as never);
    prisma.coHonorEdge.findMany.mockResolvedValue([
      {
        userAId: 'me',
        userBId: 'p1',
        coCount: 3,
        totalHonorValue: 30,
        lastCoAt: new Date(),
        userA: { id: 'me', displayName: '我', avatarUrl: null },
        userB: { id: 'p1', displayName: '拍档A', avatarUrl: null },
      },
    ] as never);

    const network = await service.getNetwork('me');

    expect(network.nodes[0].isCenter).toBe(true);
    expect(network.edges[0].weight).toBe(3);
    expect(network.bestPartner?.partner.displayName).toBe('拍档A');
  });
});
