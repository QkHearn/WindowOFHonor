import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenResponse(user);
  }

  async register(dto: {
    username: string;
    password: string;
    displayName: string;
    departmentId: string;
  }) {
    const exists = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (exists) {
      throw new ConflictException('用户名已被占用');
    }

    const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) {
      throw new ConflictException('所选团队不存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        departmentId: dto.departmentId,
        role: UserRole.employee,
      },
    });

    return this.tokenResponse(user);
  }

  private tokenResponse(user: {
    id: string;
    username: string;
    displayName: string;
    role: string;
    honorPoints: number;
  }) {
    const token = this.jwt.sign({ sub: user.id, role: user.role });
    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        honorPoints: user.honorPoints,
      },
    };
  }
}
