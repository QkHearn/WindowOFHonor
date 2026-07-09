import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard, Roles, RolesGuard } from '../auth/auth.guard';
import { TasksService } from './tasks.service';

class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  assigneeIds!: string[];

  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}

@Controller('tasks')
@UseGuards(AuthGuard, RolesGuard)
export class TasksSupervisorController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @Roles('super_admin', 'supervisor')
  create(
    @Req() req: { user: { id: string; role: string; departmentId: string | null } },
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(req.user, dto);
  }

  @Get()
  @Roles('super_admin', 'supervisor')
  list(@Req() req: { user: { id: string; role: string } }) {
    return this.tasks.listBySupervisor(req.user);
  }
}
