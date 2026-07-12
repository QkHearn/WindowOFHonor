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
  @Roles('supervisor')
  listMembers(
    @Req() req: { user: { id: string; role: string } },
    @Query('q') q?: string,
  ) {
    return this.users.listMembers(req.user, q);
  }

  @Get('me/overview')
  @UseGuards(AuthGuard)
  myOverview(@Req() req: { user: { id: string; role: string } }) {
    return this.users.getOverview(req.user.id, req.user.role);
  }

  @Get('me/honors/issued')
  @UseGuards(AuthGuard)
  myIssuedHonors(@Req() req: { user: { id: string } }) {
    return this.users.getIssuedHonors(req.user.id);
  }

  @Get('me/honors')
  @UseGuards(AuthGuard)
  myHonors(@Req() req: { user: { id: string } }) {
    return this.users.getHonors(req.user.id);
  }

  @Get('me/team/honors')
  @UseGuards(AuthGuard)
  teamHonors(@Req() req: { user: { id: string } }) {
    return this.users.getTeamHonors(req.user.id);
  }

  @Get('me/team/tasks')
  @UseGuards(AuthGuard)
  teamTasks(
    @Req() req: { user: { id: string } },
    @Query('status') status?: string,
  ) {
    return this.users.getTeamTasks(req.user.id, status);
  }

  @Get('me/team/partners')
  @UseGuards(AuthGuard)
  teamPartners(@Req() req: { user: { id: string } }) {
    return this.users.getTeamPartners(req.user.id);
  }

  @Get(':id/honors')
  getHonors(@Param('id') id: string) {
    return this.users.getHonors(id);
  }
}
