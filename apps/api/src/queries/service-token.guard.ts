import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/** 仅允许 MCP 服务令牌访问的外部查询接口 */
@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-service-token'] as string | undefined;
    if (token && token === process.env.MCP_SERVICE_TOKEN) {
      return true;
    }
    throw new UnauthorizedException('需要有效的 X-Service-Token');
  }
}
