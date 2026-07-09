import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    const serviceToken = req.headers['x-service-token'] as string | undefined;

    if (serviceToken && serviceToken === process.env.MCP_SERVICE_TOKEN) {
      const userId = req.headers['x-user-id'] as string | undefined;
      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          req.user = user;
          return true;
        }
      }
      req.user = { id: 'service', role: 'super_admin', displayName: 'MCP Service' };
      return true;
    }

    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = this.jwt.verify(auth.slice(7));
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User inactive');
      }
      req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

export function Roles(...roles: string[]) {
  return (target: object, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('roles', roles, descriptor?.value ?? target);
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const roles = Reflect.getMetadata(
      'roles',
      context.getHandler(),
    ) as string[] | undefined;
    if (!roles?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;
    if (user.id === 'service') return true;
    return roles.includes(user.role);
  }
}
