import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { TasksService } from './tasks.service';

@Controller('users/me/tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('issued')
  @UseGuards(RolesGuard)
  @Roles('supervisor')
  listIssued(
    @Req() req: { user: { id: string } },
    @Query('status') status?: string,
  ) {
    return this.tasks.listIssuedByUser(req.user.id, status);
  }

  @Get()
  list(
    @Req() req: { user: { id: string } },
    @Query('status') status?: string,
  ) {
    return this.tasks.listForUser(req.user.id, status);
  }
}
