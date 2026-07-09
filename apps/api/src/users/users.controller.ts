import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: { user: Record<string, unknown> }) {
    const u = req.user;
    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      honorPoints: u.honorPoints,
      avatarUrl: u.avatarUrl ?? null,
    };
  }

  @Get('search')
  @UseGuards(AuthGuard)
  search(@Query('q') q?: string) {
    return this.users.search(q ?? '');
  }

  @Get('members')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('super_admin', 'supervisor')
  listMembers(
    @Req() req: { user: { id: string; role: string; departmentId: string | null } },
    @Query('q') q?: string,
  ) {
    return this.users.listMembers(req.user, q);
  }

  @Get('me/honors')
  @UseGuards(AuthGuard)
  myHonors(@Req() req: { user: { id: string } }) {
    return this.users.getHonors(req.user.id);
  }

  @Get(':id/honors')
  getHonors(@Param('id') id: string) {
    return this.users.getHonors(id);
  }
}
