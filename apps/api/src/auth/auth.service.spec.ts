import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: JwtService;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = new JwtService({ secret: 'test-secret' });
    service = new AuthService(prisma as never, jwt);
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nobody', 'wrong')).rejects.toThrow(UnauthorizedException);
  });

  it('returns token for valid credentials', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      username: 'admin',
      passwordHash: hash,
      displayName: '主管',
      role: 'supervisor',
      honorPoints: 100,
    } as never);

    const result = await service.login('admin', 'admin123');

    expect(result.accessToken).toBeDefined();
    expect(result.user.displayName).toBe('主管');
  });

  it('registers a new employee', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.department.findUnique.mockResolvedValue({ id: 'd1', name: '研发一部' } as never);
    prisma.user.create.mockResolvedValue({
      id: 'u2',
      username: 'newbie',
      displayName: '新人',
      role: 'employee',
      honorPoints: 0,
    } as never);

    const result = await service.register({
      username: 'newbie',
      password: '123456',
      displayName: '新人',
      departmentId: 'd1',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.username).toBe('newbie');
  });

  it('rejects duplicate username on register', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' } as never);
    await expect(
      service.register({
        username: 'taken',
        password: '123456',
        displayName: '重复',
        departmentId: 'd1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
