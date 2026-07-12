import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { TasksService } from './tasks.service';

class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

@Controller('tasks')
export class TaskStatusController {
  constructor(private readonly tasks: TasksService) {}

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  updateStatus(
    @Req() req: { user: { id: string; role: string } },
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasks.updateStatus(req.user, id, dto.status);
  }
}
