import { PrismaService } from '../../src/prisma/prisma.service';

type DeepMock<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K] extends object
      ? DeepMock<T[K]>
      : T[K];
};

export function createPrismaMock(): DeepMock<PrismaService> {
  const mock: Record<string, unknown> = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mock)),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    incentiveRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    coHonorEdge: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    taskOrder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    like: {
      create: jest.fn(),
    },
  };
  return mock as DeepMock<PrismaService>;
}
