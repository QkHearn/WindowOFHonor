import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
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
  @Roles('supervisor')
  create(
    @Req() req: { user: { id: string; role: string } },
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(req.user, dto);
  }

  @Get()
  @Roles('supervisor')
  list(
    @Req() req: { user: { id: string; role: string } },
    @Query('status') status?: string,
  ) {
    return this.tasks.listIssuedByUser(req.user.id, status);
  }
}
